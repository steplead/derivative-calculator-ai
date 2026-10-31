import { NextRequest, NextResponse } from 'next/server';
import { performSecurityCheck } from '@/utils/security';
import { chainBreakdown } from '@/lib/math/advanced';

export const runtime = 'edge';

const PRIVATE = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const security = await performSecurityCheck(req.headers, url.searchParams, '/api/chain');
  if (!security.success) {
    return NextResponse.json(
      { error: security.error || 'Blocked' },
      { status: security.blocked ? 403 : 429, headers: PRIVATE }
    );
  }
  const equation = url.searchParams.get('equation') || '';
  try {
    const result = chainBreakdown(equation);
    return NextResponse.json(
      {
        solution: result.latex,
        solution_raw: result.raw,
        steps: result.steps.map((step, index) => `**Step ${index + 1}:** ${step}`).join('\n\n'),
        rule: result.rule,
        outer: result.outer,
        inner: result.inner,
        outer_derivative: result.outerDerivative,
        inner_derivative: result.innerDerivative,
        ai_explanation: result.steps[0],
      },
      { headers: PRIVATE }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not apply the chain rule.';
    return NextResponse.json({ error: message }, { status: 400, headers: PRIVATE });
  }
}
