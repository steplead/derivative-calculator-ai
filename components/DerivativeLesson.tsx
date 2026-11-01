import Link from 'next/link';
import StructuredData, { generateFAQData } from '@/components/StructuredData';
import { factBySlug, type DerivativeFact } from '@/content/derivative-lesson';
import type { DerivativeLesson as Lesson } from '@/content/derivative-lesson';
import { calculateDerivative } from '@/lib/math/math-core';
import { renderDerivativeSvg } from '@/lib/plot-svg';
import { TRIG_CLUSTER_SLUGS, TRIG_HUB_PATH } from '@/lib/trig-cluster';
import { localePath, normalizeLocale } from '@/lib/seo';

type DerivativeLessonProps = {
  lesson: Lesson;
  locale: string;
};

const DerivativeLessonView = ({ lesson, locale }: DerivativeLessonProps) => {
  const loc = normalizeLocale(locale);
  const svg = renderDerivativeSvg(
    lesson.engine,
    lesson.graphDerivative,
    `${lesson.graphHeading}: ${lesson.display}`
  );

  return (
    <div className="max-w-4xl mx-auto mt-12 space-y-12">
      <StructuredData data={generateFAQData(lesson.faqs)} />

      <section aria-labelledby="derivative-formula" className="space-y-3">
        <h2 id="derivative-formula" className="text-2xl font-bold text-gray-900 dark:text-white">
          {lesson.formulaHeading}
        </h2>
        <p className="text-lg font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 font-mono">
          {lesson.display} → {lesson.nice}
          {lesson.derivativeRaw ? <span className="block mt-2 text-sm font-normal text-gray-600 dark:text-gray-300">engine: {lesson.derivativeRaw}</span> : null}
        </p>
      </section>

      {svg ? (
        <section aria-labelledby="derivative-graph" className="space-y-3">
          <h2 id="derivative-graph" className="text-2xl font-bold text-gray-900 dark:text-white">
            {lesson.graphHeading}
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="text-sm text-gray-600 dark:text-gray-300">{lesson.graphNote}</p>
        </section>
      ) : null}

      <section aria-labelledby="derivative-why" className="space-y-4">
        <h2 id="derivative-why" className="text-2xl font-bold text-gray-900 dark:text-white">
          {lesson.derivationHeading}
        </h2>
        {lesson.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 64)} className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </section>

      <section aria-labelledby="derivative-steps" className="space-y-3">
        <h2 id="derivative-steps" className="text-2xl font-bold text-gray-900 dark:text-white">
          {lesson.stepsHeading}
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          {lesson.steps.map((step) => (
            <li key={step.slice(0, 80)} className="leading-relaxed">{step}</li>
          ))}
        </ol>
      </section>

      {lesson.example ? (
        <section aria-labelledby="derivative-example" className="space-y-3">
          <h2 id="derivative-example" className="text-2xl font-bold text-gray-900 dark:text-white">
            {lesson.example.heading}
          </h2>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{lesson.example.title}</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            {lesson.example.steps.map((step) => (
              <li key={step.slice(0, 80)} className="leading-relaxed">{step}</li>
            ))}
          </ol>
          <p className="text-gray-900 dark:text-white">
            <span className="font-semibold">{loc === 'es' ? 'Respuesta: ' : loc === 'pt' ? 'Resposta: ' : 'Answer: '}</span>
            {lesson.example.answer}
          </p>
        </section>
      ) : null}

      <section aria-labelledby="derivative-mistakes" className="space-y-4">
        <h2 id="derivative-mistakes" className="text-2xl font-bold text-gray-900 dark:text-white">
          {lesson.mistakesHeading}
        </h2>
        {lesson.mistakes.map((mistake) => (
          <div key={mistake.title}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{mistake.title}</h3>
            <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">{mistake.text}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="derivative-related" className="space-y-3">
        <h2 id="derivative-related" className="text-2xl font-bold text-gray-900 dark:text-white">
          {lesson.relatedHeading}
        </h2>
        <ul className="space-y-3">
          {lesson.related.map((item) => (
            <li key={item.href} className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <Link href={localePath(item.href, loc)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                {item.label}
              </Link>
              <span>{` — ${item.note}`}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="derivative-faq" className="space-y-5">
        <h2 id="derivative-faq" className="text-2xl font-bold text-gray-900 dark:text-white">
          {lesson.faqHeading}
        </h2>
        {lesson.faqs.map((faq) => (
          <div key={faq.question}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
            <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

const WIKI_NAME: Record<string, string> = {
  'trigonometric-derivatives': 'Trigonometric derivatives',
  'implicit-differentiation': 'Implicit differentiation',
  'chain-rule': 'Chain rule',
  'power-rule': 'Power rule',
};

/** Graph and rule links for indexable pages whose long lesson lives elsewhere. */
export function LinksOnlySupplement({ slug, locale }: { slug: string; locale: string }) {
  const fact: DerivativeFact | null = factBySlug(slug);
  if (!fact?.linksOnly) return null;
  const loc = normalizeLocale(locale);
  let derivative: string | null = null;
  try {
    const solved = calculateDerivative(fact.engine);
    derivative = solved.isValid ? solved.solutionRaw : null;
  } catch {
    derivative = null;
  }
  const svg = renderDerivativeSvg(fact.engine, derivative, fact.display);
  const wikis = [fact.ruleWiki, ...(fact.alsoWiki || [])];
  const heading = loc === 'es' ? 'Gráfica y reglas' : loc === 'pt' ? 'Gráfico e regras' : 'Graph and rules';
  return (
    <div className="max-w-4xl mx-auto mt-12 space-y-8">
      {svg ? (
        <section aria-labelledby="links-only-graph">
          <h2 id="links-only-graph" className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{heading}</h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white" dangerouslySetInnerHTML={{ __html: svg }} />
        </section>
      ) : null}
      <ul className="space-y-2">
        {wikis.map((wiki) => (
          <li key={wiki}>
            <Link href={localePath(`/wiki/${wiki}`, loc)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              {WIKI_NAME[wiki] || wiki}
            </Link>
          </li>
        ))}
        {TRIG_CLUSTER_SLUGS.has(slug) ? (
          <li>
            <Link href={localePath(TRIG_HUB_PATH, loc)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              {loc === 'es' ? 'Derivadas de funciones trigonométricas' : loc === 'pt' ? 'Derivadas de funções trigonométricas' : 'Derivatives of trigonometric functions'}
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export default DerivativeLessonView;
