import * as fs from 'fs';
import * as path from 'path';
import { calculateDerivative } from '@/lib/math/math-core';
import { parseSteps, renderStepsHtml } from '@/lib/steps/format-steps';

const ROOT = path.resolve(__dirname, '..');

describe('step markdown and KaTeX', () => {
  it('turns **Step N:** lines into numbered steps without asterisks', () => {
    const html = renderStepsHtml(
      '**Step 1:** Apply the power rule to x^2.\n\n**Step 2:** Final answer: 2*x',
    );
    expect(html).not.toContain('**');
    expect(html).toContain('class="step-list"');
    expect(html).toContain('power rule');
    expect(html).toContain('katex');
    expect(html.match(/<li>/g)).toHaveLength(2);
  });

  it('keeps a titled step label and renders display math', () => {
    const parsed = parseSteps('**Step 1: Problem Identification**\nWe need $$x^2$$.');
    expect(parsed[0].label).toBe('Step 1: Problem Identification');
    expect(parsed[0].title).toBe('Problem Identification');
    expect(parsed[0].body).not.toContain('**');
    const html = renderStepsHtml('**Step 1: Problem Identification**\nWe need $$x^2$$.');
    expect(html).toContain('Problem Identification');
    expect(html).toContain('katex');
    expect(html).not.toContain('$$');
  });

  it('renders the tan(x) SSR steps as KaTeX without raw markdown', () => {
    const solved = calculateDerivative('tan(x)');
    const marked = solved.steps.map((step, index) => `**Step ${index + 1}:** ${step}`).join('\n\n');
    const html = renderStepsHtml(marked);
    expect(html).not.toContain('**');
    expect(html).toContain('trigonometric');
    expect(html).toContain('katex');
    expect(html).toContain('sec');
  });
});

describe('quiet scratchpad brand and tokens', () => {
  it('ships an original tangent mark and does not force colors with !important', () => {
    const icon = fs.readFileSync(path.join(ROOT, 'public/icon.svg'), 'utf8');
    const design = fs.readFileSync(path.join(ROOT, 'docs/DESIGN.md'), 'utf8');
    const css = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf8');
    const nav = fs.readFileSync(path.join(ROOT, 'components/Navbar.tsx'), 'utf8');
    expect(icon).toContain('#2F5BD3');
    expect(icon).toContain('#0F766E');
    expect(icon).not.toContain('neon');
    expect(fs.existsSync(path.join(ROOT, 'public/brand/avatar-400.png'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'public/favicon.ico'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'public/apple-touch-icon.png'))).toBe(true);
    expect(design).toContain('切线');
    expect(css).not.toContain('!important');
    expect(css).not.toContain('geist');
    expect(nav).toContain('LogoMark');
    expect(nav).not.toContain('logo-light.webp');
  });
});
