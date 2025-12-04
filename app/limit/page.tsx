import Calculator from '@/components/Calculator';
import Link from 'next/link';

export const metadata = {
    title: "Limit Calculator AI - Solve Limits Instantly",
    description: "Free step-by-step limit calculator powered by AI. Solve limits as x approaches any value.",
};

export default function LimitPage() {
    return (
        <main className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-12 mt-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                    Limit Calculator <span className="text-green-500">AI</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Instant step-by-step limits powered by SymPy & Gemini.
                </p>
            </div>

            <Calculator mode="limit" />

            <div className="max-w-4xl mx-auto mt-20 prose prose-invert">
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">How to use this Limit Calculator</h2>
                        <p className="text-gray-400 mb-4">
                            Enter your function and the value x approaches to find the limit.
                        </p>
                        <ul className="list-disc pl-5 text-gray-400 space-y-2">
                            <li>Rational functions (e.g., <code className="bg-slate-800 px-1 rounded">(x^2-1)/(x-1)</code>)</li>
                            <li>Trig limits (e.g., <code className="bg-slate-800 px-1 rounded">sin(x)/x</code>)</li>
                            <li>Limits at infinity</li>
                        </ul>
                    </div>
                </div>
            </div>

            <footer className="mt-20 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} DerivativeCalculatorAI.com</p>
            </footer>
        </main>
    );
}
