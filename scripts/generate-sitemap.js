const fs = require('fs');
const problems = require('../data/problems.json');

const SITEMAP_PATH = './public/sitemap.xml';
const BASE_URL = 'https://www.derivativecalculatorai.com';

function generateSitemap() {
  const locales = ['', 'es', 'pt'];

  // Static Pages
  const staticPages = ['', 'integral', 'limit', 'matrix', 'directory'];

  const staticUrls = staticPages.flatMap(page => {
    return locales.map(locale => {
      // Handle root path logic carefully
      const path = page ? page : '';
      if (!path && !locale) return ''; // Base URL handled separately or implicitly

      let urlPath = '';
      if (locale && path) urlPath = `${locale}/${path}`;
      else if (locale) urlPath = locale;
      else urlPath = path;

      if (!urlPath) return ''; // Skip empty (root handled below manually or should be here?)
      // Let's standardise: Root is handled manually in the template below. 
      // So we only do non-root static pages here involving locales
      return `
  <url>
    <loc>${BASE_URL}/${urlPath}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });
  }).filter(Boolean);


  const problemUrls = problems.flatMap((problem) => {
    return locales.map(locale => {
      const urlPath = locale ? `${locale}/${problem.slug}` : problem.slug;
      return `
  <url>
    <loc>${BASE_URL}/${urlPath}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
  });

  const urls = [...staticUrls, ...problemUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls.join('')}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, sitemap);
  console.log(`Sitemap generated at ${SITEMAP_PATH}`);
}

generateSitemap();
