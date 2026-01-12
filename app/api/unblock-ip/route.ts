import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ipToUnblock = searchParams.get('ip');

        if (!ipToUnblock) {
            return NextResponse.json({
                error: 'Missing IP parameter',
                usage: '/api/unblock-ip?ip=YOUR_IP_ADDRESS'
            }, { status: 400 });
        }

        // @ts-ignore - Cloudflare Workers environment binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;

        if (!db) {
            return NextResponse.json({ error: 'Database not available' }, { status: 500 });
        }

        // Delete from blacklist
        await db.prepare("DELETE FROM ip_blacklist WHERE ip = ?").bind(ipToUnblock).run();

        // Reset abuse score
        await db.prepare("DELETE FROM abuse_scores WHERE ip = ?").bind(ipToUnblock).run();

        // Reset rate limit
        await db.prepare("DELETE FROM rate_limits WHERE ip = ?").bind(ipToUnblock).run();

        return NextResponse.json({
            success: true,
            message: `IP ${ipToUnblock} has been unblocked`,
            timestamp: new Date().toISOString()
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to unblock IP',
            message: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
