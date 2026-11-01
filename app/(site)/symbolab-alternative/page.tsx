import { readLocale } from '@/lib/read-locale';
import type { Metadata } from 'next';
import ComparisonArticle from '@/components/ComparisonArticle';
import { COMPARISONS } from '@/content/comparisons';
import { localeAlternates, pageTitle } from '@/lib/seo';

export const dynamic = 'force-static';


export async function generateMetadata(): Promise<Metadata> {
  const locale = readLocale();
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
  const locale = readLocale();
  return <ComparisonArticle page="symbolab" locale={locale} />;
}
