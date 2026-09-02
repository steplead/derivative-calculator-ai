import { headers } from 'next/headers';
export const runtime = 'edge';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Calculator from '@/components/Calculator';
// EmbedWidget removed to prevent API abuse
import StructuredData, { generateMathSolverData } from '@/components/StructuredData';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Suspense } from 'react';
import { getBaseUrl } from '@/utils/robust-url';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NOINDEX_SLUGS } from '@/lib/noindex-slugs';
import { calculateDerivative } from '@/lib/math/math-core';
import type { DerivativeSolution } from '@/lib/math/math-core';
import { fetchRelatedFromD1 } from '@/lib/d1/related-problems';
import {
    loadStaticProblemsSafe,
    findStaticProblem,
    pickStableRelated,
} from '@/lib/problems-source';
import { parseSlugToMath } from '@/lib/slug-math';

// Define the type for our problem data.
// `title` is optional because raw library rows are not guaranteed to carry one;
// every consumer falls back to `Problem ${formula}`.
type Problem = {
    slug: string;
    formula: string;
    title?: string;
    description?: string;
    type?: 'derivative' | 'integral' | 'limit';
    limitTo?: string;
};

/**
 * Stable related-problem selection and the slug→math fallback now live in
 * lib/problems-source.ts and lib/slug-math.ts so they can be unit-tested
 * without importing the page (which pulls in the Cloudflare edge runtime).
 */

// OPTIMIZED: Allow caching to reduce quota usage
// Cache for 1 hour - locale is handled via middleware rewrite, so caching is safe
export const revalidate = 3600; // 1 hour

// Removed generateStaticParams to disable SSG and force dynamic rendering for i18n rewrites.
// export async function generateStaticParams() { ... }

