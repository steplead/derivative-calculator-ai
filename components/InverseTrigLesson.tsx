import Link from 'next/link';
import StructuredData, { generateBreadcrumbData, generateFAQData } from '@/components/StructuredData';
import type { InverseTrigLesson as Lesson } from '@/content/inverse-trig-lessons';
import { calculatorHref, localePath, SITE_URL, normalizeLocale } from '@/lib/seo';

type Crumb = { name: string; href: string };

type InverseTrigLessonProps = {
    lesson: Lesson;
    locale: string;
    /** Same labels and hrefs as the visible breadcrumb trail. */
    breadcrumbs: Crumb[];
};

function absoluteCrumbUrl(href: string): string {
    if (href.startsWith('http')) return href;
    if (!href || href === '/') return SITE_URL;
    return `${SITE_URL}${href.startsWith('/') ? href : `/${href}`}`;
}

const InverseTrigLesson = ({ lesson, locale, breadcrumbs }: InverseTrigLessonProps) => {
    const loc = normalizeLocale(locale);
    const breadcrumb = generateBreadcrumbData(
        breadcrumbs.map((crumb) => ({ name: crumb.name, url: absoluteCrumbUrl(crumb.href) }))
    );

    return (
        <div className="max-w-4xl mx-auto mt-12 space-y-12">
            <StructuredData data={breadcrumb} />
            <StructuredData data={generateFAQData(lesson.faqs)} />

            <section aria-labelledby="inverse-trig-formula" className="space-y-4">
                <h2 id="inverse-trig-formula" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lesson.formulaHeading}
                </h2>
                <p className="text-lg font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                    {lesson.formula}
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{lesson.formulaNote}</p>
                <p>
                    <Link
                        href={calculatorHref(lesson.calculatorFormula, loc)}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {lesson.calculatorLabel}
                    </Link>
                </p>
            </section>

            <section aria-labelledby="inverse-trig-derivation" className="space-y-4">
                <h2 id="inverse-trig-derivation" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lesson.derivationHeading}
                </h2>
                {lesson.derivation.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {paragraph}
                    </p>
                ))}
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    {lesson.derivationSteps.map((step) => (
                        <li key={step} className="leading-relaxed">{step}</li>
                    ))}
                </ol>
            </section>

            <section aria-labelledby="inverse-trig-examples" className="space-y-6">
                <h2 id="inverse-trig-examples" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lesson.examplesHeading}
                </h2>
                {lesson.examples.map((example) => (
                    <div key={example.title} className="border border-gray-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{example.title}</h3>
                        <ol className="mt-3 list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
                            {example.steps.map((step) => (
                                <li key={step} className="leading-relaxed">{step}</li>
                            ))}
                        </ol>
                        <p className="mt-3 text-gray-900 dark:text-white">
                            <span className="font-semibold">{loc === 'es' ? 'Respuesta: ' : loc === 'pt' ? 'Resposta: ' : 'Answer: '}</span>
                            {example.answer}
                        </p>
                        <p className="mt-2">
                            <Link
                                href={calculatorHref(example.calculatorFormula, loc)}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                aria-label={`${loc === 'es' ? 'Calcular' : loc === 'pt' ? 'Calcular' : 'Solve'} ${example.calculatorFormula}`}
                            >
                                {loc === 'es' ? 'Calcular este ejemplo' : loc === 'pt' ? 'Calcular este exemplo' : 'Solve this example'}
                            </Link>
                        </p>
                    </div>
                ))}
            </section>

            <section aria-labelledby="inverse-trig-mistakes" className="space-y-4">
                <h2 id="inverse-trig-mistakes" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lesson.mistakesHeading}
                </h2>
                {lesson.mistakes.map((mistake) => (
                    <div key={mistake.title}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{mistake.title}</h3>
                        <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">{mistake.text}</p>
                    </div>
                ))}
            </section>

            <section aria-labelledby="inverse-trig-related" className="space-y-3">
                <h2 id="inverse-trig-related" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lesson.relatedHeading}
                </h2>
                <ul className="space-y-3">
                    {lesson.related.map((item) => (
                        <li key={item.href} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            <Link href={localePath(item.href, loc)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                {item.label}
                            </Link>
                            <span>{` — ${item.note}`}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="inverse-trig-faq" className="space-y-5">
                <h2 id="inverse-trig-faq" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loc === 'es' ? 'Preguntas frecuentes' : loc === 'pt' ? 'Perguntas frequentes' : 'Frequently asked questions'}
                </h2>
                {lesson.faqs.map((faq) => (
                    <div key={faq.question}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                        <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default InverseTrigLesson;
