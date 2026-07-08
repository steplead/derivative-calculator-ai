import { NextResponse, NextRequest } from 'next/server';
import { redis, ratelimit } from '@/utils/cache';
import { isAdminRequest } from '@/utils/admin-auth';
import { adminResponseHeaders } from '@/utils/monitoring-sanitize';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    // SECURITY: Require admin authentication
    if (!isAdminRequest(request.headers)) {
        return NextResponse.json({
            error: 'Unauthorized. Admin access required.',
        }, { status: 401, headers: adminResponseHeaders() });
    }
    const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        redis_configured: false,
        ratelimit_configured: false,
        redis_url_set: false,
        redis_token_set: false,
        redis_connection_test: 'not_attempted',
        env_check: {},
    };

    // Check environment variables — only boolean presence flags, never values
    results.env_check = {
        UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        NODE_ENV: process.env.NODE_ENV,
    };

    results.redis_url_set = results.env_check.UPSTASH_REDIS_REST_URL;
    results.redis_token_set = results.env_check.UPSTASH_REDIS_REST_TOKEN;

    // Test Redis connection
    if (redis) {
        results.redis_configured = true;
        try {
            // Test SET
            await redis.set('health_check', 'ok', { ex: 60 });
            // Test GET
            const value = await redis.get('health_check');
            results.redis_connection_test = value === 'ok' ? 'success' : 'unexpected_value';
        } catch (e) {
            results.redis_connection_test = `error: ${e instanceof Error ? e.message : String(e)}`;
        }
    } else {
        results.redis_connection_test = 'redis_not_configured';
    }

    // Test Ratelimit
    if (ratelimit) {
        results.ratelimit_configured = true;
        // Try to use ratelimit
        try {
            const { success } = await ratelimit.limit('health_check_ip');
            results.ratelimit_test = success ? 'allowed' : 'blocked';
        } catch (e) {
            results.ratelimit_test = `error: ${e instanceof Error ? e.message : String(e)}`;
        }
    } else {
        results.ratelimit_configured = false;
        results.ratelimit_test = 'ratelimit_not_configured';
    }

    // Final verdict
    if (!results.redis_configured) {
        results.verdict = 'CRITICAL: Redis not configured. Rate limiting is DISABLED.';
    } else if (results.redis_connection_test !== 'success') {
        results.verdict = 'ERROR: Redis configured but connection failed.';
    } else if (!results.ratelimit_configured) {
        results.verdict = 'ERROR: Redis connected but ratelimit not initialized.';
    } else {
        results.verdict = 'OK: Redis and ratelimit are working correctly.';
    }

    return NextResponse.json(results, {
        status: 200,
        headers: adminResponseHeaders(),
    });
}
