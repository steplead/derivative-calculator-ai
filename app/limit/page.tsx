import Calculator from '@/components/Calculator';
import Link from 'next/link';

export const metadata = {
    title: "Limit Calculator AI - Solve Limits Instantly",
    description: "Free step-by-step limit calculator powered by AI. Solve limits as x approaches any value.",
};

import { Suspense } from 'react';

import { headers } from 'next/headers';
import { getDictionary } from '../dictionaries';

export const dynamic = 'force-dynamic';

export default async function LimitPage() {
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const dict = getDictionary(locale);

    return (
        <main className="min-h-screen bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto text-center mb-12 mt-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    {dict.limit.h1} <span className="text-green-600 dark:text-green-500">AI</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    {dict.limit.subtitle}
                </p>
            </div>

            <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">{dict.common.loading}</div>}>
                <Calculator mode="limit" dict={dict.calculator} />
            </Suspense>

            <div className="max-w-4xl mx-auto mt-20 prose prose-invert">
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


        </main>
    );
}
