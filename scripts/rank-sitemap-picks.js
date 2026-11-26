/**
 * Rank the problem library for sitemap curation (read-only).
 *
 *   node scripts/rank-sitemap-picks.js [--type integral|limit] [--n 100] [--json out.json]
 *
 * It reads the *built* pages under .next/server/app so every candidate is
 * checked the way a crawler sees it: the page must carry an answer block, must
 * be self-canonical at its public ("plus") URL, and must not publish a raw
 * 6+ digit constant or an unevaluated "1/infinity".
 *
 * Selection rules, in order:
 *   integral  textbook rule first (x, x^2, 1/x, e^x, sin, ln, ...), then
 *             coefficient-free shapes, then fewer terms, then shorter slugs.
 *             One page per shape family, so 2*e^x/3*e^x/5*e^x do not all ship.
 *             Definite integrals are excluded: the solver ignores the bounds.
 *   limit     the textbook list first, then plain quotients, then fewer
 *             factors. Answers must be plain numbers at standard targets.
 *
 * The output is what SITEMAP_URLS and data/sitemap-problem-slugs.json are built
 * from; re-run it after a solver change before trusting the current list.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const problems = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'problems.json'), 'utf8'));
const BASE_URL = 'https://derivativecalculatorai.com';
const APP = path.join(ROOT, '.next', 'server', 'app');

const plusFree = (slug) => slug.replace(/\+/g, 'plus').replace(/ /g, 'plus');

const DOMAIN_SCORE = { beginner: 80, intermediate: 40, advanced: 0 };

const CORE_INTEGRALS = [
  'x', 'x^2', 'x^3', 'x^4', '1/x', '1/x^2', 'sqrt(x)', 'e^x', 'ln(x)',
  'sin(x)', 'cos(x)', 'tan(x)', 'sec(x)^2', '1/sqrt(1-x^2)', '1/(1+x^2)',
  'x*e^x', 'x*sin(x)', 'x*cos(x)', 'x*cos(x^2)', 'sin(2*x)', 'cos(2*x)',
  'e^(2*x)', 'sin(x)^2', 'cos(x)^2', 'ln(x)/x', '1/(x*ln(x))',
];

const CORE_LIMITS = [
  ['sin(x)/x', '0'], ['tan(x)/x', '0'], ['(e^x-1)/x', '0'], ['ln(x)/(x-1)', '1'],
  ['(x^2-1)/(x-1)', '1'], ['(x^3-1)/(x-1)', '1'], ['(x^2-4)/(x-2)', '2'],
  ['(x^2+x-2)/(x-1)', '1'], ['(sqrt(x)-1)/(x-1)', '1'], ['x/e^x', '0'],
  ['x^2/sqrt(x)', '1'], ['x/x^3', 'infinity'], ['e^x/1/x', 'infinity'],
  ['1/x', 'infinity'], ['1/x^2', 'infinity'], ['x^2', 'infinity'],
  ['e^x', 'infinity'], ['ln(x)', 'infinity'], ['sin(x)', '0'], ['cos(x)', '0'],
  ['tan(x)', '0'],
];

const COEF = /^(?:\d+(?:\.\d+)?\*|1\/\d+\*)+/;
/** Shape of a term, ignoring a leading coefficient and sign. */
const shapeOf = (formula) => formula.replace(COEF, '').replace(/^-/, '');

