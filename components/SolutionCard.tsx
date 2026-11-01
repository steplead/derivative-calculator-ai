import CopyLatexButton from '@/components/CopyLatexButton';
import { renderLatexHtml, renderStepsHtml } from '@/lib/steps/format-steps';

type SolutionCardProps = {
  formula: string;
  type?: string;
  solutionRaw: string;
  solutionLatex: string;
  rule: string;
  steps: string[];
};

/** Crawlable answer block. Placed directly under the page H1. */
const SolutionCard = ({ formula, type, solutionRaw, solutionLatex, rule, steps }: SolutionCardProps) => {
  const heading = `${type === 'integral' ? 'Integral' : 'Derivative'} of ${formula}`;
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
        <div>
          <dt className="text-sm font-semibold text-primary">Steps</dt>
          <dd className="mt-4" dangerouslySetInnerHTML={{ __html: stepsHtml }} />
        </div>
      </dl>
    </section>
  );
};

export default SolutionCard;
