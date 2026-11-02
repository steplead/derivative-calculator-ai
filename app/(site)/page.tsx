import { readLocale } from '@/lib/read-locale';
import Calculator from '@/components/Calculator';
import AdShell from '@/components/AdShell';
import DynamicRecommendations from '@/components/DynamicRecommendations';
import HomeGuideSection from '@/components/HomeGuide';
import PracticeGenerator from '@/components/PracticeGenerator';
import EmbedSnippet from '@/components/EmbedSnippet';
import PopularDerivatives from '@/components/PopularDerivatives';
import StructuredData, { generateFAQData } from '@/components/StructuredData';
import Link from 'next/link';
import { Suspense } from 'react';
import { getDictionary } from '@/app/dictionaries';
import { getBaseUrl } from '@/utils/robust-url';
import { loadStaticProblemsSafe } from '@/lib/problems-source';
import { homeGuide } from '@/content/home-guide';
import { HOME_DESCRIPTIONS, localeAlternates, localePath, pageTitle, problemHref, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';

export const dynamic = 'force-static';


// OPTIMIZED: Allow caching to reduce quota usage
// Cache for 1 hour - locale is handled via middleware rewrite, so caching is safe

export async function generateMetadata(): Promise<Metadata> {
  const locale = readLocale();
  const title = pageTitle('home', locale);
  const description = HOME_DESCRIPTIONS[locale];
  const alternates = localeAlternates('/', locale);

  return {
    title: { absolute: title },
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      type: 'website',
    },
  };
}

