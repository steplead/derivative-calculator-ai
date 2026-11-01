/**
 * Turn calculator step strings into numbered HTML.
 * Strips Markdown asterisks and renders delimited or inline math with KaTeX.
 * Safe for the Edge runtime: katex is pure JS and every text node is escaped.
 */

import katex from 'katex';

export type ParsedStep = {
  label: string;
  /** Extra title after "Step N", such as "Problem Identification". */
  title: string | null;
  body: string;
};

const STEP_HEADING = /^\*\*((?:Step\s+\d+(?:\s*:[^*]*)?)|Final Answer)\s*\*\*:?\s*/i;
const PLAIN_STEP_HEADING = /^(Step\s+\d+)\s*:\s*/i;

const MATH_PATTERN =
  /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$|(?:d\/dx)(?:\s*[A-Za-z]+(?:\([^)]*\))?)?|(?:arcsin|arccos|arctan|asin|acos|atan|sinh|cosh|tanh|log10|sqrt|sin|cos|tan|sec|csc|cot|ln|log)\([^)]*\)(?:\^(?:\(\s*[^)]*\)|\d+))?|[A-Za-z]\^(?:\(\s*[^)]*\)|\d+)|\d+\s*[·*]\s*[A-Za-z](?:\^(?:\(\s*[^)]*\)|\d+))?/g;

const FN_LATEX: Record<string, string> = {
  arcsin: '\\arcsin',
  arccos: '\\arccos',
  arctan: '\\arctan',
  asin: '\\arcsin',
  acos: '\\arccos',
  atan: '\\arctan',
  sinh: '\\sinh',
  cosh: '\\cosh',
  tanh: '\\tanh',
  log10: '\\log_{10}',
  log: '\\log',
  ln: '\\ln',
  sqrt: '\\sqrt',
  sin: '\\sin',
  cos: '\\cos',
  tan: '\\tan',
  sec: '\\sec',
  csc: '\\csc',
  cot: '\\cot',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br />');
}

function cleanLabel(label: string): string {
  return label.replace(/\s+/g, ' ').replace(/:\s*$/, '').trim();
}

function titleFromLabel(label: string): string | null {
  const numbered = label.match(/^Step\s+\d+\s*:?\s*(.*)$/i);
  if (numbered) {
    const extra = numbered[1].trim();
    return extra || null;
  }
  return label || null;
}

function splitBlocks(content: string | string[]): string[] {
  const parts = Array.isArray(content) ? content : [content];
  const blocks: string[] = [];
  for (const part of parts) {
    const text = String(part ?? '').replace(/\r\n/g, '\n').trim();
    if (!text) continue;
    const pieces = text.split(/\n+(?=\*\*(?:Step\s+\d+|Final Answer)\b)/i);
    for (const piece of pieces) {
      const block = piece.trim();
      if (block) blocks.push(block);
    }
  }
  return blocks;
}

export function parseSteps(content: string | string[] | null | undefined): ParsedStep[] {
  if (content == null) return [];
  return splitBlocks(content).map((block, index) => {
    let rest = block;
    let label = `Step ${index + 1}`;
    const marked = rest.match(STEP_HEADING);
    if (marked) {
      label = cleanLabel(marked[1]);
      rest = rest.slice(marked[0].length).trim();
    } else {
      const plain = rest.match(PLAIN_STEP_HEADING);
      if (plain) {
        label = cleanLabel(plain[1]);
        rest = rest.slice(plain[0].length).trim();
      }
    }
    rest = rest.replace(/\*\*([^*]+)\*\*/g, '$1').trim();
    return { label, title: titleFromLabel(label), body: rest };
  }).filter((step) => step.body.length > 0 || step.title);
}

function unwrapDelimited(token: string): { latex: string; display: boolean } | null {
  if (token.startsWith('$$') && token.endsWith('$$') && token.length >= 4) {
    return { latex: token.slice(2, -2).trim(), display: true };
  }
  if (token.startsWith('\\[') && token.endsWith('\\]')) {
    return { latex: token.slice(2, -2).trim(), display: true };
  }
  if (token.startsWith('\\(') && token.endsWith('\\)')) {
    return { latex: token.slice(2, -2).trim(), display: false };
  }
  if (token.startsWith('$') && token.endsWith('$') && token.length >= 2) {
    return { latex: token.slice(1, -1).trim(), display: false };
  }
  return null;
}

function plainToLatex(token: string): string {
  let source = token.trim().replace(/−/g, '-').replace(/·/g, '\\cdot ');
  source = source.replace(/d\/dx/g, '\\frac{d}{dx}');
  source = source.replace(
    /\b(arcsin|arccos|arctan|sinh|cosh|tanh|log10|sqrt|sin|cos|tan|sec|csc|cot|ln|log|asin|acos|atan)\b/g,
    (name) => FN_LATEX[name] || name,
  );
  source = source.replace(/\\sqrt\(([^()]*)\)/g, '\\sqrt{$1}');
  source = source.replace(/\^\(([^)]*)\)/g, '^{$1}');
  source = source.replace(/\*/g, ' \\cdot ');
  source = source.replace(/\bpi\b/g, '\\pi');
  return source;
}

function renderToken(token: string): string {
  const delimited = unwrapDelimited(token);
  const latex = delimited ? delimited.latex : plainToLatex(token);
  if (!latex) return escapeHtml(token);
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: delimited?.display ?? false,
      output: 'htmlAndMathml',
      strict: 'ignore',
    });
  } catch {
    return escapeHtml(token);
  }
}

export function renderMathAndText(input: string): string {
  if (!input) return '';
  const pattern = new RegExp(MATH_PATTERN.source, 'g');
  let html = '';
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    html += escapeHtml(input.slice(last, match.index));
    html += renderToken(match[0]);
    last = match.index + match[0].length;
    if (match[0].length === 0) pattern.lastIndex += 1;
  }
  html += escapeHtml(input.slice(last));
  return html;
}

export function renderLatexHtml(latex: string, display = true): string {
  const source = (latex || '').trim().replace(/^\$\$/, '').replace(/\$\$$/, '').replace(/^\$/, '').replace(/\$$/, '');
  if (!source) return '';
  try {
    return katex.renderToString(source, {
      throwOnError: false,
      displayMode: display,
      output: 'htmlAndMathml',
      strict: 'ignore',
    });
  } catch {
    return escapeHtml(latex);
  }
}

export function renderStepsHtml(content: string | string[] | null | undefined): string {
  const steps = parseSteps(content);
  if (steps.length === 0) return '';
  const items = steps.map((step) => {
    const title = step.title ? `<p class="step-title">${escapeHtml(step.title)}</p>` : '';
    const body = step.body ? `<div class="step-body">${renderMathAndText(step.body)}</div>` : '';
    return `<li><div class="step-copy">${title}${body}</div></li>`;
  });
  return `<ol class="step-list">${items.join('')}</ol>`;
}
