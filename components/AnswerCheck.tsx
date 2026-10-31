'use client';

import { useState } from 'react';

type Locale = 'en' | 'es' | 'pt';

type AnswerCheckProps = {
  equation: string;
  locale?: string;
};

const COPY: Record<Locale, { title: string; placeholder: string; button: string; match: string; miss: string; expected: string }> = {
  en: {
    title: 'Check my answer',
    placeholder: 'Your derivative, e.g. 2*cos(2*x)',
    button: 'Check',
    match: 'That matches the derivative.',
    miss: 'That does not match.',
    expected: 'Expected',
  },
  es: {
    title: 'Comprobar mi respuesta',
    placeholder: 'Tu derivada, por ejemplo 2*cos(2*x)',
    button: 'Comprobar',
    match: 'Coincide con la derivada.',
    miss: 'No coincide.',
    expected: 'Esperado',
  },
  pt: {
    title: 'Conferir minha resposta',
    placeholder: 'Sua derivada, por exemplo 2*cos(2*x)',
    button: 'Conferir',
    match: 'Confere com a derivada.',
    miss: 'Não confere.',
    expected: 'Esperado',
  },
};

function loc(locale: string | undefined): Locale {
  if (locale === 'es' || locale === 'pt') return locale;
  return 'en';
}

export default function AnswerCheck({ equation, locale }: AnswerCheckProps) {
  const t = COPY[loc(locale)];
  const [answer, setAnswer] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState<boolean | null>(null);

  const onCheck = async () => {
    const trimmed = answer.trim();
    if (!trimmed || !equation) return;
    setPending(true);
    setMessage('');
    setOk(null);
    try {
      const response = await fetch(
        `/api/check-answer?equation=${encodeURIComponent(equation)}&answer=${encodeURIComponent(trimmed)}`
      );
      const data = await response.json();
      if (!response.ok) {
        setOk(false);
        setMessage(data.error || t.miss);
        return;
      }
      setOk(Boolean(data.match));
      setMessage(data.match ? t.match : `${t.miss} ${t.expected}: ${data.expected}`);
    } catch {
      setOk(false);
      setMessage(t.miss);
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      className="mt-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onCheck();
      }}
    >
      <label htmlFor="check-answer" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {t.title}
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="check-answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={t.placeholder}
          aria-label={t.title}
          className="flex-grow px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-mono text-gray-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={t.button}
          className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl disabled:opacity-50"
        >
          {pending ? '…' : t.button}
        </button>
      </div>
      {message ? (
        <p className={`mt-3 text-sm ${ok ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
