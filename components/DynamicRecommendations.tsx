'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shuffle } from 'lucide-react';

interface Problem {
  slug: string;
  formula: string;
  type?: string;
  title?: string;
}

interface DynamicRecommendationsProps {
  baseUrl: string;
  locale?: string;
  count?: number;
  refreshInterval?: number; // milliseconds
}

export default function DynamicRecommendations({
  baseUrl,
  locale = 'en',
  count = 8,
  refreshInterval = 60000, // 1 minute default
}: DynamicRecommendationsProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchRandomProblems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/problems?limit=100`, {
        cache: 'no-store', // Always fresh
      });

      if (res.ok) {
        const allProblems = await res.json();
        // Fisher-Yates shuffle for true randomness
        const shuffled = [...allProblems].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, count);
        setProblems(selected);
        setLastRefresh(Date.now());
      }
    } catch (e) {
      console.error('Failed to fetch recommendations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomProblems();

    // Auto-refresh based on interval
    const interval = setInterval(() => {
      fetchRandomProblems();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [baseUrl, count, refreshInterval]);

  if (loading && problems.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const getProblemUrl = (problem: Problem) => {
    const localePrefix = locale === 'en' ? '' : `${locale}/`;
    return `/${localePrefix}${problem.slug}`;
  };

  const getProblemTitle = (problem: Problem) => {
    const type = problem.type || 'derivative';
    const prefix = type === 'integral' ? '∫' : type === 'limit' ? 'lim' : 'd/dx';
    return `${prefix}(${problem.formula})`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Recommended for You
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Problems update automatically • Last refreshed: {new Date(lastRefresh).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchRandomProblems}
          disabled={loading}
          className="p-3 rounded-full bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          title="Refresh recommendations"
        >
          <Shuffle className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {problems.map((problem) => (
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
