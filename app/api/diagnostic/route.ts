import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        // @ts-ignore - Cloudflare Workers environment binding
        const env = getRequestContext()?.env as any;

        const diagnostic = {
            timestamp: new Date().toISOString(),
            environment: {
                SKIP_SECURITY: env?.SKIP_SECURITY || 'UNDEFINED',
                hasDB: !!env?.DB,
                DB_name: env?.DB?.constructor?.name || 'NONE',
            },
            request: {
                method: request.method,
                url: request.url,
                headers: Object.fromEntries(request.headers.entries()),
            },
        };

        return NextResponse.json(diagnostic, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Diagnostic failed',
            message: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
