/**
 * math-core.ts — Shared deterministic math engine (server-safe)
 *
 * CONTRACT (math semantics):
 *   ln(x)   = natural logarithm  → normalized to nerdamer `log(x)`
 *   log(x)  = natural logarithm  → nerdamer `log(x)` (nerdamer treats log as ln)
 *   log10(x)= base-10 logarithm  → nerdamer `log10(x)`
 *
 * This module is the SINGLE source of truth for:
 *   - expression normalization (display vs engine)
 *   - derivative calculation (deterministic, no AI)
 *   - differentiation rule identification
 *   - deterministic step generation
 *   - result validation
 *
 * It is used by BOTH the API route and the SSR [slug] page so that
 * server-rendered HTML and client API responses never diverge.
 */

// Lazy-import nerdamer so SSR pages that only need the type can tree-shake.
// (nerdamer is CJS; the calculus plugin must be registered once.)
// @ts-ignore - nerdamer has no bundled types
import nerdamer from 'nerdamer';
// @ts-ignore
import 'nerdamer/Calculus';

export interface DerivativeSolution {
  /** Display-friendly original expression (after normalization, e.g. ln→log for engine only) */
  original: string;
  /** Engine-ready expression actually differentiated */
  engineExpression: string;
  /** nerdamer raw string result (e.g. "2*x") */
  solutionRaw: string;
  /** LaTeX result (e.g. "2 \cdot x") */
  solutionLatex: string;
  /** Identified rule name, e.g. "Power Rule" */
  rule: string;
  /** Deterministic step-by-step explanation (each step a string) */
  steps: string[];
  /** true if the result passed validation */
  isValid: boolean;
}

/**
 * Normalize a user-visible math expression into nerdamer-safe syntax.
 * ONLY rewrites known function tokens; never touches variable names.
 *
 * Current normalization:
 *   ln(  → log(      (natural log — nerdamer has no ln; its log IS natural log)
 *   log( → log(      (kept; nerdamer's log is natural log, contract matches)
 *   log10( → log10(  (kept; nerdamer supports log10 natively)
 *   Abs( → abs(      (nerdamer only knows lowercase `abs`; `Abs(` is parsed as
 *                     the unknown symbol `Abs` times x, and diff() then returns
 *                     the bare word "Abs" — a wrong answer on a live page)
 */
