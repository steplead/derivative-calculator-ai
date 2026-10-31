/**
 * Deterministic practice problems. The seed picks coefficients; the derivative
 * is whatever the shared math engine returns, so the checker and the generator
 * cannot drift apart.
 */

import { calculateDerivative } from '@/lib/math/math-core';

export const PRACTICE_RULES = [
  'power',
  'product',
  'quotient',
  'chain',
  'trigonometric',
  'exponential',
  'logarithmic',
] as const;

export const PRACTICE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export type PracticeRule = (typeof PRACTICE_RULES)[number];
export type PracticeDifficulty = (typeof PRACTICE_DIFFICULTIES)[number];

export type PracticeProblem = {
  expression: string;
  rule: PracticeRule;
  difficulty: PracticeDifficulty;
  seed: number;
  /** Engine derivative. Returned to the checker path, not required by the client. */
  answerRaw: string;
  hintKey: 'power' | 'product' | 'quotient' | 'chain' | 'trig' | 'exp' | 'log';
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

function integer(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function buildExpression(rule: PracticeRule, difficulty: PracticeDifficulty, rand: () => number): { expression: string; hintKey: PracticeProblem['hintKey'] } {
  const coeff = () => integer(rand, 2, difficulty === 'beginner' ? 4 : 6);
  if (rule === 'power') {
    if (difficulty === 'beginner') return { expression: `x^${integer(rand, 2, 4)}`, hintKey: 'power' };
    if (difficulty === 'intermediate') return { expression: `${coeff()}*x^${integer(rand, 2, 5)}`, hintKey: 'power' };
    return { expression: `(x+${integer(rand, 1, 4)})^${integer(rand, 2, 4)}`, hintKey: 'chain' };
  }
  if (rule === 'product') {
    const trig = pick(rand, ['sin(x)', 'cos(x)'] as const);
    if (difficulty === 'beginner') return { expression: `x*${trig}`, hintKey: 'product' };
    if (difficulty === 'intermediate') return { expression: `x^${integer(rand, 2, 3)}*${trig}`, hintKey: 'product' };
    return { expression: `x*sin(${coeff()}*x)`, hintKey: 'product' };
  }
  if (rule === 'quotient') {
    if (difficulty === 'beginner') return { expression: pick(rand, ['1/x', '1/x^2'] as const), hintKey: 'quotient' };
    if (difficulty === 'intermediate') return { expression: `1/(x+${integer(rand, 1, 4)})`, hintKey: 'chain' };
    return { expression: `(x+${integer(rand, 1, 3)})/(x+${integer(rand, 4, 7)})`, hintKey: 'quotient' };
  }
  if (rule === 'chain') {
    const a = coeff();
    if (difficulty === 'beginner') return { expression: pick(rand, [`sin(${a}*x)`, `cos(${a}*x)`, `exp(${a}*x)`] as const), hintKey: 'chain' };
    if (difficulty === 'intermediate') return { expression: pick(rand, [`sin(x^2)`, `ln(${a}*x)`, `sqrt(x+${integer(rand, 1, 4)})`] as const), hintKey: 'chain' };
    return { expression: `exp(sin(${a}*x))`, hintKey: 'chain' };
  }
  if (rule === 'trigonometric') {
    if (difficulty === 'beginner') return { expression: pick(rand, ['sin(x)', 'cos(x)'] as const), hintKey: 'trig' };
    if (difficulty === 'intermediate') return { expression: pick(rand, ['tan(x)', 'sec(x)'] as const), hintKey: 'trig' };
    return { expression: pick(rand, ['csc(x)', 'cot(x)'] as const), hintKey: 'trig' };
  }
  if (rule === 'exponential') {
    if (difficulty === 'beginner') return { expression: pick(rand, ['e^x', 'exp(x)', '2^x'] as const), hintKey: 'exp' };
    if (difficulty === 'intermediate') return { expression: `exp(${coeff()}*x)`, hintKey: 'chain' };
    return { expression: `exp(x^2)`, hintKey: 'chain' };
  }
  if (difficulty === 'beginner') return { expression: 'ln(x)', hintKey: 'log' };
  if (difficulty === 'intermediate') return { expression: `ln(${coeff()}*x)`, hintKey: 'log' };
  return { expression: 'x*ln(x)', hintKey: 'product' };
}

export function generatePracticeProblem(
  rule: PracticeRule,
  difficulty: PracticeDifficulty,
  seed: number
): PracticeProblem {
  const base = Math.abs(Math.floor(seed)) % 100000;
  for (let attempt = 0; attempt < 8; attempt++) {
    const rand = mulberry32(base + attempt * 97);
    const built = buildExpression(rule, difficulty, rand);
    try {
      const solved = calculateDerivative(built.expression);
      if (!solved.isValid || !solved.solutionRaw) continue;
      return {
        expression: built.expression,
        rule,
        difficulty,
        seed: base + attempt * 97,
        answerRaw: solved.solutionRaw,
        hintKey: built.hintKey,
      };
    } catch {
      continue;
    }
  }
  const fallback = calculateDerivative('x^2');
  return {
    expression: 'x^2',
    rule,
    difficulty,
    seed: base,
    answerRaw: fallback.solutionRaw,
    hintKey: 'power',
  };
}

export function isPracticeRule(value: string): value is PracticeRule {
  return (PRACTICE_RULES as readonly string[]).includes(value);
}

export function isPracticeDifficulty(value: string): value is PracticeDifficulty {
  return (PRACTICE_DIFFICULTIES as readonly string[]).includes(value);
}
