import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { performSecurityCheck } from '@/utils/security';
import { explainStepDeterministic } from '@/lib/step-why';

export const runtime = 'edge';

const PRIVATE = { 'Cache-Control': 'private, no-store' };

export async function POST(req: NextRequest) {
  const security = await performSecurityCheck(req.headers, new URL(req.url).searchParams, '/api/explain-step');
  if (!security.success) {
    return NextResponse.json(
      { error: security.error || 'Blocked' },
      { status: security.blocked ? 403 : 429, headers: PRIVATE }
    );
  }

  let body: { equation?: unknown; step?: unknown; rule?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected JSON.' }, { status: 400, headers: PRIVATE });
  }

  const equation = String(body.equation || '').slice(0, 200);
  const step = String(body.step || '').slice(0, 500);
  const rule = String(body.rule || 'Power Rule').slice(0, 80);
  const locale = body.locale === 'es' || body.locale === 'pt' ? body.locale : 'en';
  if (!equation || !step) {
    return NextResponse.json({ error: 'Provide the equation and the step.' }, { status: 400, headers: PRIVATE });
  }

  const fallback = explainStepDeterministic(equation, step, rule, locale);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ why: fallback, source: 'deterministic' }, { headers: PRIVATE });
  }

  try {
    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      timeout: 8000,
    });
    const completion = await client.chat.completions.create({
      model: 'deepseek/deepseek-chat',
      max_tokens: 280,
      messages: [
        {
          role: 'system',
          content: `You explain one calculus step to a student. Say why the step is valid. Do not invent a different result. Plain text, at most 90 words. No preamble. Write in ${locale === 'es' ? 'Spanish' : locale === 'pt' ? 'Portuguese' : 'English'}.`,
        },
        {
          role: 'user',
          content: `Function: ${equation}\nRule: ${rule}\nStep: ${step}\nKnown-correct context: ${fallback}`,
        },
      ],
    });
    const why = completion.choices[0]?.message?.content?.trim() || '';
    if (why.length < 40 || why.length > 1200) {
      return NextResponse.json({ why: fallback, source: 'deterministic' }, { headers: PRIVATE });
    }
    return NextResponse.json({ why, source: 'ai' }, { headers: PRIVATE });
  } catch {
    return NextResponse.json({ why: fallback, source: 'deterministic' }, { headers: PRIVATE });
  }
}
