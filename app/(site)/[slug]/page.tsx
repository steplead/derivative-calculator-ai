import { publicProblemSlugs } from '@/lib/prerender-paths';
import { readLocale } from '@/lib/read-locale';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Calculator from '@/components/Calculator';
// EmbedWidget removed to prevent API abuse
import StructuredData, { generateMathSolverData } from '@/components/StructuredData';
import Breadcrumbs from '@/components/Breadcrumbs';
import ShareResultCard from '@/components/ShareResultCard';
import { Suspense } from 'react';
import { getBaseUrl } from '@/utils/robust-url';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NOINDEX_SLUGS } from '@/lib/noindex-slugs';
import { calculateDerivative } from '@/lib/math/math-core';
import type { DerivativeSolution } from '@/lib/math/math-core';
import { fetchRelatedFromD1 } from '@/lib/d1/related-problems';
import {
    loadStaticProblemsSafe,
    pickStableRelated,
    getDerivativeCanonicalMap,
} from '@/lib/problems-source';
import indexableProblemSlugs from '@/data/sitemap-problem-slugs.json';
import {
    keywordTitle,
    localeAlternates,
    plusFreeSlug,
    problemHref,
    resolveLibraryProblem,
    safeDecodeSlug,
} from '@/lib/seo';
import { getInverseTrigLesson } from '@/content/inverse-trig-lessons';
import InverseTrigLesson from '@/components/InverseTrigLesson';
import TrigHubLink from '@/components/TrigHubLink';
import DerivativeLessonView, { LinksOnlySupplement } from '@/components/DerivativeLesson';
import { getDerivativeLesson } from '@/content/derivative-lesson';
import { answerFirstLead } from '@/content/answer-lead';
import { strikingMeta } from '@/content/striking-lessons';
import { TRIG_CLUSTER_SLUGS } from '@/lib/trig-cluster';

const INDEXABLE_PROBLEM_SLUGS = new Set<string>(indexableProblemSlugs);
import { parseSlugToMath } from '@/lib/slug-math';
import Link from 'next/link';
import SolutionCard from '@/components/SolutionCard';
import AdShell from '@/components/AdShell';

const derivativeMemo = new Map<string, DerivativeSolution | null>();

function memoizedDerivative(formula: string): DerivativeSolution | null {
    const cached = derivativeMemo.get(formula);
    if (cached !== undefined) return cached;
    let solved: DerivativeSolution | null = null;
    try {
        const result = calculateDerivative(formula);
        solved = result.isValid ? result : null;
    } catch (e) {
        console.error("SSR derivative calculation failed:", e);
        solved = null;
    }
    derivativeMemo.set(formula, solved);
    return solved;
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
    return publicProblemSlugs().map((slug) => ({ slug }));
}

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
    // B4: tags/difficulty are now present on library rows; kept optional because
    // heuristic (parseSlugToMath) and some D1 paths do not populate them.
    tags?: string;
    difficulty?: string;
};

/**
 * Stable related-problem selection and the slug→math fallback now live in
 * lib/problems-source.ts and lib/slug-math.ts so they can be unit-tested
 * without importing the page (which pulls in the Cloudflare edge runtime).
 */

// B4: lightweight labels for the tags/difficulty badge row (server-rendered,
// no client logic). Tags use the same "word-case" formatting as tag pages.
function tagLabel(tag: string): string {
    return tag.split('-').map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
}
function difficultyLabel(d: string): string {
    const map: Record<string, string> = {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
    };
    return map[d] || (d.charAt(0).toUpperCase() + d.slice(1));
}

