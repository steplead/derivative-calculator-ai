/**
 * REGRESSION GUARD — Cloudflare D1 rows_read quota.
 *
 * Incident: `SELECT * FROM problems WHERE slug != ? ORDER BY RANDOM() LIMIT 10`
 * ran ~1,700x/day and read >8M rows/day, exceeding the D1 free tier
 * (5M rows_read/day).
 *
 * These tests fail if anyone reintroduces a whole-table scan / sort, or the
 * redundant `?limit=50` self-fetch that also billed 50 rows per page view.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchRelatedFromD1 } from '@/lib/d1/related-problems';

const PAGE_PATH = path.join(process.cwd(), 'app/[slug]/page.tsx');

/**
 * Strip comments before scanning, otherwise the "BEFORE (removed):" explanatory
 * comments that document the old bad query would trip the guard.
 */
function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const pageSource = stripComments(fs.readFileSync(PAGE_PATH, 'utf8'));

/** Minimal D1 stub that records every statement it is asked to prepare. */
function makeDb(rowCount: number, forwardRows: any[] = [], backRows: any[] = []) {
    const calls: { sql: string; binds: any[] }[] = [];
    const db = {
        calls,
        rowsRead: 0,
        prepare(sql: string) {
            return {
                bind(...binds: any[]) {
                    calls.push({ sql, binds });
                    const isForward = /slug\s*>\s*\?/.test(sql);
                    const isBackward = /slug\s*<=\s*\?/.test(sql);
                    const limit = typeof binds[1] === 'number' ? binds[1] : 10;
                    db.rowsRead += Math.min(rowCount, limit);
                    return {
                        async all() {
                            const pool = isForward ? forwardRows : isBackward ? backRows : [];
                            return { results: pool.slice(0, limit) };
                        },
                    };
                },
            };
        },
    };
    return db;
}

describe('D1 quota guard — source level', () => {
    it('[slug] page must not contain ORDER BY RANDOM / ORDER BY RAND', () => {
        expect(pageSource).not.toMatch(/ORDER\s+BY\s+RAND(OM)?\b/i);
    });

    it('[slug] page must not contain the full-scan related query (slug != ... ORDER BY RANDOM)', () => {
        expect(pageSource).not.toMatch(/slug\s*!=\s*\?[^"'`]*ORDER\s+BY\s+RANDOM/i);
    });

    it('[slug] page must not self-fetch /api/problems (cost 50 rows_read per view)', () => {
        expect(pageSource).not.toMatch(/\/api\/problems\?limit=/);
    });

    it('[slug] page must not use Math.random() for related-problem ordering', () => {
        expect(pageSource).not.toMatch(/sort\(\s*\(\s*\)\s*=>\s*0?\.5\s*-\s*Math\.random/);
    });
});

describe('D1 quota guard — runtime level', () => {
    it('uses an index range seek on slug, never SELECT *, never RANDOM', async () => {
        const db = makeDb(3137, [{ slug: 'zzz' }]);
        await fetchRelatedFromD1(db, 'derivative-of-x^2', 10);

        expect(db.calls.length).toBeGreaterThan(0);
        for (const call of db.calls) {
            const sql = call.sql.toUpperCase();
            expect(sql).not.toContain('RANDOM');
            expect(sql).not.toContain('SELECT *');
            expect(sql).toContain('FROM PROBLEMS');
            expect(sql).toContain('LIMIT ?');
            expect(sql).toMatch(/WHERE\s+SLUG\s*(>|<=)\s*\?/);
        }
    });

    it('reads at most 2 * limit rows even when the table has 3,137 rows', async () => {
        // forward query returns nothing (slug is last in the index) → wrap-around
        const db = makeDb(3137, [], [{ slug: 'aaa' }]);
        const related = await fetchRelatedFromD1(db, 'zzz-last-slug', 10);

        expect(db.calls).toHaveLength(2);
        expect(db.rowsRead).toBeLessThanOrEqual(20); // 2 * limit
        expect(db.rowsRead).toBeLessThan(3137);
        expect(related.length).toBeLessThanOrEqual(10);
    });

    it('stops after the forward seek when it already filled the limit', async () => {
        const forwardRows = Array.from({ length: 10 }, (_, i) => ({ slug: `p-${i}` }));
        const db = makeDb(3137, forwardRows);
        const related = await fetchRelatedFromD1(db, 'derivative-of-x^2', 10);

        expect(db.calls).toHaveLength(1);
        expect(db.rowsRead).toBe(10);
        expect(related).toHaveLength(10);
    });

    it('is deterministic: same slug yields the same rows in the same order', async () => {
        const forwardRows = Array.from({ length: 10 }, (_, i) => ({ slug: `p-${i}` }));
        const a = await fetchRelatedFromD1(makeDb(3137, forwardRows), 'derivative-of-x^2', 10);
        const b = await fetchRelatedFromD1(makeDb(3137, forwardRows), 'derivative-of-x^2', 10);
        expect(a).toEqual(b);
    });

    it('never returns more rows than the requested limit', async () => {
        const forwardRows = Array.from({ length: 4 }, (_, i) => ({ slug: `p-${i}` }));
        const backRows = Array.from({ length: 8 }, (_, i) => ({ slug: `b-${i}` }));
        const related = await fetchRelatedFromD1(makeDb(3137, forwardRows, backRows), 'mmm', 10);
        expect(related.length).toBeLessThanOrEqual(10);
    });
});
