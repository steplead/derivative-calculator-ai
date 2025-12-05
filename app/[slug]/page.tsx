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

    const title = `${problem.title} - Derivative Calculator AI`;
    const description = problem.description || `Step-by-step derivative solution for ${problem.formula}. Learn the differentiation rules used to solve this problem.`;
    const url = `https://derivativecalculatorai.com/${slug}`;

    return {
        title,
        description,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
        },
    };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const problem = problems.find((p) => p.slug === slug);

    if (!problem) {
        notFound();
    }

    // Advanced SEO: Internal Linking (Random 4 related problems)
    // In a real app, this would be smarter (e.g. similar complexity), but random is good for crawling coverage.
    const relatedProblems = problems
        .filter(p => p.slug !== slug)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

    // Advanced SEO: JSON-LD Schema (HowTo / MathSolver)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": `How to calculate the derivative of ${problem.formula}`,
        "description": `Step-by-step guide to finding the derivative of ${problem.formula} using standard differentiation rules.`,
        "step": [
            {
                "@type": "HowToStep",
                "name": "Identify the Rules",
                "text": `Identify which differentiation rules apply to ${problem.formula} (e.g. Power Rule, Chain Rule).`
            },
            {
                "@type": "HowToStep",
                "name": "Apply Differentiation",
                "text": "Apply the rules to each term of the expression."
            },
            {
                "@type": "HowToStep",
                "name": "Simplify",
                "text": "Simplify the result to get the final answer."
            }
        ],
        "totalTime": "PT0M30S",
        "supply": {
            "@type": "HowToSupply",
            "name": "Calculus Problem"
        },
        "tool": {
            "@type": "HowToTool",
            "name": "Derivative Calculator AI"
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

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

            {/* Related Problems Section */}
            <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                    Practice More Problems
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedProblems.map((p) => (
                        <a
                            key={p.slug}
                            href={`/${p.slug}`}
                            className="block p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-slate-800"
                        >
                            <div className="font-semibold text-gray-900 dark:text-white">{p.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Solve d/dx {p.formula}
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            <footer className="mt-20 text-center text-gray-500 dark:text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} DerivativeCalculatorAI.com</p>
            </footer>
        </main>
    );
}
