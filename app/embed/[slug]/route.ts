/**
 * Embed Widget Route Handler - Returns 403 Forbidden
 * 
 * This route handler intercepts GET requests to /embed/* and returns 403 Forbidden
 * with long-term caching to minimize quota usage.
 * 
 * NOTE: This route should be blocked at Cloudflare edge level using Custom Rules
 * for maximum effectiveness (no quota consumption at all).
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    // Permanently block all embed requests
    // Return 403 with long-term caching to minimize quota usage
    return new NextResponse('Embed widget has been permanently disabled.', {
        status: 403,
        headers: {
            'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
            'Content-Type': 'text/plain',
        },
    });
}
