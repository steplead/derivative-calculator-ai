import { headers } from 'next/headers';
export const runtime = 'edge';
import Link from 'next/link';
import type { Metadata } from 'next';
import { loadStaticProblemsSafe, type StaticProblem } from '@/lib/problems-source';

/** Minimum problems a tag must have to appear in "Popular Tags". */
const MIN_TAG_COUNT = 10;

function tagDisplayName(tag: string): string {
    return tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// B5: unique per-tag intro copy. Adds descriptive body text so tag pages are
// not flagged as thin content when noindex is later reconsidered. Pure static
// map — no D1, no data change, no i18n (the tag page body is English only).
// Rendered only when the tag has an entry AND has matching problems, so
// empty/nonexistent tag pages stay minimal.
const TAG_INTROS: Record<string, string> = {
    fraction: 'These fraction calculus problems cover derivatives and integrals of rational functions — quotients of polynomials. Each solution applies the quotient and chain rules step by step.',
    trigonometric: 'These trigonometric calculus problems work through derivatives and integrals of sine, cosine, tangent and their reciprocal functions, using the chain rule and trig identities.',
    derivative: 'These derivative problems span polynomials, trigonometric, exponential and logarithmic functions. Every solution breaks the differentiation into explicit steps and names the rule used.',
    limit: 'These limit problems use direct substitution, factoring and L’Hôpital’s rule to evaluate how a function behaves as the variable approaches a value.',
    integral: 'These integral problems cover antiderivatives of polynomials, trigonometric, exponential and logarithmic functions, with substitution and integration by parts shown step by step.',
    polynomial: 'These polynomial calculus problems cover derivatives and integrals of powers of x using the power rule, with no trigonometric or exponential terms.',
    radical: 'These radical calculus problems involve square-root expressions, applying the chain rule and rationalizing steps for derivatives and integrals.',
    exponential: 'These exponential calculus problems cover derivatives and integrals of e^x and a^x, including the natural exponential and base-changed forms.',
    logarithmic: 'These logarithmic calculus problems work through derivatives and integrals of ln(x) and log_a(x) using the logarithm differentiation rule.',
};

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
    // P2-E: route is D1-backed and soft-404s when the D1 daily read quota is
    // exhausted; noindex to keep the index clean and avoid orphaned/empty URLs.
    robots: {
      index: false,
      follow: true,
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

  // B4: read the static library directly and filter by the `tags` field.
  // No D1, no API self-fetch, no hot path. loadStaticProblemsSafe is already
  // proven in the edge runtime (used by /[slug]).
  const library = await loadStaticProblemsSafe();
  const filteredProblems: StaticProblem[] = library.filter(
    (p) => p && p.tags && String(p.tags).split(',').map((t) => t.trim()).includes(tag)
  );

  // Deterministic "Popular Tags": count real tags across the library, keep only
  // those above MIN_TAG_COUNT, sort by count desc then name asc. Never the
  // hard-coded list that drifted out of sync with the data.
  const tagCounts = new Map<string, number>();
  for (const p of library) {
    if (!p || !p.tags) continue;
    for (const raw of String(p.tags).split(',')) {
      const t = raw.trim();
      if (t) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }
  const popularTags = Array.from(tagCounts.entries())
    .filter(([, n]) => n >= MIN_TAG_COUNT)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);

  const tagName = tagDisplayName(tag);

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
            {filteredProblems.length} problems tagged with &quot;{tagName}&quot;
          </p>
          {TAG_INTROS[tag] && filteredProblems.length > 0 && (
            <p className="max-w-3xl mx-auto text-base text-gray-600 dark:text-gray-400 mt-4">
              {TAG_INTROS[tag]}
            </p>
          )}
        </div>

        {/* Problems Grid */}
        {filteredProblems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProblems.map((problem) => (
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

        {/* Popular Tags — generated from the real tag vocabulary, not hard-coded */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Popular Tags</h2>
          <div className="flex flex-wrap gap-3">
            {popularTags.map((otherTag) => (
              <Link
                key={otherTag}
                href={`/problems/tag/${otherTag}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  otherTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {tagDisplayName(otherTag)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
