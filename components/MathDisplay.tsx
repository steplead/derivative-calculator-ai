'use client';

import { renderLatexHtml } from '@/lib/steps/format-steps';

interface MathDisplayProps {
  latex: string;
}

export default function MathDisplay({ latex }: MathDisplayProps) {
  return (
    <div className="answer-math" dangerouslySetInnerHTML={{ __html: renderLatexHtml(latex, true) }} />
  );
}
