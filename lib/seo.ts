/**
 * Shared SEO helpers: locale canonicals, hreflang, keyword titles, and the
 * public form of problem slugs.
 *
 * Literal "+" in a path is not a stable URL on this host. The edge decodes an
 * unescaped "+" into a space, the dynamic route misses the library row, and
 * the response is a 404. The public slug spells that character as "plus"
 * (`integral-of-tanx-+-cosx` → `integral-of-tanx-plus-cosx`). Middleware 301s
 * the broken form to the public form.
 */

import { findStaticProblem, type StaticProblem } from '@/lib/problems-source';

export const SITE_URL = 'https://derivativecalculatorai.com';

export type Locale = 'en' | 'es' | 'pt';

export function normalizeLocale(locale: string | null | undefined): Locale {
    if (locale === 'es' || locale === 'pt') return locale;
    return 'en';
}

/** Replace a literal plus (or the space it was corrupted into) with the letters "plus". */
export function plusFreeSlug(slug: string): string {
    return slug.replace(/\+/g, 'plus').replace(/ /g, 'plus');
}

/** Inverse of plusFreeSlug. Only valid when the slug does not already use the word "plus". */
export function plusSymbolSlug(slug: string): string {
    return slug.replace(/plus/g, '+');
}

export function safeDecodeSlug(slug: string): string {
    try {
        return decodeURIComponent(slug);
    } catch {
        return slug;
    }
}

/**
 * Library lookup candidates for a request slug.
 * Exact match is first. A space is the corrupted form of "+", and a public
 * "plus" slug maps back to the library row that still stores "+".
 */
export function slugLookupCandidates(raw: string): string[] {
    const decoded = safeDecodeSlug(raw).trim();
    const candidates = [decoded];
    const spaced = decoded.replace(/ /g, '+');
    if (spaced !== decoded) candidates.push(spaced);
    const symbol = plusSymbolSlug(decoded);
    if (symbol !== decoded) candidates.push(symbol);
    return [...new Set(candidates)];
}

export function resolveLibraryProblem(
    rows: StaticProblem[],
    rawSlug: string
): StaticProblem | null {
    for (const candidate of slugLookupCandidates(rawSlug)) {
        const hit = findStaticProblem(rows, candidate);
        if (hit) return hit;
    }
    return null;
}

export function problemHref(slug: string, locale: string = 'en'): string {
    const s = plusFreeSlug(slug);
    const loc = normalizeLocale(locale);
    return loc === 'en' ? `/${s}` : `/${loc}/${s}`;
}

/** Site path for a locale. `path` is "/" or "/practice". */
export function localePath(path: string, locale: string = 'en'): string {
    const loc = normalizeLocale(locale);
    const clean = !path || path === '/' ? '' : (path.startsWith('/') ? path : `/${path}`);
    if (loc === 'en') return clean || '/';
    return clean ? `/${loc}${clean}` : `/${loc}`;
}

/** Homepage calculator with the expression already filled in. */
export function calculatorHref(formula: string, locale: string = 'en'): string {
    const base = localePath('/', locale);
    const query = `equation=${encodeURIComponent(formula)}`;
    return base === '/' ? `/?${query}` : `${base}?${query}`;
}

/** Path is site-root relative, "" or "/" for the homepage. */
export function localeAlternates(path: string, locale: string): {
    canonical: string;
    languages: Record<string, string>;
} {
    const loc = normalizeLocale(locale);
    const clean = !path || path === '/' ? '' : (path.startsWith('/') ? path : `/${path}`);
    const forLocale = (l: Locale): string =>
        l === 'en' ? `${SITE_URL}${clean}` : `${SITE_URL}/${l}${clean}`;
    return {
        canonical: forLocale(loc),
        languages: {
            en: forLocale('en'),
            es: forLocale('es'),
            pt: forLocale('pt'),
            'x-default': forLocale('en'),
        },
    };
}

