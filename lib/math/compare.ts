/**
 * Symbolic comparison of two calculus expressions.
 * nerdamer is used as a parser, never via eval/Function.
 * A symbolic zero wins; otherwise both sides are sampled at several x values
 * so equivalent forms (sec^2 vs 1/cos^2, double-angle identities) still match.
 */

// @ts-ignore - nerdamer has no bundled types
import nerdamer from 'nerdamer';
// @ts-ignore
import 'nerdamer/Calculus';
// @ts-ignore
import 'nerdamer/Algebra';
import { normalizeExpression } from '@/lib/math/math-core';

const SAFE_CHARS = /^[0-9a-zA-Z+\-*/^().,=\s|]+$/;

const BASE_WORDS = [
  'x', 'e', 'pi',
  'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
  'asin', 'acos', 'atan', 'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh', 'sech', 'csch', 'coth',
  'ln', 'log', 'log10', 'exp', 'sqrt', 'abs', 'sign',
];

export type SafeMathOptions = {
  allowEquals?: boolean;
  allowY?: boolean;
  allowZ?: boolean;
};

export function assertSafeMath(input: string, options: SafeMathOptions = {}): string {
  const s = (input || '').trim();
  if (!s || s.length > 200) {
    throw new Error('Expression is empty or too long.');
  }
  if (!SAFE_CHARS.test(s)) {
    throw new Error('Expression contains unsupported characters.');
  }
  if (!options.allowEquals && s.includes('=')) {
    throw new Error('Enter an expression, not an equation.');
  }
  if ((s.match(/=/g) || []).length > 1) {
    throw new Error('Use a single equals sign.');
  }
  const allowed = new Set(BASE_WORDS);
  if (options.allowY) allowed.add('y');
  if (options.allowZ) allowed.add('z');
  const words = s.match(/[a-zA-Z]+/g) || [];
  for (const word of words) {
    if (!allowed.has(word.toLowerCase())) {
      throw new Error(`Unsupported symbol: ${word}`);
    }
  }
  return s;
}

function numericAt(expr: string, x: number): number | null {
  try {
    const value = (nerdamer(expr) as { evaluate: (_vars: Record<string, number>) => { text?: () => string } }).evaluate({ x });
    const text = typeof value?.text === 'function' ? value.text() : String(value);
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export type Equivalence = {
  match: boolean;
  method: 'symbolic' | 'numeric' | 'uncompared';
};

/**
 * True when `userAnswer` is the same function of x as `expectedRaw`.
 * `expectedRaw` is an engine result and is not re-validated as user input.
 */
export function answersEquivalent(expectedRaw: string, userAnswer: string): Equivalence {
  const user = normalizeExpression(assertSafeMath(userAnswer));
  const expected = normalizeExpression(expectedRaw);
  if (!user || !expected) return { match: false, method: 'uncompared' };

  try {
    const difference = nerdamer(`expand((${expected})-(${user}))`).toString().replace(/\s+/g, '');
    if (difference === '0') return { match: true, method: 'symbolic' };
  } catch {
    // Fall through to sampling. Some equivalent forms do not expand to 0.
  }

  const points = [-1.7, -0.8, -0.35, 0.4, 0.75, 1.2, 1.8, 2.4];
  let checked = 0;
  for (const x of points) {
    const a = numericAt(expected, x);
    const b = numericAt(user, x);
    if (a === null || b === null) continue;
    if (Math.abs(a) > 1e6 || Math.abs(b) > 1e6) continue;
    checked += 1;
    const tolerance = 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));
    if (Math.abs(a - b) > tolerance) return { match: false, method: 'numeric' };
  }
  if (checked >= 3) return { match: true, method: 'numeric' };
  return { match: false, method: 'uncompared' };
}
