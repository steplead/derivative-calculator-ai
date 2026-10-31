'use client';

import { useState } from 'react';

type AskWhyButtonProps = {
  equation: string;
  step: string;
  rule?: string;
  locale?: string;
};

const LABEL: Record<string, string> = {
  en: 'Ask AI why',
  es: 'Preguntar por qué',
  pt: 'Perguntar por quê',
};

export default function AskWhyButton({ equation, step, rule, locale }: AskWhyButtonProps) {
  const label = LABEL[locale || 'en'] || LABEL.en;
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState('');
  const [pending, setPending] = useState(false);

  const onAsk = async () => {
    if (why) {
      setOpen((value) => !value);
      return;
    }
    setPending(true);
    setOpen(true);
    try {
      const response = await fetch('/api/explain-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equation, step, rule: rule || '' }),
      });
      const data = await response.json();
      setWhy(data.why || data.error || '');
    } catch {
      setWhy('');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => void onAsk()}
        aria-label={label}
        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
      >
        {pending ? '…' : label}
      </button>
      {open && why ? <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{why}</p> : null}
    </div>
  );
}
