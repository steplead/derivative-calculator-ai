import { MetadataRoute } from 'next';
import problems from '../data/problems.json';

export const runtime = 'edge';

const BASE_URL = 'https://derivative-calculator-ai.pages.dev';

export default function sitemap(): MetadataRoute.Sitemap {
    const staticRoutes = [
        '',
        '/limit',
        '/integral',
        '/derivative',
        '/matrix',
        '/directory',
    ];

    const locales = ['', '/es', '/pt']; // Empty string for default (en) which is at root

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // 1. Add Static Routes
    locales.forEach(locale => {
        staticRoutes.forEach(route => {
            const url = `${BASE_URL}${locale}${route === '' ? '' : route}`;

            let priority = 0.8;
            if (route === '' && locale === '') priority = 1.0;
            if (route === '' && locale !== '') priority = 0.9;

            sitemapEntries.push({
                url,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority,
            });
        });
    });

    // 2. Add Dynamic Problem Routes (3000+ per locale)
    problems.forEach((p: any) => {
        locales.forEach(locale => {
            const url = `${BASE_URL}${locale}/${p.slug}`;
            sitemapEntries.push({
                url,
                lastModified: new Date(),
                changeFrequency: 'monthly' as const,
                priority: 0.6,
            });
        });
    });

    return sitemapEntries;
}
