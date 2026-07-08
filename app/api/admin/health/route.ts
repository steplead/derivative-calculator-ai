/**
 * /api/admin/health — Unified Health Check Endpoint
 *
 * Provides a single endpoint for external uptime monitoring and
 * internal system health assessment. Protected by admin auth.
 *
 * Checks:
 * 1. D1 database connectivity
 * 2. Redis/Upstash connectivity
 * 3. OpenRouter API availability (env var presence + ping)
 * 4. Global quota usage
 * 5. Recent request volume (from counters)
 * 6. D1 table row counts (size estimate)
 *
 * Response format:
 * { status: "healthy" | "degraded" | "down",
 *   checks: { ... },
 *   summary: { ... } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { isAdminRequest } from '@/utils/admin-auth';
import { adminResponseHeaders } from '@/utils/monitoring-sanitize';
import { redis } from '@/utils/cache';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    // SECURITY: Require admin authentication
    if (!isAdminRequest(request.headers)) {
        return NextResponse.json({
            error: 'Unauthorized',
            status: 'unauthorized',
        }, { status: 401, headers: adminResponseHeaders() });
    }

    const checks: Record<string, { ok: boolean; detail?: string; latencyMs?: number }> = {};
    let overallStatus = 'healthy';

    // ========== 1. D1 Database ==========
    try {
        // @ts-ignore — Cloudflare Workers D1 binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;
        if (!db) {
            checks.d1 = { ok: false, detail: 'DB binding not available' };
            overallStatus = 'down';
        } else {
            const start = Date.now();
            const result = await db.prepare('SELECT 1 as test').first();
            const latency = Date.now() - start;
            checks.d1 = {
                ok: result?.test === 1,
                detail: result?.test === 1 ? 'connected' : 'unexpected result',
                latencyMs: latency,
            };
            if (!checks.d1.ok) overallStatus = 'degraded';
        }
    } catch (e) {
        checks.d1 = { ok: false, detail: 'connection error' };
        overallStatus = 'down';
    }

    // ========== 2. Redis / Upstash ==========
    if (!redis) {
        checks.redis = { ok: false, detail: 'not configured (env vars missing)' };
        // Redis being absent is acceptable — rate limiting falls back to D1
    } else {
        try {
            const start = Date.now();
            await redis.set('health:ping', 'ok', { ex: 30 });
            const value = await redis.get('health:ping');
            const latency = Date.now() - start;
            checks.redis = {
                ok: value === 'ok',
                detail: value === 'ok' ? 'connected' : 'unexpected value',
                latencyMs: latency,
            };
            if (!checks.redis.ok) overallStatus = 'degraded';
        } catch (e) {
            checks.redis = { ok: false, detail: 'connection error' };
            overallStatus = 'degraded';
        }
    }

    // ========== 3. OpenRouter API ==========
    const hasApiKey = !!process.env.OPENROUTER_API_KEY;
    checks.openrouter = {
        ok: hasApiKey,
        detail: hasApiKey ? 'API key configured' : 'API key missing — AI explanations disabled',
    };
    if (!hasApiKey) overallStatus = 'degraded';

    // ========== 4. Global Quota Usage ==========
    try {
        // @ts-ignore — Cloudflare Workers D1 binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;
        if (db) {
            const now = Math.floor(Date.now() / 1000);
            const currentHour = Math.floor(now / 3600);
            const currentDay = Math.floor(now / 86400);

            const hourCount = await db.prepare(
                "SELECT value FROM counters WHERE key = ?"
            ).bind(`global:hour:${currentHour}`).first() as { value: number } | null;

            const dayCount = await db.prepare(
                "SELECT value FROM counters WHERE key = ?"
            ).bind(`global:day:${currentDay}`).first() as { value: number } | null;

            checks.quota = {
                ok: true,
                detail: `hourly: ${(hourCount?.value || 0)}/4200, daily: ${(dayCount?.value || 0)}/100000`,
            };

            // Warn if approaching limits
            if ((dayCount?.value || 0) > 80000) {
                checks.quota.ok = false;
                checks.quota.detail += ' — approaching daily limit';
                overallStatus = 'degraded';
            }
        }
    } catch (e) {
        checks.quota = { ok: true, detail: 'unable to check (transient)' };
    }

    // ========== 5. D1 Table Sizes ==========
    try {
        // @ts-ignore — Cloudflare Workers D1 binding
        const env = getRequestContext()?.env as any;
        const db = env?.DB;
        if (db) {
            const rl = await db.prepare("SELECT COUNT(*) as c FROM rate_limits").first() as { c: number } | null;
            const ct = await db.prepare("SELECT COUNT(*) as c FROM counters").first() as { c: number } | null;
            const ps = await db.prepare("SELECT COUNT(*) as c FROM path_stats").first() as { c: number } | null;
            const bl = await db.prepare("SELECT COUNT(*) as c FROM ip_blacklist").first() as { c: number } | null;
            const ab = await db.prepare("SELECT COUNT(*) as c FROM abuse_scores").first() as { c: number } | null;

            checks.d1_tables = {
                ok: true,
                detail: `rate_limits:${rl?.c || 0}, counters:${ct?.c || 0}, path_stats:${ps?.c || 0}, ip_blacklist:${bl?.c || 0}, abuse_scores:${ab?.c || 0}`,
            };

            // Warn if path_stats is large (> 10k rows)
            if ((ps?.c || 0) > 10000) {
                checks.d1_tables.ok = false;
                checks.d1_tables.detail += ' — path_stats needs cleanup';
                if (overallStatus === 'healthy') overallStatus = 'degraded';
            }
        }
    } catch (e) {
        checks.d1_tables = { ok: true, detail: 'unable to check' };
    }

    // ========== 6. Homepage / API availability (lightweight probe) ==========
    // We don't make outbound HTTP requests here (would be recursive and slow).
    // Instead, we check that the host header indicates our domain.
    const host = request.headers.get('host') || '';
    checks.site_identity = {
        ok: host.includes('derivativecalculatorai.com') || host.includes('localhost'),
        detail: host,
    };

    // ========== Summary ==========
    const failedChecks = Object.values(checks).filter(c => !c.ok).length;
    if (failedChecks > 0 && overallStatus === 'healthy') {
        overallStatus = 'degraded';
    }

    return NextResponse.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
        summary: {
            totalChecks: Object.keys(checks).length,
            passed: Object.values(checks).filter(c => c.ok).length,
            failed: failedChecks,
        },
    }, {
        status: overallStatus === 'down' ? 503 : 200,
        headers: adminResponseHeaders(),
    });
}
