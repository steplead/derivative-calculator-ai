'use client';

import { useState } from 'react';

type CopyLatexButtonProps = {
  latex: string;
};

const CopyLatexButton = ({ latex }: CopyLatexButtonProps) => {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!latex) return;
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" className="copy-btn" onClick={onCopy} aria-label="Copy LaTeX">
      {copied ? 'Copied' : 'Copy LaTeX'}
    </button>
  );
};

export default CopyLatexButton;
