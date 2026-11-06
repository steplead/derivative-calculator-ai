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
    it('lists only the quality English set, with real lastmod and self-consistent hreflang', () => {
        execSync('node scripts/generate-sitemap.js', { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
        const xml = fs.readFileSync(path.resolve(__dirname, '..', 'public', 'sitemap.xml'), 'utf8');
        const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        expect(locs.length).toBe(85);
        for (const path of [
            '/partial-derivative-calculator',
            '/implicit-differentiation-calculator',
            '/chain-rule-calculator',
            '/wiki/logarithmic-derivatives',
            '/symbolab-alternative',
            '/derivative-calculator-comparison',
        ]) {
            expect(locs).toContain(`https://derivativecalculatorai.com${path}`);
        }
        expect(locs.filter((url) => url.endsWith('/derivatives-of-trig-functions')).length).toBe(1);
        for (const hub of ['/directory', '/problems', '/practice', '/practice/beginner', '/practice/intermediate', '/practice/advanced']) {
            expect(locs).toContain(`https://derivativecalculatorai.com${hub}`);
        }
        // Crawl-budget narrowing: es/pt are declared as alternates but never
        // submitted as <loc>. Exactly 85 URLs, each with a full reciprocal set.
        expect(locs.some((url) => /^https:\/\/derivativecalculatorai\.com\/(es|pt)(\/|$)/.test(url))).toBe(false);
        expect((xml.match(/hreflang="en"/g) ?? []).length).toBe(85);
        expect((xml.match(/hreflang="es"/g) ?? []).length).toBe(85);
        expect((xml.match(/hreflang="pt"/g) ?? []).length).toBe(85);
        expect((xml.match(/hreflang="x-default"/g) ?? []).length).toBe(85);
        const blocks = xml.split('<url>').slice(1);
        expect(blocks).toHaveLength(85);
        for (const block of blocks) {
            expect((block.match(/xhtml:link/g) ?? []).length).toBe(4);
            expect(block).not.toContain('<loc>https://derivativecalculatorai.com/es');
            expect(block).not.toContain('<loc>https://derivativecalculatorai.com/pt');
        }
        expect(locs.some((url) => url.includes('/problems/tag/'))).toBe(false);
        expect(locs.some((url) => /\/problems\/(derivative|integral|limit)$/.test(url))).toBe(false);
        expect(xml).not.toContain('/derivative-of-x-e-x<');
        expect(xml).not.toContain('+');
        expect(xml).not.toContain('integral-of-');
        expect(xml).not.toContain('/derivative-of-e-x<');
        expect(xml).toContain('https://derivativecalculatorai.com/derivative-of-sin-2x');
        expect(xml).toContain('https://derivativecalculatorai.com/derivative-of-1-over-x-squared');
        expect(xml).toContain('hreflang="x-default"');
        const lastmods = new Set([...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]));
        expect(lastmods.size).toBeGreaterThan(1);
        for (const stamp of lastmods) {
            expect(Number.isNaN(Date.parse(stamp))).toBe(false);
            expect(stamp).not.toBe(new Date().toISOString());
        }
        const allow = JSON.parse(
            fs.readFileSync(path.resolve(__dirname, '..', 'data', 'sitemap-problem-slugs.json'), 'utf8')
        ) as string[];
        for (const slug of ['derivative-of-sin-x', 'derivative-of-tan-x', 'derivative-of-cot-x', 'derivative-of-pi', 'derivative-of-sec-x', 'derivative-of-arcsin-x']) {
            expect(allow).toContain(slug);
            expect(locs).toContain(`https://derivativecalculatorai.com/${slug}`);
        }
    });
});
