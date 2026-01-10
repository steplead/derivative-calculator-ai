import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
    const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        requestContextAvailable: false,
        envAvailable: false,
        dbBindingAvailable: false,
        dbTest: 'not_attempted',
    };

    try {
        const ctx = getRequestContext();
        results.requestContextAvailable = !!ctx;
        results.envAvailable = !!ctx?.env;
        results.dbBindingAvailable = !!ctx?.env?.DB;

        if (ctx?.env?.DB) {
            const db = ctx.env.DB;

            // Test simple query
            try {
                const result = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
                results.dbTest = 'success';
                results.tables = result.results?.map((r: any) => r.name) || [];
                results.hasRateLimitsTable = results.tables.includes('rate_limits');
            } catch (dbError) {
                results.dbTest = `query_error: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
            }
        } else {
            results.dbTest = 'db_binding_not_available';
        }

        results.verdict = results.dbBindingAvailable && results.hasRateLimitsTable
            ? 'OK: D1 binding and rate_limits table are available'
            : results.dbBindingAvailable
                ? 'WARNING: D1 binding available but rate_limits table missing'
                : 'CRITICAL: D1 binding NOT available. Rate limiting disabled.';

    } catch (error) {
        results.error = error instanceof Error ? error.message : String(error);
        results.verdict = 'ERROR: Exception during D1 check.';
    }

    return NextResponse.json(results, {
        status: 200,
        headers: {
            'Cache-Control': 'no-store, must-revalidate',
        },
    });
}
