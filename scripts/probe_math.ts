/* Temporary diagnostic probe — local engine behaviour for RED-page expressions. */
import { calculateDerivative } from '../lib/math/math-core';

const exprs = [
    'x', 'x^2', '1/x', 'acos(x/2)', 'acos(x/10)', '1/sqrt(1-x^2)',
    'x^(1/5)', '10^x', 'x/(x^4+1)', 'x^(1/6)',
];

for (const e of exprs) {
    const t0 = Date.now();
    try {
        const r = calculateDerivative(e);
        console.log(
            [e.padEnd(18), 'valid=' + r.isValid, 'rule=' + r.rule.padEnd(16),
             'steps=' + r.steps.length, 'raw=' + r.solutionRaw.slice(0, 45),
             (Date.now() - t0) + 'ms'].join(' ')
        );
    } catch (err: any) {
        console.log([e.padEnd(18), 'THROW', err?.message, (Date.now() - t0) + 'ms'].join(' '));
    }
}
