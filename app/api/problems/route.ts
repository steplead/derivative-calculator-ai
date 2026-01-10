import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');

    try {
        // @ts-ignore
        const db = getRequestContext().env.DB;

        if (!db) {
            console.warn("D1 Database binding 'DB' not found. Falling back or failing.");
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        let query = "SELECT * FROM problems";
        const binds: any[] = [];
        const conditions: string[] = [];

        if (type) {
            conditions.push("type = ?");
            binds.push(type);
        }

        if (tag) {
            conditions.push("tags LIKE ?");
            binds.push(`%${tag}%`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY id LIMIT ? OFFSET ?";
        binds.push(limit, offset);

        const { results } = await db.prepare(query)
            .bind(...binds)
            .all();

        return NextResponse.json(results);
    } catch (e: any) {
        console.error("D1 Fetch Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
