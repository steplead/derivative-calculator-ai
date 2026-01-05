import { headers } from 'next/headers';
export const runtime = 'edge';
import Link from 'next/link';
import { Calculator, Divide, FunctionSquare, Minus } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
  const url = locale === 'en' ? `${siteUrl}/calculators` : `${siteUrl}/${locale}/calculators`;

  return {
    title: `Math Calculators - Free Online Tools`,
    description: `Free online math calculators: Derivative, Integral, Limit, ODE, and Matrix solvers. Step-by-step solutions with AI explanations.`,
    alternates: {
      canonical: url,
      languages: {
        'en': `${siteUrl}/calculators`,
        'es': `${siteUrl}/es/calculators`,
        'pt': `${siteUrl}/pt/calculators`,
      }
    },
    openGraph: {
      title: `Math Calculators - Free Online Tools`,
      description: `Free online math calculators with step-by-step solutions.`,
      url,
      type: 'website',
    },
  };
}

export default function CalculatorsPage() {
  const calculators = [
    {
      name: 'Derivative Calculator',
      description: 'Find derivatives with step-by-step solutions. Supports complex functions, chain rule, product rule, and more.',
      href: '/',
      icon: Calculator,
      color: 'blue',
      features: ['Symbolic differentiation', 'Chain rule explanation', 'Graph visualization', 'AI-powered steps'],
    },
    {
      name: 'Integral Calculator',
      description: 'Calculate definite and indefinite integrals. Learn integration techniques with detailed explanations.',
      href: '/integral',
      icon: Divide,
      color: 'purple',
      features: ['Definite & indefinite', 'Integration techniques', 'Step-by-step solutions', 'AI explanations'],
    },
    {
      name: 'Limit Calculator',
      description: 'Evaluate limits as x approaches any value. Includes L\'Hôpital\'s rule and limit laws.',
      href: '/limit',
      icon: Minus,
      color: 'green',
      features: ['One-sided & two-sided', 'L\'Hôpital\'s rule', 'Limit laws', 'Graph visualization'],
    },
    {
      name: 'ODE Solver',
      description: 'Solve ordinary differential equations. First-order, second-order, and systems with detailed steps.',
      href: '/ode',
      icon: FunctionSquare,
      color: 'orange',
      features: ['First & second order', 'Step-by-step solution', 'General & particular solutions', 'AI guidance'],
    },
    {
      name: 'Matrix Calculator',
      description: 'Matrix operations: multiplication, inversion, determinant, rank, and more.',
      href: '/matrix',
      icon: FunctionSquare,
      color: 'red',
      features: ['Matrix multiplication', 'Inverse & determinant', 'Row reduction', 'Step-by-step results'],
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:ring-blue-500',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:ring-purple-500',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:ring-green-500',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:ring-orange-500',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:ring-red-500',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Free Math Calculators
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Powerful, free online calculators with step-by-step solutions. Perfect for students, teachers, and engineers.
          </p>
        </div>

        {/* Calculators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {calculators.map((calc) => {
            const Icon = calc.icon;
            return (
              <Link
                key={calc.name}
                href={calc.href}
                className={`group block p-8 rounded-2xl border-2 ${colorClasses[calc.color as keyof typeof colorClasses]} hover:ring-4 transition-all`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg bg-white dark:bg-slate-800 shadow-md ${iconColorClasses[calc.color as keyof typeof iconColorClasses]}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {calc.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {calc.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {calc.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 flex items-center gap-1">
                  Use Calculator →
                </div>
              </Link>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Why Use Our Calculators?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Instant results powered by optimized math engines. No waiting, no delays.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get step-by-step explanations powered by advanced AI. Learn the "why" behind every solution.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">100% Free</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All features are completely free. No subscriptions, no hidden fees, no limits.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Need to Solve a Problem?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Start with our most popular calculator
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-blue-600 font-bold py-4 px-8 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            Try Derivative Calculator →
          </Link>
        </div>
      </div>
    </div>
  );
}
