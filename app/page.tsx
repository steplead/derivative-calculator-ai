import Calculator from '@/components/Calculator';
import Link from 'next/link';
import problems from '@/data/problems.json';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center mb-12 mt-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Derivative Calculator <span className="text-blue-500">AI</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Instant step-by-step solutions powered by SymPy & Gemini.
        </p>
      </div>

      <Calculator />

      <div className="max-w-4xl mx-auto mt-20 prose prose-invert">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">How to use this Derivative Calculator</h2>
            <p className="text-gray-400 mb-4">
              This tool uses advanced AI to help you solve calculus problems. Simply enter your function into the box above and click "Solve".
            </p>
            <ul className="list-disc pl-5 text-gray-400 space-y-2">
              <li>Supports polynomials (e.g., <code className="bg-slate-800 px-1 rounded">x^2 + 3x</code>)</li>
              <li>Trigonometric functions (e.g., <code className="bg-slate-800 px-1 rounded">sin(x)</code>, <code className="bg-slate-800 px-1 rounded">tan(x)</code>)</li>
              <li>Logarithmic & Exponential functions (e.g., <code className="bg-slate-800 px-1 rounded">ln(x)</code>, <code className="bg-slate-800 px-1 rounded">e^x</code>)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Common Derivative Rules</h2>
            <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-400">Power Rule</h3>
                <p className="text-sm text-gray-400 mt-1">d/dx (x^n) = nx^(n-1)</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-400">Product Rule</h3>
                <p className="text-sm text-gray-400 mt-1">d/dx (uv) = u'v + uv'</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-green-400">Chain Rule</h3>
                <p className="text-sm text-gray-400 mt-1">d/dx f(g(x)) = f'(g(x))g'(x)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Calculations Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Popular Calculations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {problems.slice(0, 20).map((problem) => (
              <Link
                key={problem.slug}
                href={`/${problem.slug}`}
                className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-sm text-blue-300 hover:text-blue-200 transition-colors text-center block no-underline"
              >
                Derivative of {problem.formula}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-20 text-center text-gray-500 dark:text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} DerivativeCalculatorAI.com</p>
      </footer>
    </main>
  );
}
