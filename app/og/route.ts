import { NextRequest } from 'next/server';
import { encodeCardPng } from '@/lib/og-card';

export const runtime = 'edge';

function clip(value: string | null, max: number): string {
  return (value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = clip(url.searchParams.get('type'), 20) || 'derivative';
  const equation = clip(url.searchParams.get('eq'), 80);
  const result = clip(url.searchParams.get('result'), 80);
  const heading = type === 'integral' ? 'Integral' : type === 'limit' ? 'Limit' : 'Derivative';
  const png = await encodeCardPng([
    'Derivative Calculator AI',
    heading,
    equation || 'Free calculus solver',
    result ? `= ${result}` : 'Step-by-step, no sign-up',
  ]);
  const body = new ArrayBuffer(png.byteLength);
  new Uint8Array(body).set(png);
  return new Response(body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
