/**
 * RC-1b: integrals and limits must get the same server-rendered answer block
 * as derivatives.
 *
 * Before this, `ssrSolution` was gated on `type === 'derivative'`, so the 2,049
 * integral / limit pages in the library shipped a calculator with no answer,
 * rule or steps in the HTML — thin pages with nothing for a crawler to read.
 */
import fs from 'fs';
import path from 'path';
import { calculateIntegral, calculateLimit } from '@/lib/math/integral-limit';
import { calculateDerivative, normalizeExpression } from '@/lib/math/math-core';

describe('integral and limit SSR blocks', () => {
  it('integral: answer, +C, named rule, steps', () => {
    const r = calculateIntegral('2*x + 4*x');
    expect(r.isValid).toBe(true);
    expect(r.solutionRaw).toContain('x^2');
    expect(r.solutionLatex).toContain('C');
    expect(r.rule).toMatch(/Integral|Rule/);
    expect(r.steps.length).toBeGreaterThan(0);
  });

  it('limit: value and technique', () => {
    const r = calculateLimit('5*x^3 / sqrt(x)', '1');
    expect(r.isValid).toBe(true);
    expect(r.solutionRaw).toBe('5');
    expect(r.rule).toBeTruthy();
    expect(r.steps.length).toBeGreaterThan(0);
  });

  it('limit at a removable singularity cancels before substituting', () => {
    const r = calculateLimit('(x^2+x-2)/(x-1)', '1');
    expect(r.isValid).toBe(true);
    expect(r.solutionRaw).toBe('3');
  });

  it('[slug] page solves every type, not only derivatives', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'app/(site)/[slug]/page.tsx'),
      'utf8'
    );
    expect(src).toContain("from '@/lib/math/integral-limit'");
    expect(src).toMatch(/if \(type === 'integral'\) solved = memoizedIntegral\(formula\);/);
    expect(src).toMatch(/if \(type === 'limit'\) solved = memoizedLimit\(formula, limitTo \|\| '0'\);/);
    // the old derivative-only gate must not come back
    expect(src).not.toMatch(/safeProblem\.type === 'derivative' \|\| !safeProblem\.type\s*\)\s*\n\s*\?\s*memoizedDerivative/);
  });

  it('pages without an answer stay out of the index', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'app/(site)/[slug]/page.tsx'),
      'utf8'
    );
    expect(src).toMatch(/const hasAnswer = Boolean\(solveForType\(/);
    expect(src).toMatch(/!hasAnswer \|\|/);
  });

  it('SolutionCard labels a limit with its target instead of "Derivative of"', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'components/SolutionCard.tsx'),
      'utf8'
    );
    expect(src).toMatch(/type === 'limit'/);
    expect(src).toMatch(/as x approaches/);
  });
});

describe('normalizeExpression: bare e^ captures one atom', () => {
  it('stops at the first operator instead of swallowing the rest', () => {
    // Regression: `[^()]*` turned e^x - 1/x into exp(x - 1/x), a different
    // function — wrong derivative AND an impossible integral.
    expect(normalizeExpression('e^x - 1/x')).toBe('exp(x) - 1/x');
    expect(normalizeExpression('e^x/x^2')).toBe('exp(x)/x^2');
    expect(normalizeExpression('x*e^x*sin(x)')).toBe('x*exp(x)*sin(x)');
  });

  it('keeps the legitimate forms working', () => {
    expect(normalizeExpression('e^(2*x)')).toBe('exp(2*x)');
    expect(normalizeExpression('e^x^2')).toBe('exp(x^2)');
    expect(normalizeExpression('e^x-1')).toBe('exp(x)-1');
  });

  it('the derivative of e^x - 1/x is e^x + 1/x^2, not the composed form', () => {
    const r = calculateDerivative('e^x - 1/x');
    expect(r.isValid).toBe(true);
    expect(r.solutionRaw).toContain('x^(-2)');
    expect(r.solutionRaw).not.toContain('exp(x - 1/x)');
  });
});
