/**
 * A4/RC-1 regression: SSR deterministic content requirements.
 *
 * The [slug] page's server HTML must contain real math content
 * (answer + rule + steps). We test the shared math core's output
 * (what gets rendered server-side) — not the client Calculator.
 */
import { calculateDerivative } from '@/lib/math/math-core';

describe('RC-1 SSR deterministic content — per-page substance', () => {
  it('x^2 SSR block: answer, power rule, real steps', () => {
    const r = calculateDerivative('x^2');
    expect(r.solutionRaw).toBe('2*x');
    expect(r.rule).toBe('Power Rule');
    expect(r.steps.length).toBeGreaterThanOrEqual(2);
    const stepsText = r.steps.join(' ');
    expect(stepsText.toLowerCase()).toContain('power rule');
  });

  it('sin(x) SSR block: rule and steps mention trigonometric', () => {
    const r = calculateDerivative('sin(x)');
    expect(r.solutionRaw).toBe('cos(x)');
    expect(r.steps.join(' ').toLowerCase()).toContain('trigonometric');
  });

  it('ln(x) SSR block: answer 1/x with log rule', () => {
    const r = calculateDerivative('ln(x)');
    expect(r.solutionRaw).toBe('x^(-1)');
    expect(r.rule).toBe('Logarithmic Rule');
  });

  it('product rule page has distinct steps from power rule page', () => {
    const power = calculateDerivative('x^2');
    const product = calculateDerivative('x*sin(x)');
    expect(power.steps.join(' ')).not.toBe(product.steps.join(' '));
    expect(product.rule).toBe('Product Rule');
  });

  it('steps are never generic placeholder-only ("Identify/Apply/Simplify" alone)', () => {
    // E5: steps must reflect the actual rule used, not a 3-line generic template
    const r = calculateDerivative('log10(x)');
    const joined = r.steps.join(' ').toLowerCase();
    expect(joined).toContain('base-10'); // rule-specific detail
  });

  it('invalid implicit-equation result is rejected (not surfaced in SSR)', () => {
    const r = calculateDerivative('x^2+y^2=25');
    expect(r.isValid).toBe(false);
  });
});
