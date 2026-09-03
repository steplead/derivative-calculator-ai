/**
 * RC-8 / RC-7 regression guards.
 *
 * RC-8: every /[slug] page must resolve its formula from the authoritative
 *       /problems.json library, never from the slug heuristic. In production
 *       the old `fetch(url, { cache: 'force-cache', next: { revalidate } })`
 *       returned no data, so "derivative-of-1-x" rendered "1x" (d/dx = 1)
 *       instead of "1/x" (d/dx = -1/x^2).
 * RC-7: the slug heuristic must reject arbitrary short strings. It used to
 *       accept anything under 15 chars with no dash, minting unlimited hollow
 *       HTTP 200 pages ("/qqqzzz999" -> "Derivative of qqqzzz^999").
 */

import fs from 'fs';
import path from 'path';
import { parseSlugToMath } from '@/lib/slug-math';
import { pickStableRelated, findStaticProblem, getDerivativeCanonicalMap } from '@/lib/problems-source';
import { NOINDEX_SLUGS } from '@/lib/noindex-slugs';

const ROOT = path.resolve(__dirname, '..');

function read(rel: string): string {
    return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

/** Strip // and /* *\/ comments so guards are not tripped by documentation. */
function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const PAGE_FILES = [
    'app/[slug]/page.tsx',
    'app/page.tsx',
    'app/problems/page.tsx',
    'app/problems/[type]/page.tsx',
    'app/directory/page.tsx',
];

describe('RC-8: no force-cache/revalidate fetch of /problems.json', () => {
    it.each(PAGE_FILES)('%s must not use cache:"force-cache" on problems.json', (rel) => {
        const code = stripComments(read(rel));
        // Any fetch of problems.json must not carry Next.js cache directives.
        const offenders = code
            .split(';')
            .filter((stmt) => stmt.includes('problems.json') && /cache|revalidate/.test(stmt));
        expect(offenders).toEqual([]);
    });

    it.each(PAGE_FILES)('%s must not read the same Response body twice', (rel) => {
        const code = stripComments(read(rel));
        const jsonCalls = (code.match(/\.json\(\)/g) || []).length;
        // Guard against the "body used already" crash: at most one .json()
        // per response variable. Pages now delegate to the shared loader,
        // so a page should have at most one or two guarded reads.
        expect(jsonCalls).toBeLessThanOrEqual(2);
    });

    it('lib/problems-source.ts uses a plain fetch (no cache/next options)', () => {
        const code = stripComments(read('lib/problems-source.ts'));
        expect(code).not.toMatch(/cache:\s*['"]force-cache['"]/);
        expect(code).not.toMatch(/next:\s*\{\s*revalidate/);
        expect(code).toMatch(/await fetch\(`\$\{base\}\/problems\.json`\)/);
    });

    it('problem pages import the shared loader', () => {
        for (const rel of PAGE_FILES) {
            expect(read(rel)).toMatch(/loadStaticProblemsSafe|loadStaticProblems/);
        }
    });
});

describe('RC-8: authoritative formula resolution', () => {
    // Mirrors the real rows in public/problems.json.
    const library = [
        { slug: 'derivative-of-1-x', formula: '1/x' },
        { slug: 'derivative-of-x-squared', formula: 'x^2' },
        { slug: 'derivative-of-acosx-minus-over-minus-2', formula: 'acos(x/2)' },
    ];

    it('resolves derivative-of-1-x to 1/x, not the slug-derived 1x', () => {
        const found = findStaticProblem(library as any, 'derivative-of-1-x');
        expect(found?.formula).toBe('1/x');
        // The slug heuristic WOULD have produced the wrong formula:
        expect(parseSlugToMath('derivative-of-1-x')?.formula).toBe('1x');
    });

    it('resolves derivative-of-acosx-minus-over-minus-2 to acos(x/2)', () => {
        const found = findStaticProblem(library as any, 'derivative-of-acosx-minus-over-minus-2');
        expect(found?.formula).toBe('acos(x/2)');
        // The heuristic produces something else entirely — never the library value.
        expect(parseSlugToMath('derivative-of-acosx-minus-over-minus-2')?.formula)
            .not.toBe('acos(x/2)');
    });

    it('returns null for a slug outside the library', () => {
        expect(findStaticProblem(library as any, 'derivative-of-not-in-library')).toBeNull();
    });

    it('is deterministic and stable across calls', () => {
        const a = findStaticProblem(library as any, 'derivative-of-1-x')?.formula;
        const b = findStaticProblem(library as any, 'derivative-of-1-x')?.formula;
        expect(a).toBe(b);
    });
});

describe('RC-6: related problems are deterministic', () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
        slug: `derivative-of-p${String(i).padStart(2, '0')}`,
        formula: `x^${i}`,
        type: 'derivative' as const,
    }));

    it('returns the same set on repeated calls (no Math.random)', () => {
        const a = pickStableRelated(rows, 'derivative-of-p05', 'derivative');
        const b = pickStableRelated(rows, 'derivative-of-p05', 'derivative');
        expect(a.map((p) => p.slug)).toEqual(b.map((p) => p.slug));
    });

    it('never includes the current slug', () => {
        const out = pickStableRelated(rows, 'derivative-of-p05', 'derivative');
        expect(out.some((p) => p.slug === 'derivative-of-p05')).toBe(false);
    });

    it('is capped at the requested limit', () => {
        expect(pickStableRelated(rows, 'derivative-of-p05', 'derivative', 10).length).toBe(10);
        expect(pickStableRelated(rows, 'derivative-of-p05', 'derivative', 3).length).toBe(3);
    });
});

