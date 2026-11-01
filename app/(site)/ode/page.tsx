import { readLocale } from '@/lib/read-locale';
import Calculator from '@/components/Calculator';
import AdShell from '@/components/AdShell';
import PopularDerivatives from '@/components/PopularDerivatives';
// EmbedWidget removed to prevent API abuse
import { Suspense } from 'react';
import { getDictionary } from '@/app/dictionaries';
import { localeAlternates, normalizeLocale, pageTitle } from '@/lib/seo';

export const dynamic = 'force-static';

// OPTIMIZED: Allow caching to reduce quota usage
// Cache for 1 hour - locale is handled via middleware rewrite, so caching is safe

export async function generateMetadata() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        locale = readLocale();
        dict = getDictionary(locale);
    } catch (e) {
        console.error("ODE metadata error:", e);
    }

    const subtitle = dict?.ode?.subtitle || "Solve ODEs step-by-step.";
    const title = pageTitle('ode', locale);
    const alternates = localeAlternates('/ode', locale);

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

export default async function ODEPage() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        locale = readLocale();
        dict = getDictionary(locale);
    } catch (e) {
        console.error("ODE page header error:", e);
    }

    if (!dict || !dict.ode) {
        dict = getDictionary("en");
    }

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto text-center mb-12 mt-10">
                <h1 id="differential-equation-solver" className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    {dict.ode.h1} <span className="text-indigo-600 dark:text-indigo-500">AI</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    {dict.ode.subtitle}
                </p>
            </div>

            <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">{dict.common.loading}</div>}>
                <Calculator
                    mode="ode"
                    dict={dict.calculator}
                    locale={locale}
                    showShare
                    shareUrl={localeAlternates('/ode', normalizeLocale(locale)).canonical}
                />
            </Suspense>
            <PopularDerivatives locale={locale} id="ode-popular-derivatives" />

            <div className="mt-16">
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{dict.ode.howToTitle}</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {dict.ode.howToText}
                        </p>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                            <li>{dict.ode.bullet1}</li>
                            <li>{dict.ode.bullet2}</li>
                            <li>{dict.ode.bullet3}</li>
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
