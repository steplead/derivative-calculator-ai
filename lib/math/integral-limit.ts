/**
 * Deterministic integrals and limits.
 * The same nerdamer calls the API routes used to make inline, so a checked
 * answer and a displayed answer cannot drift.
 */

// @ts-ignore - nerdamer has no bundled types
import nerdamer from 'nerdamer';
// @ts-ignore
import 'nerdamer/Calculus';
import { identifyRule, normalizeExpression } from '@/lib/math/math-core';

export interface IntegralSolution {
  original: string;
  engineExpression: string;
  solutionRaw: string;
  solutionLatex: string;
  rule: string;
  steps: string[];
  isValid: boolean;
}

export interface LimitSolution {
  original: string;
  engineExpression: string;
  target: string;
  solutionRaw: string;
  solutionLatex: string;
  rule: string;
  steps: string[];
  isValid: boolean;
}

const WHY: Record<string, string> = {
  'Power Rule for Integrals': 'Differentiating x^(n+1)/(n+1) brings the exponent down and cancels the denominator, which is why the antiderivative raises the power by 1 and divides by the new exponent. A constant of integration is required because every constant differentiates to zero.',
  'Constant Multiple Rule for Integrals': 'A constant factor stretches the area by the same amount everywhere, so it comes out of the integral and the remaining function is integrated on its own.',
  'Sum Rule for Integrals': 'Integration is linear. Each term has its own antiderivative, and the constants of integration collapse into a single +C.',
  Substitution: 'The inside of the function is not x itself. Let u be that inside. dx is replaced by du divided by the derivative of the inside, which is the chain rule run backwards.',
  'Integration by Parts': 'A product of two functions of x does not integrate factor by factor. Parts uses ∫ u dv = u v − ∫ v du, so one factor is differentiated and the other is integrated.',
  'Standard Integral': 'This integrand is one of the functions whose antiderivative is memorized. Differentiating the result has to recover the integrand; that is the check.',
  'Logarithmic Integral': 'The derivative of ln|x| is 1/x, so the antiderivative of 1/x is the logarithm. A constant inside the log often cancels after differentiation and does not change the 1/x form.',
  'Exponential Integral': 'e^x is its own derivative, so it is its own antiderivative. Any other base is e^(x ln base), and dividing by ln(base) undoes the chain-rule factor.',
  'Direct Substitution': 'The expression is built from functions that are continuous at the target, so the limit equals the value there. Continuity is the reason substitution is legal.',
  'Algebraic Simplification': 'Substitution produces an indeterminate form, usually 0/0. A shared factor is zero at the target and nonzero nearby, so canceling it does not change the limit. The simplified function can then be evaluated.',
  'Standard Limit': 'sin(x)/x approaches 1 because, in radians, the sine of a small angle is almost the angle. The squeeze theorem is what makes that precise. A constant multiple inside the sine scales the result by that constant.',
};

export function integralRuleWhy(rule: string): string {
  return WHY[rule] || WHY['Standard Integral'];
}

export function identifyIntegralRule(expr: string): string {
  const outer = identifyRule(expr);
  const e = expr.replace(/\s+/g, '').toLowerCase();
  if (outer === 'Sum Rule') return 'Sum Rule for Integrals';
  if (outer === 'Constant Multiple Rule') return 'Constant Multiple Rule for Integrals';
  if (outer === 'Product Rule') return 'Integration by Parts';
  if (outer === 'Chain Rule') return 'Substitution';
  if (outer === 'Quotient Rule' && /^1\/x(\^\d+)?$/.test(e)) return 'Logarithmic Integral';
  if (outer === 'Logarithmic Rule') return 'Logarithmic Integral';
  if (outer === 'Exponential Rule') return 'Exponential Integral';
  if (outer === 'Power Rule') return 'Power Rule for Integrals';
  if (outer === 'Trigonometric Rule') return 'Standard Integral';
  return 'Standard Integral';
}

export function generateIntegralSteps(expr: string, solutionRaw: string, rule: string): string[] {
  const why = integralRuleWhy(rule);
  return [
    `Integrate ${expr} with respect to x using the ${rule}. ${why}`,
    `The antiderivative, before the constant, is ${solutionRaw}.`,
    `Add +C. Differentiating ${solutionRaw} + C returns the integrand, and the constant disappears.`,
    `Final answer: ${solutionRaw} + C`,
  ];
}

