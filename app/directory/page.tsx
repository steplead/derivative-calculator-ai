import Link from 'next/link';
import problems from '@/data/problems.json';

export const metadata = {
    title: 'All Derivative Problems - Derivative Calculator AI',
    description: 'Browse our complete list of derivative problems and solutions. Find step-by-step explanations for polynomials, trigonometry, logarithms, and more.',
};

export default function DirectoryPage() {
    return (
        <main className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        All Derivative Problems
                    </h1>
                    <p className="text-gray-400">
                        Browse our comprehensive library of calculus problems and step-by-step solutions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {problems.map((problem) => (
                        <Link
                            key={problem.slug}
                            href={`/${problem.slug}`}
                            className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg border border-slate-700 hover:border-blue-500 transition-all group"
                        >
                            <h3 className="text-blue-400 group-hover:text-blue-300 font-medium mb-1">
                                Derivative of {problem.formula}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                                {problem.title}
                            </p>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link href="/" className="text-blue-400 hover:text-blue-300 hover:underline">
                        &larr; Back to Calculator
                    </Link>
                </div>
            </div>
        </main>
    );
}
