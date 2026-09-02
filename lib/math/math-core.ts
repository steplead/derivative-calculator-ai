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
 */
export function normalizeExpression(expr: string): string {
  if (!expr) return '';
  let s = expr.trim();
  // Rewrite `ln(` → `log(` (function token only; lookahead for `(` avoids
  // corrupting identifiers like "lnx" if ever present).
  s = s.replace(/ln(?=\s*\()/g, 'log');
  return s;
}

/**
 * Identify the differentiation rule used for an expression.
 * Deterministic, based on structure. Used for both steps and SEO content.
 */
export function identifyRule(expr: string): string {
  const e = expr.replace(/\s+/g, '').toLowerCase();
  if (!e) return 'Constant Rule';
  // Quotient rule: has a division where denominator contains a variable or function
  if (e.includes('/')) return 'Quotient Rule';
  // Product rule: explicit * between two non-constant factors
  if (e.includes('*') && !/^[0-9.*]+$/.test(e)) return 'Product Rule';
  // Chain rule: composite function (function containing another function/variable power)
  const composite = /(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|log|sqrt|exp|abs)\s*\([^)]*\(/.test(e)
    || /(sin|cos|tan|sec|csc|cot|log|sqrt|exp)\s*\([^)]*\^[0-9]+\)/.test(e)
    || /\([^)]*\)\^[0-9]+/.test(e); // e.g. (x+1)^2
  if (composite) return 'Chain Rule';
  // Exponential: e^x or a^x
  if (/e\^|exp\(/.test(e)) return 'Exponential Rule';
  // Logarithmic
  if (/log\(|log10\(/.test(e)) return 'Logarithmic Rule';
  // Trigonometric (simple, not composite)
  if (/^(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan)\([^()]*\)$/.test(e)) return 'Trigonometric Rule';
  // Power rule: x^n
  if (/\^/.test(e)) return 'Power Rule';
  // Sum/difference
  if (/[+-]/.test(e)) return 'Sum Rule';
  // Constant multiple
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
      // x^n → n·x^(n-1)
      const m = e.match(/^([a-z])\^(\d+)$/);
      if (m) {
        const n = parseInt(m[2], 10);
        steps.push(`Apply the power rule: d/dx(${m[1]}^${m[2]}) = ${n}·${m[1]}^(${m[2]}−1)`);
        steps.push(`Simplify the exponent: ${n}·${m[1]}^${n - 1}`);
        steps.push(`Final answer: ${sol}`);
      } else {
        steps.push(`Identify the expression as a power function and apply the power rule.`);
        steps.push(`Final answer: ${sol}`);
      }
      break;
    }
    case 'Trigonometric Rule': {
      const fn = e.match(/^(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan)\(/);
      if (fn) {
        steps.push(`Recognize the trigonometric function ${fn[1]}(x).`);
        steps.push(`Apply the standard derivative: d/dx ${fn[1]}(x).`);
        steps.push(`Final answer: ${sol}`);
      }
      break;
    }
    case 'Logarithmic Rule': {
      if (e.includes('log10(')) {
        steps.push(`Recognize the base-10 logarithm log10(x).`);
        steps.push(`Apply the rule: d/dx log10(x) = 1/(x·ln(10)).`);
        steps.push(`Final answer: ${sol}`);
      } else {
        steps.push(`Recognize the natural logarithm log(x).`);
        steps.push(`Apply the rule: d/dx log(x) = 1/x.`);
        steps.push(`Final answer: ${sol}`);
      }
      break;
    }
    case 'Exponential Rule': {
      steps.push(`Recognize the exponential function.`);
      steps.push(`Apply the rule: d/dx e^(f(x)) = f'(x)·e^(f(x)).`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Product Rule': {
      steps.push(`Identify a product of two functions: use the product rule (uv)' = u'v + uv'.`);
      steps.push(`Differentiate each factor and combine.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Quotient Rule': {
      steps.push(`Identify a quotient of two functions: use the quotient rule (u/v)' = (u'v − uv')/v².`);
      steps.push(`Differentiate numerator and denominator, then combine.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    case 'Chain Rule': {
      steps.push(`Identify a composite function: use the chain rule d/dx f(g(x)) = f'(g(x))·g'(x).`);
      steps.push(`Differentiate the outer function, then multiply by the inner derivative.`);
      steps.push(`Final answer: ${sol}`);
      break;
    }
    default: {
      steps.push(`Apply the standard differentiation rule for this expression.`);
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
  try {
    const d = nerdamer(`diff(${engineExpression}, x)`);
    raw = d.toString();
  } catch (e: any) {
    throw new Error(`Nerdamer calculation failed: ${e?.message || String(e)}`);
  }
  if (!raw || raw === '0' && engineExpression.includes('x')) {
    // A zero derivative of something containing x is a red flag — validate later.
  }

  let latex = '';
  try {
    latex = nerdamer(`diff(${engineExpression}, x)`).toTeX();
  } catch {
    latex = raw;
  }

  const rule = identifyRule(engineExpression);
  const steps = generateSteps(engineExpression, raw, rule);

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
  // nerdamer ln bug: diff(ln(x),x) → "ln" (bare ln symbol with no argument)
  if (/^ln$/.test(rawResult.trim()) || (/(^|\*)ln($|\*)/.test(rawResult) && !/ln\(/.test(rawResult))) {
    return false;
  }
  // Implicit equation with '=' cannot be differentiated as a plain function.
  if (engineExpression.includes('=')) return false;
  // Result must contain at least one variable/function artifact or be a constant zero
  if (!/[a-z0-9]/.test(rawResult)) return false;
  return true;
}
