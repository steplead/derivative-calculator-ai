/**
 * Partial derivatives, implicit differentiation, and chain-rule breakdown.
 * All three stay on the deterministic nerdamer engine used by the derivative API.
 */

// @ts-ignore - nerdamer has no bundled types
import nerdamer from 'nerdamer';
// @ts-ignore
import 'nerdamer/Calculus';
// @ts-ignore
import 'nerdamer/Algebra';
import { calculateDerivative, normalizeExpression } from '@/lib/math/math-core';
import { assertSafeMath } from '@/lib/math/compare';

export type AdvancedResult = {
  raw: string;
  latex: string;
  steps: string[];
  rule: string;
};

function texOf(expr: string): string {
  try {
    return nerdamer(expr).toTeX();
  } catch {
    return expr;
  }
}

export function partialDerivative(expression: string, variable: string): AdvancedResult {
  const symbol = (variable || '').trim().toLowerCase();
  if (symbol !== 'x' && symbol !== 'y' && symbol !== 'z') {
    throw new Error('Differentiate with respect to x, y, or z.');
  }
  const safe = assertSafeMath(expression, { allowY: true, allowZ: true });
  const engine = normalizeExpression(safe);
  if (!new RegExp(`(^|[^a-z])${symbol}([^a-z]|$)`, 'i').test(engine)) {
    return {
      raw: '0',
      latex: '0',
      rule: 'Constant Rule',
      steps: [
        `${engine} does not contain ${symbol}. Every other letter is held constant, so the partial derivative with respect to ${symbol} is 0.`,
      ],
    };
  }
  let differentiated: { toString: () => string; toTeX: () => string };
  try {
    differentiated = nerdamer(`diff(${engine}, ${symbol})`);
  } catch (error) {
    throw new Error(`Could not differentiate with respect to ${symbol}.`);
  }
  const raw = differentiated.toString();
  if (!raw || /diff\s*\(/.test(raw)) {
    throw new Error(`No partial derivative with respect to ${symbol} was found.`);
  }
  let latex = raw;
  try {
    latex = differentiated.toTeX();
  } catch {
    latex = raw;
  }
  return {
    raw,
    latex,
    rule: 'Partial Derivative',
    steps: [
      `Treat every variable other than ${symbol} as a constant. A constant factor stays; a term with no ${symbol} drops out.`,
      `Differentiate ${engine} with respect to ${symbol} using the ordinary power, product, and chain rules.`,
      `∂/∂${symbol} = ${raw}.`,
    ],
  };
}

export function implicitDerivative(equation: string): AdvancedResult {
  const safe = assertSafeMath(equation, { allowEquals: true, allowY: true });
  const halves = safe.split('=');
  if (halves.length !== 2 || !halves[0].trim() || !halves[1].trim()) {
    throw new Error('Enter an equation with one equals sign, such as x^2+y^2=25.');
  }
  const left = normalizeExpression(halves[0].trim());
  const right = normalizeExpression(halves[1].trim());
  const blob = `${left}${right}`;
  if (!/(^|[^a-z])y([^a-z]|$)/i.test(blob) || !/(^|[^a-z])x([^a-z]|$)/i.test(blob)) {
    throw new Error('The equation needs both x and y. y is treated as a function of x.');
  }
  const f = `((${left})-(${right}))`;
  let fx: string;
  let fy: string;
  try {
    fx = nerdamer(`diff(${f}, x)`).toString();
    fy = nerdamer(`diff(${f}, y)`).toString();
  } catch (error) {
    throw new Error('Could not differentiate both sides.');
  }
  if (!fy || fy === '0') {
    throw new Error('The partial with respect to y is 0, so this equation does not determine dy/dx.');
  }
  let raw = '';
  let latex = '';
  try {
    const solved = nerdamer(`simplify(-(${fx})/(${fy}))`);
    raw = solved.toString();
    latex = solved.toTeX();
  } catch {
    raw = `-(${fx})/(${fy})`;
    latex = texOf(raw);
  }
  if (!raw || /diff\s*\(/.test(raw)) {
    throw new Error('Could not solve for dy/dx.');
  }
  return {
    raw,
    latex,
    rule: 'Implicit Differentiation',
    steps: [
      `Rewrite the equation as F(x, y) = 0 with F = (${left}) − (${right}).`,
      `Hold y constant and differentiate in x: Fx = ${fx}.`,
      `Hold x constant and differentiate in y: Fy = ${fy}. y is still a function of x; this partial only isolates the coefficient of dy/dx.`,
      `Solve Fx + Fy·dy/dx = 0 for the derivative: dy/dx = −Fx/Fy = ${raw}.`,
    ],
  };
}

const OUTER_DERIVATIVE: Record<string, string> = {
  sin: 'cos(u)',
  cos: '-sin(u)',
  tan: 'sec(u)^2',
  sec: 'sec(u)*tan(u)',
  csc: '-csc(u)*cot(u)',
  cot: '-csc(u)^2',
  asin: '1/sqrt(1-u^2)',
  acos: '-1/sqrt(1-u^2)',
  atan: '1/(1+u^2)',
  exp: 'exp(u)',
  log: '1/u',
  ln: '1/u',
  sqrt: '1/(2*sqrt(u))',
  sinh: 'cosh(u)',
  cosh: 'sinh(u)',
  tanh: 'sech(u)^2',
};

export type ChainBreakdown = AdvancedResult & {
  outer: string | null;
  inner: string | null;
  outerDerivative: string | null;
  innerDerivative: string | null;
};

export function chainBreakdown(expression: string): ChainBreakdown {
  const safe = assertSafeMath(expression);
  const engine = normalizeExpression(safe).replace(/\s+/g, '');
  const full = calculateDerivative(engine);
  if (!full.isValid) {
    throw new Error('This expression does not have an ordinary derivative.');
  }
  const call = engine.match(/^(sin|cos|tan|sec|csc|cot|asin|acos|atan|exp|log|ln|sqrt|sinh|cosh|tanh)\((.*)\)$/i);
  if (!call) {
    return {
      raw: full.solutionRaw,
      latex: full.solutionLatex,
      rule: full.rule,
      outer: null,
      inner: null,
      outerDerivative: null,
      innerDerivative: null,
      steps: [
        `${engine} is not a single outer function wrapped around an inside. The derivative is still ${full.solutionRaw}, by the ${full.rule}.`,
        ...full.steps,
      ],
    };
  }
  const name = call[1].toLowerCase();
  const inner = call[2];
  const outerDerivative = OUTER_DERIVATIVE[name] || null;
  let innerDerivative = '1';
  if (inner !== 'x') {
    const innerResult = calculateDerivative(inner);
    if (!innerResult.isValid) {
      throw new Error('The inside function could not be differentiated.');
    }
    innerDerivative = innerResult.solutionRaw;
  }
  const substituted = outerDerivative ? outerDerivative.replace(/\(u\)/g, `(${inner})`).replace(/u/g, `(${inner})`) : null;
  return {
    raw: full.solutionRaw,
    latex: full.solutionLatex,
    rule: 'Chain Rule',
    outer: `${name}(u)`,
    inner,
    outerDerivative,
    innerDerivative,
    steps: [
      `Outer function: ${name}(u). Its derivative with respect to u is ${outerDerivative}.`,
      `Inner function: u = ${inner}. Its derivative with respect to x is ${innerDerivative}. This factor is why a composition is not differentiated by copying the outer rule onto the same inside.`,
      substituted
        ? `Multiply them and replace u with ${inner}: (${substituted}) · (${innerDerivative}).`
        : `Multiply the outer derivative by the inner derivative.`,
      `Simplified derivative: ${full.solutionRaw}.`,
    ],
  };
}
