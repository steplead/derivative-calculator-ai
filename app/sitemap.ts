import { MetadataRoute } from 'next';
import problemsData from '../public/problems.json';
import wikiData from '../public/wiki.json';

export const runtime = 'edge';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';

export default function sitemap(): MetadataRoute.Sitemap {
    const staticRoutes = [
        '',
        '/limit',
        '/integral',
        '/derivative',
        '/matrix',
        '/directory',
        '/wiki',
    ];

    const locales = ['', '/es', '/pt'];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // 1. Static Routes
    locales.forEach(locale => {
        staticRoutes.forEach(route => {
            const url = `${BASE_URL}${locale}${route}`;
            sitemapEntries.push({
                url,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: (route === '' && locale === '') ? 1.0 : 0.8,
            });
        });
    });

    // 2. Wiki Topics
    wikiData.forEach((topic: any) => {
        locales.forEach(locale => {
            sitemapEntries.push({
                url: `${BASE_URL}${locale}/wiki/${topic.slug}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.7,
            });
        });
    });

    // 3. Problem Routes
    problemsData.forEach((p: any) => {
        locales.forEach(locale => {
            sitemapEntries.push({
                url: `${BASE_URL}${locale}/${p.slug}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.6,
            });
        });
    });

    return sitemapEntries;
}
