/**
 * P1: inverse-trig lessons, the trig-derivative hub, and e^x alias 301s.
 */
import * as fs from 'fs';
import * as path from 'path';
import { getInverseTrigLesson, lessonPlainText } from '@/content/inverse-trig-lessons';
import { trigHubCopy, trigHubPlainText } from '@/content/trig-hub';
import { exponentialAliasRedirect, localeRewriteTarget } from '@/lib/redirects';
import { keywordTitle } from '@/lib/seo';
import { INVERSE_TRIG_SLUGS, TRIG_CLUSTER_PAGES, TRIG_HUB_PATH } from '@/lib/trig-cluster';

const LOCALES = ['en', 'es', 'pt'] as const;

function words(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
}

describe('inverse trig lessons', () => {
    it('covers arcsin, arccos, and arctan in every locale', () => {
        for (const locale of LOCALES) {
            const texts = new Set<string>();
            for (const slug of INVERSE_TRIG_SLUGS) {
                const lesson = getInverseTrigLesson(slug, locale);
                expect(lesson).not.toBeNull();
                expect(lesson!.slug).toBe(slug);
                expect(keywordTitle(lesson!.title).length).toBeLessThanOrEqual(60);
                expect(lesson!.description.length).toBeLessThanOrEqual(160);
                expect(lesson!.faqs.length).toBeGreaterThanOrEqual(4);
                expect(lesson!.examples.length).toBeGreaterThanOrEqual(3);
                expect(lesson!.derivationSteps.length).toBeGreaterThanOrEqual(5);
                expect(lesson!.related.some((item) => item.href === TRIG_HUB_PATH)).toBe(true);
                texts.add(lesson!.derivationSteps.join('|'));
            }
            expect(texts.size).toBe(INVERSE_TRIG_SLUGS.length);
        }
    });

    it('targets the striking-distance notation without copying one lesson across languages', () => {
        const arcsin = getInverseTrigLesson('derivative-of-arcsin-x', 'en')!;
        const arccos = getInverseTrigLesson('derivative-of-arccos-x', 'en')!;
        const arctan = getInverseTrigLesson('derivative-of-arctan-x', 'en')!;
        expect(arcsin.title).toMatch(/arcsin/i);
        expect(arcsin.title).toMatch(/sin\^-1/);
        expect(arccos.title).toMatch(/arccos/i);
        expect(arccos.formula).toMatch(/-1 \/ sqrt/);
        expect(arctan.title).toMatch(/arctan/i);
        expect(arctan.title).toMatch(/tan\^-1/);
        expect(arctan.formula).toMatch(/atan/);
        expect(arcsin.calculatorFormula).toBe('asin(x)');
        expect(arccos.calculatorFormula).toBe('acos(x)');
        expect(arctan.calculatorFormula).toBe('atan(x)');
        expect(words(lessonPlainText(arcsin))).toBeGreaterThanOrEqual(400);
        expect(getInverseTrigLesson('derivative-of-arcsin-x', 'es')!.title).not.toBe(arcsin.title);
        expect(getInverseTrigLesson('derivative-of-arctan-x', 'pt')!.title).not.toBe(arctan.title);
        expect(getInverseTrigLesson('derivative-of-sin-x', 'en')).toBeNull();
    });
});

describe('trigonometric derivatives hub', () => {
    it('lists every curated trig page and stays inside the title limit', () => {
        const allow = JSON.parse(
            fs.readFileSync(path.resolve(__dirname, '..', 'data', 'sitemap-problem-slugs.json'), 'utf8')
        ) as string[];
        expect(TRIG_CLUSTER_PAGES.map((page) => page.slug).sort()).toEqual(
            [...new Set(TRIG_CLUSTER_PAGES.map((page) => page.slug))].sort()
        );
        for (const page of TRIG_CLUSTER_PAGES) {
            expect(allow).toContain(page.slug);
            expect(page.derivative.length).toBeGreaterThan(0);
            expect(page.calculator.length).toBeGreaterThan(0);
        }
        const groups = new Set(TRIG_CLUSTER_PAGES.map((page) => page.group));
        expect(groups).toEqual(new Set(['standard', 'inverse', 'variant', 'hyperbolic']));
        for (const locale of LOCALES) {
            const copy = trigHubCopy[locale];
            expect(keywordTitle(copy.title).length).toBeLessThanOrEqual(60);
            expect(copy.description.length).toBeLessThanOrEqual(160);
            expect(copy.faqs.length).toBeGreaterThanOrEqual(4);
            expect(words(trigHubPlainText(copy))).toBeGreaterThanOrEqual(120);
        }
        const page = fs.readFileSync(
            path.resolve(__dirname, '..', 'app', 'derivatives-of-trig-functions', 'page.tsx'),
            'utf8'
        );
        expect(page).toContain('generateFAQData');
        expect(page).toContain('generateBreadcrumbData');
        expect(page).toContain('id="derivatives-of-trig-functions"');
    });
});

describe('e^x alias redirects', () => {
    it('sends both duplicate URLs to the canonical slug and keeps the locale', () => {
        expect(exponentialAliasRedirect('/derivative-of-e-x')).toBe('/derivative-of-e-to-the-x');
        expect(exponentialAliasRedirect('/es/derivative-of-e-x')).toBe('/es/derivative-of-e-to-the-x');
        expect(exponentialAliasRedirect('/pt/derivative-of-x-e-x/')).toBe('/pt/derivative-of-x-e-to-the-x');
        expect(exponentialAliasRedirect('/derivative-of-e-to-the-x')).toBeNull();
        expect(exponentialAliasRedirect('/derivative-of-e-to-the-2x')).toBeNull();
        expect(localeRewriteTarget('/es', '?equation=asin(x)')).toBe('/?equation=asin(x)');
        expect(localeRewriteTarget('/pt/derivative-of-arcsin-x', '')).toBe('/derivative-of-arcsin-x');
        expect(localeRewriteTarget('/practice', '?equation=asin(x)')).toBeNull();
    });

    it('is applied from middleware before the page renders', () => {
        const src = fs.readFileSync(path.resolve(__dirname, '..', 'middleware.ts'), 'utf8');
        expect(src).toContain('exponentialAliasRedirect');
        expect(src).toContain('NextResponse.redirect(url, 301)');
        const home = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'page.tsx'), 'utf8');
        expect(home).toContain("slug: 'derivative-of-e-to-the-x'");
        expect(home).not.toContain("slug: 'derivative-of-e-x'");
    });
});
