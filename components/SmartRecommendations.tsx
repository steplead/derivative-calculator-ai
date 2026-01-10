'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Problem {
  slug: string;
  formula: string;
  type?: string;
  title?: string;
}

interface SmartRecommendationsProps {
  currentSlug: string;
  allProblems: Problem[];
  locale?: string;
  limit?: number;
}

export default function SmartRecommendations({
  currentSlug,
  allProblems,
  locale = 'en',
  limit = 10
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Problem[]>([]);

  useEffect(() => {
    const generateRecommendations = () => {
      const otherProblems = allProblems.filter(p => p.slug !== currentSlug);
      const viewed = JSON.parse(sessionStorage.getItem('viewedProblems') || '[]');

      const weighted = otherProblems.map(problem => {
        let weight = 1;
        if (!viewed.includes(problem.slug)) weight += 3;
        const currentType = allProblems.find(p => p.slug === currentSlug)?.type;
        if (problem.type === currentType) weight += 2;
        if (problem.title) weight += 1;
        return { ...problem, weight };
      });

      weighted.sort((a, b) => {
        if (b.weight !== a.weight) return b.weight - a.weight;
        return Math.random() - 0.5;
      });

      const selected = weighted.slice(0, limit);
      const newViewed = [...new Set([currentSlug, ...viewed])].slice(0, 100);
      sessionStorage.setItem('viewedProblems', JSON.stringify(newViewed));

      return selected;
    };

    setRecommendations(generateRecommendations());
  }, [currentSlug, allProblems, limit]);

  if (recommendations.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
        Recommended for You
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {recommendations.map((problem) => (
          <Link
            key={problem.slug}
            href={`/${locale === 'en' ? '' : `${locale}/`}${problem.slug}`}
            className="block p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-slate-800 group"
          >
            <div className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-2">
              {problem.formula}
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {problem.title || 'Calculate ' + problem.formula}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
