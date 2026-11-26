/**
 * Production-nerdamer string locks.
 *
 * The nerdamer build used at build/runtime numericizes e as the ratio
 * 325368125 / 119696244, so antiderivatives of e-based integrands come back as
 *   \frac{325368125^{x}}{119696244^{x} \cdot (\log(325368125/119696244))}
 * and the display pipeline has to fold both the ratio and ln(e)=1. The local
 * jest nerdamer is symbolic and never emits these, so the guards are pinned by
 * feeding the exact production strings (same approach as math-core.test.ts).
 */
import { prettifyRaw, prettifyLatex } from '@/lib/math/math-core';

describe('prettify: production e-ratio strings', () => {
  const rawIn = '325368125^x/(119696244^x*log(325368125/119696244))-log(x)';
  const latexIn =
    '\\frac{325368125^{x}}{119696244^{x} \\cdot \\left(\\mathrm{log}\\left(\\frac{325368125}{119696244}\\right)\\right)}-\\mathrm{log}\\left(x\\right)';

  it('folds ln(e)=1 and the ratio into e^x (raw)', () => {
    expect(prettifyRaw(rawIn)).toBe('e^x-ln(x)');
  });

  it('folds ln(e)=1 and the ratio into e^x (LaTeX)', () => {
    expect(prettifyLatex(latexIn)).toBe('e^{x}-\\ln\\left(x\\right)');
  });

  it('never leaves a 6+ digit integer or a bare "lne" token', () => {
    for (const out of [prettifyRaw(rawIn), prettifyLatex(latexIn)]) {
      expect(out).not.toMatch(/\d{6,}/);
      expect(out).not.toMatch(/lne(?!\w)/);
    }
  });

  it('still folds the derivative forms the guards were written for', () => {
    // d/dx(e^{2x}) and d/dx(x·e^{x}) shapes (owner-captured production strings).
    expect(prettifyLatex('\\frac{2 \\cdot 325368125^{2 \\cdot x}}{119696244^{2 \\cdot x}}')).toBe(
      '2e^{2x}'
    );
    expect(
      prettifyLatex('e^{x}+\\frac{325368125^{x} \\cdot x}{119696244^{x}}')
    ).toBe('e^{x}+e^{x}x');
  });
});

describe('prettify: antiderivative of a^x (log-sum spelling)', () => {
  // Captured from the build output of /integral-of-ex--1-over-x and friends:
  // nerdamer writes ln(e) as ln(1/B) + ln(A) instead of a single log.
  const rawIn = '-325368125^x/(119696244^x*(log(1/119696244)+log(325368125)))-log(x)';
  const latexIn =
    '-\\frac{325368125^{x}}{119696244^{x} \\cdot \\left(\\mathrm{log}\\left(\\frac{1}{119696244}\\right)+\\mathrm{log}\\left(325368125\\right)\\right)}-\\mathrm{log}\\left(x\\right)';

  it('folds the log-sum to 1 and the ratio to e^x (raw)', () => {
    expect(prettifyRaw(rawIn)).toBe('-e^x-ln(x)');
  });

  it('folds the log-sum to 1 and the ratio to e^x (LaTeX)', () => {
    expect(prettifyLatex(latexIn)).toBe('-e^{x}-\\ln\\left(x\\right)');
  });

  it('keeps the coefficient in front of e^x', () => {
    const withCoefficient =
      '\\frac{4 \\cdot 325368125^{x}}{119696244^{x} \\cdot \\left(\\mathrm{log}\\left(\\frac{1}{119696244}\\right)+\\mathrm{log}\\left(325368125\\right)\\right)}-\\mathrm{log}\\left(x\\right)';
    expect(prettifyLatex(withCoefficient)).toBe('4e^{x}-\\ln\\left(x\\right)');
  });

  it('leaves no 6+ digit integer behind', () => {
    for (const out of [prettifyRaw(rawIn), prettifyLatex(latexIn)]) {
      expect(out).not.toMatch(/\d{6,}/);
    }
  });
});
