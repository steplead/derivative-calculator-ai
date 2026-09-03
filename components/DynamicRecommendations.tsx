'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shuffle } from 'lucide-react';

interface Problem {
  slug: string;
  formula: string;
  type?: string;
  title?: string;
}

interface DynamicRecommendationsProps {
  problems: Problem[];
  locale?: string;
  count?: number;
}

export default function DynamicRecommendations({
  problems,
  locale = 'en',
  count = 8,
}: DynamicRecommendationsProps) {
  // P3-P1-2: the list is now provided by the server from the static library
  // (deterministic, crawlable, zero D1/API). This client component only
  // re-shuffles locally on demand — there is NO polling and NO /api/problems
  // call, so we no longer revive the D1/API quota pattern P2 eliminated.
  const [list, setList] = useState<Problem[]>(() => (problems || []).slice(0, count));
  const [shuffledAt, setShuffledAt] = useState<number | null>(null);

  const handleShuffle = () => {
    setList([...(problems || [])].sort(() => Math.random() - 0.5).slice(0, count));
    setShuffledAt(Date.now());
  };

  const getProblemUrl = (problem: Problem) => {
    const localePrefix = locale === 'en' ? '' : `${locale}/`;
    return `/${localePrefix}${problem.slug}`;
  };

  const getProblemTitle = (problem: Problem) => {
    const type = problem.type || 'derivative';
    const prefix = type === 'integral' ? '∫' : type === 'limit' ? 'lim' : 'd/dx';
    return `${prefix}(${problem.formula})`;
  };

  if (!list || list.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Recommended for You
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {shuffledAt
              ? `Shuffled at ${new Date(shuffledAt).toLocaleTimeString()}`
              : 'Hand-picked problems to practice next.'}
          </p>
        </div>
        <button
          onClick={handleShuffle}
          className="p-3 rounded-full bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all"
          title="Shuffle recommendations"
        >
          <Shuffle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {list.map((problem) => (
          <Link
            key={problem.slug}
            href={getProblemUrl(problem)}
            className="group block bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <div className="font-mono text-sm text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
              {getProblemTitle(problem)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Solve →
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          Browse all problems →
        </Link>
      </div>
    </div>
  );
}