describe('RC-7: slug heuristic rejects non-math slugs', () => {
    it('rejects arbitrary short alphanumeric strings (soft-404 generators)', () => {
        // These all returned HTTP 200 before the fix.
        for (const slug of ['qqqzzz999', 'asdfgh', 'qqq111', 'z9z9z9', 'abc123']) {
            expect(parseSlugToMath(slug)).toBeNull();
        }
    });

    it('rejects raw-math slugs (sanitizeSlug allows only [a-z0-9-_])', () => {
        // These never worked: sanitizeSlug() rejects operator characters before
        // the parser runs. The old code pretended to support them.
        for (const slug of ['x%5E2', '2%2B2', 'sin(x)%2Fx', 'x^2', '1/x']) {
            expect(parseSlugToMath(slug)).toBeNull();
        }
    });

    it('still parses descriptive derivative/integral/limit slugs', () => {
        expect(parseSlugToMath('derivative-of-x-squared')?.formula).toBe('x^2');
        expect(parseSlugToMath('integral-of-sin-x')?.type).toBe('integral');
        expect(parseSlugToMath('limit-of-sin-x-over-x-as-x-approaches-0')?.type).toBe('limit');
    });

    it('groups the fraction bar tighter than +/- (RC-8b)', () => {
        // "31/x^2+1" would be (31/x^2)+1 — a different function, wrong derivative.
        expect(parseSlugToMath('derivative-of-31-over-x2-plus-1')?.formula).toBe('31/(x^2+1)');
        // Single atoms must not gain cosmetic parentheses.
        expect(parseSlugToMath('derivative-of-sin-x-over-x')?.formula).toBe('sin(x)/x');
        expect(parseSlugToMath('derivative-of-x-over-2')?.formula).toBe('x/2');
    });
});

describe('P2-G: derivative near-duplicate canonical map', () => {
    // Read the real library from disk (no network) and feed it to the helper.
    const library: any[] = JSON.parse(read('data/problems.json'));

    it('maps exactly the 20 non-primary derivative slugs (15 groups)', async () => {
        const map = await getDerivativeCanonicalMap(library);
        expect(map.size).toBe(20);
    });

    it('points each non-primary at its clean primary slug', async () => {
        const map = await getDerivativeCanonicalMap(library);
        expect(map.get('derivative-of-x2')).toBe('derivative-of-x-squared');
        expect(map.get('derivative-of-e-x')).toBe('derivative-of-e-to-the-x');
        expect(map.get('derivative-of-1-x')).toBe('derivative-of-1-over-x');
        expect(map.get('derivative-of-sin2x')).toBe('derivative-of-sin-2x');
        expect(map.get('derivative-of-cos2x')).toBe('derivative-of-cos-2x');
        expect(map.get('derivative-of-ln2x')).toBe('derivative-of-ln-2x');
    });

    it('keeps primary slugs self-canonical (not in the map)', async () => {
        const map = await getDerivativeCanonicalMap(library);
        expect(map.has('derivative-of-x-squared')).toBe(false);
        expect(map.has('derivative-of-x-cubed')).toBe(false);
        expect(map.has('derivative-of-2-to-the-x')).toBe(false);
    });

    it('EXCLUDES limit/integral near-duplicates (different content)', async () => {
        const map = await getDerivativeCanonicalMap(library);
        // Same formula but different limit point / bounds => distinct problems.
        expect(map.has('limit-of-sinx-as-x-to-0')).toBe(false);
        expect(map.has('limit-of-sinx-as-x-to-infinity')).toBe(false);
        expect(map.has('integral-of-x2')).toBe(false);
        expect(map.has('integral-of-x2-from-0-to-1')).toBe(false);
    });

    it('is deterministic across calls', async () => {
        const a = await getDerivativeCanonicalMap(library);
        const b = await getDerivativeCanonicalMap(library);
        expect([...a.entries()]).toEqual([...b.entries()]);
    });
});

describe('P2-G follow-up: derivative dup-group slugs unlocked from NOINDEX_SLUGS', () => {
    // Production wiring (app/[slug]/page.tsx generateMetadata) lifts noindex for
    // any slug that participates in a derivative near-duplicate group, deriving
    // the unlock set from getDerivativeCanonicalMap (keys ∪ values). These guards
    // pin the contract so a future regeneration of lib/noindex-slugs.ts from
    // scripts/noindex_list.txt cannot silently re-noindex the 35 slugs.
    const library: any[] = JSON.parse(read('data/problems.json'));

    async function unlockSet(): Promise<Set<string>> {
        const map = await getDerivativeCanonicalMap(library);
        return new Set<string>([...map.keys(), ...map.values()]);
    }

    it('unlock set = 35 slugs (15 groups), every one currently in NOINDEX_SLUGS', async () => {
        const unlock = await unlockSet();
        expect(unlock.size).toBe(35);
        for (const s of unlock) expect(NOINDEX_SLUGS.has(s)).toBe(true);
    });

    it('non-group NOINDEX_SLUGS slugs stay locked (not in unlock set)', async () => {
        const unlock = await unlockSet();
        // A polluted sqrt slug that is NOT part of any derivative dup group must
        // remain noindex — the unlock only lifts the 15 duplicate groups.
        const polluted = 'derivative-of-1-minus-over-minus-sqrt1-minus-x-minus-to-minus-the-minus-2';
        expect(NOINDEX_SLUGS.has(polluted)).toBe(true);
        expect(unlock.has(polluted)).toBe(false);
    });

    it('primary + a secondary of the same group are both in the unlock set', async () => {
        const unlock = await unlockSet();
        expect(unlock.has('derivative-of-x-squared')).toBe(true); // primary
        expect(unlock.has('derivative-of-x2')).toBe(true); // secondary -> x-squared
    });
});
