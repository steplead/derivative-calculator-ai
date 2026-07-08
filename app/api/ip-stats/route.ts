import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { isAdminRequest } from '@/utils/admin-auth';
import { hashIp, adminResponseHeaders, assertSaltOrFailClosed } from '@/utils/monitoring-sanitize';

export const runtime = 'edge';

export async function GET(_request: NextRequest) {
    // SECURITY: Require admin authentication (Bearer token only)
    if (!isAdminRequest(_request.headers)) {
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
        // @ts-ignore - Cloudflare Workers environment binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;

        if (!db) {
            return NextResponse.json({
                error: 'Database not available',
            }, { status: 500, headers: adminResponseHeaders() });
        }

        // Get all rate limit entries (active IPs in current window)
        const rateLimits = await db.prepare(
            "SELECT * FROM rate_limits ORDER BY count DESC LIMIT 50"
        ).all() as any;

        // Get all blocked IPs — reason omitted (may contain UA info)
        const blockedIps = await db.prepare(
            "SELECT ip, blocked_until, offense_count FROM ip_blacklist"
        ).all() as any;

        // Get abuse scores
        const abuseScores = await db.prepare(
            "SELECT ip, score, last_updated FROM abuse_scores ORDER BY score DESC LIMIT 20"
        ).all() as any;

        const now = Math.floor(Date.now() / 1000);

        // Hash all IPs async (HMAC-SHA256 + salt)
        const ipStats = await Promise.all((rateLimits.results || []).map(async (entry: any) => {
            const blocked = (blockedIps.results || []).find((b: any) => b.ip === entry.ip);
            return {
                ipHash: await hashIp(entry.ip),
                count: entry.count as number,
                reset_time: entry.reset_time as number,
                isBlocked: !!blocked && blocked.blocked_until > now,
            };
        }));

        // Calculate statistics
        const totalRequests = ipStats.reduce((sum: number, ip: { count: number }) => sum + ip.count, 0);
        const activeIps = ipStats.length;
        const blockedIpsCount = (blockedIps.results || []).filter((b: any) => b.blocked_until > now).length;

        // Identify suspicious IPs (high request count)
        const suspiciousIps = ipStats.filter((ip: { count: number }) => ip.count > 10);

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            summary: {
                totalRequests,
                activeIps,
                blockedIps: blockedIpsCount,
                suspiciousIps: suspiciousIps.length,
            },
            topIps: ipStats.slice(0, 20),
            blockedIps: await Promise.all((blockedIps.results || [])
                .filter((b: any) => b.blocked_until > now)
                .map(async (b: any) => ({
                    ipHash: await hashIp(b.ip),
                    // reason omitted — may contain raw UA strings
                    blockedUntil: new Date(b.blocked_until * 1000).toISOString(),
                    offenseCount: b.offense_count,
                }))),
            highAbuseScoreIps: await Promise.all((abuseScores.results || [])
                .filter((s: any) => s.score > 30)
                .map(async (s: any) => ({
                    ipHash: await hashIp(s.ip),
                    score: s.score,
                    lastUpdated: new Date(s.last_updated * 1000).toISOString(),
                }))),
        }, {
            headers: adminResponseHeaders(),
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to fetch IP stats',
        }, { status: 500, headers: adminResponseHeaders() });
    }
}
