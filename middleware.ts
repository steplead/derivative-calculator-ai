import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { trackPath } from "@/utils/path-tracker";
import { performSecurityCheck } from "@/utils/security";

export const runtime = 'experimental-edge';

const locales = ["es", "pt"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ULTRA AGGRESSIVE: Early blocking before any processing to reduce quota usage
    // Block suspicious requests at the edge, before they consume Worker resources
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // Block requests without User-Agent (almost always bots)
    if (!userAgent || userAgent.trim() === '') {
        return NextResponse.json(
            { error: 'Access denied. User-Agent required.' },
            { status: 403 }
        );
    }

    // Block suspicious User-Agent patterns (common bots/crawlers)
    const suspiciousPatterns = ['bot', 'crawler', 'spider', 'scraper', 'python', 'curl', 'wget', 'http', 'java', 'go-http'];
    const lowerUA = userAgent.toLowerCase();
    if (suspiciousPatterns.some(pattern => lowerUA.includes(pattern))) {
        return NextResponse.json(
            { error: 'Access denied. Automated requests not allowed.' },
            { status: 403 }
        );
    }

    // Block API requests without proper Referer (direct API access, likely abuse)
    if (pathname.startsWith('/api/') && !referer.includes('derivativecalculatorai.com')) {
        return NextResponse.json(
            { error: 'Access denied. API requests must come from the website.' },
            { status: 403 }
        );
    }

    // Track request path for traffic analysis (async, non-blocking)
    // This helps analyze traffic distribution since Cloudflare Log Explorer is paid
    // NOTE: Track embed requests separately to monitor widget abuse
    if (pathname.startsWith('/embed/')) {
        trackPath(pathname, 200).catch(err => {
            console.error('[MIDDLEWARE] Error tracking embed path:', err);
        });
    } else {
        trackPath(pathname).catch(err => {
            console.error('[MIDDLEWARE] Error tracking path:', err);
        });
    }

    // AGGRESSIVE: Apply rate limiting to page requests to prevent quota abuse
    // Since main traffic source is page visits (not API), we need to limit page access too
    // Use same strict limit as API (1 req/min) to truly control traffic
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
        const searchParams = new URLSearchParams();
        const securityResult = await performSecurityCheck(
            request.headers,
            searchParams,
            pathname,
            {
                rateLimit: 1, // 1 req/min for pages (same as API - aggressive limit)
                rateWindow: 60,
            }
        );

        if (!securityResult.success) {
            // Track blocked response
            trackPath(pathname, securityResult.blocked ? 403 : 429).catch(() => {});
            
            return NextResponse.json(
                { error: securityResult.error },
                {
                    status: securityResult.blocked ? 403 : 429,
                    headers: securityResult.retryAfter ? {
                        'Retry-After': securityResult.retryAfter.toString()
                    } : undefined
                }
            );
        }
    }

    // Check if path starts with a locale
    const locale = locales.find(
        (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
    );

    const url = request.nextUrl.clone();
    const host = request.headers.get("host") || "";

    // 1. Enforce Non-WWW and HTTPS (Production only ideally, but safe everywhere here)
    if (host.startsWith("www.")) {
        const newHost = host.replace("www.", "");
        url.host = newHost;
        url.protocol = "https";
        return NextResponse.redirect(url, 301);
    }

    if (locale) {
        // Remove locale from path to get the underlying route
        // e.g. /es/derivative-of-sin-x -> /derivative-of-sin-x
        let newPath = pathname.replace(`/${locale}`, "");
        if (newPath === "") newPath = "/";

        // Rewrite to the actual path but pass locale in header
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-next-locale", locale);

        const response = NextResponse.rewrite(new URL(newPath, request.url), {
            request: {
                headers: requestHeaders,
            },
        });

        // CACHE OPTIMIZATION: Add cache headers for page requests
        // This allows Cloudflare Page Rules to cache pages even if Next.js sets no-cache
        // Cache for 2 hours (7200 seconds) to match Page Rules Edge Cache TTL
        if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
            response.headers.set('Cache-Control', 'public, s-maxage=7200, max-age=3600, stale-while-revalidate=86400');
        }

        return response;
    }

    // CACHE OPTIMIZATION: Add cache headers for page requests
    // This allows Cloudflare Page Rules to cache pages even if Next.js sets no-cache
    // Cache for 2 hours (7200 seconds) to match Page Rules Edge Cache TTL
    const response = NextResponse.next();
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
        response.headers.set('Cache-Control', 'public, s-maxage=7200, max-age=3600, stale-while-revalidate=86400');
    }

    return response;
}

export const config = {
    matcher: [
        // Match all paths except static files, api routes, image optimization files, and common static assets
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
    ],
};
