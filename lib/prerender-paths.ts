import problems from '@/data/problems.json';
import wiki from '@/data/wiki.json';
import allowlist from '@/data/sitemap-problem-slugs.json';
import { plusFreeSlug } from '@/lib/seo';

type ProblemRow = { slug?: string; tags?: string };
type WikiRow = { slug?: string };

/** Public URL form of every library slug. "+" is spelled "plus" (see lib/seo.ts). */
export function publicProblemSlugs(): string[] {
    const slugs = new Set<string>();
    for (const row of problems as ProblemRow[]) {
        if (row?.slug) slugs.add(plusFreeSlug(row.slug));
    }
    return [...slugs];
}

export function sitemapProblemSlugs(): string[] {
    return (allowlist as string[]).map((slug) => plusFreeSlug(slug));
}

export function wikiSlugs(): string[] {
    return (wiki as WikiRow[]).map((topic) => topic.slug).filter((slug): slug is string => Boolean(slug));
}

export function problemTags(): string[] {
    const tags = new Set<string>();
    for (const row of problems as ProblemRow[]) {
        for (const raw of String(row?.tags || '').split(',')) {
            const tag = raw.trim();
            if (tag) tags.add(tag);
        }
    }
    return [...tags];
}

/** Single-segment pages that exist in addition to the problem library. */
export const STATIC_SEGMENTS = [
    'integral',
    'limit',
    'matrix',
    'ode',
    'calculators',
    'wiki',
    'practice',
    'derivatives-of-trig-functions',
    'partial-derivative-calculator',
    'implicit-differentiation-calculator',
    'chain-rule-calculator',
    'symbolab-alternative',
    'derivative-calculator-comparison',
    'about',
    'privacy',
    'contact',
    'directory',
    'problems',
] as const;

/**
 * Paths prerendered under /es and /pt.
 * Includes every sitemap URL plus the internal pages those URLs link to
 * (about, directory, the full library, practice levels, tags) so a crawl
 * does not fall through to a per-request render.
 */
export function localeCatchAllParams(): { path: string[] }[] {
    const paths: string[][] = [[]];
    for (const segment of STATIC_SEGMENTS) paths.push([segment]);
    for (const slug of wikiSlugs()) paths.push(['wiki', slug]);
    for (const level of ['beginner', 'intermediate', 'advanced']) paths.push(['practice', level]);
    for (const type of ['derivative', 'integral', 'limit']) paths.push(['problems', type]);
    for (const tag of problemTags()) paths.push(['problems', 'tag', tag]);
    for (const slug of publicProblemSlugs()) paths.push([slug]);
    return paths.map((path) => ({ path }));
}
