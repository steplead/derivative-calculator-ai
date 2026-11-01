import { NextRequest, NextResponse } from 'next/server';
import { performSecurityCheck } from '@/utils/security';
import { partialDerivative } from '@/lib/math/advanced';
import { requestWithBodyQuery } from '@/lib/api-method';

export const runtime = 'edge';

const PRIVATE = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const security = await performSecurityCheck(req.headers, url.searchParams, '/api/partial');
  if (!security.success) {
    return NextResponse.json(
      { error: security.error || 'Blocked' },
      { status: security.blocked ? 403 : 429, headers: PRIVATE }
    );
  }
  const equation = url.searchParams.get('equation') || '';
  const variable = url.searchParams.get('variable') || 'x';
  try {
    const result = partialDerivative(equation, variable);
    return NextResponse.json(
      {
        solution: result.latex,
        solution_raw: result.raw,
        steps: result.steps.map((step, index) => `**Step ${index + 1}:** ${step}`).join('\n\n'),
        rule: result.rule,
        ai_explanation: result.steps[0],
      },
      { headers: PRIVATE }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not compute that partial derivative.';
    return NextResponse.json({ error: message }, { status: 400, headers: PRIVATE });
  }
}

export async function POST(req: NextRequest) {
  return GET(await requestWithBodyQuery(req));
}