// Helper for localization
function getLocalizedContent(locale: string, formula: string, type: string = 'derivative') {
    const isIntegral = type === 'integral';
    const isLimit = type === 'limit';

    const content = {
        en: {
            title: isIntegral ? `Integral of ${formula}` : isLimit ? `Limit of ${formula}` : `Derivative of ${formula}`,
            description: isIntegral
                ? `Step-by-step integral solution for ${formula}. Learn the integration rules used to solve this problem.`
                : isLimit
                    ? `Step-by-step limit solution for ${formula}. Learn the limit laws and L'Hôpital's rule used to solve this problem.`
                    : `Step-by-step derivative solution for ${formula}. Learn the differentiation rules used to solve this problem.`,
            h1: isIntegral ? `Integral of ${formula}` : isLimit ? `Limit of ${formula}` : `Derivative of ${formula}`,
            subtitle: `Instant step-by-step solution for`,
            howToTitle: isIntegral ? `How to find the integral of ${formula}` : isLimit ? `How to find the limit of ${formula}` : `How to find the derivative of ${formula}`,
            howToText: isIntegral
                ? `To find the integral of <strong>${formula}</strong>, we use standard integration rules (power rule, substitution, parts). Our AI-powered calculator breaks down the steps.`
                : isLimit
                    ? `To find the limit of <strong>${formula}</strong>, we use standard limit laws, algebraic simplification, and L'Hôpital's rule. Our AI-powered calculator breaks down the steps.`
                    : `To find the derivative of <strong>${formula}</strong>, we use standard differentiation rules. Our AI-powered calculator breaks down the steps and explains the logic.`,
            practiceTitle: "Practice More Problems",
            solvePrefix: isIntegral ? "Solve integral" : isLimit ? "Find limit" : "Solve d/dx"
        },
        es: {
            title: isIntegral ? `Integral de ${formula}` : isLimit ? `Límite de ${formula}` : `Derivada de ${formula}`,
            description: isIntegral
                ? `Solución paso a paso de la integral de ${formula}. Aprende las reglas de integración usadas.`
                : isLimit
                    ? `Solución paso a paso del límite de ${formula}. Aprende las leyes de límites y la regla de L'Hôpital.`
                    : `Solución paso a paso de la derivada de ${formula}. Aprende las reglas de diferenciación usadas para resolver este problema.`,
            h1: isIntegral ? `Integral de ${formula}` : isLimit ? `Límite de ${formula}` : `Derivada de ${formula}`,
            subtitle: `Solución paso a paso instantánea para`,
            howToTitle: isIntegral ? `Cómo encontrar la integral de ${formula}` : isLimit ? `Cómo encontrar el límite de ${formula}` : `Cómo encontrar la derivada de ${formula}`,
            howToText: isIntegral
                ? `Para encontrar la integral de <strong>${formula}</strong>, usamos reglas de integración estándar. Nuestra calculadora con IA desglosa los pasos.`
                : isLimit
                    ? `Para encontrar el límite de <strong>${formula}</strong>, usamos leyes de límites estándar y la regla de L'Hôpital. Nuestra calculadora con IA desglosa los pasos.`
                    : `Para encontrar la derivada de <strong>${formula}</strong>, usamos reglas de diferenciación estándar. Nuestra calculadora con IA desglosa los pasos y explica la lógica.`,
            practiceTitle: "Practicar Más Problemas",
            solvePrefix: isIntegral ? "Resolver integral" : isLimit ? "Calcular límite" : "Resolver d/dx"
        },
        pt: {
            title: isIntegral ? `Integral de ${formula}` : isLimit ? `Limite de ${formula}` : `Derivada de ${formula}`,
            description: isIntegral
                ? `Solução passo a passo da integral de ${formula}. Aprenda as regras de integração usadas.`
                : isLimit
                    ? `Solução passo a passo do limite de ${formula}. Aprenda as leis de limites e a regra de L'Hôpital.`
                    : `Solução passo a passo da derivada de ${formula}. Aprenda as regras de diferenciação usadas para resolver este problema.`,
            h1: isIntegral ? `Integral de ${formula}` : isLimit ? `Limite de ${formula}` : `Derivada de ${formula}`,
            subtitle: `Solução passo a passo instantânea para`,
            howToTitle: isIntegral ? `Como encontrar a integral de ${formula}` : isLimit ? `Como encontrar o limite de ${formula}` : `Como encontrar a derivada de ${formula}`,
            howToText: isIntegral
                ? `Para encontrar a integral de <strong>${formula}</strong>, usamos regras de integração padrão. Nossa calculadora com IA detalha os passos.`
                : isLimit
                    ? `Para encontrar o limite de <strong>${formula}</strong>, usamos leis de limites padrão e a regra de L'Hôpital. Nossa calculadora com IA detalha os passos.`
                    : `Para encontrar a derivada de <strong>${formula}</strong>, usamos regras de diferenciação padrão. Nossa calculadora com IA detalha os passos e explica a lógica.`,
            practiceTitle: "Praticar Mais Problemas",
            solvePrefix: isIntegral ? "Resolver integral" : isLimit ? "Calcular limite" : "Resolver d/dx"
        }
    };
    return content[locale as keyof typeof content] || content.en;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { slug } = params;

    // Fetch problem details from API
    // Fetch problem details from API
    const baseUrl = getBaseUrl();

    // RC-8 FIX: the authoritative library is the FIRST source here, exactly as
    // in the page body, so <title> and <h1> can never disagree again. The old
    // `cache: 'force-cache'` fetches never returned data on this platform.
    let problem: Problem | null = findStaticProblem(await loadStaticProblemsSafe(), slug);

    // Only slugs outside the library pay for a D1-backed HTTP round trip.
    if (!problem && baseUrl) {
        try {
            const res = await fetch(`${baseUrl}/api/problem/${slug}`);
            const contentType = res.headers.get("content-type");
            if (res.ok && contentType && contentType.includes("application/json")) {
                problem = await res.json();
            }
        } catch (e) {
            console.error("Failed to fetch problem for metadata:", e);
        }
    }

    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";

    // D1 Lookup (Zero-hop)
    if (!problem) {
        try {
            // @ts-ignore
            const db = getRequestContext().env.DB;
            if (db) {
                // Explicit columns only: no `SELECT *` on D1.
                problem = await db
                    .prepare("SELECT slug, formula, title, type, description, limitTo FROM problems WHERE slug = ?")
                    .bind(slug)
                    .first() as Problem | null;
            }
        } catch (e) {
            console.error("D1 Metadata fetch failed:", e);
        }
    }

    // DYNAMIC FALLBACK: Smart Parser (Heuristic for descriptive or raw math slugs)
    if (!problem) {
        problem = parseSlugToMath(slug);
    }

    if (!problem) {
        return {
            title: 'Problem Not Found',
        };
    }

    const t = getLocalizedContent(locale, problem.formula, problem.type);

    // Use host-relative or dynamic canonical based on env
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
    const baseUrlWithLocale = locale === 'en' ? siteUrl : `${siteUrl}/${locale}`;
    const url = `${baseUrlWithLocale}/${slug}`;

    return {
        title: t.title,
        description: t.description,
        robots: NOINDEX_SLUGS.has(slug) ? {
            index: false,
            follow: true,
        } : undefined,
        alternates: {
            canonical: url,
            languages: {
                'en': `${siteUrl}/${slug}`,
                'es': `${siteUrl}/es/${slug}`,
                'pt': `${siteUrl}/pt/${slug}`,
            }
        },
        openGraph: {
            title: t.title,
            description: t.description,
            url,
            type: 'website',
        },
    };
}

