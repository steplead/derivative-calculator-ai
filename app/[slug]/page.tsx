import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Calculator from '@/components/Calculator';
import { Suspense } from 'react';

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
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    // Fetch problem details from API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    let problem: Problem | null = null;
    try {
        const res = await fetch(`${baseUrl}/api/problem/${slug}`, { next: { revalidate: 3600 } });
        if (res.ok) {
            problem = await res.json();
        }
    } catch (e) {
        console.error("Failed to fetch problem for metadata:", e);
    }

    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";

    if (!problem) {
        return {
            title: 'Problem Not Found',
        };
    }

    const t = getLocalizedContent(locale, problem.formula, problem.type);
    const url = `https://derivativecalculatorai.com/${locale === 'en' ? '' : locale + '/'}${slug}`;

    return {
        title: `${t.title} - Derivative Calculator AI`,
        description: t.description,
        alternates: {
            canonical: url,
            languages: {
                'en': `https://derivativecalculatorai.com/${slug}`,
                'es': `https://derivativecalculatorai.com/es/${slug}`,
                'pt': `https://derivativecalculatorai.com/pt/${slug}`,
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

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch problem details and related problems from API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    let problem: Problem | null = null;
    let relatedProblems: Problem[] = [];

    try {
        const [probRes, allRes] = await Promise.all([
            fetch(`${baseUrl}/api/problem/${slug}`, { next: { revalidate: 3600 } }),
            fetch(`${baseUrl}/api/problems?limit=50`, { next: { revalidate: 3600 } })
        ]);

        if (probRes.ok) problem = await probRes.json();
        if (allRes.ok) {
            const allProblems = await allRes.json();
            relatedProblems = allProblems
                .filter((p: any) => p.slug !== slug)
                .sort(() => 0.5 - Math.random())
                .slice(0, 4);
        }
    } catch (e) {
        console.error("Failed to fetch problem data:", e);
    }

    const headersList = await headers();
    const locale = headersList.get("x-next-locale") || "en";

    if (!problem) {
        notFound();
    }

    const t = getLocalizedContent(locale, problem.formula, problem.type);

    // Advanced SEO: JSON-LD Schema (HowTo / MathSolver)
    // Note: Schema usually stays in English or needs full translation. Keeping English for technical schema for now, 
    // but name/description could be localized.
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": t.howToTitle,
        "description": t.description,
        "step": [
            {
                "@type": "HowToStep",
                "name": "Identify the Rules",
                "text": `Identify which differentiation rules apply to ${problem.formula}.`
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
                    {t.h1}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    {t.subtitle} <code className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-gray-800 dark:text-gray-200">{problem.formula}</code>
                </p>
            </div>

            <Suspense fallback={<div className="text-gray-900 dark:text-white text-center">Loading Calculator...</div>}>
                <Calculator
                    initialEquation={problem.formula}
                    initialLimitTo={problem.limitTo}
                    mode={problem.type || 'derivative'}
                />
            </Suspense>

            <div className="max-w-2xl mx-auto mt-12 prose prose-invert">
                <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2">{t.howToTitle}</h3>
                <p className="text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: t.howToText }} />
            </div>

            {/* Related Problems Section */}
            <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                    {t.practiceTitle}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedProblems.map((p) => (
                        <a
                            key={p.slug}
                            href={`/${locale === 'en' ? '' : locale + '/'}${p.slug}`}
                            className="block p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-slate-800"
                        >
                            <div className="font-semibold text-gray-900 dark:text-white">
                                {locale === 'en' ? p.title : getLocalizedContent(locale, p.formula, p.type).title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {t.solvePrefix} {p.formula}
                            </div>
                        </a>
                    ))}
                </div>
            </div>


        </main>
    );
}
