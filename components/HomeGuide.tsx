import Link from 'next/link';
import { homeGuide } from '@/content/home-guide';
import { normalizeLocale, type Locale } from '@/lib/seo';

type HomeGuideProps = {
    locale: string;
};

const HomeGuideSection = ({ locale }: HomeGuideProps) => {
    const loc: Locale = normalizeLocale(locale);
    const guide = homeGuide[loc];

    return (
        <div className="max-w-4xl mx-auto mt-16 space-y-12">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">{guide.lede}</p>

            {guide.sections.map((section) => (
                <section key={section.id} aria-labelledby={section.id} className="space-y-4">
                    <h2 id={section.id} className="text-2xl font-bold text-gray-900 dark:text-white">
                        {section.heading}
                    </h2>
                    {section.paragraphs.map((paragraph) => (
                        <p key={paragraph.slice(0, 48)} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {paragraph}
                        </p>
                    ))}
                </section>
            ))}

            <section aria-labelledby="worked-derivative-examples" className="space-y-4">
                <h2 id="worked-derivative-examples" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {guide.examplesHeading}
                </h2>
                <ul className="space-y-3">
                    {guide.examples.map((example) => (
                        <li key={example.href} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            <Link href={example.href} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                {example.label}
                            </Link>
                            <span>{` — ${example.detail}`}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="derivative-calculator-faq" className="space-y-6">
                <h2 id="derivative-calculator-faq" className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loc === 'es' ? 'Preguntas frecuentes' : loc === 'pt' ? 'Perguntas frequentes' : 'Frequently asked questions'}
                </h2>
                <div className="space-y-5">
                    {guide.faqs.map((faq) => (
                        <div key={faq.question}>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                            <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HomeGuideSection;