function inspect(problem) {
  const slug = plusFree(problem.slug);
  const file = path.join(APP, `${slug}.html`);
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  const answer = html.match(/<div class="answer-math"[^>]*>([\s\S]*?)<\/div>/);
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
  return {
    hasAnswer: Boolean(answer),
    answerText: answer ? answer[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '',
    noindex: /<meta name="robots" content="noindex/.test(html),
    selfCanonical: canonical === `${BASE_URL}/${slug}`,
  };
}

function integralCandidates() {
  const rows = [];
  for (const problem of problems) {
    if (problem.type !== 'integral') continue;
    const page = inspect(problem);
    if (!page || !page.hasAnswer || !page.selfCanonical) continue;
    if (problem.slug.includes('-from-')) continue; // definite: bounds are ignored
    if (/abs\(/.test(problem.formula)) continue;
    if (/\^\d+\^/.test(problem.formula)) continue;
    if (/\d{6,}/.test(page.answerText)) continue;
    if (!/\+ C/.test(page.answerText)) continue; // an antiderivative carries +C
    rows.push({ problem, page });
  }

  // One page per shape; keep the plain member when a family has coefficients.
  const best = new Map();
  for (const row of rows) {
    const key = shapeOf(row.problem.formula);
    const rank = (r) =>
      (shapeOf(r.problem.formula) === r.problem.formula ? 100000 : 0) +
      (CORE_INTEGRALS.includes(r.problem.formula) ? 50000 : 0) +
      (DOMAIN_SCORE[r.problem.difficulty] || 0) * 10 -
      r.problem.slug.length;
    const previous = best.get(key);
    if (!previous || rank(row) > rank(previous)) best.set(key, row);
  }

  return [...best.values()]
    .map((row) => {
      let score = CORE_INTEGRALS.includes(row.problem.formula) ? 1000 : 0;
      if (shapeOf(row.problem.formula) === row.problem.formula) score += 300;
      const signs = (row.problem.formula.match(/[+-]/g) || []).length;
      score -= Math.max(0, signs - 1) * 45;
      score += DOMAIN_SCORE[row.problem.difficulty] || 0;
      score -= row.problem.slug.length * 0.8;
      return { ...row, score };
    })
    .sort((a, b) => b.score - a.score || a.problem.slug.length - b.problem.slug.length);
}

const limitJunk = (formula) => {
  if (/\^\d+\^/.test(formula)) return 'double exponent';
  if (/abs\(/.test(formula)) return 'abs branch';
  const compact = formula.replace(/\s/g, '');
  const sides = compact.split('-');
  if (sides.length === 2 && sides[0] === sides[1]) return 'identically zero';
  return '';
};

/**
 * A limit page ships only when the published answer is unambiguous: a plain
 * number, at a standard point. That rules out the engine's unevaluated
 * "1/infinity" (infinite targets), complex logs/sqrts at negative points,
 * two-sided divergence printed as a single infinity, and "undefined" targets.
 */
function shipableLimit(problem, page) {
  const target = String(problem.limitTo || '');
  if (!/^-?\d+(\.\d+)?$|^pi$|^pi\/2$/.test(target)) return false;
  if (limitJunk(problem.formula)) return false;
  if (/\d{6,}/.test(page.answerText)) return false;
  if (/∞|infty|undefined|nan/i.test(page.answerText)) return false;
  if (/sqrt\{?-|sqrt\(-/i.test(page.answerText)) return false;
  if (/[a-df-z]/i.test(page.answerText.replace(/frac|cdot|left|right|mathrm|pi/g, ''))) return false;
  return true;
}

function limitCandidates() {
  const rows = [];
  for (const problem of problems) {
    if (problem.type !== 'limit') continue;
    const page = inspect(problem);
    if (!page || !page.hasAnswer || !page.selfCanonical) continue;
    if (!shipableLimit(problem, page)) continue;
    rows.push({ problem, page });
  }

  return rows
    .map((row) => {
      const compact = row.problem.formula.replace(/\s/g, '');
      let score = CORE_LIMITS.some(
        ([formula, target]) => formula === compact && String(row.problem.limitTo) === target
      )
        ? 1000
        : 0;
      const sides = compact.split('/');
      if (sides.length === 2 && !sides.some((side) => /\//.test(side))) score += 300;
      if (!/\d\*|\*\d/.test(compact)) score += 120;
      score += DOMAIN_SCORE[row.problem.difficulty] || 0;
      score -= compact.length * 3;
      score -= (compact.match(/\*/g) || []).length * 10;
      return { ...row, score };
    })
    .sort((a, b) => b.score - a.score || a.problem.formula.length - b.problem.formula.length);
}

function rank(type) {
  const candidates = type === 'integral' ? integralCandidates() : limitCandidates();
  return candidates.map((row) => ({
    slug: row.problem.slug,
    urlPath: `/${plusFree(row.problem.slug)}`,
    formula: row.problem.formula,
    limitTo: row.problem.limitTo,
    difficulty: row.problem.difficulty,
    score: Number(row.score.toFixed(1)),
    currentlyNoindex: row.page.noindex,
    answer: row.page.answerText,
  }));
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const typeArg = args.includes('--type') ? args[args.indexOf('--type') + 1] : null;
  const nArg = args.includes('--n') ? Number(args[args.indexOf('--n') + 1]) : 100;
  const jsonArg = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
  const types = typeArg ? [typeArg] : ['integral', 'limit'];

  const out = {};
  for (const type of types) {
    const ranked = rank(type);
    out[type] = ranked.slice(0, nArg);
    if (!jsonArg) {
      console.log(`\n===== ${type}: ${ranked.length} eligible, showing ${out[type].length}`);
      out[type].forEach((row, index) => {
        console.log(
          `${String(index + 1).padStart(3)} ${String(row.score).padStart(7)} ${row.urlPath.padEnd(46)} ` +
            `${row.formula}${type === 'limit' ? ` -> ${row.limitTo}` : ''} | ${row.answer.slice(0, 26)}`
        );
      });
    }
  }
  if (jsonArg) fs.writeFileSync(path.resolve(ROOT, jsonArg), `${JSON.stringify(out, null, 2)}\n`);
}

module.exports = { rank };
