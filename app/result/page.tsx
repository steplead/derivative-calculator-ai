import type { Metadata } from 'next';
import Link from 'next/link';
import { calculatorPathForShare } from '@/lib/share-link';
import { SITE_URL } from '@/lib/seo';

export const runtime = 'edge';

type Search = { type?: string; eq?: string; result?: string; to?: string };

function clean(value: string | undefined, max: number): string {
  return (value || '').replace(/[\r\n<>]+/g, ' ').trim().slice(0, max);
}

export function generateMetadata({ searchParams }: { searchParams: Search }): Metadata {
  const type = clean(searchParams.type, 20) || 'derivative';
  const equation = clean(searchParams.eq, 120);
  const result = clean(searchParams.result, 120);
  const title = equation
    ? `${type === 'integral' ? 'Integral' : type === 'limit' ? 'Limit' : 'Derivative'} of ${equation}`.slice(0, 60)
    : 'Shared calculus result';
  const description = result
    ? `${title} = ${result}. Free step-by-step calculus, no sign-up.`
    : 'Free step-by-step calculus result. No sign-up.';
  const image = `${SITE_URL}/og?type=${encodeURIComponent(type)}&eq=${encodeURIComponent(equation)}&result=${encodeURIComponent(result)}`;
  return {
    title: { absolute: title },
    description: description.slice(0, 160),
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: description.slice(0, 160),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description: description.slice(0, 160), images: [image] },
  };
}

export default function ResultPage({ searchParams }: { searchParams: Search }) {
  const type = clean(searchParams.type, 20) || 'derivative';
  const equation = clean(searchParams.eq, 180);
  const result = clean(searchParams.result, 180);
  const limitTo = clean(searchParams.to, 40);
  const openHref = calculatorPathForShare({ type, equation, result, limitTo });
  const label = type === 'integral' ? 'Integral' : type === 'limit' ? 'Limit' : 'Derivative';

  return (
    <article className="max-w-3xl mx-auto py-16">
      <h1 id="shared-result" className="text-3xl font-extrabold text-gray-900 dark:text-white">
        {equation ? `${label} of ${equation}` : 'Shared calculus result'}
      </h1>
      {result ? (
        <p className="mt-6 text-2xl font-mono text-gray-900 dark:text-white break-words">= {result}</p>
      ) : (
        <p className="mt-6 text-gray-700 dark:text-gray-300">Open the calculator to compute this expression.</p>
      )}
      {limitTo ? <p className="mt-2 text-gray-600 dark:text-gray-400">as x → {limitTo}</p> : null}
      <p className="mt-8">
        <Link href={equation ? openHref : '/'} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          Open in the calculator
        </Link>
      </p>
    </article>
  );
}
