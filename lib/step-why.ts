/**
 * Deterministic "why this step" explanations.
 * Used when no AI key is configured and as the fallback when a model call fails.
 * The equation and the step text are quoted so two problems do not share a blurb.
 */

import { normalizeExpression } from '@/lib/math/math-core';

const RULE_WHY: Record<string, string> = {
  'Power Rule': 'The exponent counts the factors of the base. Differentiating removes one factor and multiplies by how many there were, which is why the exponent decreases by 1 and moves to the front.',
  'Constant Rule': 'A constant does not change when x changes. Its rate of change is zero even when the constant is written as a letter, such as pi.',
  'Constant Multiple Rule': 'A constant stretch scales every slope by the same amount, so it factors out of the derivative and is not itself differentiated.',
  'Sum Rule': 'Differentiation is linear. Each term contributes its own slope, and a constant term contributes none, so it disappears.',
  'Product Rule': 'Both factors depend on x, so each one has to be differentiated while the other is left alone. Adding those two contributions is the product rule; differentiating only one factor drops a term.',
  'Quotient Rule': 'A quotient is a product with a reciprocal. The minus sign is the derivative of the denominator; reversing it is the error that produces the wrong numerator.',
  'Chain Rule': 'The outer function sees the inner function, not x itself. When the inside changes faster or slower than x, that rate multiplies the outer derivative. Leaving the factor off is the usual wrong answer.',
  'Trigonometric Rule': 'Sine, cosine, and the other four have fixed derivatives on the unit circle. Cosine, cotangent, and cosecant pick up a minus sign because those graphs are decreasing at the origin.',
  'Inverse Trigonometric Rule': 'An inverse trig function returns an angle. Differentiating the relation sin(y) = x (or the cosine or tangent version) and solving for y\' produces a rational or radical function of x, not another inverse.',
  'Hyperbolic Rule': 'Hyperbolic sine and cosine are combinations of e^x and e^(−x). Differentiating swaps them and the minus signs cancel, so there is no extra negative the way there is for cosine.',
  'Logarithmic Rule': 'The natural log is the inverse of e^x. Because the exponential is its own derivative, the inverse function\'s derivative is the reciprocal 1/x. A different base divides by ln of that base.',
  'Exponential Rule': 'e^x is its own derivative because its slope equals its height. Any other base is e raised to x·ln(base), so the chain rule contributes ln(base).',
  'Absolute Value Rule': 'Absolute value is x on the right of the origin and −x on the left, so the slope is the sign of x. At zero the left and right slopes disagree and the derivative does not exist.',
  'Partial Derivative': 'Every variable you are not differentiating is a constant for that one derivative. It stays as a coefficient if it multiplies the active variable, and the whole term vanishes if the active variable is absent.',
  'Implicit Differentiation': 'y depends on x even though it is written as its own letter. Differentiating both sides with respect to x produces a factor dy/dx on every term that contains y, and you then solve for that factor.',
  'Power Rule for Integrals': 'Differentiating x^(n+1)/(n+1) brings the exponent down and cancels the denominator, so the antiderivative raises the power by 1 and divides by the new exponent. +C covers every constant, all of which differentiate to zero.',
  'Constant Multiple Rule for Integrals': 'A constant stretch scales the area evenly, so it factors out of the integral and is not itself integrated.',
  Substitution: 'The outer function sees the inside, not x. Setting u to the inside and dividing by du/dx is the chain rule run backwards.',
  'Integration by Parts': 'Two factors both depend on x, so integrating one and differentiating the other is the product rule rearranged: ∫ u dv = uv − ∫ v du.',
  'Standard Integral': 'This is a memorized antiderivative. Differentiating it has to give the integrand back.',
  'Logarithmic Integral': 'The derivative of ln|x| is 1/x, so the antiderivative of 1/x is the logarithm. A constant factor inside the log cancels when you differentiate.',
  'Exponential Integral': 'e^x is its own derivative, so it is its own antiderivative. Another base contributes a factor of ln(base), and dividing by that factor undoes it.',
  'Direct Substitution': 'The pieces are continuous at the target, so the limit is the function value. Continuity is what makes substitution valid.',
  'Algebraic Simplification': 'Plugging in the target is indeterminate, often 0/0. A factor that is zero only at that point can be canceled without changing the limit, and the simpler function can then be evaluated.',
  'Standard Limit': 'In radians, sin of a small angle is almost the angle, so sin(x)/x approaches 1. The squeeze theorem is the proof. A constant inside the sine scales the limit.',
};

