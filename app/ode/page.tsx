import Calculator from '@/components/Calculator';
import EmbedWidget from '@/components/EmbedWidget';
import Link from 'next/link';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { getDictionary } from '../dictionaries';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = headersList.get("x-next-locale") || "en";
        dict = getDictionary(locale);
    } catch (e) {
        console.error("ODE metadata error:", e);
    }

    const h1 = dict?.ode?.h1 || "Differential Equation Solver";
    const subtitle = dict?.ode?.subtitle || "Solve ODEs step-by-step.";

    return {
        title: `${h1} - Step-by-Step ODE Solutions | Derivative Calculator AI`,
        description: subtitle,
        alternates: {
            canonical: '/ode',
            languages: {
                'en': '/ode',
                'es': '/es/ode',
                'pt': '/pt/ode',
            },
        },
    };
}

export default async function ODEPage() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        const headersList = await headers();
        locale = headersList.get("x-next-locale") || "en";
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
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    {dict.ode.h1} <span className="text-indigo-600 dark:text-indigo-500">AI</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    {dict.ode.subtitle}
                </p>
            </div>

            <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">{dict.common.loading}</div>}>
                <Calculator mode="ode" dict={dict.calculator} />
            </Suspense>

            <div className="max-w-4xl mx-auto mt-20 prose prose-invert">
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

            {/* Embed Widget - Link Magnet Strategy */}
            <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
                <EmbedWidget
                    problemSlug="y-prime-plus-y-equals-x"
                    problemFormula="y' + y = x"
                    problemType="ode"
                    locale={locale}
                />
            </div>
        </div>
    );
}
