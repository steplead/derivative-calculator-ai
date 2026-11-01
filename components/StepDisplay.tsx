'use client';

import AskWhyButton from '@/components/AskWhyButton';
import { parseSteps, renderMathAndText } from '@/lib/steps/format-steps';

interface StepDisplayProps {
  content: string | string[];
  equation?: string;
  rule?: string;
  locale?: string;
}

export default function StepDisplay({ content, equation, rule, locale }: StepDisplayProps) {
  const steps = parseSteps(content);
  if (steps.length === 0) return null;

  return (
    <ol className="step-list">
      {steps.map((step, index) => (
        <li key={`${step.label}-${index}`}>
          <div className="step-copy">
            {step.title ? <p className="step-title">{step.title}</p> : null}
            {step.body ? (
              <div className="step-body" dangerouslySetInnerHTML={{ __html: renderMathAndText(step.body) }} />
            ) : null}
            {equation ? (
              <AskWhyButton equation={equation} step={step.body || step.label} rule={rule} locale={locale} />
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
