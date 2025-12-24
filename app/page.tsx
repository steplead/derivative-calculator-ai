import Calculator from '@/components/Calculator';
export const runtime = 'edge';
import Link from 'next/link';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { getDictionary } from './dictionaries';
import { getBaseUrl } from '@/utils/robust-url';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';

  const url = locale === 'en' ? siteUrl : `${siteUrl}/${locale}`;

  return {
    title: `${dict.home.h1} - Derivative Calculator AI`,
    description: dict.home.subtitle,
    alternates: {
      canonical: url,
      languages: {
        'en': siteUrl,
        'es': `${siteUrl}/es`,
        'pt': `${siteUrl}/pt`,
      }
    }
  };
}

export default async function Home() {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const dict = getDictionary(locale);

  if (!dict || !dict.home || !dict.common) {
    return <div className="p-20 text-center">System initialization... (Dictionary missing)</div>;
  }

  // Fetch popular problems from API instead of local JSON
  const baseUrl = getBaseUrl();

  let popularProblems = [];

  // SAFE FETCH: Verification before parsing JSON
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/problems?limit=20`, {
        cache: 'force-cache',
        // @ts-ignore
        next: { revalidate: 3600 }
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        popularProblems = await res.json();
      } else {
        console.warn("Backend returned non-JSON response, using local fallback.");
      }
    } catch (e) {
      console.error("Failed to fetch popular problems:", e);
    }
  }

  // FALLBACK: Use local data if API failed or returned HTML
  if (!popularProblems || popularProblems.length === 0) {
    try {
      // Fetch from public/ directory instead of bundling it
      const fallbackRes = await fetch(`${baseUrl}/problems.json`);
      if (fallbackRes.ok) {
        const problemsData = await fallbackRes.json();
        popularProblems = (problemsData as any[]).slice(0, 20);
      }
    } catch (e) {
      console.error("Static fallback failed:", e);
    }
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto text-center mb-12 mt-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          {dict.home.h1} <span className="text-blue-600 dark:text-blue-500">AI</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {dict.home.subtitle}
        </p>
      </div>

      <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">{dict.common.loading}</div>}>
        <Calculator dict={dict.calculator} />
      </Suspense>

      <div className="max-w-4xl mx-auto mt-20 prose prose-invert">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{dict.home.howToTitle}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {dict.home.howToText}
            </p>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Supports polynomials (e.g., <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">x^2 + 3x</code>)</li>
              <li>Trigonometric functions (e.g., <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">sin(x)</code>, <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">tan(x)</code>)</li>
              <li>Logarithmic & Exponential functions (e.g., <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">ln(x)</code>, <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">e^x</code>)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{dict.home.rulesTitle}</h2>
            <div className="space-y-4">
              <Link href="/wiki/power-rule" className="block bg-gray-100 dark:bg-slate-800 p-4 rounded-lg hover:ring-2 hover:ring-blue-500 transition-all no-underline group">
                <h3 className="font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700">{dict.home.rules.power.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{dict.home.rules.power.text}</p>
              </Link>
              <Link href="/wiki/product-rule" className="block bg-gray-100 dark:bg-slate-800 p-4 rounded-lg hover:ring-2 hover:ring-purple-500 transition-all no-underline group">
                <h3 className="font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700">{dict.home.rules.product.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{dict.home.rules.product.text}</p>
              </Link>
              <Link href="/wiki/chain-rule" className="block bg-gray-100 dark:bg-slate-800 p-4 rounded-lg hover:ring-2 hover:ring-green-500 transition-all no-underline group">
                <h3 className="font-semibold text-green-600 dark:text-green-400 group-hover:text-green-700">{dict.home.rules.chain.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{dict.home.rules.chain.text}</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Popular Calculations Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">{dict.home.popularTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularProblems.map((problem: any) => (
              <Link
                key={problem.slug}
                href={`/${locale === 'en' ? '' : locale + '/'}${problem.slug}`}
                className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 p-3 rounded-lg text-sm text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors text-center block no-underline"
              >
                {locale === 'en' ? `Derivative of ${problem.formula}` :
                  locale === 'es' ? `Derivada de ${problem.formula}` :
                    `Derivada de ${problem.formula}`}
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/directory" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors no-underline">
              {dict.home.viewAll} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
