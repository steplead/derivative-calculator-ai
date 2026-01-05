import Calculator from '@/components/Calculator';
import EmbedWidget from '@/components/EmbedWidget';
import Link from 'next/link';

import { getDictionary } from '../dictionaries';

export async function generateMetadata() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = headersList.get("x-next-locale") || "en";
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Integral metadata error:", e);
    }

    const h1 = dict?.integral?.h1 || "Integral Calculator";
    const subtitle = dict?.integral?.subtitle || "Solve integrals instantly.";

    return {
        title: `${h1} - Derivative Calculator AI`,
        description: subtitle,
        alternates: {
            canonical: '/integral',
            languages: {
                'en': '/integral',
                'es': '/es/integral',
                'pt': '/pt/integral',
            },
        },
    };
}

import { Suspense } from 'react';

import { headers } from 'next/headers';
export const runtime = 'edge';

import { getDictionary as getDict } from '../dictionaries';

export const dynamic = 'force-dynamic';

export default async function IntegralPage() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = headersList.get("x-next-locale") || "en";
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Integral page header error:", e);
    }

    if (!dict || !dict.integral) {
        dict = getDictionary("en");
    }

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto text-center mb-12 mt-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    {dict.integral.h1} <span className="text-purple-600 dark:text-purple-500">AI</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    {dict.integral.subtitle}
                </p>
            </div>

            <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">{dict.common.loading}</div>}>
                <Calculator mode="integral" dict={dict.calculator} />
            </Suspense>

            <div className="max-w-4xl mx-auto mt-20 prose prose-invert">
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{dict.integral.howToTitle}</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {dict.integral.howToText}
                        </p>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                            <li>{dict.integral.bullet1} <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">x^2 + 3x</code></li>
                            <li>{dict.integral.bullet2} <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">sin(x)</code></li>
                            <li>{dict.integral.bullet3} <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">e^x</code></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Embed Widget - Link Magnet Strategy */}
            <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
                <EmbedWidget
                    problemSlug="integral-of-x-squared"
                    problemFormula="x^2"
                    problemType="integral"
                    locale={locale}
                />
            </div>

        </div>
    );
}
