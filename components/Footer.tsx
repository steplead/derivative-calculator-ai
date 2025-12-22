
import Link from 'next/link';

type WikiTopic = {
    slug: string;
    title: string;
};

type Problem = {
    slug: string;
    formula: string;
};

interface FooterProps {
    wikiTopics: WikiTopic[];
    problems: Problem[];
    locale: string;
}

export default function Footer({ wikiTopics, problems, locale }: FooterProps) {
    // Shuffle and slice to implement "Stir-Fry"
    // Note: On truly static hosting, this only shuffles during build.
    // In our Edge runtime, it shuffles on every dynamic request.
    const randomWiki = wikiTopics.sort(() => 0.5 - Math.random()).slice(0, 4);
    const randomProblems = problems.sort(() => 0.5 - Math.random()).slice(0, 6);

    const baseUrl = locale === 'en' ? '' : `/${locale}`;

    return (
        <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pt-16 pb-12 mt-20 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand & Mission */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Derivative<span className="text-blue-600">Calculator</span> AI
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            Empowering students and professionals with AI-driven calculus solutions.
                            Step-by-step guidance for derivatives, integrals, and more.
                        </p>
                    </div>

                    {/* Stir-Fry: Wiki Topics */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                            Math Wiki (Featured)
                        </h4>
                        <ul className="space-y-2">
                            {randomWiki.map(topic => (
                                <li key={topic.slug}>
                                    <Link
                                        href={`${baseUrl}/wiki/${topic.slug}`}
                                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                                    >
                                        {topic.title}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href={`${baseUrl}/wiki`}
                                    className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                                >
                                    View Library &rarr;
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Stir-Fry: Deep Problems */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                            Practice Problems
                        </h4>
                        <ul className="space-y-2">
                            {randomProblems.map(problem => (
                                <li key={problem.slug}>
                                    <Link
                                        href={`${baseUrl}/${problem.slug}`}
                                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                                    >
                                        d/dx {problem.formula}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Links & Legal */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                            Quick Links
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href={`${baseUrl}/directory`} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm">Problem Directory</Link>
                            </li>
                            <li>
                                <Link href={`${baseUrl}/matrix`} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm">Matrix Calculator</Link>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm">Privacy Policy</a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm">Contact Us</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Derivative Calculator AI. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <span className="text-green-500 font-medium whitespace-nowrap">● System Status: Online</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
