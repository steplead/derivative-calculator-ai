import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { loadStaticProblemsSafe, filterByType } from '@/lib/problems-source';

export const runtime = 'edge';

// P1-2: list problems from the static dataset first (no D1, no full-table scan,
// no SELECT *). D1 is only consulted as a fallback when a `tag` filter cannot be
// satisfied from the static library (tags are not present in problems.json).
const PROBLEM_COLUMNS = 'slug, formula, title, type, description, limitTo, difficulty';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');

    // 1. Static dataset is the primary source.
    const library = await loadStaticProblemsSafe();
    let rows = type ? filterByType(library, type) : library;

    // 2. Tag filter: tags live only in D1, so apply it against the static subset
    //    when possible; otherwise fall back to D1 with an INDEXED type predicate
    //    (never a leading-wildcard LIKE full scan).
    if (tag) {
        const tagged = rows.filter(
            (p: any) => p && p.tags && String(p.tags).includes(tag)
        );
        if (tagged.length > 0) {
            rows = tagged;
        } else {
            // Static library has no tag data — try D1, but narrow with the
            // indexed `type` column first, then filter in JS (no LIKE '%x%').
            try {
                // @ts-ignore - Cloudflare Workers D1 binding
                const db = getRequestContext()?.env?.DB;
                if (db) {
                    let query = `SELECT ${PROBLEM_COLUMNS} FROM problems`;
                    const binds: any[] = [];
                    if (type) {
                        query += ' WHERE type = ?';
                        binds.push(type);
                    }
                    query += ' ORDER BY slug LIMIT ? OFFSET ?';
                    binds.push(limit, offset);
                    const { results } = await db.prepare(query).bind(...binds).all();
                    const fromDb = (results || []).filter(
                        (r: any) => r.tags && String(r.tags).includes(tag)
                    );
                    if (fromDb.length > 0) {
                        return NextResponse.json(fromDb);
                    }
                }
            } catch (e: any) {
                console.error("D1 problems fetch failed:", e);
            }
        }
    }

    // 3. Paginate the (static) result set.
    const paged = rows.slice(offset, offset + limit);
    return NextResponse.json(paged);
}
