import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { trackPath } from "@/utils/path-tracker";

export const runtime = 'experimental-edge';

const locales = ["es", "pt"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Track request path for traffic analysis (async, non-blocking)
    // This helps analyze traffic distribution since Cloudflare Log Explorer is paid
    trackPath(pathname).catch(err => {
        // Silently fail - don't break the request flow
        console.error('[MIDDLEWARE] Error tracking path:', err);
    });

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

        return NextResponse.rewrite(new URL(newPath, request.url), {
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files, api routes, image optimization files, and common static assets
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
    ],
};
