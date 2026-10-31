import Link from 'next/link';
import { Suspense } from 'react';
import AdvancedCalculator from '@/components/AdvancedCalculator';
import EmbedSnippet from '@/components/EmbedSnippet';
import StructuredData, { generateBreadcrumbData, generateFAQData } from '@/components/StructuredData';
import { SPECIAL_CALCULATORS, type SpecialKey } from '@/content/special-calculators';
import { localePath, normalizeLocale, SITE_URL, type Locale } from '@/lib/seo';

type SpecialToolPageProps = {
  tool: SpecialKey;
  locale: string;
};

const CRUMB: Record<Locale, { home: string; calculators: string }> = {
  en: { home: 'Home', calculators: 'Calculators' },
  es: { home: 'Inicio', calculators: 'Calculadoras' },
  pt: { home: 'Início', calculators: 'Calculadoras' },
};

export default function SpecialToolPage({ tool, locale }: SpecialToolPageProps) {
  const loc = normalizeLocale(locale);
  const page = SPECIAL_CALCULATORS[tool];
  const copy = page.copy[loc];
  const mode = tool === 'partial' ? 'partial' : tool === 'implicit' ? 'implicit' : 'chain';
  const crumbs = [
    { name: CRUMB[loc].home, url: loc === 'en' ? SITE_URL : `${SITE_URL}/${loc}` },
    { name: CRUMB[loc].calculators, url: `${loc === 'en' ? SITE_URL : `${SITE_URL}/${loc}`}/calculators` },
    { name: copy.h1, url: `${loc === 'en' ? SITE_URL : `${SITE_URL}/${loc}`}${page.path}` },
  ];

  return (
    <div className="py-12">
      <StructuredData data={generateFAQData(copy.faqs)} />
      <StructuredData data={generateBreadcrumbData(crumbs)} />
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 id={copy.h1Id} className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          {copy.h1}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">{copy.description}</p>
      </div>
      <Suspense fallback={<div className="text-center text-gray-500">Loading…</div>}>
        <AdvancedCalculator mode={mode} locale={loc} />
      </Suspense>
      <EmbedSnippet path={page.path} locale={loc} />
      <div className="max-w-4xl mx-auto mt-12 space-y-4">
        {copy.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="text-gray-700 dark:text-gray-300 leading-relaxed">{paragraph}</p>
        ))}
      </div>
      <section className="max-w-4xl mx-auto mt-10" aria-labelledby={`${copy.h1Id}-related`}>
        <h2 id={`${copy.h1Id}-related`} className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {loc === 'es' ? 'Regla y ejemplos' : loc === 'pt' ? 'Regra e exemplos' : 'Rule and examples'}
        </h2>
        <ul className="space-y-2">
          <li>
            <Link href={localePath(page.wiki, loc)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              {page.wiki.replace('/wiki/', '').replace(/-/g, ' ')}
            </Link>
          </li>
          {page.examples.map((example) => (
            <li key={example.href}>
              <Link href={localePath(example.href, loc)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                {example.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="max-w-4xl mx-auto mt-10 space-y-4" aria-labelledby={`${copy.h1Id}-faq`}>
        <h2 id={`${copy.h1Id}-faq`} className="text-2xl font-bold text-gray-900 dark:text-white">
          {loc === 'es' ? 'Preguntas frecuentes' : loc === 'pt' ? 'Perguntas frequentes' : 'Frequently asked questions'}
        </h2>
        {copy.faqs.map((faq) => (
          <div key={faq.question}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
            <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
