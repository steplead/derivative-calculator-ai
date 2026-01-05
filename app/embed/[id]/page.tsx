import { headers } from 'next/headers';
export const runtime = 'edge';
import { notFound } from 'next/navigation';
import Calculator from '@/components/Calculator';
import { Suspense } from 'react';
import { getBaseUrl } from '@/utils/robust-url';
import { getRequestContext } from '@cloudflare/next-on-pages';

type Problem = {
  slug: string;
  formula: string;
  title: string;
  description?: string;
  type?: 'derivative' | 'integral' | 'limit' | 'ode' | 'matrix';
  limitTo?: string;
};

function parseSlugToMath(slug: string): Problem | null {
  let type: 'derivative' | 'integral' | 'limit' = 'derivative';
  let formula = slug;
  let limitTo = '0';

  if (slug.startsWith('integral-of-')) {
    type = 'integral';
    formula = slug.replace('integral-of-', '');
  } else if (slug.startsWith('limit-of-')) {
    type = 'limit';
    formula = slug.replace('limit-of-', '');
    const limitMatch = formula.match(/(.*?)-(?:to|as-x-approaches)-(.*)/i);
    if (limitMatch) {
      formula = limitMatch[1];
      limitTo = limitMatch[2]
        .replace(/^minus-/i, '-')
        .replace(/^-+/g, '-')
        .replace(/(\d)-(\d)/g, '$1.$2');
    }
  } else if (slug.startsWith('derivative-of-')) {
    type = 'derivative';
    formula = slug.replace('derivative-of-', '');
  } else {
    const looksLikeMath = /[\+\*\/\^\(\)]/.test(decodeURIComponent(slug)) || (slug.length < 15 && !slug.includes('-'));
    if (!looksLikeMath) return null;
  }

  let mathFormula = formula
    .replace(/-/g, ' ')
    .replace(/\be to the\b/gi, 'e^')
    .replace(/\bto the\b/gi, '^')
    .replace(/\bsqrt\b/gi, 'sqrt')
    .replace(/\broot\b/gi, 'sqrt')
    .replace(/\bcbrt\b/gi, 'cbrt')
    .replace(/\bplus\b/gi, '+')
    .replace(/\bminus\b/gi, '-')
    .replace(/\btimes\b/gi, '*')
    .replace(/\bover\b/gi, '/')
    .replace(/\bpower\b/gi, '^')
    .replace(/\bsquared\b/gi, '^2')
    .replace(/\bcubed\b/gi, '^3')
    .replace(/\s+/g, '');

  const functions = ['sin', 'cos', 'tan', 'ln', 'log', 'sqrt', 'cbrt', 'exp', 'arcsin', 'arccos', 'arctan', 'sec', 'csc', 'cot'];
  functions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}([a-z0-9]+)\\b`, 'gi');
    mathFormula = mathFormula.replace(regex, `${fn}($1)`);
  });

  mathFormula = mathFormula.replace(/([a-z])(\d+)/gi, '$1^$2');

  if (!mathFormula || mathFormula.length < 1) return null;

  return {
    slug,
    formula: mathFormula,
    title: type === 'integral' ? `Integral of ${mathFormula}` : type === 'limit' ? `Limit of ${mathFormula}` : `Derivative of ${mathFormula}`,
    type,
    limitTo
  };
}

export const dynamic = 'force-dynamic';

export default async function EmbedPage({ params, searchParams }: { params: { id: string }; searchParams: { theme?: 'light' | 'dark'; preview?: string } }) {
  const { id: problemSlug } = params;
  const theme = searchParams.theme || 'light';
  const isPreview = searchParams.preview === 'true';
  const baseUrl = getBaseUrl();

  let problem: Problem | null = null;

  try {
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/api/problem/${problemSlug}`, {
        cache: 'force-cache',
        // @ts-ignore
        next: { revalidate: 3600 }
      });

      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        problem = await res.json();
      }
    }

    if (!problem) {
      try {
        const context = getRequestContext();
        // @ts-ignore
        const db = context?.env?.DB;
        if (db) {
          problem = await db.prepare("SELECT * FROM problems WHERE slug = ?").bind(problemSlug).first();
        }
      } catch (e) {
        console.error("D1 lookup failed:", e);
      }
    }

    if (!problem) {
      problem = parseSlugToMath(problemSlug);
    }

    if (!problem) {
      return notFound();
    }

    const safeProblem: Problem = {
      slug: problem.slug || problemSlug,
      formula: problem.formula || decodeURIComponent(problemSlug),
      title: problem.title || `Problem ${problem.formula}`,
      type: problem.type || 'derivative',
      limitTo: problem.limitTo || '0',
      description: problem.description || ""
    };

    if (isPreview) {
      return (
        <div className={theme === 'dark' ? 'dark' : ''}>
          <div className="py-8 px-4 bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto">
              <div className="bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  🔍 Embed Preview Mode
                </p>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {safeProblem.type === 'integral' ? `Integral of ${safeProblem.formula}` :
                   safeProblem.type === 'limit' ? `Limit of ${safeProblem.formula}` :
                   `Derivative of ${safeProblem.formula}`}
                </h1>
              </div>

              <Suspense fallback={<div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>}>
                <Calculator
                  initialEquation={safeProblem.formula}
                  initialLimitTo={safeProblem.limitTo}
                  mode={safeProblem.type as any}
                  embedded={true}
                />
              </Suspense>
            </div>
          </div>

          <div className="py-4 px-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
            <div className="max-w-4xl mx-auto text-center">
              <a
                href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com'}/${problemSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Powered by DerivativeCalculatorAI →
              </a>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="py-6 px-3 bg-white dark:bg-slate-900 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <Suspense fallback={<div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>}>
              <Calculator
                initialEquation={safeProblem.formula}
                initialLimitTo={safeProblem.limitTo}
                mode={safeProblem.type as any}
                embedded={true}
              />
            </Suspense>
          </div>
        </div>

        <div className="py-2 px-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto text-center">
            <a
              href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com'}/${problemSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              Powered by DerivativeCalculatorAI
            </a>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Embed page error:", error);
    return (
      <div className="py-20 px-4 text-center bg-white dark:bg-slate-900">
        <p className="text-gray-600 dark:text-gray-400">Unable to load embedded calculator.</p>
      </div>
    );
  }
}