export function normalizeLimitPoint(target: string): string {
  const t = (target || '0').trim().toLowerCase();
  if (t === 'inf' || t === 'infinity' || t === '∞' || t === '+inf' || t === '+infinity' || t === '+∞') return 'infinity';
  if (t === '-inf' || t === '-infinity' || t === '-∞') return '-infinity';
  if (!/^[+-]?(?:\d+(?:\.\d+)?|pi|e)$/.test(t)) {
    throw new Error('Limit point must be a number, pi, e, or infinity.');
  }
  return t;
}

function identifyLimitRule(expr: string, target: string, raw: string): string {
  const e = expr.replace(/\s+/g, '').toLowerCase();
  if (/sin\([^)]*\)\/\(?(?:[+-]?\d*\*?x|x)\)?/.test(e) || e === 'sin(x)/x') return 'Standard Limit';
  if (/(1-cos\([^)]*\))\/x\^2/.test(e)) return 'Standard Limit';
  if (target === 'infinity' || target === '-infinity') return 'Algebraic Simplification';
  const point = Number(target);
  if (!Number.isFinite(point)) return 'Algebraic Simplification';
  try {
    const value = (nerdamer(normalizeExpression(expr)) as { evaluate: (_vars: Record<string, number>) => { text?: () => string } })
      .evaluate({ x: point });
    const text = typeof value?.text === 'function' ? value.text() : String(value);
    if (Number.isFinite(Number(text)) && String(raw).replace(/\s+/g, '') === String(text).replace(/\s+/g, '')) {
      return 'Direct Substitution';
    }
  } catch {
    // Indeterminate form. The simplified limit is still the engine result.
  }
  return 'Algebraic Simplification';
}

export function generateLimitSteps(expr: string, target: string, solutionRaw: string, rule: string): string[] {
  const why = WHY[rule] || WHY['Algebraic Simplification'];
  const shown = target === 'infinity' ? '∞' : target === '-infinity' ? '−∞' : target;
  return [
    `Evaluate the limit of ${expr} as x approaches ${shown} using ${rule}. ${why}`,
    `The limit value is ${solutionRaw}.`,
    `Final answer: ${solutionRaw}`,
  ];
}

function invalidIntegral(original: string, engineExpression: string): IntegralSolution {
  return {
    original,
    engineExpression,
    solutionRaw: '',
    solutionLatex: '',
    rule: 'Standard Integral',
    steps: [],
    isValid: false,
  };
}

export function calculateIntegral(expr: string): IntegralSolution {
  const original = (expr || '').trim();
  if (!original) throw new Error('Empty expression');
  const engineExpression = normalizeExpression(original);
  let raw = '';
  let latex = '';
  try {
    const integral = nerdamer(`integrate(${engineExpression}, x)`);
    raw = String(integral.toString() || '').trim();
    try {
      latex = String(integral.toTeX() || '').trim();
    } catch {
      latex = raw;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Integral calculation failed: ${message}`);
  }
  if (!raw || /integrate\s*\(/i.test(raw)) return invalidIntegral(original, engineExpression);
  const rule = identifyIntegralRule(engineExpression);
  const steps = generateIntegralSteps(engineExpression, raw, rule);
  const withConstant = latex ? `${latex} + C` : `${raw} + C`;
  return {
    original,
    engineExpression,
    solutionRaw: raw,
    solutionLatex: withConstant,
    rule,
    steps,
    isValid: true,
  };
}

export function calculateLimit(expr: string, targetInput: string): LimitSolution {
  const original = (expr || '').trim();
  if (!original) throw new Error('Empty expression');
  const engineExpression = normalizeExpression(original);
  const target = normalizeLimitPoint(targetInput);
  let raw = '';
  let latex = '';
  try {
    const limit = nerdamer(`limit(${engineExpression}, x, ${target})`);
    raw = String(limit.toString() || '').trim();
    try {
      latex = String(limit.toTeX() || '').trim();
    } catch {
      latex = raw;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Limit calculation failed: ${message}`);
  }
  const isValid = Boolean(raw) && !/limit\s*\(/i.test(raw);
  const rule = isValid ? identifyLimitRule(engineExpression, target, raw) : 'Algebraic Simplification';
  return {
    original,
    engineExpression,
    target,
    solutionRaw: raw,
    solutionLatex: latex || raw,
    rule,
    steps: isValid ? generateLimitSteps(engineExpression, target, raw, rule) : [],
    isValid,
  };
}
