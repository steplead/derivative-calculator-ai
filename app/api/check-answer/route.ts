import { NextRequest, NextResponse } from 'next/server';
import { performSecurityCheck } from '@/utils/security';
import { calculateDerivative } from '@/lib/math/math-core';
import { answersEquivalent } from '@/lib/math/compare';

export const runtime = 'edge';

const PRIVATE = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const security = await performSecurityCheck(req.headers, url.searchParams, '/api/check-answer');
  if (!security.success) {
    return NextResponse.json(
      { error: security.error || 'Blocked' },
      { status: security.blocked ? 403 : 429, headers: PRIVATE }
    );
  }

  const equation = url.searchParams.get('equation') || '';
  const answer = url.searchParams.get('answer') || '';
  if (!equation || !answer) {
    return NextResponse.json({ error: 'Provide both an equation and an answer.' }, { status: 400, headers: PRIVATE });
  }

  try {
    const solved = calculateDerivative(equation);
    if (!solved.isValid) {
      return NextResponse.json(
        { error: 'This expression does not have an ordinary derivative to check against.' },
        { status: 422, headers: PRIVATE }
      );
    }
    const verdict = answersEquivalent(solved.solutionRaw, answer);
    return NextResponse.json(
      {
        match: verdict.match,
        method: verdict.method,
        expected: solved.solutionRaw,
        rule: solved.rule,
      },
      { headers: PRIVATE }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not check that answer.';
    return NextResponse.json({ error: message }, { status: 400, headers: PRIVATE });
  }
}
