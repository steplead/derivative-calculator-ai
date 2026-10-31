/**
 * Security headers shared by public/_headers and middleware.
 *
 * Cloudflare Pages applies `_headers` only to static assets. HTML on this site
 * is rendered by the Pages Function (`x-edge-runtime`), so middleware must set
 * the same policy or the document never receives a CSP.
 *
 * The calculator fetches same-origin `/api/*`, draws with function-plot
 * (`unsafe-eval` + inline SVG styles), renders KaTeX from bundled fonts, and
 * loads Turnstile from challenges.cloudflare.com. GA4 loads gtag.js from
 * googletagmanager.com and beacons to google-analytics.com / analytics.google.com.
 * Donation and share "ads" are ordinary links (PayPal, X), not third-party scripts.
 */

export const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
    "script-src-attr 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://challenges.cloudflare.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googletagmanager.com https://*.g.doubleclick.net",
    "font-src 'self' data: https://challenges.cloudflare.com https://fonts.gstatic.com",
    "connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://*.g.doubleclick.net",
    "frame-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
].join('; ');

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': CONTENT_SECURITY_POLICY,
};

/** Mutates a Headers object. Does not touch Cache-Control. */
export function applySecurityHeaders(headers: Headers): void {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        headers.set(name, value);
    }
}