export default async function ProblemPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";

    let problem: Problem | null = null;
    let relatedProblems: Problem[] = [];

    try {
        const context = getRequestContext();
        // @ts-ignore
        const db = context?.env?.DB;

        // ------------------------------------------------------------------
        // RC-8 FIX — data resolution order.
        //
        // The authoritative library (/problems.json) is consulted FIRST and
        // alone. Previously every source was fetched in parallel with
        // `fetch(url, { cache: 'force-cache', next: { revalidate: 3600 } })`,
        // which never returns data on this platform (see lib/problems-source.ts
        // for the mechanism). Every page therefore fell through to the
        // slug heuristic and published slug-derived formulas instead of the
        // library's — e.g. slug "derivative-of-1-x" rendered "1x" (d/dx = 1)
        // instead of the real "1/x" (d/dx = -1/x^2).
        //
        // Bonus: for the 3,137 slugs present in the library this performs
        // ZERO D1 queries, removing the ~21 rows_read/page-view of D1 cost
        // that the old parallel fan-out incurred.
        // ------------------------------------------------------------------
        const library = await loadStaticProblemsSafe();

        problem = findStaticProblem(library, slug);

        // Type hint for stable related selection (falls back to slug prefix).
        const problemTypeHint = problem?.type
            || (slug.startsWith('integral') ? 'integral' : slug.startsWith('limit') ? 'limit' : 'derivative');

        if (problem && library.length > 0) {
            relatedProblems = pickStableRelated(library, slug, problemTypeHint);
        }

        // Only slugs OUTSIDE the library pay for D1 / API lookups.
        if (!problem) {
            const [d1Problem, apiProbRes, d1Related] = await Promise.allSettled([
                (async () => {
                    try {
                        if (db) {
                            return await db.prepare("SELECT slug, formula, title, type, difficulty FROM problems WHERE slug = ?")
                                .bind(slug)
                                .first();
                        }
                    } catch (e) {
                        return null;
                    }
                })(),
                baseUrl ? fetch(`${baseUrl}/api/problem/${slug}`) : Promise.reject('No baseUrl'),
                (async () => {
                    try {
                        if (db) {
                            return await fetchRelatedFromD1(db, slug, 10);
                        }
                    } catch (e) {
                        return [];
                    }
                })()
            ]);

            if (!problem && d1Problem.status === 'fulfilled' && d1Problem.value) {
                problem = d1Problem.value as Problem;
            }
            if (!problem && apiProbRes.status === 'fulfilled' && (apiProbRes.value as Response).ok) {
                const contentType = (apiProbRes.value as Response).headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    problem = await (apiProbRes.value as Response).json() as Problem;
                }
            }
            if (relatedProblems.length === 0 && d1Related.status === 'fulfilled' && Array.isArray(d1Related.value)) {
                relatedProblems = pickStableRelated(d1Related.value as any[], slug, problemTypeHint);
            }
        }

        // DYNAMIC MATH FALLBACK: Smart Parser
        if (!problem) {
            problem = parseSlugToMath(slug);
        }

        if (!problem) {
            notFound();
        }

        // SANITIZE: Ensure no null values or "null" strings crash the render
        const problemSlug = (problem.slug || slug || '').toString();
        const problemFormula = (problem.formula || decodeURIComponent(slug) || '').toString().replace(/^null$/i, '');
        const problemLimitTo = (problem.limitTo || '0').toString().replace(/^null$/i, '0');

        if (!problemFormula) {
            notFound();
        }

        const safeProblem: Problem = {
            slug: problemSlug,
            formula: problemFormula,
            title: problem.title || `Problem ${problemFormula}`,
            type: problem.type || 'derivative',
            limitTo: problemLimitTo,
            description: problem.description || ""
        };

        // RC-1 FIX: deterministically compute the answer server-side so the
        // initial HTML contains real math content (answer, rule, steps) —
        // not just a template sentence. Same shared module as /api/derivative.
        let ssrSolution: DerivativeSolution | null = null;
        if (safeProblem.type === 'derivative' || !safeProblem.type) {
            try {
                ssrSolution = calculateDerivative(safeProblem.formula);
                // Never surface a failed/invalid result as if it were correct.
                if (!ssrSolution.isValid) ssrSolution = null;
            } catch (e) {
                console.error("SSR derivative calculation failed:", e);
                ssrSolution = null;
            }
        }

        // initialResult passed to the client Calculator (avoids duplicate first fetch).
        const initialResult = ssrSolution ? {
            solution: ssrSolution.solutionLatex,
            solution_raw: ssrSolution.solutionRaw,
            steps: ssrSolution.steps.map((s, i) => `**Step ${i + 1}:** ${s}`).join('\n\n'),
            ai_explanation: ssrSolution.rule ? `Rule used: ${ssrSolution.rule}.` : 'Deterministic step-by-step solution.',
            _ssr: true,
        } : undefined;

        const t = getLocalizedContent(locale, safeProblem.formula, safeProblem.type);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
        const baseUrlWithLocale = locale === 'en' ? siteUrl : `${siteUrl}/${locale}`;
        const url = `${baseUrlWithLocale}/${slug}`;

        // Generate Schema.org structured data
        const mathSolverSchema = generateMathSolverData({
            name: t.title,
            description: t.description,
            url: url,
            educationalLevel: "College"
        });

        return (
            <>
                <StructuredData data={mathSolverSchema} />
                <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
                <div className="max-w-4xl mx-auto">
                    <Breadcrumbs
                        items={[
                            { name: 'Home', href: '/' },
                            { name: 'Problems', href: '/problems' },
                            { name: safeProblem.type || 'Derivative', href: `/problems/${safeProblem.type || 'derivative'}` },
                            { name: t.h1, href: `/${slug}` }
                        ]}
                    />
                </div>
                <div className="max-w-4xl mx-auto text-center mb-12 mt-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                        {t.h1}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        {t.subtitle} <code className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-gray-800 dark:text-gray-200">{safeProblem.formula}</code>
                    </p>
                </div>

                <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">Loading Calculator...</div>}>
                    <Calculator
                        initialEquation={safeProblem.formula}
                        initialLimitTo={safeProblem.limitTo}
                        mode={safeProblem.type as any}
                        initialResult={initialResult}
                    />
                </Suspense>

                {/* RC-1 FIX: deterministic answer block rendered in initial HTML.
                    Gives Googlebot real math content without JS execution. */}
                {ssrSolution && (
                    <section
                        className="max-w-4xl mx-auto mt-8 p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700"
                        aria-label="Solution"
                    >
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {safeProblem.type === 'integral' ? 'Integral' : 'Derivative'} of {safeProblem.formula}
                        </h2>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Answer</dt>
                                <dd className="mt-1 text-2xl text-gray-900 dark:text-white font-math">
                                    {ssrSolution.solutionRaw}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Rule Used</dt>
                                <dd className="mt-1 text-gray-700 dark:text-gray-300">{ssrSolution.rule}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Steps</dt>
                                <dd className="mt-1">
                                    <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                        {ssrSolution.steps.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ol>
                                </dd>
                            </div>
                        </dl>
                    </section>
                )}

                <div className="max-w-2xl mx-auto mt-12 prose prose-invert">
                    <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2">{t.howToTitle}</h3>
                    <p className="text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: t.howToText }} />
                </div>

                {/* Related Problems */}
                <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                        {t.practiceTitle}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {relatedProblems.map((p) => {
                            const pSafeFormula = p.formula || "";
                            const pSafeType = p.type || 'derivative';
                            const pT = getLocalizedContent(locale, pSafeFormula, pSafeType);
                            return (
                                <a
                                    key={p.slug}
                                    href={`/${locale === 'en' ? '' : locale + '/'}${p.slug}`}
                                    className="block p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-slate-800"
                                >
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {pT.title}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {t.solvePrefix} {pSafeFormula}
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
            </>
        );
    } catch (criticalError: any) {
        // RC-2 FIX: Next.js `notFound()` throws a special control-flow error with
        // digest "NEXT_NOT_FOUND". Previously this catch block swallowed it and
        // returned a 200 fallback page (soft 404). We must re-throw it so Next.js
        // renders the real 404 (not-found.tsx).
        if (criticalError?.digest === 'NEXT_NOT_FOUND') {
            throw criticalError;
        }
        // Any OTHER error is a genuine server/render failure → re-throw so the
        // error boundary returns 500. Never return HTTP 200 with a "Unable to
        // load" body, which would get cached by the CDN (RC-3).
        console.error("Critical Render Error in ProblemPage:", criticalError);
        throw criticalError;
    }
}
