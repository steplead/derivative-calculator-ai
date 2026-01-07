import { MetadataRoute } from 'next';
import problems from '../public/problems.json';

const baseUrl = 'https://derivativecalculatorai.com';

export default function sitemap(): MetadataRoute.Sitemap {
    const staticUrls: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/integral`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/limit`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/ode`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/matrix`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/calculators`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/problems`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/directory`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/wiki`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ];

    // Add all problem pages from problems.json
    const problemUrls: MetadataRoute.Sitemap = problems.map((problem: any) => ({
        url: `${baseUrl}/${problem.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    return [...staticUrls, ...problemUrls];
}
