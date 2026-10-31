'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import AnswerCheck from '@/components/AnswerCheck';
import AskWhyButton from '@/components/AskWhyButton';

const MathDisplay = dynamic(() => import('./MathDisplay'), { ssr: false });

type Mode = 'partial' | 'implicit' | 'chain';
type Locale = 'en' | 'es' | 'pt';

type AdvancedCalculatorProps = {
  mode: Mode;
  locale?: string;
  initialEquation?: string;
};

const COPY: Record<Locale, Record<Mode, { h: string; ph: string; go: string; variable: string }>> = {
  en: {
    partial: { h: 'Function of several variables', ph: 'x^2*y + sin(y)', go: 'Differentiate', variable: 'With respect to' },
    implicit: { h: 'Equation F(x, y) = 0', ph: 'x^2 + y^2 = 25', go: 'Solve for dy/dx', variable: '' },
    chain: { h: 'Composite function', ph: 'sin(2*x)', go: 'Apply the chain rule', variable: '' },
  },
  es: {
    partial: { h: 'Función de varias variables', ph: 'x^2*y + sin(y)', go: 'Derivar', variable: 'Respecto de' },
    implicit: { h: 'Ecuación F(x, y) = 0', ph: 'x^2 + y^2 = 25', go: 'Despejar dy/dx', variable: '' },
    chain: { h: 'Función compuesta', ph: 'sin(2*x)', go: 'Aplicar la regla de la cadena', variable: '' },
  },
  pt: {
    partial: { h: 'Função de várias variáveis', ph: 'x^2*y + sin(y)', go: 'Derivar', variable: 'Em relação a' },
    implicit: { h: 'Equação F(x, y) = 0', ph: 'x^2 + y^2 = 25', go: 'Isolar dy/dx', variable: '' },
    chain: { h: 'Função composta', ph: 'sin(2*x)', go: 'Aplicar a regra da cadeia', variable: '' },
  },
};

function loc(locale: string | undefined): Locale {
  if (locale === 'es' || locale === 'pt') return locale;
  return 'en';
}

export default function AdvancedCalculator({ mode, locale, initialEquation }: AdvancedCalculatorProps) {
  const t = COPY[loc(locale)][mode];
  const [input, setInput] = useState(initialEquation || '');
  const [variable, setVariable] = useState('x');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ solution: string; solution_raw: string; steps: string; rule: string; outer?: string; inner?: string; outer_derivative?: string; inner_derivative?: string } | null>(null);

  const solve = async () => {
    const equation = input.trim();
    if (!equation) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const params = new URLSearchParams({ equation });
      if (mode === 'partial') params.set('variable', variable);
      const response = await fetch(`/api/${mode === 'partial' ? 'partial' : mode === 'implicit' ? 'implicit' : 'chain'}?${params}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Error');
        return;
      }
      setResult(data);
    } catch {
      setError('Error');
    } finally {
      setLoading(false);
    }
  };

  const steps = result?.steps?.split('\n').map((line) => line.trim()).filter(Boolean) || [];

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void solve();
        }}
      >
        <label htmlFor={`${mode}-input`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {t.h}
        </label>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            id={`${mode}-input`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t.ph}
            aria-label={t.h}
            className="flex-grow px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 font-mono text-gray-900 dark:text-white"
          />
          {mode === 'partial' ? (
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t.variable}
              <select
                aria-label={t.variable}
                value={variable}
                onChange={(event) => setVariable(event.target.value)}
                className="mt-1 block px-3 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="x">x</option>
                <option value="y">y</option>
                <option value="z">z</option>
              </select>
            </label>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            aria-label={t.go}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? '…' : t.go}
          </button>
        </div>
      </form>
      {error ? <p className="mt-4 text-red-600" role="status">{error}</p> : null}
      {result ? (
        <div className="mt-8 space-y-4">
          <div className="text-3xl overflow-x-auto text-gray-900 dark:text-white">
            <MathDisplay latex={result.solution} />
          </div>
          <p className="font-mono text-sm text-gray-600 dark:text-gray-300">{result.solution_raw}</p>
          {mode === 'chain' && result.outer ? (
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="font-semibold">u</dt><dd className="font-mono">{result.inner}</dd></div>
              <div><dt className="font-semibold">d/du</dt><dd className="font-mono">{result.outer_derivative}</dd></div>
              <div><dt className="font-semibold">du/dx</dt><dd className="font-mono">{result.inner_derivative}</dd></div>
            </dl>
          ) : null}
          <ol className="space-y-3">
            {steps.map((step) => (
              <li key={step} className="text-gray-700 dark:text-gray-300">
                {step.replace(/\*\*/g, '')}
                <AskWhyButton equation={input} step={step} rule={result.rule} locale={locale} />
              </li>
            ))}
          </ol>
          {mode === 'chain' ? <AnswerCheck equation={input} locale={locale} /> : null}
        </div>
      ) : null}
    </div>
  );
}