// Prerendered at build time. Locale comes from readLocale() (English by default,
// es/pt via withLocale in the locale catch-all). Do not call headers() here.

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
    const decodedSlug = safeDecodeSlug(slug);
    if (decodedSlug.includes('+') || decodedSlug.includes(' ')) {
        const earlyLocale = readLocale();
        const preview = await loadStaticProblemsSafe();
        const restored = resolveLibraryProblem(preview, decodedSlug);
        const target = restored
            ? problemHref(restored.slug, earlyLocale)
            : (earlyLocale === 'en' ? '/integral' : `/${earlyLocale}/integral`);
        permanentRedirect(target);
    }

    const library = await loadStaticProblemsSafe();
    const libraryProblem = resolveLibraryProblem(library, slug);
    // Any slug NOT present in the static library (/problems.json) belongs to an
    // unbounded URL surface: it may resolve via D1, the /api/problem endpoint,
    // or the slug→math heuristic. The sitemap lists only library slugs, so such
    // pages must be noindexed (P2-H). The decision is based on library membership
    // — not on which fallback resolved the slug — because the API itself answers
    // heuristic slugs with HTTP 200, which would otherwise defeat the noindex and
    // leave an infinite indexed URL surface.
    let problem: Problem | null = libraryProblem;
    const isOutOfLibrary = !libraryProblem;

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

    const locale = readLocale();

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
    const lesson = libraryProblem ? getInverseTrigLesson(libraryProblem.slug, locale) : null;
    const indexLesson = libraryProblem ? getDerivativeLesson(libraryProblem.slug, locale) : null;
    const striking = libraryProblem ? strikingMeta(libraryProblem.slug, locale) : null;

    // P2-G: derivative near-duplicates (same formula -> identical title+content)
    // point their canonical at the group's primary slug to consolidate indexing
    // equity. Non-duplicate slugs (and all limit/integral slugs) stay
    // self-canonical. Fail-closed: an empty map leaves `url` === self.
    const canonMap = await getDerivativeCanonicalMap();
    const librarySlug = libraryProblem?.slug || slug;
    const canonicalSlug = plusFreeSlug(canonMap.get(librarySlug) || librarySlug);
    // P2-G follow-up: slugs that belong to a derivative near-duplicate group are
    // intentionally indexable. The canonical tag above already points every
    // non-primary member at the group's primary slug, so indexing equity stays
    // consolidated. The unlock set is DERIVED from the canonical map (the single
    // source of truth) and therefore survives any regeneration of
    // lib/noindex-slugs.ts from scripts/noindex_list.txt. Slugs outside the
    // library stay noindex (RC-8 guard) — only the NOINDEX_SLUGS overlap is lifted.
    // Impression / textbook slugs in the sitemap allowlist stay indexable even
    // when an older noindex list still names them.
    const derivDupSlugs = new Set<string>([...canonMap.keys(), ...canonMap.values()]);
    const selfCanonical = plusFreeSlug(librarySlug) === canonicalSlug;
    const forceIndex = Boolean(libraryProblem) && selfCanonical && INDEXABLE_PROBLEM_SLUGS.has(canonicalSlug);
    const lockedNoindex = !forceIndex && ((NOINDEX_SLUGS.has(librarySlug) && !derivDupSlugs.has(librarySlug)) || isOutOfLibrary);
    const alternates = localeAlternates(`/${canonicalSlug}`, locale);
    const title = keywordTitle(striking?.title ?? lesson?.title ?? t.title);
    const description = striking?.description ?? lesson?.description ?? indexLesson?.description ?? t.description;

    return {
        title: { absolute: title },
        description,
        robots: lockedNoindex ? {
            index: false,
            follow: true,
        } : undefined,
        alternates,
        openGraph: {
            title,
            description,
            url: alternates.canonical,
            type: 'website',
        },
    };
}

