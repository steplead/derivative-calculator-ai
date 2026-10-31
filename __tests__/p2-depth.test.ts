import * as fs from 'fs';
import * as path from 'path';
import { calculateDerivative, identifyRule } from '@/lib/math/math-core';
import { answersEquivalent } from '@/lib/math/compare';
import { chainBreakdown, implicitDerivative, partialDerivative } from '@/lib/math/advanced';
import { generatePracticeProblem } from '@/lib/practice-problems';
import { explainStepDeterministic } from '@/lib/step-why';
import {
  allDerivativeFacts,
  clusterSiblings,
  examplesForRule,
  getDerivativeLesson,
  lessonPlainText,
} from '@/content/derivative-lesson';
import { SPECIAL_CALCULATORS, specialPlainText } from '@/content/special-calculators';
import { keywordTitle } from '@/lib/seo';
import { renderDerivativeSvg } from '@/lib/plot-svg';

const LOCALES = ['en', 'es', 'pt'] as const;

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

describe('indexable derivative lessons', () => {
  const allow = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', 'data', 'sitemap-problem-slugs.json'), 'utf8')
  ) as string[];

  it('covers every sitemap derivative and keeps the math honest', () => {
    const slugs = allDerivativeFacts().map((fact) => fact.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of allow) {
      expect(slugs).toContain(slug);
      const fact = allDerivativeFacts().find((item) => item.slug === slug)!;
      if (fact.nondiff || fact.linksOnly) continue;
      const solved = calculateDerivative(fact.engine);
      expect(solved.isValid).toBe(true);
      expect(answersEquivalent(solved.solutionRaw, fact.nice).match).toBe(true);
    }
  });

  it('gives each full lesson unique copy, a graph, faqs, and two-way links', () => {
    const full = allDerivativeFacts().filter((fact) => !fact.linksOnly);
    expect(full.length).toBeGreaterThanOrEqual(45);
    for (const locale of LOCALES) {
      const texts = new Set<string>();
      for (const fact of full) {
        const lesson = getDerivativeLesson(fact.slug, locale);
        expect(lesson).not.toBeNull();
        expect(lesson!.faqs.length).toBeGreaterThanOrEqual(3);
        expect(lesson!.related.some((item) => item.href === `/wiki/${fact.ruleWiki}`)).toBe(true);
        expect(words(lessonPlainText(lesson!))).toBeGreaterThanOrEqual(120);
        expect(lesson!.description.length).toBeLessThanOrEqual(160);
        texts.add(lessonPlainText(lesson!));
        const svg = renderDerivativeSvg(lesson!.engine, lesson!.graphDerivative, fact.display);
        expect(svg && svg.includes('<path')).toBe(true);
      }
      expect(texts.size).toBe(full.length);
    }
    for (const fact of allDerivativeFacts()) {
      for (const sibling of clusterSiblings(fact.slug)) {
        expect(clusterSiblings(sibling)).toContain(fact.slug);
      }
      expect(examplesForRule(fact.ruleWiki)).toContain(fact.slug);
    }
    const en = getDerivativeLesson('derivative-of-sin-2x', 'en')!;
    const es = getDerivativeLesson('derivative-of-sin-2x', 'es')!;
    expect(es.paragraphs[0]).not.toBe(en.paragraphs[0]);
    expect(examplesForRule('chain-rule')).toContain('derivative-of-sin-2x');
    expect(examplesForRule('logarithmic-derivatives')).toContain('derivative-of-ln-x');
  });
});

describe('calculator features', () => {
  it('classifies chain, power, and quotient without confusing the operators', () => {
    expect(identifyRule('sin(2*x)')).toBe('Chain Rule');
    expect(identifyRule('x^(1/3)')).toBe('Power Rule');
    expect(identifyRule('1/x')).toBe('Quotient Rule');
    expect(identifyRule('2*x')).toBe('Constant Multiple Rule');
    expect(identifyRule('x*sin(x)')).toBe('Product Rule');
  });

  it('accepts equivalent derivatives and rejects a dropped chain factor', () => {
    const solved = calculateDerivative('sin(2*x)');
    expect(answersEquivalent(solved.solutionRaw, '2*cos(2*x)').match).toBe(true);
    expect(answersEquivalent(solved.solutionRaw, '2cos(2x)').match).toBe(true);
    expect(answersEquivalent(solved.solutionRaw, 'cos(2*x)').match).toBe(false);
  });

  it('differentiates partials, implicit equations, and the chain rule', () => {
    const partial = partialDerivative('x^2*y+sin(y)', 'x');
    expect(partial.raw.replace(/\s+/g, '')).toBe('2*x*y');
    const implicit = implicitDerivative('x^2+y^2=25');
    expect(implicit.raw.replace(/\s+/g, '')).toBe('-x*y^(-1)');
    const chain = chainBreakdown('sin(2*x)');
    expect(chain.inner).toBe('2*x');
    expect(chain.innerDerivative).toBe('2');
    expect(answersEquivalent(chain.raw, '2*cos(2*x)').match).toBe(true);
  });

  it('generates a checkable practice problem from a seed', () => {
    const first = generatePracticeProblem('chain', 'beginner', 7);
    const again = generatePracticeProblem('chain', 'beginner', 7);
    expect(again.expression).toBe(first.expression);
    expect(again.answerRaw).toBe(first.answerRaw);
    const solved = calculateDerivative(first.expression);
    expect(answersEquivalent(solved.solutionRaw, first.answerRaw).match).toBe(true);
  });

  it('explains a step without an API key', () => {
    const why = explainStepDeterministic('sin(2*x)', 'Multiply by the derivative of 2x, which is 2.', 'Chain Rule');
    expect(why.toLowerCase()).toContain('chain rule');
    expect(why).toContain('sin(2*x)');
    expect(why).toContain('2');
  });
});

describe('special calculator pages', () => {
  it('has hreflang-ready copy and faq schema inputs in every locale', () => {
    const page = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'generate-sitemap.js'), 'utf8');
    for (const key of ['partial', 'implicit', 'chain'] as const) {
      const tool = SPECIAL_CALCULATORS[key];
      expect(page).toContain(tool.path);
      for (const locale of LOCALES) {
        const copy = tool.copy[locale];
        expect(keywordTitle(copy.h1).length).toBeLessThanOrEqual(60);
        expect(copy.description.length).toBeLessThanOrEqual(160);
        expect(copy.faqs.length).toBeGreaterThanOrEqual(4);
        expect(words(specialPlainText(copy))).toBeGreaterThanOrEqual(120);
      }
      expect(tool.copy.es.h1).not.toBe(tool.copy.en.h1);
      expect(tool.copy.pt.paragraphs[0]).not.toBe(tool.copy.en.paragraphs[0]);
    }
  });
});