export default async function Home() {
  const locale = readLocale();
  const dict = getDictionary(locale);
  const guide = homeGuide[locale];

  if (!dict || !dict.home || !dict.common) {
    return <div className="p-20 text-center">System initialization... (Dictionary missing)</div>;
  }

  // OPTIMIZED: Parallel fetch to reduce processing time
  // Fetch from both static JSON and API in parallel, use whichever responds first
  const baseUrl = getBaseUrl();
  let popularProblems = [];

  // RC-8 FIX: shared plain-fetch loader. As on every other page, the
  // `cache: 'force-cache'` + `next: { revalidate }` fetch returned nothing
  // here, so the homepage "popular problems" strip was always empty.
  popularProblems = (await loadStaticProblemsSafe()).slice(0, 20);
  // P3-P1-2: deterministic, crawl-stable "recommended" list from the static
  // library — replaces the old client-side 60s polling of /api/problems.
  const recommendedProblems = (await loadStaticProblemsSafe()).slice(20, 28);

  if (popularProblems.length === 0 && baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/problems?limit=20`);
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        popularProblems = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch popular problems:", e);
    }
  }

  const alternates = localeAlternates('/', locale);
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: pageTitle('home', locale),
    url: alternates.canonical,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    description: HOME_DESCRIPTIONS[locale],
    inLanguage: locale,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: 'Derivative Calculator AI',
      url: SITE_URL,
    },
  };

  return (
    <div className="py-12">
      <StructuredData data={webAppSchema} />
      <StructuredData data={generateFAQData(guide.faqs)} />
      <div className="text-center mb-8">
        <h1 id={locale === 'en' ? 'derivative-calculator' : 'calculadora-de-derivadas'} className="text-4xl font-semibold text-ink tracking-tight mb-4">
          {dict.home.h1}
        </h1>
        <p className="text-lg text-muted">
          {dict.home.subtitle}
        </p>
      </div>

      <Suspense fallback={<div className="text-ink text-center">{dict.common.loading}</div>}>
        <Calculator
          dict={dict.calculator}
          showShare
          shareUrl={alternates.canonical}
          locale={locale}
          examples={['x^2', 'sin(x)', 'ln(x)', 'e^x', 'tan(x)']}
        />
      </Suspense>
      <PopularDerivatives locale={locale} />
      <p className="mt-12 text-base text-ink leading-relaxed">
        {guide.positioning}
      </p>
      <p className="mt-4 text-sm text-muted">
        <Link href={localePath('/derivative-calculator-comparison', locale)} className="link hover:underline">
          {locale === 'es' ? 'Comparación de calculadoras' : locale === 'pt' ? 'Comparação de calculadoras' : 'Calculator comparison'}
        </Link>
        <span> · </span>
        <Link href={localePath('/symbolab-alternative', locale)} className="link hover:underline">
          {locale === 'es' ? 'Alternativa a Symbolab' : locale === 'pt' ? 'Alternativa ao Symbolab' : 'Symbolab alternative'}
        </Link>
      </p>
      <div className="mt-12">
        <AdShell type="donation" />
      </div>
      <EmbedSnippet path="/" locale={locale} />
      <PracticeGenerator locale={locale} />

      {/* Quick Links Section - Protocol 2 Compliance */}
      <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
        <Link href="/problems" className="solve-btn inline-flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Browse All Problems
        </Link>
        <Link href="/directory" className="copy-btn inline-flex items-center justify-center font-semibold">
          View Directory
        </Link>
      </div>

      <div className="mt-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold text-ink mb-4">{dict.home.howToTitle}</h2>
            <p className="text-muted mb-4">
              {dict.home.howToText}
            </p>
            <ul className="list-disc pl-5 text-muted space-y-2">
              <li>Supports polynomials (e.g., <code className="bg-chip px-1 rounded text-ink">x^2 + 3x</code>)</li>
              <li>Trigonometric functions (e.g., <code className="bg-chip px-1 rounded text-ink">sin(x)</code>, <code className="bg-chip px-1 rounded text-ink">tan(x)</code>)</li>
              <li>Logarithmic & Exponential functions (e.g., <code className="bg-chip px-1 rounded text-ink">ln(x)</code>, <code className="bg-chip px-1 rounded text-ink">e^x</code>)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-ink mb-4">{dict.home.rulesTitle}</h2>
            <div className="space-y-4">
              <Link href="/wiki/power-rule" className="surface-link text-left no-underline">
                <h3 className="font-semibold text-primary">{dict.home.rules.power.title}</h3>
                <p className="text-sm text-muted mt-1">{dict.home.rules.power.text}</p>
              </Link>
              <Link href="/wiki/product-rule" className="surface-link text-left no-underline">
                <h3 className="font-semibold text-primary">{dict.home.rules.product.title}</h3>
                <p className="text-sm text-muted mt-1">{dict.home.rules.product.text}</p>
              </Link>
              <Link href="/wiki/chain-rule" className="surface-link text-left no-underline">
                <h3 className="font-semibold text-primary">{dict.home.rules.chain.title}</h3>
                <p className="text-sm text-muted mt-1">{dict.home.rules.chain.text}</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Popular Calculations Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-semibold text-ink mb-8 text-center">{dict.home.popularTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularProblems.map((problem: any) => (
              <Link
                key={problem.slug}
                href={problemHref(problem.slug, locale)}
                className="surface-link text-sm no-underline"
              >
                {locale === 'en' ? `Derivative of ${problem.formula}` :
                  locale === 'es' ? `Derivada de ${problem.formula}` :
                    `Derivada de ${problem.formula}`}
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/directory" className="solve-btn inline-flex items-center no-underline">
              {dict.home.viewAll} &rarr;
            </Link>
          </div>
        </div>

        {/* Dynamic Recommendations - Protocol 5 "Stir Fry" Internal Linking */}
        <div className="mt-16">
          <Suspense fallback={<div className="text-center py-12">Loading recommendations...</div>}>
            {/* @ts-ignore */}
            <DynamicRecommendations problems={recommendedProblems} locale={locale} count={8} />
          </Suspense>
        </div>

        {/* P3-GSC-1: fixed, crawl-stable SSR internal links for inner-page discovery.
            Static server-rendered array — not random, not client-only, no DB/API.
            Goal: let Google discover low-competition inner pages from the homepage. */}
        <div className="mt-16 space-y-12">
          <section aria-labelledby="gsc-popular">
            <h2 id="gsc-popular" className="text-2xl font-semibold text-ink mb-6 text-center">Popular derivative problems</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { slug: 'derivative-of-x-squared', label: 'Derivative of x^2' },
                { slug: 'derivative-of-e-to-the-x', label: 'Derivative of e^x' },
                { slug: 'derivative-of-sin-x', label: 'Derivative of sin(x)' },
                { slug: 'derivative-of-cos-x', label: 'Derivative of cos(x)' },
                { slug: 'derivative-of-ln-x', label: 'Derivative of ln(x)' },
                { slug: 'derivative-of-tan-x', label: 'Derivative of tan(x)' },
              ].map((item) => (
                <Link
                  key={item.slug}
                  href={problemHref(item.slug, locale)}
                  className="surface-link text-sm no-underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="gsc-practice">
            <h2 id="gsc-practice" className="text-2xl font-semibold text-ink mb-6 text-center">Practice paths</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'All practice levels', href: '/practice' },
                { label: 'Beginner', href: '/practice/beginner' },
                { label: 'Intermediate', href: '/practice/intermediate' },
                { label: 'Advanced', href: '/practice/advanced' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="surface-link text-sm no-underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="gsc-topics">
            <h2 id="gsc-topics" className="text-2xl font-semibold text-ink mb-6 text-center">Explore by topic</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Polynomial', href: '/problems/tag/polynomial' },
                { label: 'Trigonometric', href: '/problems/tag/trigonometric' },
                { label: 'Logarithmic', href: '/problems/tag/logarithmic' },
                { label: 'Exponential', href: '/problems/tag/exponential' },
                { label: 'Fraction', href: '/problems/tag/fraction' },
                { label: 'Trig derivatives', href: localePath('/derivatives-of-trig-functions', locale) },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="surface-link text-sm no-underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <HomeGuideSection locale={locale} />
    </div>
  );
}