export function normalizeExpression(expr: string): string {
  if (!expr) return '';
  let s = expr.trim();
  // Rewrite the natural-base exponential `e^(…)` → `exp(…)`. In some nerdamer
  // builds the bare symbol `e` is treated as a numeric constant and d/dx e^x is
  // emitted as a rational approximation (e.g. (325368125/119696244)^x instead of
  // e^x). Routing through the symbolic `exp` function keeps the result exact.
  // The display form e^(…) is restored by prettifyRaw()/displayExpression() after differentiation.
  s = s.replace(/e\^\(/gi, 'exp(').replace(/E\^\(/g, 'exp(');
  s = s.replace(/e\^([^()]*)/gi, 'exp($1)').replace(/E\^([^()]*)/g, 'exp($1)');
  // Rewrite `ln(` → `log(` (function token only; lookahead for `(` avoids
  // corrupting identifiers like "lnx" if ever present).
  s = s.replace(/ln(?=\s*\()/g, 'log');
  // Rewrite `Abs(` → `abs(` (case-insensitive function token only).
  s = s.replace(/\babs(?=\s*\()/gi, 'abs');
  return s;
}

/**
 * Back-substitute irrational constants that some nerdamer builds emit as
 * rationals. A production nerdamer build numericizes ln2 / ln10 / e / pi / √2
 * into ratios of 6+ digit integers (e.g. d/dx 2^x → (49180508/70952475)*2^x,
 * where 49180508/70952475 ≈ ln2). We restore the exact constant symbolically so
 * the displayed answer is exact, not a decimal-fraction approximation.
 *
 * Version-independent: symbolic builds already emit `2^x*log(2)` and are left
 * untouched by the ratio detector, so BOTH builds converge on `2^x*ln(2)`.
 */
const BACKSUB_CONSTANTS: { value: number; display: string; latex: string }[] = [
  { value: Math.E,       display: 'e',       latex: 'e' },
  { value: Math.log(2),  display: 'ln(2)',   latex: '\\ln\\left(2\\right)' },
  { value: Math.log(10), display: 'ln(10)',  latex: '\\ln\\left(10\\right)' },
  { value: Math.PI,      display: 'pi',      latex: '\\pi' },
  { value: Math.SQRT2,   display: 'sqrt(2)', latex: '\\sqrt{2}' },
];

function matchBackSubConstant(v: number): { display: string; latex: string } | null {
  if (!isFinite(v) || v === 0) return null;
  for (const c of BACKSUB_CONSTANTS) {
    if (Math.abs(v - c.value) / Math.abs(c.value) < 1e-4) return c;
  }
  return null;
}

/** Replace 6+ digit integer ratios (parenthesized or bare) equal to a constant. */
function backSubstituteRaw(s: string): string {
  let out = s.replace(/\((-?\d{6,})\s*\/\s*(\d{6,})\)/g, (m, a, b) => {
    const den = Number(b);
    if (!den) return m;
    const c = matchBackSubConstant(Number(a) / den);
    return c ? c.display : m;
  });
  out = out.replace(/(?<![\d/])(-?\d{6,})\s*\/\s*(\d{6,})(?![\d/])/g, (m, a, b) => {
    const den = Number(b);
    if (!den) return m;
    const c = matchBackSubConstant(Number(a) / den);
    return c ? c.display : m;
  });
  return out;
}

/** Replace LaTeX \frac{6+digits}{6+digits} (optionally wrapped) equal to a constant. */
function backSubstituteLatex(s: string): string {
  return s.replace(
    /\\left\(\s*\\frac\{(-?\d{6,})\}\{(-?\d{6,})\}\s*\\right\)|\\frac\{(-?\d{6,})\}\{(-?\d{6,})\}/g,
    (m, a1, b1, a2, b2) => {
      const a = a1 ?? a2;
      const b = b1 ?? b2;
      const den = Number(b);
      if (!den) return m;
      const c = matchBackSubConstant(Number(a) / den);
      return c ? c.latex : m;
    },
  );
}

/** Move a leading constant factor after the term: ln(2)*2^x → 2^x*ln(2). */
function reorderLeadingConstant(s: string): string {
  const m = s.match(/^ln\((\d+|10)\)\*\s*([\s\S]+)$/);
  if (m) return `${m[2]}*ln(${m[1]})`;
  return s;
}

/** Restore exp(…) → e^(…) only (no constant/log rewriting). Used for step prose. */
function restoreExp(s: string): string {
  return s.replace(/exp\(/g, 'e^(').replace(/e\^\(x\)/g, 'e^x');
}

/** Post-process nerdamer RAW output into clean display form. */
export function prettifyRaw(s: string): string {
  let out = restoreExp(s);
  out = backSubstituteRaw(out);
  // nerdamer prints its natural log as `log` → display as `ln`. `log10(` is
  // base-10 and has no `(` directly after `log`, so this pattern skips it.
  out = out.replace(/log\(/g, 'ln(');
  out = reorderLeadingConstant(out);
  return out;
}

/** Post-process nerdamer LaTeX output (mirrors prettifyRaw). */
function prettifyLatex(s: string): string {
  let out = restoreExp(s);
  out = backSubstituteLatex(out);
  out = out.replace(/\\mathrm\{log\}/g, '\\ln').replace(/\\blog(?![_{])/g, '\\ln');
  return out;
}

/**
 * Convert an ENGINE formula (e.g. exp(2*x)) into its HUMAN display form
 * (e.g. e^(2x)). For display strings ONLY (titles, H1, subtitles, code chips) —
 * never for the Calculator's initialEquation, which must stay engine-ready.
 */
export function displayExpression(s: string): string {
  if (!s) return '';
  let out = restoreExp(s);
  // Tidy exponent display: 2*x → 2x inside e^(2*x) → e^(2x).
  out = out.replace(/\b(\d)\*x\b/g, '$1x');
  out = out.replace(/log\(/g, 'ln(');
  return out;
}

const WHOLE_FUNCTION = /^(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|asin|acos|atan|sinh|cosh|tanh|log10|log|ln|exp|sqrt|abs)\((.*)\)$/i;

function hasVariableX(expr: string): boolean {
  return /(^|[^a-z])x([^a-z]|$)/i.test(expr);
}

function isConstantFactor(expr: string): boolean {
  return /^(?:\d+(?:\.\d+)?|pi|e)$/i.test(expr);
}

/** First top-level operator, ignoring signs that belong to a unary minus or exponent. */
function splitTopLevel(expr: string, operators: string[]): { op: string; left: string; right: string } | null {
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0 && operators.includes(c)) {
      if ((c === '+' || c === '-') && (i === 0 || '([+-*/^,'.includes(expr[i - 1]))) continue;
      const left = expr.slice(0, i);
      const right = expr.slice(i + 1);
      if (!left || !right) continue;
      return { op: c, left, right };
    }
  }
  return null;
}

/**
 * Identify the differentiation rule used for an expression.
 * Deterministic, based on structure. Operators inside parentheses do not
 * decide the outer rule: sin(2*x) is the chain rule, not the product rule,
 * and x^(1/3) is the power rule, not the quotient rule.
 */
export function identifyRule(expr: string): string {
  const e = expr.replace(/\s+/g, '');
  if (!e) return 'Constant Rule';
  const lower = e.toLowerCase();

  if (!hasVariableX(lower)) return 'Constant Rule';

  const absCall = lower.match(/^abs\((.*)\)$/);
  if (absCall && !hasVariableX(absCall[1].replace(/x/g, ''))) {
    // abs(x) or abs of a constant multiple is the absolute-value rule.
    // Nested functions fall through to the chain rule below.
    if (!/[a-z]{2,}/.test(absCall[1])) return 'Absolute Value Rule';
  }

  if (splitTopLevel(lower, ['+', '-'])) return 'Sum Rule';
  if (splitTopLevel(lower, ['/'])) return 'Quotient Rule';

  const product = splitTopLevel(lower, ['*']);
  if (product) {
    if (isConstantFactor(product.left) || isConstantFactor(product.right)) return 'Constant Multiple Rule';
    return 'Product Rule';
  }

  const call = lower.match(WHOLE_FUNCTION);
  if (call) {
    const name = call[1];
    const inner = call[2];
    const simpleInner = inner === 'x' || isConstantFactor(inner);
    if (!simpleInner && hasVariableX(inner)) return 'Chain Rule';
    if (/^(sin|cos|tan|sec|csc|cot)$/.test(name)) return 'Trigonometric Rule';
    if (/^(sinh|cosh|tanh)$/.test(name)) return 'Hyperbolic Rule';
    if (/^(asin|acos|atan|arcsin|arccos|arctan)$/.test(name)) return 'Inverse Trigonometric Rule';
    if (name === 'log' || name === 'ln' || name === 'log10') return 'Logarithmic Rule';
    if (name === 'exp') return 'Exponential Rule';
    if (name === 'sqrt') return 'Power Rule';
    if (name === 'abs') return 'Absolute Value Rule';
  }

  const power = splitTopLevel(lower, ['^']);
  if (power) {
    const baseHasX = hasVariableX(power.left);
    const expHasX = hasVariableX(power.right);
    if (!baseHasX && expHasX) return 'Exponential Rule';
    if (baseHasX && power.left !== 'x') return 'Chain Rule';
    return 'Power Rule';
  }

  if (/^-?(?:\d+(?:\.\d+)?)?x$/.test(lower)) return 'Constant Multiple Rule';
  return 'Power Rule';
}

/**
 * Generate deterministic steps for a derivative.
 * Steps are derived from the engine result and the identified rule —
 * never fabricated. For rules where we cannot reliably produce the full
 * derivation, we still emit the answer + rule identification (safe subset).
 */
export function generateSteps(expr: string, solutionRaw: string, rule: string): string[] {
  const e = expr.replace(/\s+/g, '');
  const sol = solutionRaw;
  const steps: string[] = [];

  switch (rule) {
    case 'Power Rule': {
      // x^n → n·x^(n-1). The phrase "power rule" is load-bearing for SSR tests.
      const m = e.match(/^([a-z])\^(\d+)$/);
      if (m) {
        const n = parseInt(m[2], 10);
        steps.push(`Apply the power rule: d/dx(${m[1]}^${m[2]}) = ${n}·${m[1]}^(${m[2]}−1). The exponent counts how many factors of ${m[1]} are multiplied, so one factor is lost and the count moves in front.`);
        steps.push(`Simplify the exponent: ${n}·${m[1]}^${n - 1}`);
        steps.push(`Final answer: ${sol}`);
      } else if (/^sqrt\((.*)\)$/.test(e)) {
        steps.push(`Rewrite sqrt as a power: sqrt(u) = u^(1/2), then apply the power rule. The new exponent is 1/2 − 1 = −1/2, and the 1/2 stays in front.`);
        steps.push(`Final answer: ${sol}`);
      } else {
        steps.push(`Identify the expression as a power function and apply the power rule. A rational exponent is allowed: d/dx x^(p/q) = (p/q)·x^(p/q − 1).`);
        steps.push(`Final answer: ${sol}`);
      }
      break;
    }
    case 'Constant Rule': {
      steps.push(`${e} does not depend on x. The slope of a horizontal line is zero, so the constant rule gives 0. A symbol such as pi is still a constant.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Constant Multiple Rule': {
      steps.push(`${e} is a constant times a function of x. The constant is a fixed stretch of the slope, so it factors out and the remaining function is differentiated.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Trigonometric Rule': {
      const fn = e.match(/^(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan)\(/);
      const name = fn ? fn[1] : 'trigonometric';
      steps.push(`Recognize the trigonometric function ${name}(x). These six derivatives are standard; a cofunction (cos, cot, csc) picks up a minus sign.`);
      steps.push(`Apply the standard derivative: d/dx ${name}(x) = ${sol}.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Inverse Trigonometric Rule': {
      steps.push(`Recognize an inverse trigonometric function. It is not the reciprocal of the trig function: asin(x) means arcsin(x), the angle whose sine is x.`);
      steps.push(`The derivative comes from implicit differentiation of the inverse relation, then a Pythagorean identity that removes the angle.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Hyperbolic Rule': {
      steps.push(`Recognize a hyperbolic function. sinh and cosh swap under differentiation, with no minus sign, because both are built from e^x and e^(−x) with the same sign pattern.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Logarithmic Rule': {
      if (e.includes('log10(')) {
        steps.push(`Recognize the base-10 logarithm log10(x).`);
        steps.push(`Apply the rule: d/dx log10(x) = 1/(x·ln(10)). The extra ln(10) is the change-of-base factor that natural log does not need.`);
        steps.push(`Final answer: ${sol}`);
      } else {
        steps.push(`Recognize the natural logarithm log(x), written ln(x) on this site. Its derivative is the reciprocal because ln is the inverse of e^x and the derivative of e^x is itself.`);
        steps.push(`Apply the rule: d/dx log(x) = 1/x.`);
        steps.push(`Final answer: ${sol}`);
      }
      break;
    }
    case 'Absolute Value Rule': {
      steps.push(`Recognize the absolute value function |u| = abs(u).`);
      steps.push(`Apply the rule: d/dx |u| = u' · u/|u|  (equivalently u'·sign(u) for u ≠ 0). The derivative does not exist where u = 0, because the graph has a corner.`);
      steps.push(`Here u = ${e.replace(/abs\(|\)/g, '')}, so the derivative is shown below.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Exponential Rule': {
      steps.push(`Recognize the exponential ${e}. For e^x the derivative equals the original function. For a^x the factor ln(a) appears, because a^x = e^(x·ln(a)).`);
      steps.push(`Apply the rule and keep that constant factor.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Product Rule': {
      steps.push(`Identify a product of two functions of x in ${e}: use the product rule (uv)' = u'v + uv'. Each factor is differentiated once while the other is held as-is, then the two terms are added.`);
      steps.push(`Differentiate each factor and combine.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Quotient Rule': {
      steps.push(`Identify a quotient in ${e}: use the quotient rule (u/v)' = (u'v − uv')/v². The minus sign belongs to the derivative of the denominator; swapping it is the usual error.`);
      steps.push(`Differentiate numerator and denominator, then combine.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Chain Rule': {
      steps.push(`Identify a composite function in ${e}: use the chain rule d/dx f(g(x)) = f'(g(x))·g'(x). The inner derivative is required because a stretch or shift of the input changes how fast the output moves.`);
      steps.push(`Differentiate the outer function, then multiply by the inner derivative.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Sum Rule': {
      steps.push(`Differentiate ${e} term by term. The sum rule says the derivative of a sum is the sum of the derivatives, and the derivative of a constant term is 0, so that term disappears.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    default: {
      steps.push(`Apply the standard differentiation rule for ${e}.`);
      steps.push(`Final answer: ${sol}`);
    }
  }

  return steps;
}

/**
 * Calculate the derivative deterministically.
 * Returns a fully-populated DerivativeSolution, or throws on engine failure.
 */
export function calculateDerivative(expr: string): DerivativeSolution {
  const original = (expr || '').trim();
  if (!original) throw new Error('Empty expression');
  const engineExpression = normalizeExpression(original);
  if (!engineExpression) throw new Error('Invalid expression');

  let raw = '';
  let latex = '';
  let d: any;
  try {
    // P1-a: differentiate ONCE and reuse the same nerdamer object for both the
    // raw string and the LaTeX form. This removes a redundant second
    // parse + differentiation pass on every request (the same `diff(...)` call
    // was previously executed twice). No memoization is introduced — `d` is a
    // per-invocation local, so there is no cross-request state or memory growth.
    d = nerdamer(`diff(${engineExpression}, x)`);
    raw = d.toString();
    raw = prettifyRaw(raw);
  } catch (e: any) {
    throw new Error(`Nerdamer calculation failed: ${e?.message || String(e)}`);
  }
  if (!raw || raw === '0' && engineExpression.includes('x')) {
    // A zero derivative of something containing x is a red flag — validate later.
  }

  try {
    latex = d.toTeX();
    latex = prettifyLatex(latex);
  } catch {
    latex = raw;
  }

  const rule = identifyRule(engineExpression);
  const steps = generateSteps(engineExpression, raw, rule).map(restoreExp);

  // Validation: reject obvious ln-bug outputs (result containing bare `ln` symbol).
  const isValid = validateDerivativeResult(engineExpression, raw);

  return {
    original,
    engineExpression,
    solutionRaw: raw,
    solutionLatex: latex,
    rule,
    steps,
    isValid,
  };
}

/**
 * Validate a derivative result.
 * - Rejects results that contain a bare `ln` (nerdamer ln bug output).
 * - Accepts "0" when the expression is a constant (d/dx 5 = 0 is correct).
 * - Flags expressions that are NOT single-variable functions of x
 *   (e.g. implicit equations like x^2+y^2=25) as invalid for this engine.
 */
export function validateDerivativeResult(engineExpression: string, rawResult: string): boolean {
  if (!rawResult) return false;
  const res = rawResult.trim();

  // (1) nerdamer could not differentiate at all and echoed the call back, e.g.
  //       diff(floor(x), x)      →  "diff(floor(x),x)"
  //     or the tuple form          "(floor(x), x, diff)"
  //     Publishing that as an "answer" would be plainly wrong.
  if (/diff\s*\(/.test(res) || /,\s*x\s*,\s*diff\s*\)?$/.test(res)) return false;

  // (2) A bare multi-letter word is a mis-parsed function symbol, not a result.
  //     Known signatures: diff(ln(x),x)  → "ln",  diff(Abs(x),x) → "Abs".
  //     Legitimate single-symbol results (`e`, `pi`, `x`, `1`) must still pass.
  if (/^[A-Za-z]{2,}$/.test(res) && !/^(pi|inf)$/i.test(res)) return false;

  // (3) Implicit equation with '=' cannot be differentiated as a plain function.
  if (engineExpression.includes('=')) return false;

  // (4) Result must contain at least one variable/function artifact or be a constant zero
  if (!/[a-z0-9]/.test(res)) return false;
  return true;
}
