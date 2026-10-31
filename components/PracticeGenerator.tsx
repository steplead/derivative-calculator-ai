'use client';

import { useState } from 'react';
import AnswerCheck from '@/components/AnswerCheck';

type Locale = 'en' | 'es' | 'pt';

const RULES = ['power', 'product', 'quotient', 'chain', 'trigonometric', 'exponential', 'logarithmic'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

const TEXT: Record<Locale, {
  title: string;
  lead: string;
  rule: string;
  level: string;
  next: string;
  prompt: string;
  rules: Record<string, string>;
  levels: Record<string, string>;
}> = {
  en: {
    title: 'Practice problem generator',
    lead: 'Pick a rule and a difficulty. Each problem is differentiated with the same engine that checks your answer.',
    rule: 'Rule',
    level: 'Difficulty',
    next: 'New problem',
    prompt: 'Find the derivative of',
    rules: {
      power: 'Power',
      product: 'Product',
      quotient: 'Quotient',
      chain: 'Chain',
      trigonometric: 'Trigonometric',
      exponential: 'Exponential',
      logarithmic: 'Logarithmic',
    },
    levels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  },
  es: {
    title: 'Generador de problemas',
    lead: 'Elige una regla y una dificultad. El mismo motor que deriva el problema comprueba tu respuesta.',
    rule: 'Regla',
    level: 'Dificultad',
    next: 'Otro problema',
    prompt: 'Halla la derivada de',
    rules: {
      power: 'Potencia',
      product: 'Producto',
      quotient: 'Cociente',
      chain: 'Cadena',
      trigonometric: 'Trigonométrica',
      exponential: 'Exponencial',
      logarithmic: 'Logarítmica',
    },
    levels: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' },
  },
  pt: {
    title: 'Gerador de problemas',
    lead: 'Escolha uma regra e uma dificuldade. O mesmo motor que deriva o problema confere sua resposta.',
    rule: 'Regra',
    level: 'Dificuldade',
    next: 'Outro problema',
    prompt: 'Ache a derivada de',
    rules: {
      power: 'Potência',
      product: 'Produto',
      quotient: 'Quociente',
      chain: 'Cadeia',
      trigonometric: 'Trigonométrica',
      exponential: 'Exponencial',
      logarithmic: 'Logarítmica',
    },
    levels: { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' },
  },
};

function loc(locale: string | undefined): Locale {
  if (locale === 'es' || locale === 'pt') return locale;
  return 'en';
}

type Problem = { expression: string; hint: string; seed: number };

export default function PracticeGenerator({ locale }: { locale?: string }) {
  const t = TEXT[loc(locale)];
  const [rule, setRule] = useState<(typeof RULES)[number]>('chain');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('beginner');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setPending(true);
    setError('');
    try {
      const seed = Math.floor(Math.random() * 100000);
      const response = await fetch(
        `/api/practice?rule=${rule}&difficulty=${level}&locale=${loc(locale)}&seed=${seed}`
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Error');
        return;
      }
      setProblem({ expression: data.expression, hint: data.hint, seed: data.seed });
    } catch {
      setError('Error');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto mt-16 p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700" aria-labelledby="practice-generator">
      <h2 id="practice-generator" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{t.lead}</p>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <label className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t.rule}
          <select
            aria-label={t.rule}
            value={rule}
            onChange={(event) => setRule(event.target.value as (typeof RULES)[number])}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700"
          >
            {RULES.map((item) => <option key={item} value={item}>{t.rules[item]}</option>)}
          </select>
        </label>
        <label className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t.level}
          <select
            aria-label={t.level}
            value={level}
            onChange={(event) => setLevel(event.target.value as (typeof LEVELS)[number])}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700"
          >
            {LEVELS.map((item) => <option key={item} value={item}>{t.levels[item]}</option>)}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={pending}
          aria-label={t.next}
          className="self-end px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50"
        >
          {pending ? '…' : t.next}
        </button>
      </div>
      {error ? <p className="text-red-600 text-sm" role="status">{error}</p> : null}
      {problem ? (
        <div>
          <p className="text-lg text-gray-900 dark:text-white">
            {t.prompt} <code className="font-mono">{problem.expression}</code>
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{problem.hint}</p>
          <AnswerCheck key={problem.seed} equation={problem.expression} locale={locale} />
        </div>
      ) : null}
    </section>
  );
}
