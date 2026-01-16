import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/utils/admin-auth';
import { getPathStats } from '@/utils/path-tracker';

export const runtime = 'edge';

/**
 * API endpoint to get request path statistics
 * 
 * This endpoint provides request path statistics from D1 database.
 * Only accessible by admin.
 */
export async function GET(request: NextRequest) {
    // SECURITY: Require admin authentication
    if (!isAdminRequest(request.headers)) {
        return NextResponse.json({
            error: 'Unauthorized. Admin access required.',
        }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const hours = parseInt(searchParams.get('hours') || '24', 10);

        const stats = await getPathStats(hours);

        // Calculate totals
        const total = stats.reduce((sum, item) => sum + item.count, 0);
        const totalSuccess = stats.reduce((sum, item) => sum + item.success_count, 0);
        const totalError = stats.reduce((sum, item) => sum + item.error_count, 0);

        return NextResponse.json({
            success: true,
            period_hours: hours,
            total_requests: total,
            total_success: totalSuccess,
            total_error: totalError,
            paths: stats,
            total_paths: stats.length,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to get path statistics',
            message: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