export default async function ProblemPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const baseUrl = getBaseUrl();
    const locale = readLocale();
    const decodedSlug = safeDecodeSlug(slug);
    if (decodedSlug.includes('+') || decodedSlug.includes(' ')) {
        const preview = await loadStaticProblemsSafe();
        const restored = resolveLibraryProblem(preview, decodedSlug);
        const target = restored
            ? problemHref(restored.slug, locale)
            : (locale === 'en' ? '/integral' : `/${locale}/integral`);
        permanentRedirect(target);
    }

    let problem: Problem | null = null;
    let relatedProblems: Problem[] = [];

    try {
        let db: any = null;
        try {
            // Absent during static generation. Library pages never need D1.
            // @ts-ignore
            db = getRequestContext().env?.DB ?? null;
        } catch {
            db = null;
        }

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

        problem = resolveLibraryProblem(library, slug);

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
            description: problem.description || "",
            tags: problem.tags || "",
            difficulty: problem.difficulty || ""
        };

        // RC-1 FIX: deterministically compute the answer server-side so the
        // initial HTML contains real math content (answer, rule, steps) —
        // not just a template sentence. Same shared module as /api/derivative.
        const ssrSolution = (safeProblem.type === 'derivative' || !safeProblem.type)
            ? memoizedDerivative(safeProblem.formula)
            : null;

        // initialResult passed to the client Calculator (avoids duplicate first fetch).
        const initialResult = ssrSolution ? {
            solution: ssrSolution.solutionLatex,
            solution_raw: ssrSolution.solutionRaw,
            steps: ssrSolution.steps,
            ai_explanation: ssrSolution.rule ? `Rule used: ${ssrSolution.rule}.` : 'Deterministic step-by-step solution.',
            rule: ssrSolution.rule,
            _ssr: true,
        } : undefined;

        const t = getLocalizedContent(locale, safeProblem.formula, safeProblem.type);
        const answerLead = (safeProblem.type === 'derivative' || !safeProblem.type)
            ? answerFirstLead(safeProblem.slug, locale, {
                formula: safeProblem.formula,
                raw: ssrSolution?.solutionRaw || null,
            })
            : null;
        const pageLesson = getInverseTrigLesson(safeProblem.slug, locale);
        const indexLesson = getDerivativeLesson(safeProblem.slug, locale);
        const striking = strikingMeta(safeProblem.slug, locale);
        const pageH1 = striking?.h1 ?? t.h1;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://derivativecalculatorai.com';
        const url = `${siteUrl}${problemHref(slug, locale)}`;

        // Generate Schema.org structured data
        const mathSolverSchema = generateMathSolverData({
            name: striking?.title ?? pageLesson?.title ?? t.title,
            description: striking?.description ?? pageLesson?.description ?? indexLesson?.description ?? t.description,
            url: url,
            educationalLevel: "College"
        });

        return (
            <>
                <StructuredData data={mathSolverSchema} />
                <div className="py-12">
                <div>
                    <Breadcrumbs
                        items={[
                            { name: 'Home', href: '/' },
                            { name: 'Problems', href: '/problems' },
                            { name: safeProblem.type || 'Derivative', href: `/problems/${safeProblem.type || 'derivative'}` },
                            { name: t.h1, href: problemHref(slug, locale) }
                        ]}
                    />
                </div>
                <div className="text-center mb-8 mt-8">
                    <h1 id={safeProblem.slug} className="text-4xl font-semibold text-ink tracking-tight mb-4">
                        {pageH1}
                    </h1>
                    {ssrSolution ? (
                        <SolutionCard
                            formula={safeProblem.formula}
                            type={safeProblem.type}
                            solutionRaw={ssrSolution.solutionRaw}
                            solutionLatex={ssrSolution.solutionLatex}
                            rule={ssrSolution.rule}
                            steps={ssrSolution.steps}
                        />
                    ) : null}
                    {answerLead ? (
                        <p className="mt-8 text-lg text-ink leading-relaxed text-left">
                            {answerLead}
                        </p>
                    ) : null}
                    <p className="mt-4 text-xl text-muted">
                        {t.subtitle} <code className="bg-chip px-2 py-1 rounded text-ink">{safeProblem.formula}</code>
                    </p>

                    {/* B4: lightweight tags/difficulty badges. Server-rendered,
                        no client logic, does not alter the math layout or the
                        canonical/noindex strategy. Tags link to the static
                        tag library so the cross-links are real. */}
                    {(safeProblem.tags || safeProblem.difficulty) && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {safeProblem.tags
                                ? safeProblem.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                                    <Link
                                        key={t}
                                        href={`/problems/tag/${t}`}
                                        className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        {tagLabel(t)}
                                    </Link>
                                ))
                                : null}
                            {safeProblem.difficulty && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    {difficultyLabel(safeProblem.difficulty)}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <Suspense fallback={<div className="text-ink text-center mt-8">Loading Calculator...</div>}>
                    <Calculator
                        initialEquation={safeProblem.formula}
                        initialLimitTo={safeProblem.limitTo}
                        mode={safeProblem.type as any}
                        initialResult={initialResult}
                        locale={locale}
                        deferGraph={safeProblem.type === 'derivative' || !safeProblem.type}
                        showInitialResult={false}
                    />
                </Suspense>

                {/* P3-P2-3: lightweight share-your-result card. Purely front-end;
                    does not alter SSR math content or the canonical/noindex strategy.
                    Placed right after the answer block so it reads as "share what you
                    just solved". Hidden gracefully when the page has no computed result. */}
                <ShareResultCard
                    formula={safeProblem.formula}
                    result={ssrSolution?.solutionRaw}
                    url={url}
                    type={safeProblem.type}
                />

                {!pageLesson && !indexLesson ? (
                    <div className="mt-12">
                        <h3 className="text-ink font-semibold text-xl mb-2">{t.howToTitle}</h3>
                        <p className="text-muted" dangerouslySetInnerHTML={{ __html: t.howToText }} />
                    </div>
                ) : null}

                {pageLesson ? (
                    <InverseTrigLesson
                        lesson={pageLesson}
                        locale={locale}
                        breadcrumbs={[
                            { name: 'Home', href: '/' },
                            { name: 'Problems', href: '/problems' },
                            { name: safeProblem.type || 'Derivative', href: `/problems/${safeProblem.type || 'derivative'}` },
                            { name: t.h1, href: problemHref(safeProblem.slug, locale) },
                        ]}
                    />
                ) : null}

                {indexLesson ? (
                    <DerivativeLessonView lesson={indexLesson} locale={locale} />
                ) : (
                    <LinksOnlySupplement slug={safeProblem.slug} locale={locale} />
                )}

                {!pageLesson && !indexLesson && TRIG_CLUSTER_SLUGS.has(safeProblem.slug) ? (
                    <TrigHubLink locale={locale} />
                ) : null}

                {/* Related Problems */}
                <div className="mt-16 pt-8 border-t border-line">
                    <h2 className="text-2xl font-semibold text-ink text-center mb-6">
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
                                    href={problemHref(p.slug, locale)}
                                    className="surface-link text-left no-underline min-h-12"
                                >
                                    <div className="font-semibold text-ink">
                                        {pT.title}
                                    </div>
                                    <div className="text-sm text-muted mt-1">
                                        {t.solvePrefix} {pSafeFormula}
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-16">
                    <AdShell type="donation" />
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
