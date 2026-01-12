import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

interface IpStats {
    ip: string;
    count: number;
    reset_time: number;
    isBlocked: boolean;
}

export async function GET(request: NextRequest) {
    try {
        // @ts-ignore - Cloudflare Workers environment binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;

        if (!db) {
            return NextResponse.json({
                error: 'Database not available',
            }, { status: 500 });
        }

        // Get all rate limit entries (active IPs in current window)
        const rateLimits = await db.prepare(
            "SELECT * FROM rate_limits ORDER BY count DESC LIMIT 50"
        ).all() as any;

        // Get all blocked IPs
        const blockedIps = await db.prepare(
            "SELECT ip, reason, blocked_until, offense_count FROM ip_blacklist"
        ).all() as any;

        // Get abuse scores
        const abuseScores = await db.prepare(
            "SELECT ip, score, last_updated FROM abuse_scores ORDER BY score DESC LIMIT 20"
        ).all() as any;

        const now = Math.floor(Date.now() / 1000);

        // Combine data
        const ipStats: IpStats[] = (rateLimits.results || []).map((entry: any) => {
            const blocked = (blockedIps.results || []).find((b: any) => b.ip === entry.ip);
            return {
                ip: entry.ip,
                count: entry.count,
                reset_time: entry.reset_time,
                isBlocked: !!blocked && blocked.blocked_until > now,
            };
        });

        // Calculate statistics
        const totalRequests = ipStats.reduce((sum, ip) => sum + ip.count, 0);
        const activeIps = ipStats.length;
        const blockedIpsCount = (blockedIps.results || []).filter((b: any) => b.blocked_until > now).length;

        // Identify suspicious IPs (high request count)
        const suspiciousIps = ipStats.filter(ip => ip.count > 10);

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            summary: {
                totalRequests,
                activeIps,
                blockedIps: blockedIpsCount,
                suspiciousIps: suspiciousIps.length,
            },
            topIps: ipStats.slice(0, 20),
            blockedIps: (blockedIps.results || [])
                .filter((b: any) => b.blocked_until > now)
                .map((b: any) => ({
                    ip: b.ip,
                    reason: b.reason,
                    blockedUntil: new Date(b.blocked_until * 1000).toISOString(),
                    offenseCount: b.offense_count,
                })),
            highAbuseScoreIps: (abuseScores.results || [])
                .filter((s: any) => s.score > 30)
                .map((s: any) => ({
                    ip: s.ip,
                    score: s.score,
                    lastUpdated: new Date(s.last_updated * 1000).toISOString(),
                })),
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to fetch IP stats',
            message: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
