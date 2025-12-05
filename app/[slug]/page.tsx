import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Calculator from '@/components/Calculator';
import problems from '@/data/problems.json';
import { Suspense } from 'react';

// Define the type for our problem data
type Problem = {
    slug: string;
    formula: string;
    title: string;
    description?: string;
};

// Generate static params for all known problems
export async function generateStaticParams() {
    return problems.map((problem: Problem) => ({
        slug: problem.slug,
    }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const problem = problems.find((p) => p.slug === slug);

    if (!problem) {
        return {
            title: 'Problem Not Found',
        };
    }

    return {
        title: `${problem.title} - Derivative Calculator AI`,
        description: problem.description || `Step-by-step derivative solution for ${problem.formula}. Learn the differentiation rules used to solve this problem.`,
    };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const problem = problems.find((p) => p.slug === slug);

    if (!problem) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">

            <div className="max-w-4xl mx-auto text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    {problem.title}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Instant step-by-step solution for <code className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-gray-800 dark:text-gray-200">{problem.formula}</code>
                </p>
            </div>

            <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">Loading Calculator...</div>}>
                <Calculator initialEquation={problem.formula} />
            </Suspense>

            <div className="max-w-2xl mx-auto mt-12 prose prose-invert">
                <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2">How to find the derivative of {problem.formula}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                    To find the derivative of <strong>{problem.formula}</strong>, we use standard differentiation rules.
                    Our AI-powered calculator breaks down the steps and explains the logic, helping you understand the calculus concepts behind the solution.
                </p>
            </div>

            <footer className="mt-20 text-center text-gray-500 dark:text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} DerivativeCalculatorAI.com</p>
            </footer>
        </main>
    );
}
