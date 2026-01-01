import { NextResponse } from 'next/server';
import { getCacheMetrics } from '@/utils/cache';

export const runtime = 'edge';

export async function GET() {
    const metrics = getCacheMetrics();

    return NextResponse.json({
        ...metrics,
        timestamp: new Date().toISOString(),
        note: "Metrics reset on server restart. For production, consider persistent metrics."
    });
}
