/**
 * Unique lessons for the indexable derivative-of pages.
 * Inverse-trig slugs stay on the hand-written InverseTrigLesson; they are
 * listed here only so the rule ↔ example links stay systematic.
 */

import factsJson from '@/content/derivative-facts.json';
import { calculateDerivative } from '@/lib/math/math-core';
import type { Locale } from '@/lib/seo';
import { TRIG_CLUSTER_SLUGS, TRIG_HUB_PATH } from '@/lib/trig-cluster';

export type LessonCopy = {
  angle: string;
  algebra: string;
  mistakeTitle: string;
  mistake: string;
  mistake2Title: string;
  mistake2: string;
  domain: string;
  check: string;
};

export type DerivativeFact = {
  slug: string;
  display: string;
  engine: string;
  nice: string;
  ruleWiki: string;
  alsoWiki?: string[];
  cluster: string;
  nondiff?: boolean;
  linksOnly?: boolean;
  copy?: Record<Locale, LessonCopy>;
};

const FACTS = factsJson as DerivativeFact[];
const BY_SLUG = new Map(FACTS.map((fact) => [fact.slug, fact]));

const WIKI_LABEL: Record<string, Record<Locale, string>> = {
  'power-rule': { en: 'Power rule', es: 'Regla de la potencia', pt: 'Regra da potência' },
  'product-rule': { en: 'Product rule', es: 'Regla del producto', pt: 'Regra do produto' },
  'quotient-rule': { en: 'Quotient rule', es: 'Regla del cociente', pt: 'Regra do quociente' },
  'chain-rule': { en: 'Chain rule', es: 'Regla de la cadena', pt: 'Regra da cadeia' },
  'trigonometric-derivatives': { en: 'Trigonometric derivatives', es: 'Derivadas trigonométricas', pt: 'Derivadas trigonométricas' },
  'exponential-derivatives': { en: 'Exponential derivatives', es: 'Derivadas exponenciales', pt: 'Derivadas exponenciais' },
  'logarithmic-derivatives': { en: 'Logarithmic derivatives', es: 'Derivadas logarítmicas', pt: 'Derivadas logarítmicas' },
  'definition-of-derivative': { en: 'Definition of the derivative', es: 'Definición de derivada', pt: 'Definição de derivada' },
  'implicit-differentiation': { en: 'Implicit differentiation', es: 'Derivación implícita', pt: 'Derivação implícita' },
};

const UI = {
  en: {
    formula: 'Derivative',
    derivation: 'Why the derivative has this form',
    steps: 'Worked derivative',
    mistakes: 'Common mistakes',
    related: 'Related rule and examples',
    faq: 'Frequently asked questions',
    graph: 'Graph of the function and its derivative',
    graphNote: 'The solid curve is f. The dashed curve is f′. Vertical gaps are asymptotes or jumps, not extra zeros.',
    q1: (display: string) => `What is the derivative of ${display}?`,
    q2: (display: string) => `Which wrong answer shows up for ${display}?`,
    q3: (display: string) => `Where is the derivative of ${display} defined?`,
    example: (display: string) => `Derivative of ${display}`,
    ruleNote: 'The rule page lists this example and the others in the same family.',
    exampleNote: 'Same family of differentiation, different function.',
  },
  es: {
    formula: 'Derivada',
    derivation: 'Por qué la derivada tiene esta forma',
    steps: 'Derivada desarrollada',
    mistakes: 'Errores frecuentes',
    related: 'Regla relacionada y ejemplos',
    faq: 'Preguntas frecuentes',
    graph: 'Gráfica de la función y de su derivada',
    graphNote: 'La curva continua es f. La curva punteada es f′. Los cortes verticales son asíntotas o saltos, no ceros de más.',
    q1: (display: string) => `¿Cuál es la derivada de ${display}?`,
    q2: (display: string) => `¿Qué respuesta incorrecta aparece con ${display}?`,
    q3: (display: string) => `¿Dónde está definida la derivada de ${display}?`,
    example: (display: string) => `Derivada de ${display}`,
    ruleNote: 'La página de la regla enlaza este ejemplo y los demás de la misma familia.',
    exampleNote: 'La misma familia de derivación, con otra función.',
  },
  pt: {
    formula: 'Derivada',
    derivation: 'Por que a derivada tem esta forma',
    steps: 'Derivada desenvolvida',
    mistakes: 'Erros comuns',
    related: 'Regra relacionada e exemplos',
    faq: 'Perguntas frequentes',
    graph: 'Gráfico da função e da derivada',
    graphNote: 'A curva cheia é f. A curva tracejada é f′. As falhas verticais são assíntotas ou saltos, não zeros a mais.',
    q1: (display: string) => `Qual é a derivada de ${display}?`,
    q2: (display: string) => `Qual resposta errada aparece em ${display}?`,
    q3: (display: string) => `Onde a derivada de ${display} está definida?`,
    example: (display: string) => `Derivada de ${display}`,
    ruleNote: 'A página da regra lista este exemplo e os outros da mesma família.',
    exampleNote: 'A mesma família de derivação, com outra função.',
  },
} as const;

export type RelatedLink = { href: string; label: string; note: string };

