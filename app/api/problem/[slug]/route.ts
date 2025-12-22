import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    const { slug } = params;

    try {
        // @ts-ignore
        const db = getRequestContext().env.DB;

        if (!db) {
            console.warn("D1 Database binding 'DB' not found. Falling back or failing.");
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        const problem = await db.prepare("SELECT * FROM problems WHERE slug = ?")
            .bind(slug)
            .first();

        if (!problem) {
            return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }

        return NextResponse.json(problem);
    } catch (e: any) {
        console.error("D1 Fetch Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
