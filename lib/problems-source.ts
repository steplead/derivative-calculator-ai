/**
 * problems-source.ts — authoritative server-side problem source.
 *
 * WHY THIS MODULE EXISTS (RC-8)
 * ----------------------------
 * Every page used to load /problems.json with:
 *
 *     fetch(url, { cache: 'force-cache', next: { revalidate: 3600 } })
 *
 * In this deployment (Next.js 14 App Router on Cloudflare Pages via
 * @cloudflare/next-on-pages) that fetch NEVER yields data:
 *   - Next.js only wires `globalThis.__incrementalCache` when the platform
 *     adapter supplies an `IncrementalCache` implementation
 *     (node_modules/next/dist/server/web/adapter.js: "if (!globalThis.__incrementalCache
 *      && params.IncrementalCache)").
 *   - next-on-pages does not supply one, so the force-cache/revalidate code
 *     path has no cache handler to read from.
 *   - Observed production effect: /problems and /problems/[type] render with
 *     ZERO problems, and every /[slug] page silently fell through to the
 *     `parseSlugToMath()` heuristic, publishing slug-derived formulas
 *     (e.g. "1-x" -> "1x") instead of the authoritative "1/x" from the library.
 *
 * The plain `fetch(url)` used by /directory (and by generateMetadata's
 * fallback) works in production. This module standardises on that proven path,
 * and memoises the parsed array per isolate so the 900 KB payload is fetched
 * and parsed once instead of on every request.
 *
 * RULES
 *   1. Plain fetch only — never `cache: 'force-cache'` / `next: { revalidate }`.
 *   2. Read the response body exactly once (reading twice throws
 *      "body used already").
 *   3. Never throw into the caller's critical path unless the caller opts in.
 */

import { getBaseUrl } from '@/utils/robust-url';

export type StaticProblem = {
    slug: string;
    formula: string;
    title?: string;
    description?: string;
    type?: 'derivative' | 'integral' | 'limit';
    limitTo?: string;
    difficulty?: string;
    // B4: tags is a comma-separated string (e.g. "derivative,polynomial"),
    // matching the on-disk shape in /problems.json. Kept as string — not a
    // parsed array — to stay compatible with the existing data model and the
    // /api/problems consumer; split on demand at the call site.
    tags?: string;
};

/** Parsed library, memoised per isolate. */
let memoryCache: StaticProblem[] | null = null;
/** Deduplicates concurrent first-hits in the same isolate. */
let inflight: Promise<StaticProblem[]> | null = null;

/**
 * Load the full problem library.
 * Returns [] (never throws) when the source is unreachable so callers can
 * degrade to their own fallbacks instead of rendering a 500.
 */
export async function loadStaticProblems(): Promise<StaticProblem[]> {
    if (memoryCache) return memoryCache;
    if (inflight) return inflight;

    const base = getBaseUrl();

    inflight = (async (): Promise<StaticProblem[]> => {
        const res = await fetch(`${base}/problems.json`);
        if (!res.ok) {
            throw new Error(`/problems.json responded HTTP ${res.status}`);
        }
        const data: unknown = await res.json();
        if (!Array.isArray(data)) {
            throw new Error('/problems.json did not return an array');
        }
        memoryCache = data as StaticProblem[];
        return memoryCache;
    })();

    try {
        return await inflight;
    } finally {
        inflight = null;
    }
}

/**
 * Safe variant used inside page render paths: any failure degrades to [].
 */
export async function loadStaticProblemsSafe(): Promise<StaticProblem[]> {
    try {
        return await loadStaticProblems();
    } catch {
        return [];
    }
}

/** Exact slug lookup against the loaded library. */
export function findStaticProblem(
    rows: StaticProblem[],
    slug: string
): StaticProblem | null {
    if (!Array.isArray(rows) || !slug) return null;
    return rows.find((p) => p && p.slug === slug) || null;
}

/** Test-only: drop the memoised library. */
export function resetStaticProblemsCache(): void {
    memoryCache = null;
    inflight = null;
}

/**
 * Split the library by problem type.
 *
 * Shared by /problems, /problems/[type] and the regression tests so the tests
 * exercise the real filter instead of a copy of it. Library rows created before
 * the `type` column existed carry no type; they are all derivatives.
 */
