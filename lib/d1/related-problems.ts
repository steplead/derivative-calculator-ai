/**
 * D1-QUOTA FIX — related-problem lookup that never scans the `problems` table.
 *
 * BEFORE (removed from app/[slug]/page.tsx):
 *   SELECT * FROM problems WHERE slug != ? ORDER BY RANDOM() LIMIT 10
 *   - `slug != ?` is NOT a range constraint, so SQLite cannot seek into the index.
 *   - `ORDER BY RANDOM()` forces SQLite to materialise and sort EVERY row before
 *     LIMIT can be applied.
 *   - `SELECT *` also pulls unused columns (description, tags, views...).
 *   - Measured cost: ~3,137 rows_read per page view; ~1,700 views/day
 *     => >5M rows/day, over the D1 free tier (5M rows_read/day).
 *
 * AFTER (this module):
 *   SELECT slug, formula, title, type, difficulty
 *     FROM problems WHERE slug >  ? ORDER BY slug      LIMIT ?
 *   SELECT slug, formula, title, type, difficulty
 *     FROM problems WHERE slug <= ? ORDER BY slug DESC LIMIT ?
 *   - Both are B-tree range seeks on the index over problems.slug.
 *   - `ORDER BY slug` / `ORDER BY slug DESC` is satisfied by the index itself,
 *     so there is no materialise + sort step (no temp B-tree).
 *   - Worst-case rows_read = 2 * limit (20); typical = limit (10).
 *     That is a ~300x reduction versus the RANDOM() scan.
 *   - Deterministic: the same slug always yields the same neighbours, so SSR
 *     output is stable (no hydration mismatch) and re-crawls see an identical
 *     internal-link block — strictly better for SEO than random ordering.
 *   - The second query only runs when the first one returns fewer than `limit`
 *     rows (i.e. the slug sits near the end of the index).
 */

export interface RelatedProblemRow {
    slug: string;
    formula: string;
    title: string;
    type?: string;
    difficulty?: string;
}

const COLUMNS = 'slug, formula, title, type, difficulty';

export async function fetchRelatedFromD1(
    db: any,
    slug: string,
    limit: number = 10
): Promise<RelatedProblemRow[]> {
    if (!db || !slug || limit <= 0) return [];

    const forward = await db
        .prepare(`SELECT ${COLUMNS} FROM problems WHERE slug > ? ORDER BY slug LIMIT ?`)
        .bind(slug, limit)
        .all();
    const head: RelatedProblemRow[] = Array.isArray(forward?.results) ? forward.results : [];
    if (head.length >= limit) return head.slice(0, limit);

    // Wrap around for slugs near the end of the index.
    const back = await db
        .prepare(`SELECT ${COLUMNS} FROM problems WHERE slug <= ? ORDER BY slug DESC LIMIT ?`)
        .bind(slug, limit - head.length)
        .all();
    const tail: RelatedProblemRow[] = Array.isArray(back?.results) ? back.results : [];

    return [...head, ...tail].slice(0, limit);
}
