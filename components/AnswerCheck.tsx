'use client';

import { useId, useState } from 'react';

type Locale = 'en' | 'es' | 'pt';

type AnswerCheckProps = {
  equation: string;
  locale?: string;
  mode?: 'derivative' | 'integral' | 'limit';
  limitTo?: string;
  onResult?: (_match: boolean, _expected?: string) => void;
};

const COPY: Record<Locale, { title: string; placeholder: Record<string, string>; button: string; match: string; miss: string; expected: string }> = {
  en: {
    title: 'Check my answer',
    placeholder: {
      derivative: 'Your derivative, e.g. 2*cos(2*x)',
      integral: 'Your antiderivative, e.g. x^3/3+C',
      limit: 'Your limit, e.g. 1',
    },
    button: 'Check',
    match: 'That matches.',
    miss: 'That does not match.',
    expected: 'Expected',
  },
  es: {
    title: 'Comprobar mi respuesta',
    placeholder: {
      derivative: 'Tu derivada, por ejemplo 2*cos(2*x)',
      integral: 'Tu antiderivada, por ejemplo x^3/3+C',
      limit: 'Tu límite, por ejemplo 1',
    },
    button: 'Comprobar',
    match: 'Coincide.',
    miss: 'No coincide.',
    expected: 'Esperado',
  },
  pt: {
    title: 'Conferir minha resposta',
    placeholder: {
      derivative: 'Sua derivada, por exemplo 2*cos(2*x)',
      integral: 'Sua antiderivada, por exemplo x^3/3+C',
      limit: 'Seu limite, por exemplo 1',
    },
    button: 'Conferir',
    match: 'Confere.',
    miss: 'Não confere.',
    expected: 'Esperado',
  },
};

function loc(locale: string | undefined): Locale {
  if (locale === 'es' || locale === 'pt') return locale;
  return 'en';
}

export default function AnswerCheck({ equation, locale, mode = 'derivative', limitTo = '0', onResult }: AnswerCheckProps) {
  const t = COPY[loc(locale)];
  const fieldId = useId();
  const placeholder = t.placeholder[mode] || t.placeholder.derivative;
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
      const to = mode === 'limit' ? `&to=${encodeURIComponent(limitTo || '0')}` : '';
      const response = await fetch(
        `/api/check-answer?mode=${mode}&equation=${encodeURIComponent(equation)}&answer=${encodeURIComponent(trimmed)}${to}`
      );
      const data = await response.json();
      if (!response.ok) {
        setOk(false);
        setMessage(data.error || t.miss);
        onResult?.(false);
        return;
      }
      const match = Boolean(data.match);
      setOk(match);
      setMessage(match ? t.match : `${t.miss} ${t.expected}: ${data.expected}`);
      onResult?.(match, typeof data.expected === 'string' ? data.expected : undefined);
    } catch {
      setOk(false);
      setMessage(t.miss);
      onResult?.(false);
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
      <label htmlFor={fieldId} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {t.title}
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id={fieldId}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={placeholder}
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
