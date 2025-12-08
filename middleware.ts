import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["es", "pt"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if path starts with a locale
    const locale = locales.find(
        (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
    );

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
        // Match all paths except static files and api
        "/((?!_next/static|_next/image|favicon.ico|api).*)",
    ],
};
