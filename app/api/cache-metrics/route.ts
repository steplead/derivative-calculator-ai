import { NextResponse } from 'next/server';
import { getCacheMetrics } from '@/utils/cache';

export const runtime = 'edge';

export async function GET() {
    const metrics = getCacheMetrics();

    // Add health warnings
    const warnings: string[] = [];
    const hitRateNum = parseFloat(metrics.hitRate.replace('%', ''));

    if (hitRateNum < 50) {
        warnings.push('Cache hit rate below 50% - Redis may be down or cache TTL too short');
    }
    if (metrics.total > 1000 && hitRateNum < 70) {
        warnings.push('Cache hit rate below 70% after 1000+ requests - consider increasing cache TTL');
    }

    return NextResponse.json({
        ...metrics,
        timestamp: new Date().toISOString(),
        health: warnings.length === 0 ? 'healthy' : 'warning',
        warnings,
        note: "Metrics reset on server restart. For production, consider persistent metrics."
    });
}
