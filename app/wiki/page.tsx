
import Link from 'next/link';
import { headers } from 'next/headers';
import { getDictionary } from '../dictionaries';
import { getBaseUrl } from '@/utils/robust-url';

export const runtime = 'edge';

export default async function WikiHome() {
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";
    const dict = getDictionary(locale);

    const baseUrl = getBaseUrl();
    let wikiTopics = [];

    try {
        const res = await fetch(`${baseUrl}/wiki.json`, {
            cache: 'force-cache',
            next: { revalidate: 3600 }
        });
        if (res.ok) {
            wikiTopics = await res.json();
        }
    } catch (e) {
        console.error("Failed to fetch wiki topics:", e);
    }

    // Group topics by category
    const categories = wikiTopics.reduce((acc: any, topic: any) => {
        if (!acc[topic.category]) {
            acc[topic.category] = [];
        }
        acc[topic.category].push(topic);
        return acc;
    }, {});

    return (
        <main className="min-h-screen bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto mb-10 mt-10">
                <nav className="flex mb-8 text-sm text-gray-500 dark:text-gray-400">
                    <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
                    <span className="mx-2">/</span>
                    <span className="font-semibold text-gray-900 dark:text-white">Wiki</span>
                </nav>

                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    Math <span className="text-blue-600 dark:text-blue-500">Wiki</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
                    Learn the fundamental rules and concepts of calculus.
                </p>

                {Object.entries(categories).map(([category, topics]: [string, any]) => (
                    <section key={category} className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-slate-800 pb-2">
                            {category}
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {topics.map((topic: any) => (
                                <Link
                                    key={topic.slug}
                                    href={`/${locale === 'en' ? '' : locale + '/'}wiki/${topic.slug}`}
                                    className="block p-6 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg no-underline"
                                >
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{topic.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        {topic.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
}
