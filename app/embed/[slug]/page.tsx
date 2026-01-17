/**
 * Embed Widget Route - Permanently Disabled
 * 
 * This route handles requests from embedded widgets on other websites.
 * Since widget functionality has been permanently disabled to prevent abuse,
 * this route returns 403 Forbidden with long-term caching to minimize quota usage.
 * 
 * NOTE: This route should be blocked at Cloudflare edge level using Custom Rules
 * for maximum effectiveness (no quota consumption at all).
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface PageProps {
    params: {
        slug: string;
    };
    searchParams: {
        theme?: string;
        preview?: string;
    };
}

export async function GET(request: Request) {
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

// Keep default export for Next.js compatibility (though GET handler takes precedence)
export default function EmbedPage() {
    return null; // This should never be called due to GET handler
}
