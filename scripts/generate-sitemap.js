const fs = require('fs');
const problems = require('../data/problems.json');
const wiki = require('../data/wiki.json');

const SITEMAP_PATH = './public/sitemap.xml';
const BASE_URL = 'https://derivativecalculatorai.com';

function generateSitemap() {
  const locales = ['', 'es', 'pt'];

  // Reuse the prior lastmod for any URL that already existed, so regenerating
  // the sitemap does NOT churn every timestamp. Only genuinely new URLs (e.g.
  // freshly added tag pages) get a fresh date. This keeps commits clean and
  // avoids lastmod-only noise while still dated-stamping new entries.
  const prevLastmod = new Map();
  try {
    const prev = fs.readFileSync(SITEMAP_PATH, 'utf8');
    const re = /<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;
    let m;
    while ((m = re.exec(prev)) !== null) prevLastmod.set(m[1], m[2]);
  } catch (e) {
    // No prior sitemap yet — every URL gets a fresh timestamp below.
  }
  const lm = (loc) => prevLastmod.get(loc) || new Date().toISOString();

  // Static Pages (updated with new SEO architecture)
  const staticPages = ['', 'integral', 'limit', 'matrix', 'ode', 'directory', 'wiki', 'problems', 'calculators', 'practice'];

  const staticUrls = staticPages.flatMap(page => {
    return locales.map(locale => {
      const urlPath = locale ? (page ? `${locale}/${page}` : locale) : page;
      const loc = `${BASE_URL}${urlPath ? '/' + urlPath : ''}`;
      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lm(loc)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${!urlPath ? '1.0' : '0.9'}</priority>
  </url>`;
    });
  });

  const wikiUrls = wiki.flatMap((topic) => {
    return locales.map(locale => {
      const urlPath = locale ? `${locale}/wiki/${topic.slug}` : `wiki/${topic.slug}`;
      const loc = `${BASE_URL}/${urlPath}`;
      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lm(loc)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  });

  const problemUrls = problems.flatMap((problem) => {
    return locales.map(locale => {
      const urlPath = locale ? `${locale}/${problem.slug}` : problem.slug;
      const loc = `${BASE_URL}/${urlPath}`;
      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lm(loc)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });
  });

  // Tag pages: emit ONLY real tags present in the data. This mirrors the tag
  // page's indexability rule (generateMetadata sets index,follow only when a
  // tag has >=1 problem). Empty/nonexistent tags are never added, so thin URLs
  // stay out of the index. 3 locales to match the rest of the sitemap.
  const tagSet = new Set();
  for (const p of problems) {
    if (p && p.tags) {
      for (const raw of String(p.tags).split(',')) {
        const t = raw.trim();
        if (t) tagSet.add(t);
      }
    }
  }
  const realTags = Array.from(tagSet);
  const tagUrls = realTags.flatMap((tag) => {
    return locales.map(locale => {
      const urlPath = locale ? `${locale}/problems/tag/${tag}` : `problems/tag/${tag}`;
      const loc = `${BASE_URL}/${urlPath}`;
      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lm(loc)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  });

  const urls = [...staticUrls, ...wikiUrls, ...problemUrls, ...tagUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, sitemap);
  console.log(`Sitemap generated at ${SITEMAP_PATH}`);
}

generateSitemap();
