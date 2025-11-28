const fs = require('fs');
const problems = require('../data/problems.json');

const SITEMAP_PATH = './public/sitemap.xml';
const BASE_URL = 'https://derivativecalculatorai.com';

function generateSitemap() {
    const urls = problems.map((problem) => {
        return `
  <url>
    <loc>${BASE_URL}/${problem.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

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
