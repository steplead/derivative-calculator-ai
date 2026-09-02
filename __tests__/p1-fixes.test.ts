/**
 * P1 regression guards — stop the next D1 write cliff.
 *
 * P1-1: middleware / hot API routes must not write D1 on every request.
 *   - path_stats writes (trackPath) removed from middleware + the 5 high-traffic
 *     calculator API routes.
 *   - global quota writes (_checkGlobalQuota, 2 counter rows/request) removed —
 *     it duplicated Cloudflare's native per-project request cap and was the
 *     single largest D1 writer. Rate limiting (1 write/request) stays fail-open.
 *
 * P1-2: D1-backed problem APIs must answer from the static dataset and degrade
 *   gracefully instead of 500-ing when D1 is over quota.
 *   - no SELECT * FROM problems in runtime code
 *   - no leading-wildcard LIKE '%x%' full scan on the hot /api/problems path
 *   - /api/problem/[slug] and /api/problems answer from static without D1
 */

import fs from 'fs';
import path from 'path';
import { resetStaticProblemsCache } from '@/lib/problems-source';

const ROOT = path.resolve(__dirname, '..');

function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Every source file that ships to production (excludes node_modules + tests). */
function productionSources(ext: string): { rel: string; code: string }[] {
    const dirs = ['app', 'lib', 'utils', 'components'];
    const out: { rel: string; code: string }[] = [];
    const walk = (dir: string) => {
        const abs = path.join(ROOT, dir);
        if (!fs.existsSync(abs)) return;
        for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
            const rel = `${dir}/${entry.name}`;
            if (entry.isDirectory()) walk(rel);
            else if (entry.name.endsWith(ext)) {
                out.push({ rel, code: stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf-8')) });
            }
        }
    };
    dirs.forEach(walk);
    return out;
}

const TS = productionSources('.ts').concat(productionSources('.tsx'));

jest.mock('@cloudflare/next-on-pages', () => ({
    // No DB → forces the static path in the API routes (proves they answer
    // without D1).
    getRequestContext: jest.fn(() => ({ env: {} })),
}), { virtual: true });

jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((body: any, init?: any) => ({
            status: init?.status ?? 200,
            headers: new Map(Object.entries(init?.headers ?? {})),
            body,
        })),
    },
}));

const LIBRARY = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'public/problems.json'), 'utf-8')
);

beforeEach(() => {
    resetStaticProblemsCache();
    (global as any).fetch = jest.fn(async (url: string) => {
        if (String(url).includes('problems.json')) {
            return { ok: true, json: async () => LIBRARY } as any;
        }
        return { ok: false, status: 404, json: async () => ({}) } as any;
    });
});

describe('P1-1: middleware no longer writes path_stats on every request', () => {
    it('middleware does not import or call trackPath', () => {
        const src = stripComments(fs.readFileSync(path.join(ROOT, 'middleware.ts'), 'utf-8'));
        expect(src).not.toMatch(/trackPath/);
        expect(src).not.toMatch(/path-tracker/);
    });

    it('middleware still enforces security (rate limiting + UA block retained)', () => {
        const src = stripComments(fs.readFileSync(path.join(ROOT, 'middleware.ts'), 'utf-8'));
        expect(src).toMatch(/performSecurityCheck/);
    });
});

describe('P1-1: global quota D1 writes removed, rate limiting kept fail-open', () => {
    it('security.ts no longer defines _checkGlobalQuota', () => {
        const src = stripComments(fs.readFileSync(path.join(ROOT, 'utils/security.ts'), 'utf-8'));
        expect(src).not.toMatch(/_checkGlobalQuota/);
    });

    it('security.ts no longer references GLOBAL_QUOTA config', () => {
        const src = stripComments(fs.readFileSync(path.join(ROOT, 'utils/security.ts'), 'utf-8'));
        expect(src).not.toMatch(/GLOBAL_QUOTA/);
    });

    it('security.ts still enforces per-IP rate limiting and fails open', () => {
        const src = stripComments(fs.readFileSync(path.join(ROOT, 'utils/security.ts'), 'utf-8'));
        expect(src).toMatch(/_checkD1RateLimit/);
        // fail-open: a D1 error inside rate limiting returns success:true
        expect(src).toMatch(/catch[\s\S]*return\s*\{\s*success:\s*true/);
    });
});

describe('P1-1: hot API routes no longer write path_stats', () => {
    const apiRoutes = [
        'app/api/derivative/route.ts',
        'app/api/integral/route.ts',
        'app/api/limit/route.ts',
        'app/api/matrix/route.ts',
        'app/api/ode/route.ts',
    ];
    it('none of the calculator API routes import or call trackPath', () => {
        for (const rel of apiRoutes) {
            const src = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf-8'));
            expect(src).not.toMatch(/trackPath/);
        }
    });
});

describe('P1-2: no SELECT * and no LIKE full scan in problem APIs', () => {
    it('no production file issues SELECT * FROM problems', () => {
        const offenders = TS
            .filter((f) => /SELECT\s+\*\s+FROM\s+problems/i.test(f.code))
            .map((f) => f.rel);
        expect(offenders).toEqual([]);
    });

    it('app/api/problems/route.ts does not use LIKE', () => {
        const src = stripComments(
            fs.readFileSync(path.join(ROOT, 'app/api/problems/route.ts'), 'utf-8')
        );
        expect(src).not.toMatch(/LIKE/i);
    });

    it('no production file uses a leading-wildcard tags LIKE scan', () => {
        const offenders = TS
            .filter((f) => /tags\s+LIKE/i.test(f.code))
            .map((f) => f.rel);
        expect(offenders).toEqual([]);
    });

    it('no production file uses ORDER BY RANDOM() / ORDER BY RAND()', () => {
        const offenders = TS
            .filter((f) => /ORDER\s+BY\s+RAND(OM)?\s*\(?/i.test(f.code))
            .map((f) => f.rel);
        expect(offenders).toEqual([]);
    });
});

describe('P1-2: problem APIs answer from static without D1', () => {
    it('/api/problem/derivative-of-1-x returns 200 from the static library (no DB)', async () => {
        const { GET } = await import('@/app/api/problem/[slug]/route');
        const res: any = await GET(
            { url: 'https://derivativecalculatorai.com/api/problem/derivative-of-1-x' } as any,
            { params: { slug: 'derivative-of-1-x' } }
        );
        expect(res.status).toBe(200);
        expect(res.body.slug).toBe('derivative-of-1-x');
        expect(res.body.formula).toBe('1/x');
    });

    it('/api/problems?type=derivative returns derivative rows from static (no DB)', async () => {
        const { GET } = await import('@/app/api/problems/route');
        const res: any = await GET(
            { url: 'https://derivativecalculatorai.com/api/problems?limit=3&type=derivative' } as any
        );
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(3);
        expect(res.body.every((r: any) => r.slug.startsWith('derivative-of-'))).toBe(true);
    });
});

describe('P1: public problem pages resolve the library before D1', () => {
    it('the [slug] page consults the library BEFORE its D1 query', () => {
        const src = stripComments(
            fs.readFileSync(path.join(ROOT, 'app/[slug]/page.tsx'), 'utf-8')
        );
        const body = src.slice(src.indexOf('export default async function ProblemPage'));
        const libraryIdx = body.indexOf('findStaticProblem(library, slug)');
        const d1Idx = body.indexOf('SELECT');
        expect(libraryIdx).toBeGreaterThan(-1);
        expect(d1Idx).toBeGreaterThan(-1);
        expect(libraryIdx).toBeLessThan(d1Idx);
    });
});
