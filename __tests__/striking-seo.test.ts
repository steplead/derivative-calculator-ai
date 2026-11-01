/**
 * Striking-distance pages, popular internal links, apex canonical, and share events.
 */
import * as fs from 'fs';
import * as path from 'path';
import { answerFirstLead } from '@/content/answer-lead';
import { getDerivativeLesson } from '@/content/derivative-lesson';
import { strikingMeta } from '@/content/striking-lessons';
import { POPULAR_DERIVATIVES } from '@/components/PopularDerivatives';
import { keywordTitle } from '@/lib/seo';

const ROOT = path.resolve(__dirname, '..');

const STRIKING = [
  'derivative-of-tan-x',
  'derivative-of-1-over-x-squared',
  'derivative-of-pi',
  'derivative-of-arctan-x',
] as const;

function firstSentence(text: string): string {
  const match = text.match(/^.+?[.!](?:\s|$)/);
  return match ? match[0] : text;
}

describe('positions 11-30 pages', () => {
  it('puts the derivative in the first sentence, title, and h1', () => {
    const answers: Record<string, RegExp> = {
      'derivative-of-tan-x': /sec\(x\)\^2/,
      'derivative-of-1-over-x-squared': /-2\/x\^3/,
      'derivative-of-pi': /\b0\b/,
      'derivative-of-arctan-x': /1\/\(1 \+ x\^2\)/,
    };
    for (const slug of STRIKING) {
      for (const locale of ['en', 'es', 'pt'] as const) {
        const meta = strikingMeta(slug, locale);
        expect(meta).not.toBeNull();
        expect(keywordTitle(meta!.title).length).toBeLessThanOrEqual(60);
        expect(meta!.description.length).toBeLessThanOrEqual(160);
        expect(meta!.h1.toLowerCase()).toContain(locale === 'en' ? 'derivative' : 'derivada');
        const lead = answerFirstLead(slug, locale);
        expect(lead).toBe(meta!.lead);
        expect(firstSentence(lead!)).toMatch(answers[slug]);
      }
    }
  });

  it('gives tan, 1/x^2, and pi a real derivation, example, and FAQ', () => {
    for (const slug of ['derivative-of-tan-x', 'derivative-of-1-over-x-squared', 'derivative-of-pi'] as const) {
      const lesson = getDerivativeLesson(slug, 'en');
      expect(lesson).not.toBeNull();
      expect(lesson!.steps.length).toBeGreaterThanOrEqual(6);
      expect(lesson!.example?.steps.length).toBeGreaterThanOrEqual(3);
      expect(lesson!.faqs.length).toBeGreaterThanOrEqual(4);
      expect(lesson!.mistakes.length).toBeGreaterThanOrEqual(3);
      expect(lesson!.related.length).toBeGreaterThanOrEqual(3);
      const es = getDerivativeLesson(slug, 'es')!;
      expect(es.paragraphs[0]).not.toBe(lesson!.paragraphs[0]);
    }
    const tan = getDerivativeLesson('derivative-of-tan-x', 'en')!;
    expect(tan.steps.join(' ')).toMatch(/quotient rule/i);
    expect(tan.example?.answer).toBe('2');
    const reciprocal = getDerivativeLesson('derivative-of-1-over-x-squared', 'en')!;
    expect(reciprocal.steps.join(' ')).toMatch(/x\^\(-2\)/);
    expect(reciprocal.example?.answer).toBe('-1/4');
    const pi = getDerivativeLesson('derivative-of-pi', 'en')!;
    expect(pi.steps.join(' ')).toMatch(/\(pi - pi\)\/h = 0/);
    expect(pi.example?.answer).toBe('2x');
  });
});

describe('popular derivatives and crawl paths', () => {
  it('links the position 4-10 and 11-30 pages with natural anchors', () => {
    const hrefs = POPULAR_DERIVATIVES.map((item) => item.href);
    for (const href of [
      '/derivative-of-sin-x',
      '/derivative-of-10-to-the-x',
      '/derivative-of-1-over-x-squared',
      '/derivative-of-arcsin-x',
      '/derivative-of-arctan-x',
      '/derivative-of-tan-x',
      '/derivative-of-pi',
      '/derivative-of-sin-2x',
    ]) {
      expect(hrefs).toContain(href);
    }
    expect(new Set(POPULAR_DERIVATIVES.map((item) => item.anchor.en)).size).toBe(POPULAR_DERIVATIVES.length);
    const home = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf8');
    const footer = fs.readFileSync(path.join(ROOT, 'components/Footer.tsx'), 'utf8');
    const integral = fs.readFileSync(path.join(ROOT, 'app/integral/page.tsx'), 'utf8');
    const limit = fs.readFileSync(path.join(ROOT, 'app/limit/page.tsx'), 'utf8');
    expect(home).toContain('PopularDerivatives');
    expect(home).toContain('href="/directory"');
    expect(footer).toContain('PopularDerivatives');
    expect(integral).toContain('PopularDerivatives');
    expect(integral).toContain('Popular integrals');
    expect(limit).toContain('PopularDerivatives');
  });
});

describe('apex canonical and share events', () => {
  it('redirects www to the apex host and canonicalizes the share page there', () => {
    const redirects = fs.readFileSync(path.join(ROOT, 'public/_redirects'), 'utf8');
    expect(redirects).toContain('https://www.derivativecalculatorai.com/* https://derivativecalculatorai.com/:splat 301');
    const result = fs.readFileSync(path.join(ROOT, 'app/result/page.tsx'), 'utf8');
    expect(result).toContain('canonical: `${SITE_URL}/result`');
    const middleware = fs.readFileSync(path.join(ROOT, 'middleware.ts'), 'utf8');
    expect(middleware).toContain('NextResponse.redirect(url, 301)');
  });

  it('fires share events on the click, before clipboard or native share can fail', () => {
    const src = fs.readFileSync(path.join(ROOT, 'components/ShareResultCard.tsx'), 'utf8');
    const copyEvent = src.indexOf("trackEvent('share_result_copy'");
    const clipboard = src.indexOf('clipboard.writeText');
    const nativeEvent = src.indexOf("trackEvent('share_result_native'");
    const nativeShare = src.indexOf('navigator.share(');
    const xEvent = src.indexOf("trackEvent('share_result_x'");
    expect(copyEvent).toBeGreaterThan(-1);
    expect(copyEvent).toBeLessThan(clipboard);
    expect(nativeEvent).toBeLessThan(nativeShare);
    expect(xEvent).toBeGreaterThan(-1);
    const ode = fs.readFileSync(path.join(ROOT, 'app/ode/page.tsx'), 'utf8');
    expect(ode).toContain('showShare');
    expect(ode).toContain('mode="ode"');
  });
});
