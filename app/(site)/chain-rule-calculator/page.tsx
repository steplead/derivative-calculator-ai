import { readLocale } from '@/lib/read-locale';
import type { Metadata } from 'next';
import SpecialToolPage from '@/components/SpecialToolPage';
import { SPECIAL_CALCULATORS } from '@/content/special-calculators';
import { localeAlternates, pageTitle } from '@/lib/seo';

export const dynamic = 'force-static';


export async function generateMetadata(): Promise<Metadata> {
  const locale = readLocale();
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
  const locale = readLocale();
  return <SpecialToolPage tool="chain" locale={locale} />;
}
