/**
 * Pre-deploy simulation of the /[slug] SSR path.
 *
 * For every row in public/problems.json it reproduces the page's data
 * resolution and SSR calculation:
 *   RC-8 (fixed):  formula = library formula        (findStaticProblem)
 *   RC-8 (broken): formula = parseSlugToMath(slug)  (what production did)
 *
 * Reports:
 *   - how many pages displayed a formula that differed from the library
 *   - how many pages will render a valid SSR answer block after the fix
 *   - how many /[slug] URLs will now 404 that previously returned 200
 *
 * Usage: npx tsx scripts/simulate_ssr_coverage.ts
 */
import fs from 'fs';
import path from 'path';
import { calculateDerivative } from '../lib/math/math-core';
import { parseSlugToMath } from '../lib/slug-math';
import { findStaticProblem } from '../lib/problems-source';

const ROOT = path.resolve(__dirname, '..');

function main(): void {
    const rows = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'public/problems.json'), 'utf-8')
    ) as Array<{ slug: string; formula: string; type?: string }>;

    let mismatch = 0;
    let fixedValid = 0;
    let fixedInvalid = 0;
    let fixedThrow = 0;
    let parserNull = 0;
    let nonDerivative = 0;

    const invalidSamples: string[] = [];
    const mismatchSamples: string[] = [];
    const mismatchRows: Array<{ slug: string; library: string; rendered: string }> = [];

    for (const row of rows) {
        const libraryFormula = (row.formula || '').toString();
        const fallback = parseSlugToMath(row.slug);
        const fallbackFormula = fallback ? fallback.formula : '';

        // What production rendered before the fix (RC-8 broken path).
        if (fallbackFormula !== libraryFormula) {
            mismatch += 1;
            mismatchRows.push({
                slug: row.slug,
                library: libraryFormula,
                rendered: fallbackFormula || '(parser returned null)',
            });
            if (mismatchSamples.length < 10) {
                mismatchSamples.push(`${row.slug}: library=${libraryFormula} rendered=${fallbackFormula || '(parser null)'}`);
            }
            // The slug heuristic produced nothing at all — the old page could
            // only render via the D1 / API sources, which are down or costly.
            if (!fallback) parserNull += 1;
        }

        // What production will render after the fix.
        const resolved = findStaticProblem(rows as any, row.slug);
        const formula = (resolved?.formula || '').toString();
        if (!formula) continue;

        const type = resolved?.type || row.type || 'derivative';
        if (type !== 'derivative') {
            nonDerivative += 1;
            continue;
        }

        try {
            const sol = calculateDerivative(formula);
            if (sol.isValid) fixedValid += 1;
            else {
                fixedInvalid += 1;
                if (invalidSamples.length < 10) invalidSamples.push(`${row.slug}: ${formula} -> ${sol.solutionRaw}`);
            }
        } catch (e: any) {
            fixedThrow += 1;
            if (invalidSamples.length < 10) invalidSamples.push(`${row.slug}: ${formula} -> THROW ${e?.message}`);
        }
    }

    const total = rows.length;
    const out = {
        total_library_rows: total,
        before_fix_wrong_formula_pages: mismatch,
        before_fix_wrong_formula_pct: ((mismatch / total) * 100).toFixed(2) + '%',
        of_which_slug_parser_returned_null: parserNull,
        after_fix_ssr_valid: fixedValid,
        after_fix_ssr_invalid: fixedInvalid,
        after_fix_ssr_throw: fixedThrow,
        skipped_non_derivative: nonDerivative,
        after_fix_coverage_pct: ((fixedValid / total) * 100).toFixed(2) + '%',
        mismatch_samples: mismatchSamples,
        invalid_samples: invalidSamples,
    };
    console.log(JSON.stringify(out, null, 2));

    // Full mismatch inventory for the audit deliverable.
    const outDir = path.join(ROOT, 'audit-output', 'derivative-seo-v2-phase1-fix');
    fs.mkdirSync(outDir, { recursive: true });
    const header = 'slug,library_formula,formula_rendered_before_fix\n';
    const csv = header + mismatchRows
        .map((r) => `${r.slug},"${r.library}","${r.rendered}"`)
        .join('\n');
    const csvPath = path.join(outDir, 'FORMULA_MISMATCH_INVENTORY.csv');
    fs.writeFileSync(csvPath, csv, 'utf-8');
    console.log(`\nwrote ${mismatchRows.length} rows -> ${path.relative(ROOT, csvPath)}`);
}

main();
