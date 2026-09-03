/**
 * RC-8 regression guards — production data source.
 *
 * Incident: on Cloudflare Pages (Next.js 14 App Router via
 * @cloudflare/next-on-pages) `fetch(url, { cache: 'force-cache',
 * next: { revalidate } })` never returns data, because the edge adapter has no
 * `IncrementalCache` (next-on-pages does not supply one). Every page that used
 * it rendered empty or fell through to the slug heuristic — 3,100 / 3,137
 * library pages published a WRONG formula (e.g. "derivative-of-1-x" rendered
 * "1x", d/dx = 1, instead of the authoritative "1/x", d/dx = -1/x^2).
 *
 * These guards fail the build if:
 *   - any production data fetch reintroduces force-cache / next.revalidate
 *   - any code path reintroduces ORDER BY RANDOM() / ORDER BY RAND()
 *   - the library no longer resolves the known-good formulas
 *   - /problems and /problems/[type] would render with zero links
 *   - a non-mathematical slug could still render HTTP 200
 */

import fs from 'fs';
import path from 'path';
import {
    findStaticProblem,
    filterByType,
    pickStableRelated,
} from '@/lib/problems-source';
import { parseSlugToMath } from '@/lib/slug-math';

const ROOT = path.resolve(__dirname, '..');

