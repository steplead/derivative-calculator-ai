/**
 * Curated sitemap generator (`npm run generate-sitemap`; output is committed as
 * public/sitemap.xml).
 *
 * 2026-11-07 (owner-approved): only the homepage is indexed and Google had
 * discovered ~255 URLs (85 locs + es/pt hreflang alternates). The sitemap is
 * now exactly the English URLs in SITEMAP_URLS below, with NO hreflang
 * alternates and no es/pt URLs. Every other page stays live, linked, and
 * self-canonical; it is just not submitted. Edit SITEMAP_URLS to add/remove.
 *
 * lastmod is the git commit time of the file(s) that own the URL.
 */

const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'public', 'sitemap.xml');
const BASE_URL = 'https://derivativecalculatorai.com';

// The one list to edit. `file` drives lastmod; `problem: true` entries must
// exist in data/problems.json and use the problem-lesson lastmod.
const SITEMAP_URLS = [
  { path: '/', file: 'app/(site)/page.tsx', priority: '1.0' },
  { path: '/integral', file: 'app/(site)/integral/page.tsx', priority: '0.9' },
  { path: '/limit', file: 'app/(site)/limit/page.tsx', priority: '0.9' },
  { path: '/partial-derivative-calculator', file: 'app/(site)/partial-derivative-calculator/page.tsx', priority: '0.9' },
  { path: '/implicit-differentiation-calculator', file: 'app/(site)/implicit-differentiation-calculator/page.tsx', priority: '0.9' },
  { path: '/chain-rule-calculator', file: 'app/(site)/chain-rule-calculator/page.tsx', priority: '0.9' },
  { path: '/derivative-of-sin-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-cos-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-tan-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-ln-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-e-to-the-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-1-over-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-sqrt-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-x-squared', problem: true, priority: '0.8' },
  { path: '/derivative-of-arctan-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-sec-x', problem: true, priority: '0.8' },
  { path: '/derivatives-of-trig-functions', file: 'app/(site)/derivatives-of-trig-functions/page.tsx', priority: '0.8' },
  { path: '/wiki/chain-rule', file: 'data/wiki.json', priority: '0.7' },
];

const PROBLEM_FILES = [
  'data/problems.json',
  'content/derivative-facts.json',
  'content/striking-lessons.ts',
  'content/inverse-trig-lessons.ts',
  'content/derivative-lesson.ts',
  'app/(site)/[slug]/page.tsx',
];

function gitLastmod(relFile) {
  let iso = '';
  try {
    iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', relFile], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch (e) {
    // fall back to mtime
  }
  if (!iso) iso = fs.statSync(path.join(ROOT, relFile)).mtime.toISOString();
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toISOString();
}

function absolute(relPath) {
  return relPath === '/' ? BASE_URL : `${BASE_URL}${relPath}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateSitemap() {
  const problems = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'problems.json'), 'utf8'));
  const wiki = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'wiki.json'), 'utf8'));
  const problemSlugs = new Set(problems.map((p) => p && p.slug));
  const wikiSlugs = new Set(wiki.map((t) => t && t.slug));
  const problemLastmod = PROBLEM_FILES.map(gitLastmod).sort().at(-1);

  const seen = new Set();
  const entries = SITEMAP_URLS.map((entry) => {
    if (seen.has(entry.path)) throw new Error(`Duplicate sitemap path: ${entry.path}`);
    seen.add(entry.path);
    if (/^\/(es|pt)(\/|$)/.test(entry.path)) throw new Error(`Locale URL not allowed: ${entry.path}`);
    if (entry.problem && !problemSlugs.has(entry.path.slice(1))) {
      throw new Error(`Not in the problem library: ${entry.path}`);
    }
    if (entry.path.startsWith('/wiki/') && !wikiSlugs.has(entry.path.slice(6))) {
      throw new Error(`Not in wiki.json: ${entry.path}`);
    }
    const lastmod = entry.problem ? problemLastmod : gitLastmod(entry.file);
    return `  <url>
    <loc>${escapeXml(absolute(entry.path))}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log(`Sitemap generated at ${SITEMAP_PATH} with ${entries.length} URLs`);
  return entries.length;
}

if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap, SITEMAP_URLS };
