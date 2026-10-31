/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';
import { calculateIntegral, calculateLimit } from '@/lib/math/integral-limit';
import { integralAnswersEquivalent, limitAnswersEquivalent } from '@/lib/math/compare';
import { generateIntegralProblem, generateLimitProblem } from '@/lib/practice-problems';
import { explainStepDeterministic } from '@/lib/step-why';
import { answerFirstLead } from '@/content/answer-lead';
import { homeGuide } from '@/content/home-guide';
import { comparisonPlainText, COMPARISONS } from '@/content/comparisons';
import { isObviousBot } from '@/lib/bot-signal';
import { nextStreak, rememberMiss } from '@/lib/practice-retention';
import { buildSharePath } from '@/lib/share-link';
import { encodeCardPng } from '@/lib/og-card';
import { keywordTitle } from '@/lib/seo';

const ROOT = path.resolve(__dirname, '..');

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

describe('integral and limit engines', () => {
  it('integrates x^2 and accepts an equivalent antiderivative with +C', () => {
    const solved = calculateIntegral('x^2');
    expect(solved.isValid).toBe(true);
    expect(solved.rule).toBe('Power Rule for Integrals');
    expect(solved.steps.join(' ').toLowerCase()).toContain('constant');
    expect(integralAnswersEquivalent(solved.solutionRaw, 'x^3/3 + C', 'x^2').match).toBe(true);
    expect(integralAnswersEquivalent(solved.solutionRaw, 'x^2', 'x^2').match).toBe(false);
  });

  it('evaluates a standard limit and a removable discontinuity', () => {
    const standard = calculateLimit('sin(x)/x', '0');
    expect(standard.isValid).toBe(true);
    expect(standard.solutionRaw).toBe('1');
    expect(standard.rule).toBe('Standard Limit');
    expect(limitAnswersEquivalent(standard.solutionRaw, '1').match).toBe(true);
    const hole = calculateLimit('(x^2-1)/(x-1)', '1');
    expect(hole.isValid).toBe(true);
    expect(hole.solutionRaw).toBe('2');
    expect(hole.steps.join(' ')).toMatch(/0\/0|indeterminate|factor/i);
  });

  it('generates stable integral and limit practice problems', () => {
    const integral = generateIntegralProblem('substitution', 'beginner', 11);
    expect(generateIntegralProblem('substitution', 'beginner', 11).expression).toBe(integral.expression);
    expect(calculateIntegral(integral.expression).isValid).toBe(true);
    const limit = generateLimitProblem('algebraic', 'beginner', 4);
    expect(generateLimitProblem('algebraic', 'beginner', 4).answerRaw).toBe(limit.answerRaw);
    expect(calculateLimit(limit.expression, limit.limitTo || '0').solutionRaw).toBe(limit.answerRaw);
  });

  it('explains an integral step in Spanish', () => {
    const why = explainStepDeterministic('x^2', 'Sube el exponente.', 'Power Rule for Integrals', 'es');
    expect(why).toContain('x^2');
    expect(why.toLowerCase()).toContain('antiderivada');
  });
});

describe('answer-first derivative leads', () => {
  it('states the derivative before any derivation prose', () => {
    const arcsin = answerFirstLead('derivative-of-arcsin-x', 'en');
    expect(arcsin).toMatch(/d\/dx arcsin\(x\)/);
    expect(arcsin).toContain('1 / sqrt(1 - x^2)');
    expect(arcsin).toContain('-1 < x < 1');
    const sin2 = answerFirstLead('derivative-of-sin-2x', 'en')!;
    expect(sin2.startsWith('d/dx ')).toBe(true);
    expect(sin2).toContain('2*cos(2*x)');
    const es = answerFirstLead('derivative-of-sin-2x', 'es')!;
    expect(es).not.toBe(sin2);
    const page = fs.readFileSync(path.join(ROOT, 'app/[slug]/page.tsx'), 'utf8');
    const marker = page.indexOf('const answerLead');
    expect(page.indexOf('{answerLead ?', marker)).toBeGreaterThan(marker);
    expect(page.indexOf('{answerLead ?', marker)).toBeLessThan(page.indexOf('t.howToText', marker));
  });
});

describe('homepage positioning and 404 robots', () => {
  it('uses one 40-60 word blurb in the page and in FAQ JSON-LD input', () => {
    for (const locale of ['en', 'es', 'pt'] as const) {
      const guide = homeGuide[locale];
      const count = words(guide.positioning);
      expect(count).toBeGreaterThanOrEqual(40);
      expect(count).toBeLessThanOrEqual(60);
      expect(guide.faqs.some((faq) => faq.answer === guide.positioning)).toBe(true);
    }
    expect(homeGuide.en.positioning).toMatch(/no sign-up/i);
    expect(homeGuide.en.positioning).toMatch(/computer-algebra/i);
    expect(homeGuide.en.positioning).toMatch(/step-by-step/i);
    const layout = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf8');
    expect(layout).not.toMatch(/next\/font/);
    expect(layout).not.toMatch(/GoogleAnalytics/);
    expect(layout).not.toMatch(/index:\s*true/);
    const notFound = fs.readFileSync(path.join(ROOT, 'app/not-found.tsx'), 'utf8');
    expect(notFound).toMatch(/index:\s*false/);
  });
});

describe('comparison pages and llms.txt', () => {
  it('keeps competitor claims sourced and the titles short', () => {
    for (const locale of ['en', 'es', 'pt'] as const) {
      for (const key of ['symbolab', 'comparison'] as const) {
        const copy = COMPARISONS[locale][key];
        expect(keywordTitle(copy.h1).length).toBeLessThanOrEqual(70);
        expect(copy.description.length).toBeLessThanOrEqual(160);
        expect(words(comparisonPlainText(copy))).toBeGreaterThanOrEqual(120);
        expect(copy.sources.length).toBeGreaterThanOrEqual(4);
        expect(copy.note.toLowerCase()).toMatch(/mathway/);
      }
    }
    expect(COMPARISONS.es.comparison.paragraphs[0]).not.toBe(COMPARISONS.en.comparison.paragraphs[0]);
    expect(COMPARISONS.pt.symbolab.paragraphs[0]).not.toBe(COMPARISONS.en.symbolab.paragraphs[0]);
    const page = fs.readFileSync(path.join(ROOT, 'scripts/generate-sitemap.js'), 'utf8');
    expect(page).toContain('/symbolab-alternative');
    expect(page).toContain('/derivative-calculator-comparison');
    const { generateLlms } = require('../scripts/generate-llms.js') as { generateLlms: () => string };
    const llms = generateLlms();
    expect(llms).toContain('https://derivativecalculatorai.com/derivative-of-sin-2x');
    expect(llms).toContain('https://derivativecalculatorai.com/wiki/power-rule');
    expect(llms).toContain('https://derivativecalculatorai.com/integral');
    expect(llms).not.toContain('integral-of-');
  });
});

describe('retention, share cards, and bot signals', () => {
  it('tracks a streak and stores a miss once', () => {
    expect(nextStreak(2, true)).toBe(3);
    expect(nextStreak(2, false)).toBe(0);
    const once = rememberMiss([], { topic: 'integral', expression: 'x^2', at: 1, expected: '(1/3)*x^3' });
    const twice = rememberMiss(once, { topic: 'integral', expression: 'x^2', at: 2, expected: '(1/3)*x^3' });
    expect(twice).toHaveLength(1);
    expect(twice[0].at).toBe(2);
  });

  it('builds a noindex share path and a png card', async () => {
    expect(buildSharePath({ type: 'limit', equation: 'sin(x)/x', result: '1', limitTo: '0' })).toContain('type=limit');
    const png = await encodeCardPng(['Derivative', 'sin(2*x)', '= 2*cos(2*x)']);
    expect(Array.from(png.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });

  it('flags webdriver and headless browsers and leaves a Cubot phone alone', () => {
    expect(isObviousBot({ webdriver: true, userAgent: 'Mozilla/5.0 Chrome/120.0.0.0' })).toBe(true);
    expect(isObviousBot({ userAgent: 'Mozilla/5.0 HeadlessChrome/120.0.0.0' })).toBe(true);
    expect(isObviousBot({ userAgent: 'Mozilla/5.0 (Linux; Android 11; CUBOT NOTE 20) AppleWebKit/537.36 Chrome/96.0.4664.104 Mobile' })).toBe(false);
    expect(isObviousBot({ userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36' })).toBe(false);
    expect(isObviousBot({ userAgent: '' })).toBe(true);
  });

  it('submits the whole sitemap when the key is new and only changes afterwards', () => {
    const { selectIndexNowUrls } = require('../scripts/indexnow.js') as {
      selectIndexNowUrls: (_input: { currentXml: string; previousXml?: string; keyIsNew: boolean }) => string[];
    };
    const current = '<url><loc>https://derivativecalculatorai.com/</loc><lastmod>2026-10-31T00:00:00Z</lastmod></url><url><loc>https://derivativecalculatorai.com/integral</loc><lastmod>2026-10-31T01:00:00Z</lastmod></url>';
    const previous = '<url><loc>https://derivativecalculatorai.com/</loc><lastmod>2026-10-30T00:00:00Z</lastmod></url><url><loc>https://derivativecalculatorai.com/integral</loc><lastmod>2026-10-31T01:00:00Z</lastmod></url>';
    expect(selectIndexNowUrls({ currentXml: current, previousXml: previous, keyIsNew: true })).toHaveLength(2);
    expect(selectIndexNowUrls({ currentXml: current, previousXml: previous, keyIsNew: false })).toEqual(['https://derivativecalculatorai.com/']);
  });
});
