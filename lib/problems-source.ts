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