export function filterByType(
    problems: StaticProblem[],
    type: string
): StaticProblem[] {
    if (!Array.isArray(problems)) return [];
    if (type === 'derivative') {
        return problems.filter((p) => p && (!p.type || p.type === 'derivative'));
    }
    return problems.filter((p) => p && p.type === type);
}

/**
 * RC-6 FIX: stable, deterministic related-problem selection.
 * - Excludes the current slug.
 * - Prefers problems of the same type (derivative/integral/limit).
 * - Deterministic lexicographic order (never Math.random).
 * - Caps at `limit`.
 */
export function pickStableRelated(
    problems: StaticProblem[],
    currentSlug: string,
    typeHint?: string,
    limit: number = 10
): StaticProblem[] {
    if (!Array.isArray(problems) || problems.length === 0) return [];
    const type = typeHint || 'derivative';
    const sameType = problems
        .filter((p) => p && p.slug && p.slug !== currentSlug && (!p.type || p.type === type))
        .sort((a, b) => a.slug.localeCompare(b.slug))
        .slice(0, limit);
    if (sameType.length >= Math.min(5, limit)) return sameType;
    const others = problems
        .filter((p) => p && p.slug && p.slug !== currentSlug)
        .sort((a, b) => a.slug.localeCompare(b.slug))
        .slice(0, Math.max(0, limit - sameType.length));
    return [...sameType, ...others].slice(0, limit);
}

/**
 * P2-G: deterministic canonical map for derivative near-duplicates.
 *
 * Two derivative problems that share a `formula` render an identical <title>
 * ("Derivative of <formula>") and identical math (d/dx is unique per formula),
 * so they are TRUE near-duplicates. We pick one primary slug per formula group
 * and return a map { nonPrimarySlug -> primarySlug } so those pages can emit
 * <link rel="canonical" href={primary}> and consolidate indexing equity.
 *
 * SCOPE IS DELIBERATELY DERIVATIVES ONLY:
 *   - Limit problems with the same formula but different limit points (x->0 vs
 *     x->infinity) are genuinely different content -> stay self-canonical.
 *   - Integral problems with the same formula but different bounds (0..1 vs
 *     1..3) are genuinely different content -> stay self-canonical.
 * Canonicalising those would wrongly merge distinct problems, so they are
 * excluded by the `type === 'derivative'` guard below.
 *
 * Primary selection (deterministic, no guessing):
 *   1. Prefer "clean" slugs: start with `derivative-of-` and NOT contain the
 *      slug-math auto-fallback artifact `minus-to-minus-the-minus`.
 *   2. Among the clean pool, pick the lexicographically smallest slug.
 *   3. If a group has no clean slug, fall back to the lexicographically
 *      smallest overall (still deterministic).
 *
 * Memoised per isolate; returns {} (never throws) so a source failure simply
 * leaves every page self-canonical (fail-closed, no broken canonical links).
 */
let _derivCanonicalCache: Map<string, string> | null = null;

export async function getDerivativeCanonicalMap(
    problems?: StaticProblem[]
): Promise<Map<string, string>> {
    // When called without a library (production path) the result is memoised
    // per isolate. When given an explicit library (tests), we rebuild fresh and
    // do NOT touch the cache.
    if (!problems && _derivCanonicalCache) return _derivCanonicalCache;
    const map = new Map<string, string>();
    const lib = problems ?? (await loadStaticProblemsSafe());
    const byFormula = new Map<string, string[]>();
    for (const p of lib) {
        if (!p || (p.type || 'derivative') !== 'derivative') continue;
        const f = p.formula || '';
        if (!f) continue;
        if (!byFormula.has(f)) byFormula.set(f, []);
        byFormula.get(f)!.push(p.slug);
    }
    for (const slugs of byFormula.values()) {
        if (slugs.length < 2) continue;
        const clean = slugs.filter(
            (s) => s.startsWith('derivative-of-') && !s.includes('minus-to-minus-the-minus')
        );
        const pool = clean.length ? clean : slugs;
        const primary = [...pool].sort()[0];
        for (const s of slugs) {
            if (s !== primary) map.set(s, primary);
        }
    }
    if (!problems) _derivCanonicalCache = map;
    return map;
}
