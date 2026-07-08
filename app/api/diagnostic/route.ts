import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { isAdminRequest } from '@/utils/admin-auth';
import { sanitizeHeaders, adminResponseHeaders } from '@/utils/monitoring-sanitize';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    // SECURITY: Require admin authentication
    if (!isAdminRequest(request.headers)) {
        return NextResponse.json({
            error: 'Unauthorized. Admin access required.',
        }, { status: 401, headers: adminResponseHeaders() });
    }

    try {
        // @ts-ignore - Cloudflare Workers environment binding
        const env = getRequestContext()?.env as any;

        const diagnostic = {
            timestamp: new Date().toISOString(),
            environment: {
                // Only output boolean presence flags — never env var values
                hasDB: !!env?.DB,
                hasRedis: !!env?.UPSTASH_REDIS_REST_URL,
                hasOpenRouter: !!env?.OPENROUTER_API_KEY,
                skipSecurity: env?.SKIP_SECURITY === 'true',
            },
            request: {
                method: request.method,
                host: request.headers.get('host') || 'unknown',
                // Sanitized headers — no IP, no raw UA, no auth tokens
                headers: sanitizeHeaders(request.headers),
            },
        };

        return NextResponse.json(diagnostic, {
            status: 200,
            headers: adminResponseHeaders(),
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Diagnostic failed',
        }, { status: 500, headers: adminResponseHeaders() });
    }
}
