import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { performSecurityCheck } from "@/utils/security";

// Note: middleware in Next.js always runs on the edge runtime. We intentionally
// do NOT export `runtime` here — declaring `edge` triggers a build error in
// Next.js 14.2.x for the middleware entry, and `experimental-edge` is deprecated.
// Omitting the export lets Next.js use its default (edge) for middleware.

const locales = ["es", "pt"];

// Allowed referer/origin hosts for API requests (prevents direct API hotlinking abuse).
// Includes localhost variants so local development is not blocked.
const ALLOWED_API_HOSTS = [
    'derivativecalculatorai.com',
    'www.derivativecalculatorai.com',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
];

// User-Agent patterns that indicate scripted abuse tools (NOT search engine bots).
// IMPORTANT: We intentionally do NOT block "bot", "crawler", "spider" here because
// those substrings appear in legitimate search engine UAs (Googlebot, Bingbot, etc.)
// and blocking them would destroy SEO indexing. Only block CLI/script tools.
const ABUSE_UA_PATTERNS = ['python-requests', 'python/', 'curl/', 'wget/', 'go-http-client', 'java/', 'scrapy', 'httpx/'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // --- Early blocking of scripted abuse (before any expensive processing) ---
    const userAgent = request.headers.get('user-agent') || '';

    // Block requests without User-Agent (almost always bots)
    if (!userAgent || userAgent.trim() === '') {
        return NextResponse.json(
            { error: 'Access denied. User-Agent required.' },
            { status: 403, headers: { 'Cache-Control': 'no-store' } }
        );
    }

    // Block scripted HTTP clients only (preserves search engine crawlers)
    const lowerUA = userAgent.toLowerCase();
    if (ABUSE_UA_PATTERNS.some(pattern => lowerUA.includes(pattern))) {
        return NextResponse.json(
            { error: 'Access denied. Automated requests not allowed.' },
            { status: 403, headers: { 'Cache-Control': 'no-store' } }
        );
    }

    // API referer check: allow same-site and localhost; skip in diagnostic mode.
    // This stops third-party sites from hotlinking the API while keeping the
    // website itself and local development working.
    if (pathname.startsWith('/api/')) {
        const referer = request.headers.get('referer') || '';
        const origin = request.headers.get('origin') || '';
        const host = request.headers.get('host') || '';
        const isSameSite = ALLOWED_API_HOSTS.some(h =>
            referer.includes(h) || origin.includes(h) || host === h || host.endsWith('.' + h)
        );
        // Allow if there's no referer/origin at all only when host itself is allowed
        // (covers same-origin requests where some browsers strip referer).
        const hostAllowed = ALLOWED_API_HOSTS.some(h => host === h || host.endsWith('.' + h));
        if (!isSameSite && !hostAllowed) {
            return NextResponse.json(
                { error: 'Access denied. API requests must come from the website.' },
                { status: 403, headers: { 'Cache-Control': 'no-store' } }
            );
        }
    }

    // Rate limiting for page requests only (NOT API, NOT static assets, NOT /embed/).
    // Static assets are excluded at the matcher level so they never hit D1.
    // API routes apply their own limits inside their handlers.
    // /embed/ route returns a cached 403 immediately, so skip D1 to save quota.
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/') && !pathname.startsWith('/embed/')) {
        const searchParams = new URLSearchParams();
        const securityResult = await performSecurityCheck(
            request.headers,
            searchParams,
            pathname,
            {
                rateLimit: 30, // 30 req/min per IP for pages (human-friendly)
                rateWindow: 60,
            }
        );

        if (!securityResult.success) {
            return NextResponse.json(
                { error: securityResult.error },
                {
                    status: securityResult.blocked ? 403 : 429,
                    headers: {
                        'Cache-Control': 'no-store',
                        ...(securityResult.retryAfter ? {
                            'Retry-After': securityResult.retryAfter.toString()
                        } : {})
                    }
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

    // Enforce Non-WWW and HTTPS
    if (host.startsWith("www.")) {
        const newHost = host.replace("www.", "");
        url.host = newHost;
        url.protocol = "https";
        return NextResponse.redirect(url, 301);
    }

    if (locale) {
        let newPath = pathname.replace(`/${locale}`, "");
        if (newPath === "") newPath = "/";

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-next-locale", locale);

        const response = NextResponse.rewrite(new URL(newPath, request.url), {
            request: {
                headers: requestHeaders,
            },
        });

        if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
            response.headers.set('Cache-Control', 'public, s-maxage=7200, max-age=3600, stale-while-revalidate=86400');
        }

        return response;
    }

    const response = NextResponse.next();
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
        response.headers.set('Cache-Control', 'public, s-maxage=7200, max-age=3600, stale-while-revalidate=86400');
    }

    return response;
}

export const config = {
    matcher: [
        // Match all paths EXCEPT: api routes, all _next/* (static, chunks, image),
        // favicon, and common static asset extensions. Previously only excluding
        // _next/static|_next/image caused /_next/static/chunks/*.js (page JS)
        // to run through middleware → D1 rate limit → 429 on CSS/JS → broken layout.
        '/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|css|js|map|woff|woff2|ttf|eot)$).*)',
    ],
};
