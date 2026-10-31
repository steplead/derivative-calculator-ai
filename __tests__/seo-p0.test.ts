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
import { trackEvent } from '@/lib/analytics';
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
    it('emits a self-canonical and x-default for each locale', () => {
        const es = localeAlternates('/practice', 'es');
        expect(es.canonical).toBe('https://derivativecalculatorai.com/es/practice');
        expect(es.languages.en).toBe('https://derivativecalculatorai.com/practice');
        expect(es.languages.es).toBe('https://derivativecalculatorai.com/es/practice');
        expect(es.languages.pt).toBe('https://derivativecalculatorai.com/pt/practice');
        expect(es.languages['x-default']).toBe('https://derivativecalculatorai.com/practice');

        const home = localeAlternates('/', 'es');
        expect(home.canonical).toBe('https://derivativecalculatorai.com/es');
        expect(home.languages['x-default']).toBe('https://derivativecalculatorai.com');
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
    });
});

describe('curated sitemap', () => {
    it('lists only the quality set, with real lastmod and hreflang', () => {
        execSync('node scripts/generate-sitemap.js', { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
        const xml = fs.readFileSync(path.resolve(__dirname, '..', 'public', 'sitemap.xml'), 'utf8');
        const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        expect(locs.length).toBeGreaterThanOrEqual(100);
        expect(locs.length).toBeLessThanOrEqual(300);
        expect(xml).not.toContain('+');
        expect(xml).not.toContain('integral-of-');
        expect(xml).not.toContain('/derivative-of-e-x<');
        expect(xml).toContain('https://derivativecalculatorai.com/derivative-of-sin-2x');
        expect(xml).toContain('https://derivativecalculatorai.com/derivative-of-1-over-x-squared');
        expect(xml).toContain('https://derivativecalculatorai.com/es');
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
