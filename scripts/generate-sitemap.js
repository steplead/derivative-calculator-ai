const fs = require('fs');
const problems = require('../data/problems.json');
const wiki = require('../data/wiki.json');

const SITEMAP_PATH = './public/sitemap.xml';
const BASE_URL = 'https://derivativecalculatorai.com';

function generateSitemap() {
  const locales = ['', 'es', 'pt'];

  // Static Pages
  const staticPages = ['', 'integral', 'limit', 'matrix', 'ode', 'directory', 'wiki'];

  const staticUrls = staticPages.flatMap(page => {
    return locales.map(locale => {
      const urlPath = locale ? (page ? `${locale}/${page}` : locale) : page;

      return `
  <url>
    <loc>${BASE_URL}${urlPath ? '/' + urlPath : ''}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${!urlPath ? '1.0' : '0.9'}</priority>
  </url>`;
    });
  });

  const wikiUrls = wiki.flatMap((topic) => {
    return locales.map(locale => {
      const urlPath = locale ? `${locale}/wiki/${topic.slug}` : `wiki/${topic.slug}`;
      return `
  <url>
    <loc>${BASE_URL}/${urlPath}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  });

  const problemUrls = problems.flatMap((problem) => {
    return locales.map(locale => {
      const urlPath = locale ? `${locale}/${problem.slug}` : problem.slug;
      return `
  <url>
    <loc>${BASE_URL}/${urlPath}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });
  });

  const urls = [...staticUrls, ...wikiUrls, ...problemUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, sitemap);
  console.log(`Sitemap generated at ${SITEMAP_PATH}`);
}

generateSitemap();
