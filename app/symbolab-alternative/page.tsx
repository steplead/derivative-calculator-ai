import { headers } from 'next/headers';
import type { Metadata } from 'next';
import ComparisonArticle from '@/components/ComparisonArticle';
import { COMPARISONS } from '@/content/comparisons';
import { localeAlternates, normalizeLocale, pageTitle } from '@/lib/seo';

export const runtime = 'edge';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = normalizeLocale(headersList.get('x-next-locale'));
  const title = pageTitle('symbolab', locale);
  const description = COMPARISONS[locale].symbolab.description;
  const alternates = localeAlternates('/symbolab-alternative', locale);
  return {
    title: { absolute: title },
    description,
    alternates,
    openGraph: { title, description, url: alternates.canonical, type: 'article' },
  };
}

export default async function SymbolabAlternativePage() {
  const headersList = await headers();
  const locale = normalizeLocale(headersList.get('x-next-locale'));
  return <ComparisonArticle page="symbolab" locale={locale} />;
}
