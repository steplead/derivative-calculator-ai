/**
 * /api/unblock-ip — DEPRECATED stub
 *
 * This endpoint has been moved to /api/admin/unblock-ip for security.
 * The old endpoint no longer performs any D1 operations.
 * Returns 410 Gone with a pointer to the new location.
 *
 * SECURITY: no-store, no token exposure, no D1 writes.
 */

import { NextResponse } from 'next/server';
import { adminResponseHeaders } from '@/utils/monitoring-sanitize';

export const runtime = 'edge';

export async function GET() {
    return NextResponse.json({
        error: 'This endpoint has been deprecated and removed.',
        migration: 'Use /api/admin/unblock-ip with proper admin authentication instead.',
        documentation: 'Requires Authorization: Bearer <ADMIN_MONITORING_TOKEN>.',
    }, { status: 410, headers: adminResponseHeaders() });
}

export async function POST() {
    return NextResponse.json({
        error: 'This endpoint has been deprecated and removed.',
        migration: 'Use /api/admin/unblock-ip with proper admin authentication instead.',
    }, { status: 410, headers: adminResponseHeaders() });
}
