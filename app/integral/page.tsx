import Calculator from '@/components/Calculator';
import Link from 'next/link';

export const metadata = {
    title: "Integral Calculator AI - Solve Integrals Instantly",
    description: "Free step-by-step integral calculator powered by AI. Solve indefinite and definite integrals with explanations.",
};

import { Suspense } from 'react';

export default function IntegralPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto text-center mb-12 mt-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    Integral Calculator <span className="text-purple-600 dark:text-purple-500">AI</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Instant step-by-step integration powered by SymPy & Gemini.
                </p>
            </div>

            <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">Loading Calculator...</div>}>
                <Calculator mode="integral" />
            </Suspense>

            <div className="max-w-4xl mx-auto mt-20 prose prose-invert">
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How to use this Integral Calculator</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Enter your function to find the antiderivative (indefinite integral).
                        </p>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                            <li>Polynomials (e.g., <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">x^2 + 3x</code>)</li>
                            <li>Trig functions (e.g., <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">sin(x)</code>)</li>
                            <li>Exponentials (e.g., <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-gray-200">e^x</code>)</li>
                        </ul>
                    </div>
                </div>
            </div>

            <footer className="mt-20 text-center text-gray-500 dark:text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} DerivativeCalculatorAI.com</p>
            </footer>
        </main>
    );
}
