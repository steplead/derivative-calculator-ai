import Link from 'next/link';
import { headers } from 'next/headers';
export const runtime = 'edge';

import { getDictionary } from '../dictionaries';
import { getBaseUrl } from '@/utils/robust-url';

// Helper to get formula title if needed (reuse from [slug]/page logic if possible, or simple mapping)
function getProblemTitle(locale: string, formula: string, type: string = 'derivative') {
    if (locale === 'en') return `Derivative of ${formula}`;
    if (locale === 'es') return `Derivada de ${formula}`;
    if (locale === 'pt') return `Derivada de ${formula}`; // Or "Derivada de"
    return `Derivative of ${formula}`;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = headersList.get("x-next-locale") || "en";
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Directory metadata error:", e);
    }

    const h1 = dict?.directory?.h1 || "All Problems";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
    const url = locale === 'en' ? `${siteUrl}/directory` : `${siteUrl}/${locale}/directory`;

    return {
        title: `${h1} - Derivative Calculator AI`,
        description: 'Browse our complete list of derivative problems and solutions.',
        alternates: {
            canonical: url,
            languages: {
                'en': `${siteUrl}/directory`,
                'es': `${siteUrl}/es/directory`,
                'pt': `${siteUrl}/pt/directory`,
            },
        },
    };
}

export default async function DirectoryPage() {
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const dict = getDictionary(locale);

    if (!dict || !dict.directory) {
        return <div className="p-20 text-center">System initialization... (Directory dictionary missing)</div>;
    }

    // Fetch all problems from API
    const baseUrl = getBaseUrl();

    let problemsList = [];
    if (baseUrl) {
        try {
            const res = await fetch(`${baseUrl}/api/problems`, {
                cache: 'force-cache',
                // @ts-ignore
                next: { revalidate: 3600 }
            });

            const contentType = res.headers.get("content-type");
            if (res.ok && contentType && contentType.includes("application/json")) {
                problemsList = await res.json();
            } else {
                console.warn("Backend returned non-JSON, using local fallback for directory.");
            }
        } catch (e) {
            console.error("Failed to fetch problems for directory:", e);
        }
    }

    // FALLBACK: Use full local data if API failed
    if (!problemsList || problemsList.length === 0) {
        try {
            const fallbackRes = await fetch(`${baseUrl}/problems.json`);
            if (fallbackRes.ok) {
                problemsList = await fallbackRes.json();
            }
        } catch (e) {
            console.error("Static fallback failed in DirectoryPage:", e);
        }
    }

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {dict.directory.h1}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        {dict.directory.subtitle.replace("{count}", problemsList.length.toString())}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {problemsList.map((problem: any) => (
                        <Link
                            key={problem.slug}
                            href={`/${locale === 'en' ? '' : locale + '/'}${problem.slug}`}
                            className="bg-gray-50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all group"
                        >
                            <h3 className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-semibold mb-1 truncate">
                                {dict.directory.derivativeOf} {problem.formula}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {problem.title}
                            </p>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 text-center pb-12">
                    <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                        &larr; {dict.directory.back}
                    </Link>
                </div>
            </div>
        </div>
    );
}
