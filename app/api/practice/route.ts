import { NextRequest, NextResponse } from 'next/server';
import { performSecurityCheck } from '@/utils/security';
import {
  generatePracticeProblem,
  isPracticeDifficulty,
  isPracticeRule,
} from '@/lib/practice-problems';

export const runtime = 'edge';

const PRIVATE = { 'Cache-Control': 'private, no-store' };

const HINTS: Record<string, Record<string, string>> = {
  en: {
    power: 'Bring the exponent to the front and reduce it by 1.',
    product: 'Differentiate each factor once, then add the two terms.',
    quotient: 'The numerator is (low·d high − high·d low), over the square of the denominator.',
    chain: 'Differentiate the outside, then multiply by the derivative of the inside.',
    trig: 'Use the standard derivative. A cofunction (cos, cot, csc) carries a minus sign.',
    exp: 'e^x is its own derivative. Any other base contributes ln of that base.',
    log: 'The derivative of ln(x) is 1/x. A constant inside the log often cancels.',
  },
  es: {
    power: 'Baja el exponente al frente y réstale 1.',
    product: 'Deriva cada factor una vez y suma los dos términos.',
    quotient: 'El numerador es (abajo·derivada de arriba − arriba·derivada de abajo), sobre el cuadrado del denominador.',
    chain: 'Deriva la función exterior y multiplica por la derivada del interior.',
    trig: 'Usa la derivada estándar. Una cofunción (cos, cot, csc) lleva signo menos.',
    exp: 'e^x es su propia derivada. Otra base aporta ln de esa base.',
    log: 'La derivada de ln(x) es 1/x. Una constante dentro del logaritmo suele cancelarse.',
  },
  pt: {
    power: 'Desça o expoente para a frente e subtraia 1.',
    product: 'Derive cada fator uma vez e some os dois termos.',
    quotient: 'O numerador é (de baixo·derivada de cima − de cima·derivada de baixo), sobre o quadrado do denominador.',
    chain: 'Derive a função de fora e multiplique pela derivada de dentro.',
    trig: 'Use a derivada padrão. Uma cofunção (cos, cot, csc) carrega sinal de menos.',
    exp: 'e^x é a própria derivada. Outra base contribui com ln dessa base.',
    log: 'A derivada de ln(x) é 1/x. Uma constante dentro do logaritmo muitas vezes se cancela.',
  },
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const security = await performSecurityCheck(req.headers, url.searchParams, '/api/practice');
  if (!security.success) {
    return NextResponse.json(
      { error: security.error || 'Blocked' },
      { status: security.blocked ? 403 : 429, headers: PRIVATE }
    );
  }

  const rule = url.searchParams.get('rule') || 'power';
  const difficulty = url.searchParams.get('difficulty') || 'beginner';
  const locale = url.searchParams.get('locale') === 'es' || url.searchParams.get('locale') === 'pt'
    ? url.searchParams.get('locale')!
    : 'en';
  if (!isPracticeRule(rule) || !isPracticeDifficulty(difficulty)) {
    return NextResponse.json({ error: 'Unknown rule or difficulty.' }, { status: 400, headers: PRIVATE });
  }
  const seedParam = url.searchParams.get('seed');
  const seed = seedParam ? Number(seedParam) : Math.floor(Math.random() * 100000);
  if (!Number.isFinite(seed)) {
    return NextResponse.json({ error: 'Seed must be a number.' }, { status: 400, headers: PRIVATE });
  }

  const problem = generatePracticeProblem(rule, difficulty, seed);
  const hint = HINTS[locale][problem.hintKey] || HINTS.en[problem.hintKey];
  return NextResponse.json(
    {
      expression: problem.expression,
      rule: problem.rule,
      difficulty: problem.difficulty,
      seed: problem.seed,
      hint,
    },
    { headers: PRIVATE }
  );
}
