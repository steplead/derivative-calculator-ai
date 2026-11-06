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
import { normalizeExpression, calculateDerivative, identifyRule, validateDerivativeResult, prettifyRaw, prettifyLatex } from '@/lib/math/math-core';

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
    ['x*ln(x)', '1+ln(x)'],              // product w/ log (display rewrites log → ln)
    ['log(x)', 'x^(-1)'],                 // natural log alias
    ['log10(x)', '(ln(10)*x)^(-1)'],      // base-10 log (log(10) = ln(10) in display)
    ['exp(2*x)', '2*e^(2*x)'],            // exponential chain
    ['e^x', 'e^x'],                        // natural-base exp (rational approx in some nerdamer builds)
    ['e^(2*x)', '2*e^(2*x)'],             // e^ with explicit parens
    ['e^(-x)', '-e^(-x)'],                // negative exponent chain
    ['x*exp(x)', 'e^x+e^x*x'],            // product with exp
    ['2^x', '2^x*ln(2)'],                // other base, constant back-sub to ln(2)
    ['10^x', '10^x*ln(10)'],             // other base, constant back-sub to ln(10)
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

describe('calculateDerivative — e^x stays symbolic (no rational approximation)', () => {
  it('d/dx e^x = e^x, never a numeric/rational approximation of e', () => {
    const r = calculateDerivative('e^x');
    expect(r.isValid).toBe(true);
    expect(r.solutionRaw).toBe('e^x');
    // Guard against the old nerdamer bug: d/dx e^x must not contain a long digit
    // run like 325368125/119696244 (≈ e). It must also not leak the internal
    // `exp(` token into the displayed answer.
    expect(r.solutionRaw).not.toMatch(/\d{6,}/);
    expect(r.solutionRaw).not.toMatch(/exp\(/);
    expect(r.steps.join(' ')).toContain('e^x');
  });

  it('e^(2*x) and non-e bases stay symbolic', () => {
    expect(calculateDerivative('e^(2*x)').solutionRaw).toBe('2*e^(2*x)');
    expect(calculateDerivative('2^x').solutionRaw).toBe('2^x*ln(2)');
    expect(calculateDerivative('10^x').solutionRaw).toBe('10^x*ln(10)');
  });
});

describe('prettifyRaw — irrational constant back-substitution (prod-rational → symbol)', () => {
  // A production nerdamer build numericizes ln2 / ln10 / e / pi / √2 into ratios of
  // 6+ digit integers (e.g. d/dx 2^x → (49180508/70952475)*2^x, where that ratio
  // ≈ ln2). prettifyRaw must restore the exact constant so the displayed answer —
  // and any JSON-LD derived from it — never contains a 6+ digit integer ratio.
  it('restores ln(2) from the observed production fraction for 2^x', () => {
    expect(prettifyRaw('(49180508/70952475)*2^x')).toBe('2^x*ln(2)');
    expect(prettifyRaw('(49180508/70952475)*2^x')).not.toMatch(/\d{6,}/);
  });

  it('restores ln(10) from the observed production fraction for 10^x', () => {
    expect(prettifyRaw('(250513404/108796589)*10^x')).toBe('10^x*ln(10)');
    expect(prettifyRaw('(250513404/108796589)*10^x')).not.toMatch(/\d{6,}/);
  });

  it('does not touch already-symbolic forms (local nerdamer build)', () => {
    expect(prettifyRaw('2^x*ln(2)')).toBe('2^x*ln(2)');
    expect(prettifyRaw('10^x*ln(10)')).toBe('10^x*ln(10)');
  });

  it('rewrites nerdamer natural-log token log( → ln( (protects log10)', () => {
    expect(prettifyRaw('(log(10)*x)^(-1)')).toBe('(ln(10)*x)^(-1)');
    // log10( is left untouched by the log( → ln( rule.
    expect(prettifyRaw('log10(x)')).toBe('log10(x)');
  });

  it('does not mistake a small rational for a constant', () => {
    // 1/2 is nowhere near ln2/ln10/e/pi/√2 → left as-is.
    expect(prettifyRaw('(1/2)*x^2')).toBe('(1/2)*x^2');
  });
});

// ---------------------------------------------------------------------------
// RC-8 / 2026-11-07 owner forensic: a production nerdamer build emits e NOT as a
// symbolic `exp` token but as a RATIO of two large integer powers
// (325368125/119696244 ≈ e), and it writes that ratio as a PRODUCT in the raw
// output but as a FRACTION in the LaTeX output. These tests lock the exact
// production strings the owner captured so the back-substitution can never again
// regress to leaking 9-digit integers or an `exp(` token into the displayed answer.
// ---------------------------------------------------------------------------
describe('prettifyRaw — e written as a ratio of integer powers (prod build)', () => {
  const cases: Array<[string, string]> = [
    // [production raw string, expected symbolic form]
    ['2*119696244^(-2*x)*325368125^(2*x)', '2*e^(2*x)'],
    ['-119696244^x*325368125^(-x)', '-e^(-x)'],
    ['119696244^(-x)*325368125^x+119696244^(-x)*325368125^x*x', 'e^x+e^x*x'],
    ['-2*119696244^(2*x)*325368125^(-2*x)', '-2*e^(-2*x)'],
  ];
  it.each(cases)('collapses %s -> %s', (input, expected) => {
    const out = prettifyRaw(input);
    expect(out).toBe(expected);
    expect(out).not.toMatch(/\d{6,}/); // no 9-digit integer leaks
    expect(out).not.toMatch(/exp\(/);   // no internal exp( token
  });

  it('does not touch already-symbolic e forms (local nerdamer build)', () => {
    expect(prettifyRaw('2*e^(2*x)')).toBe('2*e^(2*x)');
    expect(prettifyRaw('-e^(-x)')).toBe('-e^(-x)');
    expect(prettifyRaw('e^x+e^x*x')).toBe('e^x+e^x*x');
  });
});

describe('prettifyLatex — e written as a ratio of integer powers (prod build)', () => {
  // EXACT production LaTeX strings captured by the owner on 2026-11-07 (origin fetch,
  // bypassing CDN). nerdamer emits e as a FRACTION of two integer powers
  // (325368125/119696244 ≈ e). The fraction may carry a leading coefficient
  // (e.g. "2 ·" in e^(2x)) or a trailing factor (e.g. "· x" in x·e^x) — both must be
  // carried through. These tests lock the exact strings so the back-substitution can
  // never again leak 9-digit integers or an exp( token into the displayed answer.
  const cases: Array<[string, string]> = [
    // e^(2x): leading coefficient INSIDE the numerator
    ['\\frac{2 \\cdot 325368125^{2 \\cdot x}}{119696244^{2 \\cdot x}}', '2e^{2x}'],
    // e^(-x): LOW over HIGH = 1/e  (leading minus stays outside the fraction)
    ['-\\frac{119696244^{x}}{325368125^{x}}', '-e^{-x}'],
    // x*e^x: trailing "· x" factor in the numerator  ← owner's 5th / hardest case
    ['e^{x}+\\frac{325368125^{x} \\cdot x}{119696244^{x}}', 'e^{x}+e^{x}x'],
    // 2^x / 10^x constant fractions
    ['\\frac{49180508 \\cdot 2^{x}}{70952475}', '2^{x}\\ln(2)'],
    ['\\frac{250513404 \\cdot 10^{x}}{108796589}', '10^{x}\\ln(10)'],
  ];
  it.each(cases)('collapses %s -> %s', (input, expected) => {
    const out = prettifyLatex(input);
    expect(out).toBe(expected);
    expect(out).not.toMatch(/\d{6,}/);
    expect(out).not.toMatch(/exp\(/);
  });

  it('also handles the (defensive) product-shaped LaTeX e-ratio', () => {
    const out = prettifyLatex('119696244^{-2x}\\cdot 325368125^{2x}');
    expect(out).not.toMatch(/\d{6,}/);
    expect(out).toContain('e^{');
  });
});

describe('calculateDerivative — e-class forms stay exact end-to-end (prod parity)', () => {
  // Locks the four e-class shapes the owner called out (coeff / power / neg / sum),
  // proving local symbolic and production-rational paths converge on one form.
  const cases: Array<[string, string]> = [
    ['e^(2*x)', '2*e^(2*x)'],
    ['e^(-x)', '-e^(-x)'],
    ['x*exp(x)', 'e^x+e^x*x'],
    ['e^(-2*x)', '-2*e^(-2*x)'],
  ];
  it.each(cases)('d/dx %s = %s', (expr, expected) => {
    const r = calculateDerivative(expr);
    expect(r.isValid).toBe(true);
    expect(r.solutionRaw).toBe(expected);
    expect(r.solutionLatex).not.toMatch(/\d{6,}/);
    expect(r.solutionLatex).not.toMatch(/exp\(/);
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

// ---------------------------------------------------------------------------
// RC-4 follow-up: non-differentiable / mis-parsed functions must never publish
// a wrong answer. Found by the sympy cross-check oracle (1085 PASS / 0 FAIL /
// 3 UNKNOWN over all 1088 derivative pages).
// ---------------------------------------------------------------------------
describe('RC-4 hard cases — Abs(x) and floor(x)', () => {
  it('Abs(x) normalises to abs(x) and differentiates to x/|x|', () => {
    expect(normalizeExpression('Abs(x)')).toBe('abs(x)');
    const r = calculateDerivative('Abs(x)');
    expect(r.isValid).toBe(true);
    // d/dx |x| = x/|x|  (== sign(x) for x != 0)
    expect(r.solutionRaw.replace(/\s/g, '')).toBe('abs(x)^(-1)*x');
  });

  it('Abs(x) is NOT reported with the Power Rule', () => {
    const r = calculateDerivative('Abs(x)');
    expect(r.rule).not.toBe('Power Rule');
    expect(r.rule.toLowerCase()).toContain('absolute');
  });

  it('abs(x) bare-symbol regression: result is never a lone word', () => {
    const r = calculateDerivative('abs(x)');
    expect(r.solutionRaw).not.toMatch(/^[A-Za-z]+$/);
  });

  it('floor(x) is non-differentiable — must be flagged invalid, not published', () => {
    const r = calculateDerivative('floor(x)');
    // nerdamer cannot differentiate floor(): it echoes an unevaluated diff form.
    expect(r.isValid).toBe(false);
  });

  it('validateDerivativeResult rejects unevaluated diff() echoes', () => {
    expect(validateDerivativeResult('floor(x)', 'diff(floor(x),x)')).toBe(false);
    expect(validateDerivativeResult('floor(x)', '(floor(x), x, diff)')).toBe(false);
  });

  it('validateDerivativeResult rejects bare multi-letter symbols', () => {
    expect(validateDerivativeResult('Abs(x)', 'Abs')).toBe(false);
    expect(validateDerivativeResult('ln(x)', 'ln')).toBe(false);
  });

  it('validateDerivativeResult still accepts legitimate constants and vars', () => {
    expect(validateDerivativeResult('x', '1')).toBe(true);
    expect(validateDerivativeResult('e*x', 'e')).toBe(true);
    expect(validateDerivativeResult('pi*x', 'pi')).toBe(true);
    expect(validateDerivativeResult('x^2/2', 'x')).toBe(true);
    expect(validateDerivativeResult('x^2', '2*x')).toBe(true);
  });
});
