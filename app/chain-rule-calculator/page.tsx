import { headers } from 'next/headers';
import type { Metadata } from 'next';
import SpecialToolPage from '@/components/SpecialToolPage';
import { SPECIAL_CALCULATORS } from '@/content/special-calculators';
import { localeAlternates, normalizeLocale, pageTitle } from '@/lib/seo';

export const runtime = 'edge';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = normalizeLocale(headersList.get('x-next-locale'));
  const title = pageTitle('chain', locale);
  const description = SPECIAL_CALCULATORS.chain.copy[locale].description;
  const alternates = localeAlternates('/chain-rule-calculator', locale);
  return {
    title: { absolute: title },
    description,
    alternates,
    openGraph: { title, description, url: alternates.canonical, type: 'website' },
  };
}

export default async function ChainRuleCalculatorPage() {
  const headersList = await headers();
  const locale = normalizeLocale(headersList.get('x-next-locale'));
  return <SpecialToolPage tool="chain" locale={locale} />;
}