export type DerivativeLesson = {
  slug: string;
  title: string;
  description: string;
  display: string;
  engine: string;
  nice: string;
  derivativeRaw: string | null;
  formulaHeading: string;
  derivationHeading: string;
  stepsHeading: string;
  mistakesHeading: string;
  relatedHeading: string;
  faqHeading: string;
  graphHeading: string;
  graphNote: string;
  paragraphs: string[];
  steps: string[];
  mistakes: { title: string; text: string }[];
  faqs: { question: string; answer: string }[];
  related: RelatedLink[];
  graphDerivative: string | null;
};

export function allDerivativeFacts(): readonly DerivativeFact[] {
  return FACTS;
}

export function factBySlug(slug: string): DerivativeFact | null {
  return BY_SLUG.get(slug) || null;
}

export function clusterSiblings(slug: string): string[] {
  const fact = BY_SLUG.get(slug);
  if (!fact) return [];
  return FACTS.filter((item) => item.cluster === fact.cluster && item.slug !== slug).map((item) => item.slug);
}

/** Example slugs a rule article should link to. */
export function examplesForRule(wikiSlug: string): string[] {
  return FACTS.filter(
    (fact) => fact.ruleWiki === wikiSlug || (fact.alsoWiki || []).includes(wikiSlug)
  ).map((fact) => fact.slug);
}

export function lessonPlainText(lesson: DerivativeLesson): string {
  return [
    lesson.paragraphs.join(' '),
    lesson.steps.join(' '),
    lesson.mistakes.map((item) => `${item.title} ${item.text}`).join(' '),
    lesson.faqs.map((item) => `${item.question} ${item.answer}`).join(' '),
  ].join(' ');
}

function relatedLinks(fact: DerivativeFact, locale: Locale): RelatedLink[] {
  const ui = UI[locale];
  const links: RelatedLink[] = [];
  const wikis = [fact.ruleWiki, ...(fact.alsoWiki || [])];
  for (const wiki of wikis) {
    const label = WIKI_LABEL[wiki]?.[locale] || wiki;
    links.push({ href: `/wiki/${wiki}`, label, note: ui.ruleNote });
  }
  if (TRIG_CLUSTER_SLUGS.has(fact.slug)) {
    links.push({
      href: TRIG_HUB_PATH,
      label: locale === 'es' ? 'Derivadas de funciones trigonométricas' : locale === 'pt' ? 'Derivadas de funções trigonométricas' : 'Derivatives of trigonometric functions',
      note: ui.exampleNote,
    });
  }
  for (const sibling of clusterSiblings(fact.slug)) {
    const other = BY_SLUG.get(sibling);
    if (!other) continue;
    links.push({
      href: `/${sibling}`,
      label: ui.example(other.display),
      note: ui.exampleNote,
    });
  }
  return links;
}

export function getDerivativeLesson(slug: string, locale: string): DerivativeLesson | null {
  const fact = BY_SLUG.get(slug);
  if (!fact || fact.linksOnly || !fact.copy) return null;
  const loc: Locale = locale === 'es' || locale === 'pt' ? locale : 'en';
  const copy = fact.copy[loc];
  const ui = UI[loc];
  let derivativeRaw: string | null = null;
  if (!fact.nondiff) {
    try {
      const solved = calculateDerivative(fact.engine);
      derivativeRaw = solved.isValid ? solved.solutionRaw : null;
    } catch {
      derivativeRaw = null;
    }
  }
  const shown = fact.nice || derivativeRaw || '—';
  const paragraphs = [copy.angle, copy.algebra, copy.domain, copy.check];
  const steps = loc === 'es'
    ? [
      `Escribe f(x) = ${fact.display}.`,
      copy.algebra,
      `La forma simplificada que hay que recordar es ${shown}.`,
      copy.check,
    ]
    : loc === 'pt'
      ? [
        `Escreva f(x) = ${fact.display}.`,
        copy.algebra,
        `A forma simplificada para memorizar é ${shown}.`,
        copy.check,
      ]
      : [
        `Write f(x) = ${fact.display}.`,
        copy.algebra,
        `The simplified form to remember is ${shown}.`,
        copy.check,
      ];
  const description = copy.angle.length > 155 ? `${copy.angle.slice(0, 152).replace(/\s+\S*$/, '')}.` : copy.angle;
  return {
    slug: fact.slug,
    title: fact.display,
    description,
    display: fact.display,
    engine: fact.engine,
    nice: fact.nice,
    derivativeRaw,
    formulaHeading: ui.formula,
    derivationHeading: ui.derivation,
    stepsHeading: ui.steps,
    mistakesHeading: ui.mistakes,
    relatedHeading: ui.related,
    faqHeading: ui.faq,
    graphHeading: ui.graph,
    graphNote: ui.graphNote,
    paragraphs,
    steps,
    mistakes: [
      { title: copy.mistakeTitle, text: copy.mistake },
      { title: copy.mistake2Title, text: copy.mistake2 },
    ],
    faqs: [
      { question: ui.q1(fact.display), answer: `${shown}. ${copy.angle}` },
      { question: ui.q2(fact.display), answer: copy.mistake },
      { question: ui.q3(fact.display), answer: copy.domain },
    ],
    related: relatedLinks(fact, loc),
    graphDerivative: fact.nondiff ? null : derivativeRaw,
  };
}
