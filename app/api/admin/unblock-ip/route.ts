import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { isAdminRequest } from '@/utils/admin-auth';
import { hashIp, adminResponseHeaders, assertSaltOrFailClosed } from '@/utils/monitoring-sanitize';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    // SECURITY: Require admin authentication (Bearer token only)
    if (!isAdminRequest(request.headers)) {
        return NextResponse.json({
            error: 'Unauthorized. Admin access required.',
        }, { status: 401, headers: adminResponseHeaders() });
    }

    // SECURITY: Fail closed if MONITORING_HASH_SALT is missing in production
    const saltFail = assertSaltOrFailClosed();
    if (saltFail) {
        return NextResponse.json(saltFail.body, {
            status: saltFail.status,
            headers: { ...adminResponseHeaders(), ...saltFail.headers },
        });
    }

    try {
        const { searchParams } = new URL(request.url);
        const ipToUnblock = searchParams.get('ip');

        if (!ipToUnblock) {
            return NextResponse.json({
                error: 'Missing IP parameter',
                usage: '/api/admin/unblock-ip?ip=YOUR_IP_ADDRESS'
            }, { status: 400, headers: adminResponseHeaders() });
        }

        // @ts-ignore - Cloudflare Workers environment binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;

        if (!db) {
            return NextResponse.json({
                error: 'Database not available',
            }, { status: 500, headers: adminResponseHeaders() });
        }

        // Delete from blacklist
        await db.prepare("DELETE FROM ip_blacklist WHERE ip = ?").bind(ipToUnblock).run();

        // Reset abuse score
        await db.prepare("DELETE FROM abuse_scores WHERE ip = ?").bind(ipToUnblock).run();

        // Reset rate limit
        await db.prepare("DELETE FROM rate_limits WHERE ip = ?").bind(ipToUnblock).run();

        return NextResponse.json({
            success: true,
            message: `IP ${await hashIp(ipToUnblock)} has been unblocked`,
            timestamp: new Date().toISOString()
        }, {
            headers: adminResponseHeaders(),
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to unblock IP',
        }, { status: 500, headers: adminResponseHeaders() });
    }
}
