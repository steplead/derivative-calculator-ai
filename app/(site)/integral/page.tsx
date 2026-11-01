import { readLocale } from '@/lib/read-locale';
import { Suspense } from 'react';
import Calculator from '@/components/Calculator';
import AdShell from '@/components/AdShell';
import EmbedSnippet from '@/components/EmbedSnippet';
import PopularDerivatives from '@/components/PopularDerivatives';
import PracticeGenerator from '@/components/PracticeGenerator';
import { getDictionary } from '@/app/dictionaries';
import { localeAlternates, normalizeLocale, pageTitle, type Locale } from '@/lib/seo';

export const dynamic = 'force-static';

const INTEGRAL_HEADING: Record<Locale, string> = {
    en: 'Popular integrals',
    es: 'Integrales populares',
    pt: 'Integrais populares',
};

// OPTIMIZED: Allow caching to reduce quota usage
// Cache for 1 hour - locale is handled via middleware rewrite, so caching is safe

export async function generateMetadata() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        locale = readLocale();
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Integral metadata error:", e);
    }

    const subtitle = dict?.integral?.subtitle || "Solve integrals instantly.";
    const title = pageTitle('integral', locale);
    const alternates = localeAlternates('/integral', locale);

    return {
        title: { absolute: title },
        description: subtitle,
        alternates,
        openGraph: {
            title,
            description: subtitle,
            url: alternates.canonical,
            type: 'website',
        },
    };
}

export default async function IntegralPage() {
    let locale = "en";
    let dict = getDictionary("en");

    try {
        locale = readLocale();
        dict = getDictionary(locale);
    } catch (e) {
        console.error("Integral page header error:", e);
    }

    if (!dict || !dict.integral) {
        dict = getDictionary("en");
    }

    return (
        <div className="py-12">
            <div className="text-center mb-8">
                <h1 id="integral-calculator" className="text-4xl font-semibold text-ink tracking-tight mb-4">
                    {dict.integral.h1} <span className="text-primary">AI</span>
                </h1>
                <p className="text-lg text-muted">
                    {dict.integral.subtitle}
                </p>
            </div>

            <Suspense fallback={<div className="text-ink text-center">{dict.common.loading}</div>}>
                <Calculator
                    mode="integral"
                    dict={dict.calculator}
                    locale={locale}
                    showShare
                    shareUrl={localeAlternates('/integral', locale).canonical}
                    examples={['x^2', 'sin(x)', 'e^x', '1/x']}
                />
            </Suspense>
            <PopularDerivatives
                locale={locale}
                id="integral-popular-derivatives"
                heading={INTEGRAL_HEADING[normalizeLocale(locale)]}
            />
            <PracticeGenerator locale={locale} topic="integral" />

            <div className="mt-16">
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-semibold text-ink mb-4">{dict.integral.howToTitle}</h2>
                        <p className="text-muted mb-4">
                            {dict.integral.howToText}
                        </p>
                        <ul className="list-disc pl-5 text-muted space-y-2">
                            <li>{dict.integral.bullet1} <code className="bg-chip px-1 rounded text-ink">x^2 + 3x</code></li>
                            <li>{dict.integral.bullet2} <code className="bg-chip px-1 rounded text-ink">sin(x)</code></li>
                            <li>{dict.integral.bullet3} <code className="bg-chip px-1 rounded text-ink">e^x</code></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="mt-16">
                <AdShell type="donation" />
            </div>
            <EmbedSnippet path="/integral" locale={locale} />
        </div>
    );
}
