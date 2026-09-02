import { headers } from 'next/headers';
export const runtime = 'edge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/utils/robust-url';
import { loadStaticProblemsSafe, filterByType } from '@/lib/problems-source';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { type: string } }): Promise<Metadata> {
  const { type } = params;
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
  const url = locale === 'en' ? `${siteUrl}/problems/${type}` : `${siteUrl}/${locale}/problems/${type}`;

  const typeNames: Record<string, string> = {
    derivative: 'Derivatives',
    integral: 'Integrals',
    limit: 'Limits',
    ode: 'Differential Equations',
  };

  const typeName = typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);

  return {
    title: `${typeName} Problems - Calculus Library`,
    description: `Browse all ${typeName.toLowerCase()} problems with step-by-step solutions and AI explanations.`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${typeName} Problems - Calculus Library`,
      description: `Browse all ${typeName.toLowerCase()} problems.`,
      url,
      type: 'website',
    },
  };
}

export default async function ProblemsByTypePage({ params }: { params: { type: string } }) {
  const { type } = params;
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const baseUrl = getBaseUrl();

  const validTypes = ['derivative', 'integral', 'limit', 'ode'];
  if (!validTypes.includes(type)) {
    notFound();
  }

  // RC-8 FIX: shared plain-fetch loader. The previous `cache: 'force-cache'` +
  // `next: { revalidate }` fetch never returned data here, so this page
  // rendered with ZERO problems.
  let allProblems: any[] = await loadStaticProblemsSafe();

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

  const filteredProblems = filterByType(allProblems, type);

  const typeNames: Record<string, string> = {
    derivative: 'Derivatives',
    integral: 'Integrals',
    limit: 'Limits',
    ode: 'Ordinary Differential Equations',
  };

  // const typeColors: Record<string, string> = {
  //   derivative: 'blue',
  //   integral: 'purple',
  //   limit: 'green',
  //   ode: 'orange',
  // }; // Type colors defined but unused

  // const _color = typeColors[type] || 'gray'; // Color variable defined but unused
  const typeName = typeNames[type] || type;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <li><Link href="/problems" className="hover:text-blue-600 dark:hover:text-blue-400">All Problems</Link></li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white font-medium">{typeName}</li>
          </ol>
        </nav>

        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            {typeName} Library
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {filteredProblems.length} problems with step-by-step solutions
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map((problem: any) => (
            <Link
              key={problem.slug}
              href={`/${locale === 'en' ? '' : locale + '/'}${problem.slug}`}
              className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-${color}-500 dark:hover:border-${color}-400 hover:shadow-lg transition-all group"
            >
              <div className="font-mono text-lg text-gray-900 dark:text-white mb-3 group-hover:text-${color}-600 dark:group-hover:text-${color}-400 transition-colors">
                {type === 'integral' && '∫'}
                {type === 'limit' && 'lim'}
                {type === 'derivative' && 'd/dx('}
                {problem.formula}
                {type === 'derivative' && ')'}
                {type === 'integral' && 'dx'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                View step-by-step solution →
              </div>
            </Link>
          ))}
        </div>

        {/* Related Categories */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {validTypes.filter(t => t !== type).map((otherType) => (
              <Link
                key={otherType}
                href={`/problems/${otherType}`}
                className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg hover:ring-2 hover:ring-${typeColors[otherType]}-500 transition-all text-center"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {typeNames[otherType]}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
