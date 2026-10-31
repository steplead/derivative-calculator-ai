'use client';

import { useEffect, useState } from 'react';
import AnswerCheck from '@/components/AnswerCheck';
import {
  MISSED_KEY,
  STREAK_KEY_PREFIX,
  nextStreak,
  rememberMiss,
  type MissedProblem,
  type PracticeTopic,
} from '@/lib/practice-retention';

type Locale = 'en' | 'es' | 'pt';

const DERIVATIVE_RULES = ['power', 'product', 'quotient', 'chain', 'trigonometric', 'exponential', 'logarithmic'] as const;
const INTEGRAL_RULES = ['power', 'substitution', 'parts', 'trigonometric', 'exponential', 'logarithmic'] as const;
const LIMIT_RULES = ['direct', 'algebraic', 'standard'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

const TEXT: Record<Locale, {
  title: string;
  lead: string;
  rule: string;
  level: string;
  next: string;
  prompt: Record<PracticeTopic, string>;
  streak: string;
  streakMode: string;
  missed: string;
  retry: string;
  rules: Record<string, string>;
  levels: Record<string, string>;
}> = {
  en: {
    title: 'Practice problem generator',
    lead: 'Pick a rule and a difficulty. A correct answer extends the streak. A miss resets it and is saved on this device.',
    rule: 'Rule',
    level: 'Difficulty',
    next: 'New problem',
    prompt: { derivative: 'Find the derivative of', integral: 'Find the integral of', limit: 'Find the limit of' },
    streak: 'Streak',
    streakMode: 'Streak mode',
    missed: 'Missed problems',
    retry: 'Retry',
    rules: {
      power: 'Power', product: 'Product', quotient: 'Quotient', chain: 'Chain',
      trigonometric: 'Trigonometric', exponential: 'Exponential', logarithmic: 'Logarithmic',
      substitution: 'Substitution', parts: 'Parts', direct: 'Direct', algebraic: 'Algebra', standard: 'Standard',
    },
    levels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  },
  es: {
    title: 'Generador de problemas',
    lead: 'Elige una regla y una dificultad. Una respuesta correcta alarga la racha. Un fallo la reinicia y se guarda en este dispositivo.',
    rule: 'Regla',
    level: 'Dificultad',
    next: 'Otro problema',
    prompt: { derivative: 'Halla la derivada de', integral: 'Halla la integral de', limit: 'Halla el límite de' },
    streak: 'Racha',
    streakMode: 'Modo racha',
    missed: 'Problemas fallados',
    retry: 'Reintentar',
    rules: {
      power: 'Potencia', product: 'Producto', quotient: 'Cociente', chain: 'Cadena',
      trigonometric: 'Trigonométrica', exponential: 'Exponencial', logarithmic: 'Logarítmica',
      substitution: 'Sustitución', parts: 'Partes', direct: 'Directo', algebraic: 'Álgebra', standard: 'Estándar',
    },
    levels: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' },
  },
  pt: {
    title: 'Gerador de problemas',
    lead: 'Escolha uma regra e uma dificuldade. Uma resposta certa aumenta a sequência. Um erro zera a sequência e fica salvo neste aparelho.',
    rule: 'Regra',
    level: 'Dificuldade',
    next: 'Outro problema',
    prompt: { derivative: 'Ache a derivada de', integral: 'Ache a integral de', limit: 'Ache o limite de' },
    streak: 'Sequência',
    streakMode: 'Modo sequência',
    missed: 'Problemas errados',
    retry: 'Tentar de novo',
    rules: {
      power: 'Potência', product: 'Produto', quotient: 'Quociente', chain: 'Cadeia',
      trigonometric: 'Trigonométrica', exponential: 'Exponencial', logarithmic: 'Logarítmica',
      substitution: 'Substituição', parts: 'Partes', direct: 'Direto', algebraic: 'Álgebra', standard: 'Padrão',
    },
    levels: { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' },
  },
};

function loc(locale: string | undefined): Locale {
  if (locale === 'es' || locale === 'pt') return locale;
  return 'en';
}

type Problem = { expression: string; hint: string; seed: number; limitTo?: string };

function rulesFor(topic: PracticeTopic): readonly string[] {
  if (topic === 'integral') return INTEGRAL_RULES;
  if (topic === 'limit') return LIMIT_RULES;
  return DERIVATIVE_RULES;
}

export default function PracticeGenerator({ locale, topic = 'derivative' }: { locale?: string; topic?: PracticeTopic }) {
  const t = TEXT[loc(locale)];
  const rules = rulesFor(topic);
  const [rule, setRule] = useState<string>(rules[0]);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('beginner');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [streak, setStreak] = useState(0);
  const [streakMode, setStreakMode] = useState(true);
  const [missed, setMissed] = useState<MissedProblem[]>([]);
  const [scoredSeed, setScoredSeed] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(`${STREAK_KEY_PREFIX}${topic}`) || 0);
      if (Number.isFinite(stored) && stored > 0) setStreak(stored);
      const raw = localStorage.getItem(MISSED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MissedProblem[];
        if (Array.isArray(parsed)) setMissed(parsed.filter((item) => item && item.expression));
      }
    } catch {
      // Storage can be blocked. The generator still works for the session.
    }
  }, [topic]);

  const persist = (next: number, misses: MissedProblem[]) => {
    setStreak(next);
    setMissed(misses);
    try {
      localStorage.setItem(`${STREAK_KEY_PREFIX}${topic}`, String(next));
      localStorage.setItem(MISSED_KEY, JSON.stringify(misses));
    } catch {
      // Ignore quota and private-mode failures.
    }
  };

  const load = async (override?: { rule?: string; expression?: string; limitTo?: string }) => {
    setPending(true);
    setError('');
    setScoredSeed(null);
    try {
      if (override?.expression) {
        setProblem({
          expression: override.expression,
          hint: '',
          seed: Date.now() % 100000,
          limitTo: override.limitTo,
        });
        return;
      }
      const seed = Math.floor(Math.random() * 100000);
      const chosen = override?.rule || rule;
      const response = await fetch(
        `/api/practice?topic=${topic}&rule=${chosen}&difficulty=${level}&locale=${loc(locale)}&seed=${seed}`
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Error');
        return;
      }
      setProblem({
        expression: data.expression,
        hint: data.hint,
        seed: data.seed,
        limitTo: data.limitTo || undefined,
      });
    } catch {
      setError('Error');
    } finally {
      setPending(false);
    }
  };

  const onResult = (match: boolean, expected?: string) => {
    if (!problem || scoredSeed === problem.seed) return;
    setScoredSeed(problem.seed);
    const updated = nextStreak(streak, match);
    const misses = match
      ? missed
      : rememberMiss(missed, {
        topic,
        expression: problem.expression,
        limitTo: problem.limitTo,
        expected,
        at: Date.now(),
      });
    persist(updated, misses);
    if (match && streakMode) {
      window.setTimeout(() => { void load(); }, 700);
    }
  };

  const topicMisses = missed.filter((item) => item.topic === topic);

  return (
    <section className="max-w-4xl mx-auto mt-16 p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700" aria-labelledby={`practice-generator-${topic}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h2 id={`practice-generator-${topic}`} className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300" aria-live="polite">{t.streak}: {streak}</p>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{t.lead}</p>
      <label className="inline-flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={streakMode}
          onChange={(event) => setStreakMode(event.target.checked)}
          aria-label={t.streakMode}
        />
        {t.streakMode}
      </label>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <label className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t.rule}
          <select
            aria-label={t.rule}
            value={rule}
            onChange={(event) => setRule(event.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700"
          >
            {rules.map((item) => <option key={item} value={item}>{t.rules[item] || item}</option>)}
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
            {t.prompt[topic]} <code className="font-mono">{problem.expression}</code>
            {topic === 'limit' && problem.limitTo ? <span>{` as x → ${problem.limitTo}`}</span> : null}
          </p>
          {problem.hint ? <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{problem.hint}</p> : null}
          <AnswerCheck
            key={problem.seed}
            equation={problem.expression}
            locale={locale}
            mode={topic}
            limitTo={problem.limitTo}
            onResult={onResult}
          />
        </div>
      ) : null}
      {topicMisses.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t.missed}</h3>
          <ul className="space-y-2">
            {topicMisses.slice(0, 8).map((item) => (
              <li key={`${item.expression}-${item.limitTo || ''}`} className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <code className="font-mono">{item.expression}{item.limitTo ? ` → ${item.limitTo}` : ''}</code>
                <button
                  type="button"
                  aria-label={t.retry}
                  onClick={() => void load({ expression: item.expression, limitTo: item.limitTo })}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700"
                >
                  {t.retry}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
