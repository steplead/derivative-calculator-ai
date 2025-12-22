import { MetadataRoute } from 'next';

export const runtime = 'edge';

const BASE_URL = 'https://derivative-calculator-ai.pages.dev';

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        '',
        '/limit',
        '/integral',
        '/derivative',
        '/matrix',
        '/directory',
    ];

    const locales = ['', '/es', '/pt']; // Empty string for default (en) which is at root

    const sitemapEntries: MetadataRoute.Sitemap = [];

    locales.forEach(locale => {
        routes.forEach(route => {
            // Avoid double slashes
            const url = `${BASE_URL}${locale}${route === '' ? '' : route}`;

            // Determine priority
            let priority = 0.8;
            if (route === '' && locale === '') priority = 1.0;
            if (route === '' && locale !== '') priority = 0.9;

            sitemapEntries.push({
                url,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority,
            });
        });
    });

    return sitemapEntries;
}
