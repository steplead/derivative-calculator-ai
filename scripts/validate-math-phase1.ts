/**
 * Phase 1 — RC-4 math validation, STAGE 1 (engine output only).
 *
 * Runs every derivative page through the shared engine (lib/math/math-core)
 * and dumps the result to JSON. STAGE 2 (scripts/validate_math_oracle.py)
 * re-verifies each result with sympy — an independent symbolic engine — so the
 * check is not circular.
 *
 * Why not finite differences: for fast-oscillating expressions such as
 * sin(x^10) the central-difference truncation error (h^2/6 * f''') reaches
 * ~3.0 at x = 2.41 (f''' ~ 2e13), i.e. ~1.3e-4 relative — larger than any sane
 * tolerance. That produced false FAILs on two perfectly correct pages.
 * sympy gives an exact, engine-independent answer instead.
 *
 * Run:  npx tsx scripts/validate-math-phase1.ts
 * Out:  audit-output/derivative-seo-v2-phase1-fix/math-validation-engine-output.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { calculateDerivative } from '../lib/math/math-core';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'audit-output/derivative-seo-v2-phase1-fix');
const OUT_JSON = path.join(OUT_DIR, 'math-validation-engine-output.json');

const problems: any[] = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'public/problems.json'), 'utf8')
);

// Same definition used in the Phase 0 audit: explicit type OR slug prefix.
const derivativePages = problems.filter(
    (p: any) => p?.slug && (p.type === 'derivative' || String(p.slug).startsWith('derivative'))
);

function classify(formula: string): string {
    const f = formula.toLowerCase();
    if (f.includes('ln(')) return 'ln';
    if (f.includes('log10')) return 'log10';
    if (f.includes('log(')) return 'log';
    if (/asin|acos|atan|arc/.test(f)) return 'inverse-trig';
    if (/sin|cos|tan|sec|csc|cot/.test(f)) return 'trig';
    if (/e\^|\^x|exp/.test(f)) return 'exponential';
    if (f.includes('/')) return 'quotient';
    if (/\*/.test(f)) return 'product';
    if (/\^\s*[\d(]/.test(f)) return 'power';
    return 'other';
}

const out: any[] = [];
let engineErrors = 0;

for (const p of derivativePages) {
    const slug = String(p.slug);
    const formula = String(p.formula || '');
    const rec: any = {
        slug,
        formula,
        category: classify(formula),
        engine_expression: '',
        solution_raw: '',
        solution_latex: '',
        rule: '',
        steps: [],
        steps_count: 0,
        is_valid: false,
        engine_error: '',
    };

    if (!formula) {
        rec.engine_error = 'empty formula';
        out.push(rec);
        continue;
    }

    try {
        const sol = calculateDerivative(formula);
        rec.engine_expression = sol.engineExpression;
        rec.solution_raw = sol.solutionRaw;
        rec.solution_latex = sol.solutionLatex;
        rec.rule = sol.rule || '';
        rec.steps = sol.steps || [];
        rec.steps_count = (sol.steps || []).length;
        rec.is_valid = !!sol.isValid;
    } catch (e: any) {
        rec.engine_error = e?.message || String(e);
        engineErrors++;
    }

    out.push(rec);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), 'utf8');

console.log(`Derivative pages         : ${out.length}`);
console.log(`Engine errors            : ${engineErrors}`);
console.log(`Flagged invalid by engine: ${out.filter((r) => !r.is_valid).length}`);
console.log(`\nJSON -> ${OUT_JSON}`);
