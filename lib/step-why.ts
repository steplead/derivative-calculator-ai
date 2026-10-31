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
};

export function explainStepDeterministic(equation: string, step: string, rule: string): string {
  const expr = normalizeExpression(equation || '').replace(/\s+/g, ' ').trim().slice(0, 180);
  const stepText = (step || '').replace(/\s+/g, ' ').trim().slice(0, 400);
  const why = RULE_WHY[rule] || RULE_WHY['Power Rule'];
  const shown = expr || 'this function';
  if (!stepText) {
    return `For ${shown}, the ${rule} applies. ${why}`;
  }
  return `This step is about ${shown}, using the ${rule}. ${why} In this problem the step says: ${stepText}`;
}
