/**
 * slug-math.ts — heuristic slug → math fallback.
 *
 * This is the LAST-RESORT source for /[slug] pages. The authoritative source is
 * the problem library (see lib/problems-source.ts); this parser only runs for
 * slugs that are NOT in the library.
 *
 * RC-7 FIX (2026-08-10): the previous "looks like math" test also accepted
 *   `slug.length < 15 && !slug.includes('-')`
 * which matches ANY short alphanumeric string. That minted an unlimited supply
 * of hollow HTTP 200 pages ("/qqqzzz999" → "Derivative of qqqzzz^999",
 * "/asdfgh", "/z9z9z9") — a soft-404 generator that dilutes crawl budget and
 * invites a scaled-content quality problem.
 *
 * The "raw math slug" branch it was guarding is in fact unreachable:
 * `sanitizeSlug()` only permits `[a-z0-9-_]`, so any slug containing
 * `+ * / ^ ( )` is already rejected on the first line below. That branch is
 * therefore removed rather than repaired — rebuilding `sanitizeSlug()`'s
 * character class is a security-sensitive change that belongs in its own task.
 *
 * RC-8b FIX (2026-08-10): `over` is now grouped, so
 *   "31 over x2 plus 1" → "31/(x^2+1)"  (previously "31/x^2+1" = (31/x^2)+1,
 *   a different function with a different derivative).
 */

import { sanitizeSlug, sanitizeLimitValue } from '@/utils/sanitize';

/**
 * Bind the fraction bar tighter than +/−.
 *
 * "31 over x2 plus 1" must become "31/(x^2+1)", not "31/x^2+1" — the latter is
 * (31/x^2)+1, a different function with a different derivative. Publishing the
 * un-grouped form put a wrong answer on a live page (RC-8b).
 *
 * Only compound sides get parenthesised; single atoms (`31`, `x`, `sin(x)`,
 * `(x+1)`) are left untouched to avoid cosmetic noise.
 * Nested "a over b over c" is read left-associatively: "(a/b)/c".
 */
function groupFraction(spaced: string): string {
    // Greedy numerator → left-associative for chained fractions.
    const m = spaced.match(/^(.*)\bover\b(.*)$/i);
    if (!m) return spaced;

    const wrap = (raw: string): string => {
        const t = raw.replace(/\bover\b/gi, '/').trim().replace(/\s+/g, '');
        if (!t) return t;
        // Already a single atom or an already-grouped sub-expression.
        if (/^(\([^()]+\)|[A-Za-z]+\([^()]*\)|[A-Za-z]+|\d+(\.\d+)?)$/.test(t)) return t;
        return `(${t})`;
    };

    return `${wrap(m[1])}/${wrap(m[2])}`;
}

export type ParsedProblem = {
    slug: string;
    formula: string;
    title: string;
    type: 'derivative' | 'integral' | 'limit';
    limitTo: string;
};

/**
 * Convert an SEO slug into a math expression.
 * Returns null when the slug is not recognisably mathematical — the caller
 * must then call notFound() instead of rendering a hollow page.
 *
 *   derivative-of-31-over-x2-plus-1 -> 31/(x^2+1)
 *   integral-of-sin-x               -> sin(x)
 *   qqqzzz999                       -> null   (RC-7)
 */
export function parseSlugToMath(slug: string): ParsedProblem | null {
    const sanitizedSlug = sanitizeSlug(slug);
    if (!sanitizedSlug) return null;

    let type: 'derivative' | 'integral' | 'limit' = 'derivative';
    let formula = sanitizedSlug;
    let limitTo = '0';

    if (slug.startsWith('integral-of-')) {
        type = 'integral';
        formula = slug.replace('integral-of-', '');
    } else if (slug.startsWith('limit-of-')) {
        type = 'limit';
        formula = slug.replace('limit-of-', '');
        const limitMatch = formula.match(/(.*?)-(?:to|as-x-approaches)-(.*)/i);
        if (limitMatch) {
            formula = limitMatch[1];
            limitTo = sanitizeLimitValue(
                limitMatch[2]
                    .replace(/^minus-/i, '-')
                    .replace(/^-+/g, '-')
                    .replace(/(\d)-(\d)/g, '$1.$2')
            );
        }
    } else if (slug.startsWith('derivative-of-')) {
        type = 'derivative';
        formula = slug.replace('derivative-of-', '');
    } else {
        // RC-7 FIX: not a descriptive slug → no page.
        //
        // The old code tried to accept raw-math slugs here, but two things made
        // that impossible and one made it dangerous:
        //   1. `sanitizeSlug()` (first line of this function) rejects any slug
        //      containing `+ * / ^ ( )`, so raw-math slugs never reach here.
        //   2. The fallback test `slug.length < 15 && !slug.includes('-')`
        //      matched EVERY short alphanumeric string → "/qqqzzz999",
        //      "/asdfgh", "/z9z9z9" all rendered HTTP 200 hollow pages.
        // Returning null makes the caller emit a real 404.
        return null;
    }

    // Replace keywords with math symbols
    let mathFormula = groupFraction(
        formula
            .replace(/-/g, ' ')
            .replace(/\be to the\b/gi, 'e^')
            .replace(/\bto the\b/gi, '^')
            .replace(/\bsqrt\b/gi, 'sqrt')
            .replace(/\broot\b/gi, 'sqrt')
            .replace(/\bcbrt\b/gi, 'cbrt')
            .replace(/\bplus\b/gi, ' + ')
            .replace(/\bminus\b/gi, ' - ')
            .replace(/\btimes\b/gi, ' * ')
            .replace(/\bpower\b/gi, '^')
            .replace(/\bsquared\b/gi, '^2')
            .replace(/\bcubed\b/gi, '^3')
    ).replace(/\s+/g, '');

    // Add parentheses for functions if missing (simple heuristic)
    const functions = ['sin', 'cos', 'tan', 'ln', 'log', 'sqrt', 'cbrt', 'exp', 'arcsin', 'arccos', 'arctan', 'sec', 'csc', 'cot'];
    functions.forEach(fn => {
        const regex = new RegExp(`\\b${fn}([a-z0-9]+)\\b`, 'gi');
        mathFormula = mathFormula.replace(regex, `${fn}($1)`);
    });

    // Handle common shorthand like x2 -> x^2
    mathFormula = mathFormula.replace(/([a-z])(\d+)/gi, '$1^$2');

    if (!mathFormula || mathFormula.length < 1) return null;

    return {
        slug,
        formula: mathFormula,
        title: type === 'integral'
            ? `Integral of ${mathFormula}`
            : type === 'limit'
                ? `Limit of ${mathFormula}`
                : `Derivative of ${mathFormula}`,
        type,
        limitTo,
    };
}