/** Keyword-first title, hard-capped at 60 characters on a word boundary. */
export function keywordTitle(title: string, max = 60): string {
    const cleaned = title.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= max) return cleaned;
    const cut = cleaned.slice(0, max);
    const space = cut.lastIndexOf(' ');
    const trimmed = (space >= 24 ? cut.slice(0, space) : cut)
        .replace(/[\s\-–—|,;:]+$/g, '')
        .trim();
    return trimmed.length > 0 ? trimmed : cut.trim();
}

export const PAGE_TITLES: Record<string, Record<Locale, string>> = {
    home: {
        en: 'Derivative Calculator & Solver with Steps (Free)',
        es: 'Calculadora de Derivadas y Solver Gratis',
        pt: 'Calculadora de Derivadas e Solver Grátis',
    },
    integral: {
        en: 'Integral Calculator with Steps (Free)',
        es: 'Calculadora de Integrales con Pasos',
        pt: 'Calculadora de Integrais com Passos',
    },
    limit: {
        en: 'Limit Calculator with Steps (Free)',
        es: 'Calculadora de Límites con Pasos',
        pt: 'Calculadora de Limites com Passos',
    },
    matrix: {
        en: 'Matrix Calculator — Determinant & Inverse',
        es: 'Calculadora de Matrices Gratis',
        pt: 'Calculadora de Matrizes Grátis',
    },
    ode: {
        en: 'Differential Equation Solver with Steps',
        es: 'Solucionador de Ecuaciones Diferenciales',
        pt: 'Resolvedor de Equações Diferenciais',
    },
    calculators: {
        en: 'Free Calculus Calculators',
        es: 'Calculadoras de Cálculo Gratis',
        pt: 'Calculadoras de Cálculo Grátis',
    },
    wiki: {
        en: 'Calculus Wiki: Rules and Examples',
        es: 'Wiki de Cálculo: Reglas y Ejemplos',
        pt: 'Wiki de Cálculo: Regras e Exemplos',
    },
    practice: {
        en: 'Practice Calculus Problems',
        es: 'Practicar Problemas de Cálculo',
        pt: 'Praticar Problemas de Cálculo',
    },
    directory: {
        en: 'Derivative Problem Directory',
        es: 'Directorio de Problemas de Derivadas',
        pt: 'Diretório de Problemas de Derivadas',
    },
    problems: {
        en: 'Calculus Problem Library',
        es: 'Biblioteca de Problemas de Cálculo',
        pt: 'Biblioteca de Problemas de Cálculo',
    },
    about: {
        en: 'About Derivative Calculator',
        es: 'Acerca de la Calculadora de Derivadas',
        pt: 'Sobre a Calculadora de Derivadas',
    },
    contact: {
        en: 'Contact Derivative Calculator',
        es: 'Contacto — Calculadora de Derivadas',
        pt: 'Contato — Calculadora de Derivadas',
    },
    privacy: {
        en: 'Privacy Policy',
        es: 'Política de Privacidad',
        pt: 'Política de Privacidade',
    },
    partial: {
        en: 'Partial Derivative Calculator (Free)',
        es: 'Calculadora de Derivadas Parciales',
        pt: 'Calculadora de Derivadas Parciais',
    },
    implicit: {
        en: 'Implicit Differentiation Calculator',
        es: 'Calculadora de Derivación Implícita',
        pt: 'Calculadora de Derivação Implícita',
    },
    chain: {
        en: 'Chain Rule Calculator with Steps',
        es: 'Calculadora de la Regla de la Cadena',
        pt: 'Calculadora da Regra da Cadeia',
    },
};

export const HOME_DESCRIPTIONS: Record<Locale, string> = {
    en: 'Derivative calculator and solver with free step-by-step solutions for polynomials, trig, exponentials, and logarithms. No sign-up.',
    es: 'Calculadora de derivadas y solver gratis con solución paso a paso para polinomios, trigonometría, exponenciales y logaritmos.',
    pt: 'Calculadora de derivadas e solver grátis com solução passo a passo para polinômios, trigonometria, exponenciais e logaritmos.',
};

export function pageTitle(page: keyof typeof PAGE_TITLES, locale: string): string {
    const loc = normalizeLocale(locale);
    return keywordTitle(PAGE_TITLES[page][loc]);
}
