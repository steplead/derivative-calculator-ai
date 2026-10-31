/**
 * Deterministic practice problems. The seed picks coefficients; the derivative
 * is whatever the shared math engine returns, so the checker and the generator
 * cannot drift apart.
 */

import { calculateDerivative } from '@/lib/math/math-core';
import { calculateIntegral, calculateLimit } from '@/lib/math/integral-limit';

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
  topic?: 'derivative' | 'integral' | 'limit';
  limitTo?: string;
  integralRule?: string;
  limitRule?: string;
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

export const INTEGRAL_RULES = ['power', 'substitution', 'parts', 'trigonometric', 'exponential', 'logarithmic'] as const;
export const LIMIT_RULES = ['direct', 'algebraic', 'standard'] as const;
export type IntegralRule = (typeof INTEGRAL_RULES)[number];
export type LimitRule = (typeof LIMIT_RULES)[number];
export type PracticeTopic = 'derivative' | 'integral' | 'limit';

export function isIntegralRule(value: string): value is IntegralRule {
  return (INTEGRAL_RULES as readonly string[]).includes(value);
}

export function isLimitRule(value: string): value is LimitRule {
  return (LIMIT_RULES as readonly string[]).includes(value);
}

function buildIntegral(rule: IntegralRule, difficulty: PracticeDifficulty, rand: () => number): string {
  const coeff = () => integer(rand, 2, difficulty === 'beginner' ? 4 : 6);
  if (rule === 'power') {
    if (difficulty === 'beginner') return `x^${integer(rand, 2, 4)}`;
    if (difficulty === 'intermediate') return `${coeff()}*x^${integer(rand, 2, 5)}`;
    return `x^${integer(rand, 2, 4)}+${coeff()}`;
  }
  if (rule === 'substitution') {
    const a = coeff();
    if (difficulty === 'beginner') return pick(rand, [`sin(${a}*x)`, `cos(${a}*x)`] as const);
    if (difficulty === 'intermediate') return `exp(${a}*x)`;
    return `(x+${integer(rand, 1, 4)})^${integer(rand, 2, 3)}`;
  }
  if (rule === 'parts') {
    return difficulty === 'beginner' ? 'x*exp(x)' : pick(rand, ['x*sin(x)', 'x*cos(x)', 'x*exp(x)'] as const);
  }
  if (rule === 'trigonometric') return pick(rand, ['sin(x)', 'cos(x)'] as const);
  if (rule === 'exponential') return difficulty === 'beginner' ? 'exp(x)' : `${integer(rand, 2, 5)}^x`;
  return difficulty === 'beginner' ? '1/x' : `1/(${coeff()}*x)`;
}

function buildLimit(rule: LimitRule, difficulty: PracticeDifficulty, rand: () => number): { expression: string; limitTo: string } {
  if (rule === 'direct') {
    const point = integer(rand, 1, 4);
    if (difficulty === 'beginner') return { expression: `x+${integer(rand, 1, 5)}`, limitTo: String(point) };
    return { expression: `x^2+${integer(rand, 1, 3)}`, limitTo: String(point) };
  }
  if (rule === 'standard') {
    if (difficulty === 'beginner') return { expression: 'sin(x)/x', limitTo: '0' };
    if (difficulty === 'intermediate') return { expression: 'sin(2*x)/x', limitTo: '0' };
    return { expression: '(1-cos(x))/x^2', limitTo: '0' };
  }
  const a = integer(rand, 1, 4);
  return { expression: `(x^2-${a * a})/(x-${a})`, limitTo: String(a) };
}

export function generateIntegralProblem(rule: IntegralRule, difficulty: PracticeDifficulty, seed: number): PracticeProblem {
  const base = Math.abs(Math.floor(seed)) % 100000;
  for (let attempt = 0; attempt < 8; attempt++) {
    const rand = mulberry32(base + attempt * 97);
    const expression = buildIntegral(rule, difficulty, rand);
    try {
      const solved = calculateIntegral(expression);
      if (!solved.isValid || !solved.solutionRaw) continue;
      return {
        expression,
        rule: 'power',
        difficulty,
        seed: base + attempt * 97,
        answerRaw: solved.solutionRaw,
        hintKey: rule === 'parts' ? 'product' : rule === 'substitution' ? 'chain' : rule === 'logarithmic' ? 'log' : rule === 'exponential' ? 'exp' : rule === 'trigonometric' ? 'trig' : 'power',
        topic: 'integral',
        integralRule: rule,
      };
    } catch {
      continue;
    }
  }
  return {
    expression: 'x^2',
    rule: 'power',
    difficulty,
    seed: base,
    answerRaw: '(1/3)*x^3',
    hintKey: 'power',
    topic: 'integral',
    integralRule: 'power',
  };
}

export function generateLimitProblem(rule: LimitRule, difficulty: PracticeDifficulty, seed: number): PracticeProblem {
  const base = Math.abs(Math.floor(seed)) % 100000;
  for (let attempt = 0; attempt < 8; attempt++) {
    const rand = mulberry32(base + attempt * 97);
    const built = buildLimit(rule, difficulty, rand);
    try {
      const solved = calculateLimit(built.expression, built.limitTo);
      if (!solved.isValid || !solved.solutionRaw) continue;
      return {
        expression: built.expression,
        rule: 'power',
        difficulty,
        seed: base + attempt * 97,
        answerRaw: solved.solutionRaw,
        hintKey: rule === 'standard' ? 'trig' : rule === 'direct' ? 'power' : 'quotient',
        topic: 'limit',
        limitTo: solved.target,
        limitRule: rule,
      };
    } catch {
      continue;
    }
  }
  return {
    expression: 'sin(x)/x',
    rule: 'power',
    difficulty,
    seed: base,
    answerRaw: '1',
    hintKey: 'trig',
    topic: 'limit',
    limitTo: '0',
    limitRule: 'standard',
  };
}
