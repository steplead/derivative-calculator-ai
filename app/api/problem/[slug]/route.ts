import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { loadStaticProblemsSafe, findStaticProblem } from '@/lib/problems-source';

export const runtime = 'edge';

// P1-2: the static dataset is the PRIMARY source. D1 is only a fallback for
// slugs that are not in the static library, and is skipped entirely when it is
// unavailable or over its free-tier quota — so the public API keeps answering
// from the authoritative dataset instead of 500-ing.
const PROBLEM_COLUMNS = 'slug, formula, title, type, description, limitTo, difficulty';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    const { slug } = params;

    // 1. Static-first (no D1 read — works even when D1 is over its free-tier quota).
    const library = await loadStaticProblemsSafe();
    const staticProblem = findStaticProblem(library, slug);
    if (staticProblem) {
        return NextResponse.json(staticProblem);
    }

    // 2. D1 fallback only for slugs absent from the static library.
    try {
        // @ts-ignore - Cloudflare Workers D1 binding
        const db = getRequestContext()?.env?.DB;
        if (db) {
            const problem = await db.prepare(
                `SELECT ${PROBLEM_COLUMNS} FROM problems WHERE slug = ?`
            ).bind(slug).first();
            if (problem) {
                return NextResponse.json(problem);
            }
        }
    } catch (e: any) {
        // D1 failure (e.g. over free-tier quota) must not 500 when the static
        // dataset already answered — but here static had nothing, so degrade.
        console.error("D1 problem fetch failed:", e);
    }

    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
}
