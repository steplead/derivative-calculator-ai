
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/app/dictionaries';
import { getBaseUrl } from '@/utils/robust-url';
import { Metadata } from 'next';

export const runtime = 'edge';

type WikiTopic = {
    slug: string;
    title: string;
    description: string;
    category: string;
    content: string;
    relatedProblems: string[];
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { slug } = params;
    const baseUrl = getBaseUrl();

    try {
        const res = await fetch(`${baseUrl}/wiki.json`, { cache: 'force-cache' });
        if (res.ok) {
            const topics = await res.json();
            const topic = topics.find((t: any) => t.slug === slug);
            if (topic) {
                return {
                    title: `${topic.title} - Math Wiki | Derivative Calculator AI`,
                    description: topic.description,
                };
            }
        }
    } catch (e) { }

    return { title: 'Wiki Topic' };
}

export default async function WikiTopicPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const baseUrl = getBaseUrl();

    let topic: WikiTopic | null = null;
    let allTopics: WikiTopic[] = [];

    try {
        const res = await fetch(`${baseUrl}/wiki.json`, {
            cache: 'force-cache',
            next: { revalidate: 3600 }
        });
        if (res.ok) {
            allTopics = await res.json();
            topic = allTopics.find(t => t.slug === slug) || null;
        }
    } catch (e) {
        console.error("Failed to fetch wiki topic:", e);
    }

    if (!topic) {
        notFound();
    }

    // Schema.org Article & Breadcrumb
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
    const url = `${siteUrl}${locale === 'en' ? '' : '/' + locale}/wiki/${slug}`;

    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": topic.title,
        "description": topic.description,
        "author": {
            "@type": "Organization",
            "name": "Derivative Calculator AI"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Derivative Calculator AI",
            "logo": {
                "@type": "ImageObject",
                "url": `${siteUrl}/icon-192.png`
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url
        }
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": siteUrl
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Wiki",
                "item": `${siteUrl}/wiki`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": topic.title,
                "item": url
            }
        ]
    };

    return (
        <main className="min-h-screen bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            <article className="max-w-4xl mx-auto mb-10 mt-10">
                <nav className="flex mb-8 text-sm text-gray-500 dark:text-gray-400">
                    <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/wiki" className="hover:text-blue-600 dark:hover:text-blue-400">Wiki</Link>
                    <span className="mx-2">/</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{topic.title}</span>
                </nav>

                <header className="mb-12">
                    <div className="text-blue-600 dark:text-blue-400 font-semibold mb-2 uppercase tracking-wider text-sm">
                        {topic.category}
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
                        {topic.title}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                        {topic.description}
                    </p>
                </header>

                <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: topic.content }} />
                </div>

                {/* Protocol 5: Stir-Fry Deep Linking */}
                <section className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Solve Examples with {topic.title}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {topic.relatedProblems.map((pSlug) => (
                            <Link
                                key={pSlug}
                                href={`/${locale === 'en' ? '' : locale + '/'}${pSlug}`}
                                className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 transition-colors text-blue-600 dark:text-blue-400 font-medium"
                            >
                                {pSlug.replace(/-/g, ' ').replace(/^derivative of /i, 'd/dx ')} &rarr;
                            </Link>
                        ))}
                    </div>
                </section>

                {/* More in Wiki */}
                <section className="mt-16">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">More Calculus Topics</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allTopics
                            .filter(t => t.slug !== slug)
                            .sort(() => 0.5 - Math.random())
                            .slice(0, 3)
                            .map((t) => (
                                <Link
                                    key={t.slug}
                                    href={`/${locale === 'en' ? '' : locale + '/'}wiki/${t.slug}`}
                                    className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 hover:text-blue-600 transition-colors no-underline"
                                >
                                    <div className="font-bold text-gray-900 dark:text-white">{t.title}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{t.description}</div>
                                </Link>
                            ))}
                    </div>
                </section>
            </article>
        </main>
    );
}
