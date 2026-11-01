import Link from 'next/link';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import PopularDerivatives from '@/components/PopularDerivatives';
import StructuredData, { generateBreadcrumbData, generateFAQData } from '@/components/StructuredData';
import { trigHubCopy } from '@/content/trig-hub';
import {
    calculatorHref,
    keywordTitle,
    localeAlternates,
    localePath,
    normalizeLocale,
    problemHref,
    SITE_URL,
    type Locale,
} from '@/lib/seo';
import { TRIG_CLUSTER_PAGES, TRIG_HUB_PATH, type TrigGroup } from '@/lib/trig-cluster';

export const runtime = 'edge';
export const revalidate = 3600;

const GROUPS: TrigGroup[] = ['standard', 'inverse', 'variant', 'hyperbolic'];

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const locale = normalizeLocale(headersList.get('x-next-locale'));
    const copy = trigHubCopy[locale];
    const title = keywordTitle(copy.title);
    const alternates = localeAlternates(TRIG_HUB_PATH, locale);
    return {
        title: { absolute: title },
        description: copy.description,
        alternates,
        openGraph: {
            title,
            description: copy.description,
            url: alternates.canonical,
            type: 'article',
        },
    };
}

function sectionCopy(locale: Locale, group: TrigGroup): { heading: string; intro: string } {
    const copy = trigHubCopy[locale];
    if (group === 'standard') return { heading: copy.standardHeading, intro: copy.standardIntro };
    if (group === 'inverse') return { heading: copy.inverseHeading, intro: copy.inverseIntro };
    if (group === 'variant') return { heading: copy.variantHeading, intro: copy.variantIntro };
    return { heading: copy.hyperbolicHeading, intro: copy.hyperbolicIntro };
}

export default async function TrigDerivativesPage() {
    const headersList = await headers();
    const locale = normalizeLocale(headersList.get('x-next-locale'));
    const copy = trigHubCopy[locale];
    const homeUrl = locale === 'en' ? SITE_URL : `${SITE_URL}/${locale}`;
    const pageUrl = `${SITE_URL}${localePath(TRIG_HUB_PATH, locale)}`;
    const homeName = locale === 'es' ? 'Inicio' : locale === 'pt' ? 'Início' : 'Home';

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <StructuredData data={generateBreadcrumbData([
                { name: homeName, url: homeUrl },
                { name: copy.breadcrumb, url: pageUrl },
            ])} />
            <StructuredData data={generateFAQData(copy.faqs)} />

            <div className="max-w-4xl mx-auto">
                <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
                    <Link href={localePath('/', locale)} className="hover:text-blue-600 dark:hover:text-blue-400">{homeName}</Link>
                    <span className="mx-2">/</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{copy.breadcrumb}</span>
                </nav>

                <h1 id="derivatives-of-trig-functions" className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
                    {copy.h1}
                </h1>
                <div className="space-y-4 mb-12">
                    {copy.lede.map((paragraph) => (
                        <p key={paragraph.slice(0, 40)} className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                            {paragraph}
                        </p>
                    ))}
                </div>

                {GROUPS.map((group) => {
                    const section = sectionCopy(locale, group);
                    const rows = TRIG_CLUSTER_PAGES.filter((page) => page.group === group);
                    const headingId = `trig-group-${group}`;
                    return (
                        <section key={group} aria-labelledby={headingId} className="mb-14">
                            <h2 id={headingId} className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                {section.heading}
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{section.intro}</p>
                            <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-xl">
                                <table className="min-w-full text-left text-sm">
                                    <caption className="sr-only">{section.heading}</caption>
                                    <thead className="bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 font-semibold">{copy.columnFunction}</th>
                                            <th scope="col" className="px-4 py-3 font-semibold">{copy.columnDerivative}</th>
                                            <th scope="col" className="px-4 py-3 font-semibold">{copy.columnPage}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr key={row.slug} className="border-t border-gray-200 dark:border-slate-700">
                                                <th scope="row" className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                    {row.fn}
                                                </th>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.derivative}</td>
                                                <td className="px-4 py-3">
                                                    <Link href={problemHref(row.slug, locale)} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                                        {copy.columnPage}
                                                    </Link>
                                                    <span className="text-gray-400 mx-2" aria-hidden="true">·</span>
                                                    <Link
                                                        href={calculatorHref(row.calculator, locale)}
                                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                                        aria-label={`${copy.solveLabel} ${row.fn}`}
                                                    >
                                                        {copy.solveLabel}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    );
                })}

                <PopularDerivatives locale={locale} id="trig-popular-derivatives" embedded />
                <section aria-labelledby="trig-hub-faq" className="space-y-5 mb-8">
                    <h2 id="trig-hub-faq" className="text-2xl font-bold text-gray-900 dark:text-white">
                        {copy.faqHeading}
                    </h2>
                    {copy.faqs.map((faq) => (
                        <div key={faq.question}>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                            <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
}
