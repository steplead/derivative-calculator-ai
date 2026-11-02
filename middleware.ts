import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security-headers";
import { exponentialAliasRedirect } from "@/lib/redirects";

// Note: middleware in Next.js always runs on the edge runtime. We intentionally
// do NOT export `runtime` here — declaring `edge` triggers a build error in
// Next.js 14.2.x for the middleware entry, and `experimental-edge` is deprecated.
// Omitting the export lets Next.js use its default (edge) for middleware.

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

/**
 * Host and slug redirects run before the UA block and the rate limiter.
 * www HTML is often redirected by Cloudflare already, but www/sitemap.xml and
 * www/robots.txt are served by the worker (the matcher used to skip them) and
 * a scripted client used to receive 403 before any redirect.
 * A literal "+" in integral/derivative/limit slugs is decoded as a space at
 * the edge and 404s; the public slug spells it "plus".
 */
function redirectToApexOrPlusFree(request: NextRequest): NextResponse | null {
    const hostHeader = request.headers.get("host") || "";
    const hostname = hostHeader.split(":")[0];
    const isWww = hostname.toLowerCase().startsWith("www.");
    const url = request.nextUrl.clone();
    let pathname = url.pathname;
    const needsPlusRewrite =
        /\/(integral-of-|derivative-of-|limit-of-)/.test(pathname) &&
        (pathname.includes("+") || pathname.includes(" "));

    if (!isWww && !needsPlusRewrite) return null;

    if (needsPlusRewrite) {
        pathname = pathname.replace(/\+/g, "plus").replace(/ /g, "plus");
        url.pathname = pathname;
    }

    if (isWww || hostname.toLowerCase().endsWith("derivativecalculatorai.com")) {
        url.protocol = "https:";
        url.port = "";
    }
    if (isWww) {
        url.hostname = hostname.replace(/^www\./i, "");
    }

    return withSecurityHeaders(NextResponse.redirect(url, 301));
}

function withSecurityHeaders(response: NextResponse): NextResponse {
    applySecurityHeaders(response.headers);
    return response;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const earlyRedirect = redirectToApexOrPlusFree(request);
    if (earlyRedirect) return earlyRedirect;

    const aliasTarget = exponentialAliasRedirect(pathname);
    if (aliasTarget) {
        const url = request.nextUrl.clone();
        url.pathname = aliasTarget;
        return withSecurityHeaders(NextResponse.redirect(url, 301));
    }

    // Static SEO files must 301 off www (handled above) but must not spend a
    // D1 rate-limit write on every crawler fetch.
    if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
        return withSecurityHeaders(NextResponse.next());
    }

    // --- Early blocking of scripted abuse (before any expensive processing) ---
    const userAgent = request.headers.get('user-agent') || '';

    // Block requests without User-Agent (almost always bots)
    if (!userAgent || userAgent.trim() === '') {
        return withSecurityHeaders(NextResponse.json(
            { error: 'Access denied. User-Agent required.' },
            { status: 403, headers: { 'Cache-Control': 'no-store' } }
        ));
    }

    // Block scripted HTTP clients only (preserves search engine crawlers)
    const lowerUA = userAgent.toLowerCase();
    if (ABUSE_UA_PATTERNS.some(pattern => lowerUA.includes(pattern))) {
        return withSecurityHeaders(NextResponse.json(
            { error: 'Access denied. Automated requests not allowed.' },
            { status: 403, headers: { 'Cache-Control': 'no-store' } }
        ));
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
            return withSecurityHeaders(NextResponse.json(
                { error: 'Access denied. API requests must come from the website.' },
                { status: 403, headers: { 'Cache-Control': 'no-store' } }
            ));
        }
    }

    // Prerendered HTML is not in _routes.json include, so this function does
    // not run for it. Anything that still reaches the Worker must be cacheable
    // at the edge. CDN-Cache-Control max-age=0 made every document DYNAMIC and
    // burned the free-plan CPU limit (Cloudflare 1102).
    const response = NextResponse.next();
    if (pathname === '/result' || pathname.startsWith('/result/')) {
        response.headers.set('Cache-Control', 'private, no-store');
    } else if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
        response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        response.headers.set('CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    }

    return withSecurityHeaders(response);
}

export const config = {
    matcher: [
        // Prerendered pages and static files are served by Pages, not this
        // Worker (see /_routes.json). Only the dynamic surfaces remain.
        '/result',
        '/result/:path*',
        '/embed/:path*',
        '/og',
        '/og/:path*',
        '/sitemap.xml',
        '/robots.txt',
    ],
};
