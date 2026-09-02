import { headers } from 'next/headers';
export const runtime = 'edge';
import Link from 'next/link';
import { getBaseUrl } from '@/utils/robust-url';
import { loadStaticProblemsSafe, filterByType } from '@/lib/problems-source';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
  const url = locale === 'en' ? `${siteUrl}/problems` : `${siteUrl}/${locale}/problems`;

  return {
    title: `All Calculus Problems - Complete Library`,
    description: `Browse our complete library of calculus problems including derivatives, integrals, limits, and ODEs. Step-by-step solutions with AI explanations.`,
    alternates: {
      canonical: url,
      languages: {
        'en': `${siteUrl}/problems`,
        'es': `${siteUrl}/es/problems`,
        'pt': `${siteUrl}/pt/problems`,
      }
    },
    openGraph: {
      title: `All Calculus Problems - Complete Library`,
      description: `Browse our complete library of calculus problems.`,
      url,
      type: 'website',
    },
  };
}

export default async function ProblemsPage() {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const baseUrl = getBaseUrl();

  // RC-8 FIX: use the shared plain-fetch loader. The previous
  // `fetch(url, { cache: 'force-cache', next: { revalidate: 3600 } })` never
  // returned data on this platform, so this page rendered with ZERO problems.
  let allProblems: any[] = await loadStaticProblemsSafe();

  // Only if the static library is unreachable, fall back to the API.
  if (allProblems.length === 0 && baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/problems?limit=1000`);
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        allProblems = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch problems:", e);
    }
  }

  const categorized = {
    derivative: filterByType(allProblems, 'derivative'),
    integral: filterByType(allProblems, 'integral'),
    limit: filterByType(allProblems, 'limit'),
    ode: filterByType(allProblems, 'ode'),
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Calculus Problems Library
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Browse our complete collection of {allProblems.length}+ problems with step-by-step solutions
          </p>
        </div>

        {/* Category Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Link href="/problems/derivative" className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg hover:ring-2 hover:ring-blue-500 transition-all text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{categorized.derivative.length}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Derivatives</div>
          </Link>
          <Link href="/problems/integral" className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg hover:ring-2 hover:ring-purple-500 transition-all text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{categorized.integral.length}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Integrals</div>
          </Link>
          <Link href="/problems/limit" className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg hover:ring-2 hover:ring-green-500 transition-all text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{categorized.limit.length}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Limits</div>
          </Link>
          <Link href="/problems/ode" className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg hover:ring-2 hover:ring-orange-500 transition-all text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{categorized.ode.length}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">ODEs</div>
          </Link>
        </div>

        {/* All Problems Grid */}
        <div className="space-y-12">
          {categorized.derivative.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Derivatives</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorized.derivative.map((problem: any) => (
                  <Link
                    key={problem.slug}
                    href={`/${locale === 'en' ? '' : locale + '/'}${problem.slug}`}
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <div className="font-mono text-sm text-gray-900 dark:text-white mb-2">
                      d/dx({problem.formula})
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Step-by-step solution
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {categorized.integral.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Integrals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorized.integral.map((problem: any) => (
                  <Link
                    key={problem.slug}
                    href={`/${locale === 'en' ? '' : locale + '/'}${problem.slug}`}
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-md transition-all"
                  >
                    <div className="font-mono text-sm text-gray-900 dark:text-white mb-2">
                      ∫{problem.formula}dx
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Step-by-step solution
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {categorized.limit.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Limits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorized.limit.map((problem: any) => (
                  <Link
                    key={problem.slug}
                    href={`/${locale === 'en' ? '' : locale + '/'}${problem.slug}`}
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-400 hover:shadow-md transition-all"
                  >
                    <div className="font-mono text-sm text-gray-900 dark:text-white mb-2">
                      lim(x→{problem.limitTo || '0'}) {problem.formula}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Step-by-step solution
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {categorized.ode.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">ODEs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorized.ode.map((problem: any) => (
                  <Link
                    key={problem.slug}
                    href={`/${locale === 'en' ? '' : locale + '/'}${problem.slug}`}
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-400 hover:shadow-md transition-all"
                  >
                    <div className="font-mono text-sm text-gray-900 dark:text-white mb-2">
                      {problem.formula}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Step-by-step solution
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
