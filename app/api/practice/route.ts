import { NextRequest, NextResponse } from 'next/server';
import { performSecurityCheck } from '@/utils/security';
import {
  generateIntegralProblem,
  generateLimitProblem,
  generatePracticeProblem,
  isIntegralRule,
  isLimitRule,
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
    integralPower: 'Raise the power by 1 and divide by the new exponent, then add +C.',
    integralSub: 'Let u be the inside. Divide by the derivative of that inside, then add +C.',
    integralParts: 'Pick u as the factor that gets simpler when differentiated. Add +C.',
    limitDirect: 'The function is continuous at the target, so substitute that value.',
    limitAlgebra: 'Substitution is 0/0. Cancel the shared factor, then substitute.',
    limitStandard: 'sin(x)/x approaches 1. A constant inside the sine scales the answer.',
  },
  es: {
    power: 'Baja el exponente al frente y réstale 1.',
    product: 'Deriva cada factor una vez y suma los dos términos.',
    quotient: 'El numerador es (abajo·derivada de arriba − arriba·derivada de abajo), sobre el cuadrado del denominador.',
    chain: 'Deriva la función exterior y multiplica por la derivada del interior.',
    trig: 'Usa la derivada estándar. Una cofunción (cos, cot, csc) lleva signo menos.',
    exp: 'e^x es su propia derivada. Otra base aporta ln de esa base.',
    log: 'La derivada de ln(x) es 1/x. Una constante dentro del logaritmo suele cancelarse.',
    integralPower: 'Sube el exponente en 1 y divide por el nuevo exponente. Suma +C.',
    integralSub: 'Sea u el interior. Divide por la derivada de ese interior y suma +C.',
    integralParts: 'Elige como u el factor que se simplifica al derivar. Suma +C.',
    limitDirect: 'La función es continua en el punto, así que sustituye ese valor.',
    limitAlgebra: 'La sustitución da 0/0. Cancela el factor común y luego sustituye.',
    limitStandard: 'sin(x)/x tiende a 1. Una constante dentro del seno escala la respuesta.',
  },
  pt: {
    power: 'Desça o expoente para a frente e subtraia 1.',
    product: 'Derive cada fator uma vez e some os dois termos.',
    quotient: 'O numerador é (de baixo·derivada de cima − de cima·derivada de baixo), sobre o quadrado do denominador.',
    chain: 'Derive a função de fora e multiplique pela derivada de dentro.',
    trig: 'Use a derivada padrão. Uma cofunção (cos, cot, csc) carrega sinal de menos.',
    exp: 'e^x é a própria derivada. Outra base contribui com ln dessa base.',
    log: 'A derivada de ln(x) é 1/x. Uma constante dentro do logaritmo muitas vezes se cancela.',
    integralPower: 'Aumente o expoente em 1 e divida pelo novo expoente. Some +C.',
    integralSub: 'Seja u o interior. Divida pela derivada desse interior e some +C.',
    integralParts: 'Escolha como u o fator que fica mais simples ao derivar. Some +C.',
    limitDirect: 'A função é contínua no ponto, então substitua esse valor.',
    limitAlgebra: 'A substituição dá 0/0. Cancele o fator comum e depois substitua.',
    limitStandard: 'sin(x)/x tende a 1. Uma constante dentro do seno escala a resposta.',
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

  const topicParam = url.searchParams.get('topic') || 'derivative';
  const topic = topicParam === 'integral' || topicParam === 'limit' ? topicParam : 'derivative';
  const rule = url.searchParams.get('rule') || (topic === 'limit' ? 'direct' : 'power');
  const difficulty = url.searchParams.get('difficulty') || 'beginner';
  const locale = url.searchParams.get('locale') === 'es' || url.searchParams.get('locale') === 'pt'
    ? url.searchParams.get('locale')!
    : 'en';
  if (!isPracticeDifficulty(difficulty)) {
    return NextResponse.json({ error: 'Unknown rule or difficulty.' }, { status: 400, headers: PRIVATE });
  }
  if (topic === 'derivative' && !isPracticeRule(rule)) {
    return NextResponse.json({ error: 'Unknown rule or difficulty.' }, { status: 400, headers: PRIVATE });
  }
  if (topic === 'integral' && !isIntegralRule(rule)) {
    return NextResponse.json({ error: 'Unknown rule or difficulty.' }, { status: 400, headers: PRIVATE });
  }
  if (topic === 'limit' && !isLimitRule(rule)) {
    return NextResponse.json({ error: 'Unknown rule or difficulty.' }, { status: 400, headers: PRIVATE });
  }
  const seedParam = url.searchParams.get('seed');
  const seed = seedParam ? Number(seedParam) : Math.floor(Math.random() * 100000);
  if (!Number.isFinite(seed)) {
    return NextResponse.json({ error: 'Seed must be a number.' }, { status: 400, headers: PRIVATE });
  }

  const problem = topic === 'integral'
    ? generateIntegralProblem(rule as 'power', difficulty, seed)
    : topic === 'limit'
      ? generateLimitProblem(rule as 'direct', difficulty, seed)
      : generatePracticeProblem(rule as 'power', difficulty, seed);
  const hintKey = topic === 'integral'
    ? (rule === 'substitution' ? 'integralSub' : rule === 'parts' ? 'integralParts' : 'integralPower')
    : topic === 'limit'
      ? (rule === 'direct' ? 'limitDirect' : rule === 'standard' ? 'limitStandard' : 'limitAlgebra')
      : problem.hintKey;
  const hint = HINTS[locale][hintKey] || HINTS.en[hintKey] || HINTS.en[problem.hintKey];
  return NextResponse.json(
    {
      expression: problem.expression,
      rule: topic === 'derivative' ? problem.rule : rule,
      difficulty: problem.difficulty,
      seed: problem.seed,
      hint,
      topic,
      limitTo: problem.limitTo || '',
    },
    { headers: PRIVATE }
  );
}
