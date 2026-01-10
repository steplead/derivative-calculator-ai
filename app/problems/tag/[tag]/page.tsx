import { headers } from 'next/headers';
export const runtime = 'edge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/utils/robust-url';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  const { tag } = params;
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
  const url = locale === 'en' ? `${siteUrl}/problems/tag/${tag}` : `${siteUrl}/${locale}/problems/tag/${tag}`;

  const tagName = tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    title: `${tagName} Calculus Problems - Tagged Library`,
    description: `Browse calculus problems tagged with "${tagName}". Step-by-step solutions with AI explanations.`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${tagName} Calculus Problems`,
      description: `Browse problems tagged with "${tagName}".`,
      url,
      type: 'website',
    },
  };
}

export default async function ProblemsByTagPage({ params }: { params: { tag: string } }) {
  const { tag } = params;
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const baseUrl = getBaseUrl();

  let allProblems: any[] = [];

  if (baseUrl) {
    try {
      // Use database tag filtering instead of string matching
      const res = await fetch(`${baseUrl}/api/problems?limit=1000&tag=${encodeURIComponent(tag)}`, {
        cache: 'force-cache',
        // @ts-ignore
        next: { revalidate: 3600 }
      });

      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        allProblems = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch problems:", e);
    }
  }

  const filteredProblems = allProblems;

  const tagName = tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <li><Link href="/problems" className="hover:text-blue-600 dark:hover:text-blue-400">All Problems</Link></li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white font-medium">{tagName}</li>
          </ol>
        </nav>

        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            {tagName} Problems
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {filteredProblems.length} problems tagged with "{tagName}"
          </p>
        </div>

        {/* Problems Grid */}
        {filteredProblems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProblems.map((problem: any) => (
              <Link
                key={problem.slug}
                href={`/${locale === 'en' ? '' : locale + '/'}${problem.slug}`}
                className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all group"
              >
                <div className="font-mono text-lg text-gray-900 dark:text-white mb-3">
                  {problem.formula}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{problem.type || 'derivative'}</span>
                  <span>→</span>
                  <span>View solution</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No problems found with this tag.</p>
            <Link href="/problems" className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline">
              Browse all problems →
            </Link>
          </div>
        )}

        {/* Popular Tags */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Popular Tags</h2>
          <div className="flex flex-wrap gap-3">
            {['trigonometric', 'polynomial', 'chain-rule', 'product-rule', 'quotient-rule', 'exponential', 'logarithmic', 'easy', 'medium', 'hard'].map((otherTag) => (
              <Link
                key={otherTag}
                href={`/problems/tag/${otherTag}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  otherTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {otherTag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
