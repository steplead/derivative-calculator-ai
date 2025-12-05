import Link from 'next/link';
import problems from '@/data/problems.json';

export const metadata = {
    title: 'All Derivative Problems - Derivative Calculator AI',
    description: 'Browse our complete list of derivative problems and solutions. Find step-by-step explanations for polynomials, trigonometry, logarithms, and more.',
};

export default function DirectoryPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        All Derivative Problems
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Browse our comprehensive library of {problems.length} calculus problems.
                        Each page includes a step-by-step solution, AI explanation, and interactive graph.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {problems.map((problem) => (
                        <Link
                            key={problem.slug}
                            href={`/${problem.slug}`}
                            className="bg-gray-50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all group"
                        >
                            <h3 className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-semibold mb-1 truncate">
                                Derivative of {problem.formula}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {problem.title}
                            </p>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 text-center pb-12">
                    <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                        &larr; Back to Calculator
                    </Link>
                </div>
            </div>
        </main>
    );
}
