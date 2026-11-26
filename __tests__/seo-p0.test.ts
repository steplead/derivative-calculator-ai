/**
 * P0 indexing fixes: public slugs, hreflang, curated sitemap, GA4 shim.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { homeGuide, visibleWordCount } from '@/content/home-guide';
import {
    localeAlternates,
    plusFreeSlug,
    problemHref,
    resolveLibraryProblem,
    slugLookupCandidates,
} from '@/lib/seo';
import { calculationEventName, GA_MEASUREMENT_ID, trackEvent } from '@/lib/analytics';
import type { StaticProblem } from '@/lib/problems-source';

describe('plus-free problem URLs', () => {
    const rows: StaticProblem[] = [
        {
            slug: 'integral-of-tanx-+-cosx',
            formula: 'tan(x) + cos(x)',
            type: 'integral',
        },
        {
            slug: 'derivative-of-x-plus-1',
            formula: 'x+1',
            type: 'derivative',
        },
    ];

    it('rewrites a literal plus into the public slug', () => {
        expect(plusFreeSlug('integral-of-tanx-+-cosx')).toBe('integral-of-tanx-plus-cosx');
        expect(problemHref('integral-of-tanx-+-cosx', 'es')).toBe('/es/integral-of-tanx-plus-cosx');
    });

    it('resolves the broken, encoded, and public forms to the library row', () => {
        expect(resolveLibraryProblem(rows, 'integral-of-tanx-+-cosx')?.formula).toBe('tan(x) + cos(x)');
        expect(resolveLibraryProblem(rows, 'integral-of-tanx- -cosx')?.formula).toBe('tan(x) + cos(x)');
        expect(resolveLibraryProblem(rows, 'integral-of-tanx-plus-cosx')?.formula).toBe('tan(x) + cos(x)');
    });

    it('does not rewrite a slug that already uses the word plus', () => {
        expect(slugLookupCandidates('derivative-of-x-plus-1')[0]).toBe('derivative-of-x-plus-1');
        expect(resolveLibraryProblem(rows, 'derivative-of-x-plus-1')?.slug).toBe('derivative-of-x-plus-1');
    });
});

describe('hreflang', () => {
    it('emits a self-canonical and reciprocal en/es/pt/x-default set on every page', () => {
        for (const loc of ['en', 'es', 'pt'] as const) {
            const alt = localeAlternates('/practice', loc);
            expect(alt.canonical).toBe(
                loc === 'en'
                    ? 'https://derivativecalculatorai.com/practice'
                    : `https://derivativecalculatorai.com/${loc}/practice`
            );
            expect(Object.keys(alt.languages).sort()).toEqual(['en', 'es', 'pt', 'x-default']);
            expect(alt.languages.en).toBe('https://derivativecalculatorai.com/practice');
            expect(alt.languages.es).toBe('https://derivativecalculatorai.com/es/practice');
            expect(alt.languages.pt).toBe('https://derivativecalculatorai.com/pt/practice');
            expect(alt.languages['x-default']).toBe('https://derivativecalculatorai.com/practice');
            // The canonical must be one of its own alternates: no dangling tag.
            expect(Object.values(alt.languages)).toContain(alt.canonical);
        }

        const home = localeAlternates('/', 'es');
        expect(home.canonical).toBe('https://derivativecalculatorai.com/es');
        expect(home.languages['x-default']).toBe('https://derivativecalculatorai.com');
        expect(home.languages.pt).toBe('https://derivativecalculatorai.com/pt');
    });
});

describe('homepage guide', () => {
    it('english guide is a full explanation, not a stub', () => {
        expect(visibleWordCount(homeGuide.en)).toBeGreaterThanOrEqual(800);
        expect(homeGuide.en.faqs.length).toBeGreaterThanOrEqual(4);
        expect(homeGuide.es.faqs[0].question).toMatch(/derivada/i);
        expect(homeGuide.es.faqs[0].answer).not.toMatch(/Derivative Calculator - Instant/);
    });
});

describe('GA4 shim', () => {
    it('queues an event when gtag has not been installed yet', () => {
        const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
        delete w.gtag;
        w.dataLayer = [];
        trackEvent('derivative_calculate', { mode: 'derivative', formula_length: 3, source: 'client' });
        expect(typeof w.gtag).toBe('function');
        expect(w.dataLayer.length).toBe(1);
        const queued = w.dataLayer[0] as { 0: string; 1: string; 2: { send_to?: string } };
        expect(queued[1]).toBe('derivative_calculate');
        expect(queued[2].send_to).toBe(GA_MEASUREMENT_ID);
    });

    it('names integral, limit, and ode events the same way as derivative_calculate', () => {
        expect(calculationEventName('derivative')).toBe('derivative_calculate');
        expect(calculationEventName('integral')).toBe('integral_calculate');
        expect(calculationEventName('limit')).toBe('limit_calculate');
        expect(calculationEventName('ode')).toBe('ode_calculate');
    });
});

describe('curated sitemap', () => {
    it('lists exactly the curated English URLs with no hreflang alternates (2026-11-27)', () => {
        execSync('node scripts/generate-sitemap.js', { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
        const xml = fs.readFileSync(path.resolve(__dirname, '..', 'public', 'sitemap.xml'), 'utf8');
        const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        const { SITEMAP_URLS } = require('../scripts/generate-sitemap.js') as {
            SITEMAP_URLS: { path: string; problem?: boolean }[];
        };
        // 18 hub/lesson pages + 100 integrals + 100 limits (owner-approved
        // 2026-11-27). The library itself is 3,137 rows; this stays curated.
        expect(SITEMAP_URLS).toHaveLength(218);
        expect(locs).toHaveLength(218);
        expect(new Set(locs).size).toBe(218);
        expect(xml).not.toContain('xhtml:link');
        expect(xml).not.toContain('hreflang');
        expect(locs.some((url) => /^https:\/\/derivativecalculatorai\.com\/(es|pt)(\/|$)/.test(url))).toBe(false);
        for (const p of ['/integral', '/limit', '/derivative-of-sin-x', '/derivatives-of-trig-functions', '/wiki/chain-rule']) {
            expect(locs).toContain(`https://derivativecalculatorai.com${p}`);
        }
        for (const p of ['/calculators', '/ode', '/directory', '/symbolab-alternative']) {
            expect(locs).not.toContain(`https://derivativecalculatorai.com${p}`);
        }
        const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
        expect(lastmods).toHaveLength(218);
        for (const stamp of lastmods) expect(Number.isNaN(Date.parse(stamp))).toBe(false);
    });

    it('keeps every curated URL reachable and indexable', () => {
        const { SITEMAP_URLS } = require('../scripts/generate-sitemap.js') as {
            SITEMAP_URLS: { path: string; problem?: boolean }[];
        };
        const problems = JSON.parse(
            fs.readFileSync(path.resolve(__dirname, '..', 'data', 'problems.json'), 'utf8')
        ) as { slug: string }[];
        const allow = new Set(
            JSON.parse(
                fs.readFileSync(path.resolve(__dirname, '..', 'data', 'sitemap-problem-slugs.json'), 'utf8')
            ) as string[]
        );
        const plusFree = (slug: string) => slug.replace(/\+/g, 'plus').replace(/ /g, 'plus');
        const library = new Set(problems.map((row) => plusFree(row.slug)));

        const problemEntries = SITEMAP_URLS.filter((entry) => entry.problem);
        expect(problemEntries).toHaveLength(210); // 10 derivative lessons + 200 long-tail
        for (const entry of problemEntries) {
            // A literal "+" 404s on the live site, so the sitemap must use the
            // "plus" spelling and that spelling must exist in the library.
            expect(entry.path).not.toContain('+');
            const slug = entry.path.slice(1);
            expect(library.has(slug)).toBe(true);
            // data/sitemap-problem-slugs.json is what lifts their noindex; a
            // sitemap entry without it would submit a noindex URL.
            expect(allow.has(slug.replace(/plus/g, '+')) || allow.has(slug)).toBe(true);
        }
        expect(problemEntries.map((entry) => entry.path)).toContain('/integral-of-x');
        expect(problemEntries.map((entry) => entry.path)).toContain('/limit-of-sinx-over-x-as-x-to-0');
    });
});
