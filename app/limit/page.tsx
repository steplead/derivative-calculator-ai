import { Suspense } from 'react';
import { headers } from 'next/headers';
import Calculator from '@/components/Calculator';
import AdShell from '@/components/AdShell';
import EmbedSnippet from '@/components/EmbedSnippet';
import PopularDerivatives from '@/components/PopularDerivatives';
import PracticeGenerator from '@/components/PracticeGenerator';
import { getDictionary } from '../dictionaries';
import { localeAlternates, normalizeLocale, pageTitle } from '@/lib/seo';

export const runtime = 'edge';
// OPTIMIZED: Allow caching to reduce quota usage
// Cache for 1 hour - locale is handled via middleware rewrite, so caching is safe
export const revalidate = 3600; // 1 hour

export async function generateMetadata() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = normalizeLocale(headersList.get("x-next-locale"));
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Limit metadata error:", e);
    }

    const subtitle = dict?.limit?.subtitle || "Solve limits instantly.";
    const title = pageTitle('limit', locale);
    const alternates = localeAlternates('/limit', locale);

    return {
        title: { absolute: title },
        description: subtitle,
        alternates,
        openGraph: {
            title,
            description: subtitle,
            url: alternates.canonical,
            type: 'website',
        },
    };
}

export default async function LimitPage() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = headersList.get("x-next-locale") || "en";
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Limit page header error:", e);
    }

    if (!dict || !dict.limit) {
        dict = getDictionary("en");
    }

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto text-center mb-12 mt-10">
                <h1 id="limit-calculator" className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    {dict.limit.h1} <span className="text-green-600 dark:text-green-500">AI</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    {dict.limit.subtitle}
                </p>
            </div>

            <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">{dict.common.loading}</div>}>
                <Calculator mode="limit" dict={dict.calculator} locale={locale} showShare shareUrl={localeAlternates('/limit', locale).canonical} />
            </Suspense>
            <EmbedSnippet path="/limit" locale={locale} />
            <PopularDerivatives locale={locale} id="limit-popular-derivatives" />
            <PracticeGenerator locale={locale} topic="limit" />

            <div className="mt-16">
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{dict.limit.howToTitle}</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {dict.limit.howToText}
                        </p>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                            <li>{dict.limit.bullet1} <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">(x^2-1)/(x-1)</code></li>
                            <li>{dict.limit.bullet2} <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">sin(x)/x</code></li>
                            <li>{dict.limit.bullet3}</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="mt-16">
                <AdShell type="donation" />
            </div>
        </div>
    );
}