function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Every source file that ships to production (excludes node_modules + extension). */
function productionSources(ext: string): { rel: string; code: string }[] {
    const dirs = ['app', 'lib', 'utils', 'components'];
    const out: { rel: string; code: string }[] = [];
    const walk = (dir: string) => {
        const abs = path.join(ROOT, dir);
        if (!fs.existsSync(abs)) return;
        for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
            const rel = `${dir}/${entry.name}`;
            if (entry.isDirectory()) {
                walk(rel);
            } else if (entry.name.endsWith(ext)) {
                out.push({ rel, code: stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf-8')) });
            }
        }
    };
    dirs.forEach(walk);
    return out;
}

const TS_SOURCES = productionSources('.ts').concat(productionSources('.tsx'));

describe('RC-8 task 1: no force-cache / next.revalidate on production data fetches', () => {
    it('scans a non-trivial number of source files', () => {
        expect(TS_SOURCES.length).toBeGreaterThan(20);
    });

    it('no file uses cache:"force-cache"', () => {
        const offenders = TS_SOURCES
            .filter((f) => /cache:\s*['"]force-cache['"]/.test(f.code))
            .map((f) => f.rel);
        expect(offenders).toEqual([]);
    });

    it('no file uses next: { revalidate }', () => {
        const offenders = TS_SOURCES
            .filter((f) => /next:\s*\{\s*revalidate/.test(f.code))
            .map((f) => f.rel);
        expect(offenders).toEqual([]);
    });

    it('the shared loader is the only problems.json reader, and it uses plain fetch', () => {
        const loader = stripComments(fs.readFileSync(path.join(ROOT, 'lib/problems-source.ts'), 'utf-8'));
        expect(loader).toMatch(/await fetch\(`\$\{base\}\/problems\.json`\)/);
        expect(loader).not.toMatch(/cache:/);
    });
});

describe('RC-8 task 7: no random-order D1 query anywhere', () => {
    it('no production file contains ORDER BY RANDOM() or ORDER BY RAND()', () => {
        const offenders = TS_SOURCES
            .filter((f) => /ORDER\s+BY\s+RAND(OM)?\s*\(?/i.test(f.code))
            .map((f) => f.rel);
        expect(offenders).toEqual([]);
    });

    /**
     * Scoped to the server-side problem DATA path. Randomising the *selection*
     * of problems here is what produced the D1 overage and unstable internal
     * links. (Footer/wiki link shuffling is a separate finding — see RC-9 in
     * the fix report — and is deliberately out of scope for this guard.)
     */
    it('no problem-DATA file selects problems with Math.random', () => {
        const dataPath = [
            'lib/problems-source.ts',
            'lib/d1/related-problems.ts',
            'app/[slug]/page.tsx',
            'app/problems/page.tsx',
            'app/problems/[type]/page.tsx',
            'app/directory/page.tsx',
            'app/page.tsx',
            'app/layout.tsx',
        ];
        const offenders = dataPath.filter((rel) =>
            /Math\.random/.test(stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf-8')))
        );
        expect(offenders).toEqual([]);
    });
});

describe('RC-8: authoritative library resolves the known-good formulas', () => {
    // The REAL library that ships to production — not a fixture.
    const library = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'public/problems.json'), 'utf-8')
    );

    it('public/problems.json is a non-empty array', () => {
        expect(Array.isArray(library)).toBe(true);
        expect(library.length).toBeGreaterThan(3000);
    });

    it('derivative-of-1-x resolves to 1/x (never the slug-derived 1x)', () => {
        expect(findStaticProblem(library, 'derivative-of-1-x')?.formula).toBe('1/x');
        // Documented contrast: the heuristic produces the wrong answer.
        expect(parseSlugToMath('derivative-of-1-x')?.formula).toBe('1x');
    });

    it('derivative-of-acosx-minus-over-minus-2 resolves to acos(x/2)', () => {
        expect(findStaticProblem(library, 'derivative-of-acosx-minus-over-minus-2')?.formula)
            .toBe('acos(x/2)');
        expect(parseSlugToMath('derivative-of-acosx-minus-over-minus-2')?.formula)
            .not.toBe('acos(x/2)');
    });

    it('every library row resolves back to itself (no slug collisions)', () => {
        const bad = library
            .filter((row: any) => findStaticProblem(library, row.slug)?.formula !== row.formula)
            .slice(0, 5)
            .map((r: any) => r.slug);
        expect(bad).toEqual([]);
    });
});

describe('RC-8 task 7: /problems and /problems/derivative render real links', () => {
    const library = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'public/problems.json'), 'utf-8')
    );

    it('/problems has non-empty derivative, integral and limit sections', () => {
        const derivative = filterByType(library, 'derivative');
        const integral = filterByType(library, 'integral');
        const limit = filterByType(library, 'limit');
        expect(derivative.length).toBeGreaterThan(1000);
        expect(integral.length).toBeGreaterThan(900);
        expect(limit.length).toBeGreaterThan(900);
        for (const row of [...derivative, ...integral, ...limit]) {
            expect(typeof row.slug).toBe('string');
            expect(row.slug.length).toBeGreaterThan(0);
        }
    });

    it('/problems/derivative yields a non-empty, well-formed link list', () => {
        const rows = filterByType(library, 'derivative');
        const links = rows.map((p: any) => `/${p.slug}`);
        expect(links.length).toBeGreaterThan(1000);
        expect(links.every((l: string) => /^\/[a-z0-9-]+$/.test(l))).toBe(true);
        expect(new Set(links).size).toBe(links.length);
    });

    it('/problems/[type] rejects an unknown type before rendering', () => {
        // The page calls notFound() for anything outside this list.
        // P2-B: 'ode' removed — problems.json has zero ode-typed rows, so the
        // category was empty; it now 404s (consistent with /problems/matrix).
        const validTypes = ['derivative', 'integral', 'limit'];
        const src = fs.readFileSync(path.join(ROOT, 'app/problems/[type]/page.tsx'), 'utf-8');
        expect(src).toMatch(/validTypes\s*=\s*\['derivative', 'integral', 'limit'\]/);
        expect(src).toMatch(/notFound\(\)/);
        expect(validTypes).toContain('derivative');
    });

    it('both /problems pages read from the shared loader', () => {
        for (const rel of ['app/problems/page.tsx', 'app/problems/[type]/page.tsx']) {
            const src = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
            expect(src).toMatch(/loadStaticProblemsSafe\(\)/);
        }
    });

    it('the homepage and layout also read from the shared loader', () => {
        for (const rel of ['app/page.tsx', 'app/layout.tsx', 'app/directory/page.tsx']) {
            const src = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
            expect(src).toMatch(/loadStaticProblemsSafe/);
        }
    });

    it('layout no longer hits D1 for footer problems on every page view', () => {
        const src = stripComments(fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf-8'));
        expect(src).not.toMatch(/\/api\/problems/);
        expect(src).toMatch(/loadStaticProblemsSafe\(\)/);
    });
});

describe('RC-8 task 4: unknown slugs 404', () => {
    it('parseSlugToMath returns null for random slugs (caller then calls notFound())', () => {
        for (const slug of [
            'qqqzzz999',
            'asdfgh',
            'qqq111',
            'z9z9z9',
            'hello-world-12345',
            'not-a-math-page-xyz',
            'random-page-abc',
        ]) {
            expect(parseSlugToMath(slug)).toBeNull();
        }
    });

    it('the [slug] page calls notFound() when no source resolves', () => {
        const src = stripComments(
            fs.readFileSync(path.join(ROOT, 'app/[slug]/page.tsx'), 'utf-8')
        );
        expect(src).toMatch(/if\s*\(!problem\)\s*\{\s*notFound\(\);/);
    });

    it('the [slug] page body consults the library BEFORE the heuristic', () => {
        const src = stripComments(
            fs.readFileSync(path.join(ROOT, 'app/[slug]/page.tsx'), 'utf-8')
        );
        // Scope to the page component: generateMetadata has its own (correctly
        // ordered) resolution block and would skew a whole-file index check.
        const body = src.slice(src.indexOf('export default async function ProblemPage'));
        const libraryIdx = body.indexOf('findStaticProblem(library, slug)');
        const heuristicIdx = body.indexOf('parseSlugToMath(slug)');
        expect(libraryIdx).toBeGreaterThan(-1);
        expect(heuristicIdx).toBeGreaterThan(-1);
        expect(libraryIdx).toBeLessThan(heuristicIdx);
    });

    it('generateMetadata also consults the library BEFORE its own fallbacks', () => {
        const src = stripComments(
            fs.readFileSync(path.join(ROOT, 'app/[slug]/page.tsx'), 'utf-8')
        );
        const meta = src.slice(
            src.indexOf('export async function generateMetadata'),
            src.indexOf('export default async function ProblemPage')
        );
        const libraryIdx = meta.indexOf('findStaticProblem(await loadStaticProblemsSafe()');
        const heuristicIdx = meta.indexOf('parseSlugToMath(slug)');
        expect(libraryIdx).toBeGreaterThan(-1);
        expect(heuristicIdx).toBeGreaterThan(-1);
        expect(libraryIdx).toBeLessThan(heuristicIdx);
    });

    it('the [slug] page re-throws NEXT_NOT_FOUND so 404s are not swallowed', () => {
        const src = fs.readFileSync(path.join(ROOT, 'app/[slug]/page.tsx'), 'utf-8');
        expect(src).toMatch(/NEXT_NOT_FOUND/);
    });

    it('the [slug] page never issues SELECT * against D1', () => {
        // Project rule: SELECT * reads columns the renderer never uses and
        // breaks whenever the schema changes.
        const src = stripComments(
            fs.readFileSync(path.join(ROOT, 'app/[slug]/page.tsx'), 'utf-8')
        );
        expect(src).not.toMatch(/SELECT\s+\*/i);
    });
});

describe('RC-8 task 6: `over` binds tighter than +/-', () => {
    it('31-over-x2-plus-1 parses as 31/(x^2+1), not 31/x^2+1', () => {
        expect(parseSlugToMath('derivative-of-31-over-x2-plus-1')?.formula).toBe('31/(x^2+1)');
    });

    it('single atoms do not gain cosmetic parentheses', () => {
        expect(parseSlugToMath('derivative-of-x-over-2')?.formula).toBe('x/2');
        expect(parseSlugToMath('derivative-of-sin-x-over-x')?.formula).toBe('sin(x)/x');
    });
});

describe('RC-6: related problems stay deterministic and library-backed', () => {
    const library = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'public/problems.json'), 'utf-8')
    );

    it('produces 10 stable links for a known slug', () => {
        const a = pickStableRelated(library, 'derivative-of-1-x', 'derivative', 10);
        const b = pickStableRelated(library, 'derivative-of-1-x', 'derivative', 10);
        expect(a.map((p) => p.slug)).toEqual(b.map((p) => p.slug));
        expect(a).toHaveLength(10);
    });

    it('never links a page to itself', () => {
        const out = pickStableRelated(library, 'derivative-of-x-squared', 'derivative', 10);
        expect(out.some((p) => p.slug === 'derivative-of-x-squared')).toBe(false);
    });
});
