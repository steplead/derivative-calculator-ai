/**
 * Public URL aliases that must 301 to a single canonical problem page.
 *
 * derivative-of-e-x and derivative-of-e-to-the-x both render e^x. The same
 * split exists for x*e^x. Canonical tags alone left both URLs indexable;
 * the shorter aliases now redirect so the sitemap and internal links share
 * one URL. Locale prefixes are preserved (/es/derivative-of-e-x →
 * /es/derivative-of-e-to-the-x).
 */

export const EXPONENTIAL_ALIAS_REDIRECTS: Readonly<Record<string, string>> = {
    'derivative-of-e-x': 'derivative-of-e-to-the-x',
    'derivative-of-x-e-x': 'derivative-of-x-e-to-the-x',
};

/** Pathname only. Returns the locale-preserving target path, or null. */
export function exponentialAliasRedirect(pathname: string): string | null {
    const match = pathname.match(/^(\/(?:es|pt))?\/(derivative-of-e-x|derivative-of-x-e-x)\/?$/);
    if (!match) return null;
    const prefix = match[1] ?? '';
    const target = EXPONENTIAL_ALIAS_REDIRECTS[match[2]];
    if (!target) return null;
    return `${prefix}/${target}`;
}

/**
 * Internal rewrite for /es and /pt. The query string is kept so a prefilled
 * calculator link (/es?equation=asin(x)) still reaches the page.
 */
export function localeRewriteTarget(pathname: string, search: string): string | null {
    const locale = pathname === '/es' || pathname.startsWith('/es/')
        ? 'es'
        : pathname === '/pt' || pathname.startsWith('/pt/')
            ? 'pt'
            : null;
    if (!locale) return null;
    let next = pathname.slice(locale.length + 1);
    if (!next) next = '/';
    const query = search ? (search.startsWith('?') ? search : `?${search}`) : '';
    return `${next}${query}`;
}
