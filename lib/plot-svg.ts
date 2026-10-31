/**
 * Server-rendered function + derivative graph.
 * Sampling goes through nerdamer. There is no eval and no function-plot payload,
 * so the SVG can sit in the initial HTML of an indexable problem page.
 */

// @ts-ignore - nerdamer has no bundled types
import nerdamer from 'nerdamer';
// @ts-ignore
import 'nerdamer/Calculus';
import { normalizeExpression } from '@/lib/math/math-core';

function valueAt(expr: string, x: number): number | null {
  try {
    const value = (nerdamer(expr) as { evaluate: (_vars: Record<string, number>) => { text?: () => string } }).evaluate({ x });
    const text = typeof value?.text === 'function' ? value.text() : String(value);
    const n = Number(text);
    if (!Number.isFinite(n) || Math.abs(n) > 40) return null;
    return n;
  } catch {
    return null;
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type Sample = { x: number; y: number | null };

function sample(expr: string, min: number, max: number, count: number): Sample[] {
  const engine = normalizeExpression(expr);
  const points: Sample[] = [];
  for (let i = 0; i < count; i++) {
    const x = min + ((max - min) * i) / (count - 1);
    points.push({ x, y: valueAt(engine, x) });
  }
  return points;
}

function polyline(points: Sample[], xOf: (_x: number) => number, yOf: (_y: number) => number): string {
  const parts: string[] = [];
  let open = false;
  let previous: number | null = null;
  for (const point of points) {
    if (point.y === null || (previous !== null && Math.abs(point.y - previous) > 8)) {
      open = false;
      previous = point.y;
      continue;
    }
    parts.push(`${open ? 'L' : 'M'}${xOf(point.x).toFixed(2)} ${yOf(point.y).toFixed(2)}`);
    open = true;
    previous = point.y;
  }
  return parts.join(' ');
}

/**
 * SVG markup for f and, when it samples cleanly, f'. Returns null when f
 * itself has no visible points (for example a derivative that does not exist).
 */
export function renderDerivativeSvg(fn: string, derivative: string | null, ariaLabel: string): string | null {
  const width = 640;
  const height = 280;
  const pad = 28;
  const min = -6;
  const max = 6;
  const count = 121;
  const fnSamples = sample(fn, min, max, count);
  const finite = fnSamples.map((p) => p.y).filter((y): y is number => y !== null);
  if (finite.length < 8) return null;
  const derivSamples = derivative ? sample(derivative, min, max, count) : [];
  const derivFinite = derivSamples.map((p) => p.y).filter((y): y is number => y !== null);
  const ys = finite.concat(derivFinite.length >= 8 ? derivFinite : []);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  if (yMax - yMin < 0.5) {
    yMin -= 1;
    yMax += 1;
  }
  const yPad = (yMax - yMin) * 0.08;
  yMin -= yPad;
  yMax += yPad;

  const xOf = (x: number) => pad + ((x - min) / (max - min)) * (width - pad * 2);
  const yOf = (y: number) => pad + ((yMax - y) / (yMax - yMin)) * (height - pad * 2);
  const fnPath = polyline(fnSamples, xOf, yOf);
  const dyPath = derivFinite.length >= 8 ? polyline(derivSamples, xOf, yOf) : '';
  const zeroY = yOf(0);
  const zeroX = xOf(0);
  const label = escapeXml(ariaLabel);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="280" role="img" aria-label="${label}">
  <rect width="${width}" height="${height}" fill="#ffffff" rx="12"/>
  <line x1="${pad}" y1="${zeroY.toFixed(2)}" x2="${width - pad}" y2="${zeroY.toFixed(2)}" stroke="#e5e7eb" stroke-width="1"/>
  <line x1="${zeroX.toFixed(2)}" y1="${pad}" x2="${zeroX.toFixed(2)}" y2="${height - pad}" stroke="#e5e7eb" stroke-width="1"/>
  <path d="${fnPath}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  ${dyPath ? `<path d="${dyPath}" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 4" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
  <text x="${pad}" y="18" fill="#2563eb" font-size="13" font-family="ui-sans-serif, system-ui, sans-serif">f(x)</text>
  ${dyPath ? `<text x="${pad + 48}" y="18" fill="#dc2626" font-size="13" font-family="ui-sans-serif, system-ui, sans-serif">f'(x)</text>` : ''}
</svg>`;
}
