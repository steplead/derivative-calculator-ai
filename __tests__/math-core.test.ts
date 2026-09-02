/**
 * Regression tests for shared deterministic math core (Phase A3).
 *
 * Contract under test:
 *   ln(x)   = natural logarithm
 *   log(x)  = natural logarithm (nerdamer's log)
 *   log10(x)= base-10 logarithm
 *
 * Failures BEFORE fix (baseline):
 *   - diff(ln(x), x) → "ln" (wrong; should be x^(-1))
 *   - diff(x*ln(x), x) → "2*ln*x" (wrong; should be 1+log(x))
 */
import { normalizeExpression, calculateDerivative, identifyRule, validateDerivativeResult } from '@/lib/math/math-core';

describe('normalizeExpression — ln/log contract', () => {
  it('rewrites ln( → log( for natural log', () => {
    expect(normalizeExpression('ln(x)')).toBe('log(x)');
    expect(normalizeExpression('ln(2*x)')).toBe('log(2*x)');
    expect(normalizeExpression('x*ln(x)')).toBe('x*log(x)');
    expect(normalizeExpression('ln(x)^2')).toBe('log(x)^2');
  });

  it('keeps log( and log10( unchanged', () => {
    expect(normalizeExpression('log(x)')).toBe('log(x)');
    expect(normalizeExpression('log10(x)')).toBe('log10(x)');
  });

  it('does not corrupt non-function identifiers', () => {
    expect(normalizeExpression('linear')).toBe('linear');
    expect(normalizeExpression('x+lnx')).toBe('x+lnx');
  });
});

describe('calculateDerivative — required math cases', () => {
  const cases: Array<[string, string]> = [
    ['x^2', '2*x'],                       // power rule
    ['sin(x)', 'cos(x)'],                 // trig
    ['ln(x)', 'x^(-1)'],                  // natural log (was broken)
    ['ln(2*x)', 'x^(-1)'],                // log chain (was broken)
    ['x*ln(x)', '1+log(x)'],              // product w/ log (was broken)
    ['log(x)', 'x^(-1)'],                 // natural log alias
    ['log10(x)', '(log(10)*x)^(-1)'],     // base-10 log
    ['exp(2*x)', '2*e^(2*x)'],            // exponential chain
    ['x*sin(x)', 'cos(x)*x+sin(x)'],      // product rule
  ];

  it.each(cases)('d/dx(%s) = %s', (expr, expected) => {
    const r = calculateDerivative(expr);
    expect(r.isValid).toBe(true);
    expect(r.solutionRaw).toBe(expected);
  });

  it('never returns bare ln (the nerdamer bug signature)', () => {
    const r = calculateDerivative('ln(x)');
    expect(r.solutionRaw).not.toMatch(/^ln$/);
    expect(validateDerivativeResult('log(x)', r.solutionRaw)).toBe(true);
  });
});

describe('identifyRule — deterministic rule detection', () => {
  it('detects power rule', () => {
    expect(identifyRule('x^2')).toBe('Power Rule');
  });
  it('detects product rule', () => {
    expect(identifyRule('x*sin(x)')).toBe('Product Rule');
  });
  it('detects quotient rule', () => {
    expect(identifyRule('sin(x)/x')).toBe('Quotient Rule');
  });
  it('detects logarithmic rule', () => {
    expect(identifyRule('log(x)')).toBe('Logarithmic Rule');
  });
  it('detects exponential rule', () => {
    expect(identifyRule('exp(x)')).toBe('Exponential Rule');
  });
});

describe('calculateDerivative — steps are present and deterministic', () => {
  it('produces at least 2 steps for x^2', () => {
    const r = calculateDerivative('x^2');
    expect(r.steps.length).toBeGreaterThanOrEqual(2);
    expect(r.steps.join(' ')).toContain('power rule');
  });

  it('log10 steps mention base-10', () => {
    const r = calculateDerivative('log10(x)');
    expect(r.steps.join(' ').toLowerCase()).toContain('base-10');
  });

  it('throws on empty expression', () => {
    expect(() => calculateDerivative('')).toThrow();
  });
});
