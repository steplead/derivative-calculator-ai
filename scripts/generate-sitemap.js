/**
 * Curated sitemap generator. This is the script `npm run generate-sitemap` runs.
 *
 * Includes only URLs that are live, indexable, and self-canonical:
 *   - homepage, tool pages, practice index, wiki index + articles
 *   - the textbook derivative pages in data/sitemap-problem-slugs.json
 *     (every GSC impression URL named in the 2026-10-31 SEO plan, plus the
 *     hand-authored derivative lessons that sit in front of the generated
 *     `minus-to-minus` series)
 *   - en / es / pt for each of those, with hreflang and x-default
 *
 * Excludes 404 integral slugs (literal "+"), noindex programmatic URLs, and
 * alias slugs whose canonical points somewhere else (derivative-of-e-x →
 * derivative-of-e-to-the-x).
 *
 * lastmod is the git commit time of the file that owns the URL, not a single
 * stamped date and not "now" on every run.
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'public', 'sitemap.xml');
const BASE_URL = 'https://derivativecalculatorai.com';
const LOCALES = ['en', 'es', 'pt'];

const STATIC_PATHS = [
  { path: '', file: 'app/page.tsx', priority: '1.0' },
  { path: '/integral', file: 'app/integral/page.tsx', priority: '0.9' },
  { path: '/limit', file: 'app/limit/page.tsx', priority: '0.9' },
  { path: '/matrix', file: 'app/matrix/page.tsx', priority: '0.8' },
  { path: '/ode', file: 'app/ode/page.tsx', priority: '0.8' },
  { path: '/calculators', file: 'app/calculators/page.tsx', priority: '0.8' },
  { path: '/wiki', file: 'app/wiki/page.tsx', priority: '0.7' },
  { path: '/practice', file: 'app/practice/page.tsx', priority: '0.7' },
  { path: '/derivatives-of-trig-functions', file: 'app/derivatives-of-trig-functions/page.tsx', priority: '0.8' },
  { path: '/partial-derivative-calculator', file: 'app/partial-derivative-calculator/page.tsx', priority: '0.9' },
  { path: '/implicit-differentiation-calculator', file: 'app/implicit-differentiation-calculator/page.tsx', priority: '0.9' },
  { path: '/chain-rule-calculator', file: 'app/chain-rule-calculator/page.tsx', priority: '0.9' },
  { path: '/symbolab-alternative', file: 'content/comparisons.ts', priority: '0.6' },
  { path: '/derivative-calculator-comparison', file: 'content/comparisons.ts', priority: '0.6' },
];

function gitLastmod(relFile) {
  let iso = '';
  try {
    iso = execSync(`git log -1 --format=%cI -- ${relFile}`, {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch (e) {
    // Fall through to filesystem mtime when git has no history for the file.
  }
  if (!iso) {
    iso = fs.statSync(path.join(ROOT, relFile)).mtime.toISOString();
  }
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toISOString();
}

function localizedPath(locale, relPath) {
  const clean = !relPath || relPath === '/' ? '' : relPath;
  if (locale === 'en') return clean;
  return clean ? `/${locale}${clean}` : `/${locale}`;
}

function absolute(relPath) {
  if (!relPath || relPath === '/') return BASE_URL;
  return `${BASE_URL}${relPath.startsWith('/') ? relPath : `/${relPath}`}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCanonicalMap(problems) {
  const byFormula = new Map();
  for (const problem of problems) {
    if (!problem || (problem.type || 'derivative') !== 'derivative' || !problem.formula) continue;
    if (!byFormula.has(problem.formula)) byFormula.set(problem.formula, []);
    byFormula.get(problem.formula).push(problem.slug);
  }
  const canon = new Map();
  for (const slugs of byFormula.values()) {
    if (slugs.length < 2) continue;
    const clean = slugs.filter(
      (slug) => slug.startsWith('derivative-of-') && !slug.includes('minus-to-minus-the-minus')
    );
    const pool = clean.length ? clean : slugs;
    const primary = [...pool].sort()[0];
    for (const slug of slugs) {
      if (slug !== primary) canon.set(slug, primary);
    }
  }
  return canon;
}

function hreflangLinks(relPath) {
  const en = absolute(localizedPath('en', relPath));
  const es = absolute(localizedPath('es', relPath));
  const pt = absolute(localizedPath('pt', relPath));
  return [
    ['en', en],
    ['es', es],
    ['pt', pt],
    ['x-default', en],
  ]
    .map(
      ([lang, href]) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}" />`
    )
    .join('\n');
}

function urlEntry(relPath, lastmod, priority) {
  const blocks = [];
  for (const locale of LOCALES) {
    const loc = absolute(localizedPath(locale, relPath));
    blocks.push(`  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
${hreflangLinks(relPath)}
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
  }
  return blocks;
}

function generateSitemap() {
  const problems = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'problems.json'), 'utf8'));
  const wiki = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'wiki.json'), 'utf8'));
  const allow = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data', 'sitemap-problem-slugs.json'), 'utf8')
  );
  const bySlug = new Map(problems.map((problem) => [problem.slug, problem]));
  const canon = buildCanonicalMap(problems);

  const entries = [];

  for (const page of STATIC_PATHS) {
    entries.push(...urlEntry(page.path, gitLastmod(page.file), page.priority));
  }

  const wikiLastmod = gitLastmod('data/wiki.json');
  for (const topic of wiki) {
    if (!topic || !topic.slug) continue;
    entries.push(...urlEntry(`/wiki/${topic.slug}`, wikiLastmod, '0.6'));
  }

  const problemLastmod = gitLastmod('data/problems.json');
  const used = new Set();
  for (const slug of allow) {
    if (typeof slug !== 'string' || !slug || slug.includes('+') || slug.includes(' ')) {
      throw new Error(`Allowlist slug is not a public URL: ${slug}`);
    }
    if (canon.has(slug)) {
      throw new Error(`Allowlist slug is an alias and must not be submitted: ${slug} → ${canon.get(slug)}`);
    }
    if (!bySlug.has(slug)) {
      throw new Error(`Allowlist slug is not in the problem library: ${slug}`);
    }
    if (used.has(slug)) continue;
    used.add(slug);
    entries.push(...urlEntry(`/${slug}`, problemLastmod, '0.7'));
  }

  if (entries.length < 100 || entries.length > 300) {
    throw new Error(`Sitemap size ${entries.length} is outside the 100–300 quality band`);
  }

  const body = entries.join('\n');
  if (body.includes('/integral-of-') && body.includes('+')) {
    throw new Error('Sitemap still contains a literal + integral URL');
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log(`Sitemap generated at ${SITEMAP_PATH} with ${entries.length} URLs`);
  return entries.length;
}

if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap };
