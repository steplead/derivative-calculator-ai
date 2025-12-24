import { headers } from 'next/headers';
export const runtime = 'edge';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Calculator from '@/components/Calculator';
import { Suspense } from 'react';
import { getBaseUrl } from '@/utils/robust-url';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Define the type for our problem data
type Problem = {
    slug: string;
    formula: string;
    title: string;
    description?: string;
    type?: 'derivative' | 'integral' | 'limit';
    limitTo?: string;
};

// ... (rest of file)



// Force dynamic rendering to ensure headers() (and thus locale) are read correctly for every request
export const dynamic = 'force-dynamic';
// export const revalidate = 3600; // Optional: Cache for 1 hour (would need verify if header varies cache)

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

    let problem: Problem | null = null;
    if (baseUrl) {
        try {
            const res = await fetch(`${baseUrl}/api/problem/${slug}`, {
                cache: 'force-cache',
                // @ts-ignore
                next: { revalidate: 3600 }
            });

            const contentType = res.headers.get("content-type");
            if (res.ok && contentType && contentType.includes("application/json")) {
                problem = await res.json();
            }
        } catch (e) {
            console.error("Failed to fetch problem for metadata:", e);
        }
    }

    // FALLBACK: Look up in local data if API failed or returned HTML
    if (!problem) {
        try {
            const fallbackRes = await fetch(`${baseUrl}/problems.json`);
            if (fallbackRes.ok) {
                const problemsData = await fallbackRes.json();
                problem = (problemsData as Problem[]).find(p => p.slug === slug) || null;
            }
        } catch (e) {
            console.error("Static fallback failed in generateMetadata:", e);
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
                problem = await db.prepare("SELECT * FROM problems WHERE slug = ?").bind(slug).first();
            }
        } catch (e) {
            console.error("D1 Metadata fetch failed:", e);
        }
    }

    // DYNAMIC FALLBACK: Treat slug as formula (only if it doesn't look like a descriptive sentence)
    if (!problem) {
        try {
            const decodedFormula = decodeURIComponent(slug);
            const hasMultipleHyphens = (slug.match(/-/g) || []).length > 2;
            const looksLikeMath = /[\+\*\/\^\(\)]/.test(decodedFormula) || (decodedFormula.length < 15 && !decodedFormula.includes('-'));

            if (looksLikeMath && !hasMultipleHyphens && decodedFormula.length < 50) {
                problem = {
                    slug: slug,
                    formula: decodedFormula,
                    title: `Derivative of ${decodedFormula}`,
                    type: 'derivative'
                };
            }
        } catch (e) {
            // Ignore
        }
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
        title: `${t.title} - Derivative Calculator AI`,
        description: t.description,
        alternates: {
            canonical: url,
            languages: {
                'en': `${siteUrl}/${slug}`,
                'es': `${siteUrl}/es/${slug}`,
                'pt': `${siteUrl}/pt/${slug}`,
            }
        },
        openGraph: {
            title: `${t.title} - Derivative Calculator AI`,
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
        if (baseUrl) {
            try {
                const [probRes, allRes] = await Promise.all([
                    fetch(`${baseUrl}/api/problem/${slug}`, {
                        cache: 'force-cache',
                        // @ts-ignore
                        next: { revalidate: 3600 }
                    }),
                    fetch(`${baseUrl}/api/problems?limit=50`, {
                        cache: 'force-cache',
                        // @ts-ignore
                        next: { revalidate: 3600 }
                    })
                ]);

                if (probRes.ok && probRes.headers.get("content-type")?.includes("application/json")) {
                    problem = await probRes.json();
                }
                if (allRes.ok && allRes.headers.get("content-type")?.includes("application/json")) {
                    const allProblems = await allRes.json();
                    if (Array.isArray(allProblems)) {
                        relatedProblems = allProblems
                            .filter((p: any) => p && p.slug !== slug)
                            .sort(() => 0.5 - Math.random())
                            .slice(0, 4);
                    }
                }
            } catch (e) {
                console.error("Fetch failed in ProblemPage:", e);
            }
        }

        // D1 DIRECT LOOKUP (Hybrid Performance Resilience)
        if (!problem || relatedProblems.length === 0) {
            try {
                const context = getRequestContext();
                const db = context?.env?.DB;
                if (db) {
                    if (!problem) {
                        problem = await db.prepare("SELECT * FROM problems WHERE slug = ?").bind(slug).first();
                    }
                    if (relatedProblems.length === 0) {
                        const { results } = await db.prepare("SELECT * FROM problems WHERE slug != ? ORDER BY RANDOM() LIMIT 4").bind(slug).all();
                        if (Array.isArray(results)) relatedProblems = results;
                    }
                }
            } catch (e) {
                console.error("D1 Resilience Fetch Failed:", e);
            }
        }

        // STATIC FALLBACK
        if (!problem || relatedProblems.length === 0) {
            try {
                const fallbackRes = await fetch(`${baseUrl}/problems.json`);
                if (fallbackRes.ok) {
                    const problemsData = await fallbackRes.json();
                    if (Array.isArray(problemsData)) {
                        if (!problem) {
                            problem = problemsData.find(p => p.slug === slug) || null;
                        }
                        if (relatedProblems.length === 0) {
                            relatedProblems = problemsData
                                .filter(p => p.slug !== slug)
                                .sort(() => 0.5 - Math.random())
                                .slice(0, 4);
                        }
                    }
                }
            } catch (e) {
                console.error("Static fallback failed:", e);
            }
        }

        // DYNAMIC MATH FALLBACK
        if (!problem) {
            const decodedFormula = decodeURIComponent(slug);
            const looksLikeMath = /[\+\*\/\^\(\)]/.test(decodedFormula) || (decodedFormula.length < 15 && !decodedFormula.includes('-'));
            if (looksLikeMath && (slug.match(/-/g) || []).length <= 2 && decodedFormula.length < 50) {
                problem = {
                    slug: slug,
                    formula: decodedFormula,
                    title: `Derivative of ${decodedFormula}`,
                    type: 'derivative'
                };
            }
        }

        if (!problem) {
            notFound();
        }

        // SANITIZE: Ensure no null values crash the render
        const safeProblem: Problem = {
            slug: problem.slug || slug,
            formula: problem.formula || decodeURIComponent(slug),
            title: problem.title || "Math Problem",
            type: problem.type || 'derivative',
            limitTo: problem.limitTo || '0',
            description: problem.description || ""
        };

        const t = getLocalizedContent(locale, safeProblem.formula, safeProblem.type);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
        const baseUrlWithLocale = locale === 'en' ? siteUrl : `${siteUrl}/${locale}`;
        const url = `${baseUrlWithLocale}/${slug}`;

        // Schema & Breadcrumbs (omitted for brevity in patch but assumed present in original)
        // ...

        return (
            <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
                <div className="max-w-4xl mx-auto text-center mb-12">
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
                    />
                </Suspense>

                <div className="max-w-2xl mx-auto mt-12 prose prose-invert">
                    <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2">{t.howToTitle}</h3>
                    <p className="text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: t.howToText }} />
                </div>

                {/* Related Problems */}
                <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                        {t.practiceTitle}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        );
    } catch (criticalError) {
        console.error("Critical Render Error in ProblemPage:", criticalError);
        return (
            <div className="py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Unable to load calculation</h1>
                <p className="text-gray-500 mb-8">We encountered a temporary issue loading this math problem.</p>
                <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-full">Go to Home</a>
            </div>
        );
    }
}
