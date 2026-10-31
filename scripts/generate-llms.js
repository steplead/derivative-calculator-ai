/**
 * public/llms.txt — a short map for answer engines.
 * Canonical English URLs only. es/pt live under /es and /pt.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://derivativecalculatorai.com';

function oneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function link(title, href, description) {
  return `- [${title}](${href}): ${oneLine(description)}`;
}

function generateLlms() {
  const facts = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'derivative-facts.json'), 'utf8'));
  const wiki = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'wiki.json'), 'utf8'));
  const allow = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sitemap-problem-slugs.json'), 'utf8'));
  const problems = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'problems.json'), 'utf8'));
  const bySlug = new Map(problems.map((problem) => [problem.slug, problem]));
  const byFact = new Map(facts.map((fact) => [fact.slug, fact]));

  const lines = [
    '# Derivative Calculator AI',
    '',
    '> Free calculus calculators with step-by-step work and a why-explanation on each step. No sign-up. English, Spanish (/es), and Portuguese (/pt).',
    '',
    '## Calculators',
    '',
    link('Derivative calculator', `${SITE}/`, 'Differentiate a function of x and show the rule, the steps, and why each step is valid.'),
    link('Integral calculator', `${SITE}/integral`, 'Indefinite integrals with the antiderivative, +C, steps, and a check-answer box.'),
    link('Limit calculator', `${SITE}/limit`, 'Limits with the technique named, steps, and a check-answer box.'),
    link('Partial derivative calculator', `${SITE}/partial-derivative-calculator`, 'Differentiate in one variable while the others stay constant.'),
    link('Implicit differentiation calculator', `${SITE}/implicit-differentiation-calculator`, 'Find dy/dx from an equation in x and y.'),
    link('Chain rule calculator', `${SITE}/chain-rule-calculator`, 'Break a composition into the outer derivative times the inner derivative.'),
    link('Matrix calculator', `${SITE}/matrix`, 'Determinant, inverse, transpose, rank, and row reduction.'),
    link('ODE solver', `${SITE}/ode`, 'First- and second-order ordinary differential equations.'),
    link('Trig derivative hub', `${SITE}/derivatives-of-trig-functions`, 'The six trig derivatives and the inverse-trig family, with links to each worked page.'),
    link('Practice', `${SITE}/practice`, 'Practice problems by difficulty, with a streak saved on the device.'),
    '',
    '## Comparisons',
    '',
    link('Symbolab alternative', `${SITE}/symbolab-alternative`, 'What this free calculator does, next to wording from Symbolab’s own registration page.'),
    link('Derivative calculator comparison', `${SITE}/derivative-calculator-comparison`, 'Sourced notes on steps and accounts for this site, Symbolab, Wolfram|Alpha, Mathway, and derivative-calculator.net.'),
    '',
    '## Derivative pages',
    '',
  ];

  for (const slug of allow) {
    const fact = byFact.get(slug);
    const problem = bySlug.get(slug);
    const title = fact ? `Derivative of ${fact.display}` : (problem && problem.title) || slug;
    const inverseLead = {
      'derivative-of-arcsin-x': 'd/dx arcsin(x) = 1/sqrt(1-x^2), for -1 < x < 1.',
      'derivative-of-arccos-x': 'd/dx arccos(x) = -1/sqrt(1-x^2), for -1 < x < 1.',
      'derivative-of-arctan-x': 'd/dx arctan(x) = 1/(1+x^2), for every real x.',
    };
    const description = inverseLead[slug]
      || (fact
        ? (fact.nondiff ? `The derivative of ${fact.display} is not defined for every real number: ${fact.nice}.` : `d/dx ${fact.display} = ${fact.nice}.`)
        : problem
          ? `Derivative of ${problem.formula}.`
          : 'Worked derivative.');
    lines.push(link(title, `${SITE}/${slug}`, description));
  }

  lines.push('', '## Wiki', '');
  const topics = [...wiki].filter((topic) => topic && topic.slug).sort((a, b) => a.slug.localeCompare(b.slug));
  for (const topic of topics) {
    lines.push(link(topic.title || topic.slug, `${SITE}/wiki/${topic.slug}`, topic.description || topic.title || topic.slug));
  }
  lines.push('');

  const text = lines.join('\n');
  fs.writeFileSync(path.join(ROOT, 'public', 'llms.txt'), text);
  return text;
}

if (require.main === module) {
  const text = generateLlms();
  console.log(`llms.txt written (${text.length} bytes)`);
}

module.exports = { generateLlms };
