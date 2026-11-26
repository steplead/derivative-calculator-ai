import CopyLatexButton from '@/components/CopyLatexButton';
import { renderLatexHtml, renderStepsHtml } from '@/lib/steps/format-steps';
import { displayExpression } from '@/lib/math/math-core';

type SolutionCardProps = {
  formula: string;
  type?: string;
  solutionRaw: string;
  solutionLatex: string;
  rule: string;
  steps: string[];
  /** Limit target (only meaningful when type === 'limit'). */
  limitTo?: string;
};

/** Crawlable answer block. Placed directly under the page H1. */
const SolutionCard = ({ formula, type, solutionRaw, solutionLatex, rule, steps, limitTo }: SolutionCardProps) => {
  // Display form only (exp(2*x) → e^(2x)); never the engine form.
  const shown = displayExpression(formula);
  const heading = type === 'integral'
    ? `Integral of ${shown}`
    : type === 'limit'
      ? `Limit of ${shown} as x approaches ${displayExpression(limitTo || '0')}`
      : `Derivative of ${shown}`;
  const answerHtml = renderLatexHtml(solutionLatex || solutionRaw, true);
  const stepsHtml = renderStepsHtml(steps);

  return (
    <section className="mt-8 text-left" aria-label="Solution">
      <div className="answer-panel answer-flash">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <p className="answer-kicker m-0">Answer</p>
          <CopyLatexButton latex={solutionLatex || solutionRaw} />
        </div>
        <div className="answer-math" dangerouslySetInnerHTML={{ __html: answerHtml }} />
        <span className="sr-only">{solutionRaw}</span>
      </div>
      <h2 className="text-2xl font-semibold text-ink mt-8 mb-4">{heading}</h2>
      <dl className="space-y-6">
        <div>
          <dt className="text-sm font-semibold text-primary">Rule Used</dt>
          <dd className="mt-2 text-ink">{rule}</dd>
        </div>
        {/* A page may ship the answer without steps when the engine's step text
            still carries a numericized constant (see solveForType). */}
        {steps.length > 0 ? (
          <div>
            <dt className="text-sm font-semibold text-primary">Steps</dt>
            <dd className="mt-4" dangerouslySetInnerHTML={{ __html: stepsHtml }} />
          </div>
        ) : null}
      </dl>
    </section>
  );
};

export default SolutionCard;