const RULE_WHY_ES: Record<string, string> = {
  'Chain Rule': 'La función exterior ve el interior, no x. Si el interior cambia más rápido o más lento que x, esa tasa multiplica la derivada exterior.',
  'Power Rule': 'El exponente cuenta los factores de la base. Al derivar se pierde un factor y el exponente baja 1 y pasa al frente.',
  'Power Rule for Integrals': 'Derivar x^(n+1)/(n+1) baja el exponente y cancela el denominador. Por eso la antiderivada sube la potencia en 1 y divide por el nuevo exponente. +C cubre las constantes, que derivan a cero.',
  Substitution: 'La función exterior ve el interior, no x. Tomar u como ese interior y dividir por du/dx es la regla de la cadena al revés.',
  'Integration by Parts': 'Los dos factores dependen de x. Integrar uno y derivar el otro es la regla del producto reordenada: ∫ u dv = uv − ∫ v du.',
  'Standard Integral': 'Es una antiderivada conocida. Al derivarla debe reaparecer el integrando.',
  'Logarithmic Integral': 'La derivada de ln|x| es 1/x, así que la antiderivada de 1/x es el logaritmo.',
  'Exponential Integral': 'e^x es su propia derivada, así que es su propia antiderivada. Otra base aporta ln de esa base.',
  'Direct Substitution': 'Las partes son continuas en el punto, así que el límite es el valor de la función. La continuidad justifica la sustitución.',
  'Algebraic Simplification': 'Sustituir el punto da una forma indeterminada, a menudo 0/0. Un factor que solo se anula ahí se cancela sin cambiar el límite.',
  'Standard Limit': 'En radianes, el seno de un ángulo pequeño es casi el ángulo, así que sin(x)/x tiende a 1. El teorema del emparedado lo prueba.',
};

const RULE_WHY_PT: Record<string, string> = {
  'Chain Rule': 'A função de fora vê o interior, não x. Se o interior muda mais rápido ou mais devagar que x, essa taxa multiplica a derivada de fora.',
  'Power Rule': 'O expoente conta os fatores da base. Ao derivar, perde-se um fator, o expoente diminui 1 e vai para a frente.',
  'Power Rule for Integrals': 'Derivar x^(n+1)/(n+1) desce o expoente e cancela o denominador. Por isso a antiderivada sobe a potência em 1 e divide pelo novo expoente. +C cobre as constantes, que derivam a zero.',
  Substitution: 'A função de fora vê o interior, não x. Tomar u como esse interior e dividir por du/dx é a regra da cadeia ao contrário.',
  'Integration by Parts': 'Os dois fatores dependem de x. Integrar um e derivar o outro é a regra do produto reorganizada: ∫ u dv = uv − ∫ v du.',
  'Standard Integral': 'É uma antiderivada conhecida. Derivá-la tem de devolver o integrando.',
  'Logarithmic Integral': 'A derivada de ln|x| é 1/x, então a antiderivada de 1/x é o logaritmo.',
  'Exponential Integral': 'e^x é a própria derivada, então é a própria antiderivada. Outra base contribui com ln dessa base.',
  'Direct Substitution': 'As partes são contínuas no ponto, então o limite é o valor da função. A continuidade justifica a substituição.',
  'Algebraic Simplification': 'Substituir o ponto dá uma forma indeterminada, muitas vezes 0/0. Um fator que só se anula ali cancela-se sem mudar o limite.',
  'Standard Limit': 'Em radianos, o seno de um ângulo pequeno é quase o ângulo, então sin(x)/x tende a 1. O teorema do confronto prova isso.',
};

export function explainStepDeterministic(equation: string, step: string, rule: string, locale?: string): string {
  const expr = normalizeExpression(equation || '').replace(/\s+/g, ' ').trim().slice(0, 180);
  const stepText = (step || '').replace(/\s+/g, ' ').trim().slice(0, 400);
  const shown = expr || 'this function';
  const loc = locale === 'es' || locale === 'pt' ? locale : 'en';
  const localized = loc === 'es' ? RULE_WHY_ES[rule] : loc === 'pt' ? RULE_WHY_PT[rule] : undefined;
  const why = localized || RULE_WHY[rule] || RULE_WHY['Power Rule'];
  if (loc === 'es') {
    const base = `Este paso trata de ${shown} y usa ${rule}. ${why}`;
    return stepText ? `${base} El paso dice: ${stepText}` : base;
  }
  if (loc === 'pt') {
    const base = `Este passo trata de ${shown} e usa ${rule}. ${why}`;
    return stepText ? `${base} O passo diz: ${stepText}` : base;
  }
  if (!stepText) {
    return `For ${shown}, the ${rule} applies. ${why}`;
  }
  return `This step is about ${shown}, using the ${rule}. ${why} In this problem the step says: ${stepText}`;
}
