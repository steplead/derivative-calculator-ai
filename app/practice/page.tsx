import Link from 'next/link';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { loadStaticProblemsSafe } from '@/lib/problems-source';

const LEVELS = [
  {
    slug: 'beginner',
    title: 'Beginner Problems',
    description: 'Start with basic derivatives, integrals, and limits. Build confidence step by step.',
  },
  {
    slug: 'intermediate',
    title: 'Intermediate Problems',
    description: 'Level up with more involved calculus across a wider range of functions.',
  },
  {
    slug: 'advanced',
    title: 'Advanced Problems',
    description: 'Master complex calculus with challenging, multi-step problems.',
  },
];

export const metadata: Metadata = {
  title: 'Practice Calculus Problems by Difficulty | Derivative Calculator AI',
  description:
    'Practice calculus at your level — Beginner, Intermediate, and Advanced problem sets, each linking to a full step-by-step AI solution.',
  alternates: { canonical: 'https://derivativecalculatorai.com/practice' },
};

export default async function PracticeIndex() {
  const library = await loadStaticProblemsSafe();
  const counts: Record<string, number> = {};
  for (const lvl of LEVELS) {
    counts[lvl.slug] = library.filter((p) => p && p.difficulty === lvl.slug).length;
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Practice Problems', href: '/practice' }]} />
        <h1 className="text-4xl font-bold text-center mb-4">Practice Calculus Problems</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Pick a difficulty level and work through curated problem sets. Every problem links to a full step-by-step AI solution.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEVELS.map((lvl) => (
            <Link
              key={lvl.slug}
              href={'/practice/' + lvl.slug}
              className="block p-6 border rounded-xl hover:border-blue-500 bg-gray-50 dark:bg-slate-800 transition-colors"
            >
              <h2 className="text-2xl font-bold mb-2">{lvl.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{lvl.description}</p>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium">
                {counts[lvl.slug].toLocaleString()} problems
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
