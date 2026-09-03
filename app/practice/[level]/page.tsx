export const runtime = 'edge';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadStaticProblemsSafe } from '@/lib/problems-source';

const LEVEL_INFO: Record<string, { title: string; description: string; color: string }> = {
  beginner: { title: 'Beginner Problems', description: 'Start here with basic calculus.', color: 'green' },
  intermediate: { title: 'Intermediate Problems', description: 'Level up your skills.', color: 'yellow' },
  advanced: { title: 'Advanced Problems', description: 'Master complex calculus.', color: 'red' }
};

export async function generateMetadata({ params }: { params: { level: string } }): Promise<Metadata> {
  const info = LEVEL_INFO[params.level];
  if (!info) return { title: 'Not Found' };
  // P2-D: this utility route stays noindex to keep the indexable library pages
  // clean. It now reads the static library filtered by difficulty (no D1), so
  // the three levels are distinct — but remains noindex pending a content-quality
  // decision.
  return {
    title: info.title + ' | Derivative Calculator AI',
    robots: { index: false, follow: true },
  };
}

export default async function LevelPage({ params }: { params: { level: string } }) {
  const info = LEVEL_INFO[params.level];
  if (!info) notFound();

  // B5b: read the static library directly and filter by the `difficulty` field
  // (present on every row after the Batch 1-3 backfill). No D1, no API self-fetch.
  // Each level now shows its own distinct problem set instead of the first 100
  // problems shared across all three (the old P2-D near-duplicate).
  const library = await loadStaticProblemsSafe();
  const problems = library.filter(
    (p) => p && p.difficulty === params.level
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Practice', href: '/practice' }, { name: info.title, href: '/practice/' + params.level }]} />
        <h1 className="text-4xl font-bold text-center mb-4">{info.title}</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">{info.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{problems.map((p: any) => (
          <Link key={p.slug} href={'/' + p.slug} className="block p-4 border rounded hover:border-blue-500 bg-gray-50 dark:bg-slate-800">
            <div className="text-sm text-gray-600">{p.formula}</div>
            <div className="font-medium text-blue-600">{p.title || p.formula}</div>
          </Link>
        ))}</div>
      </div>
    </div>
  );
}
