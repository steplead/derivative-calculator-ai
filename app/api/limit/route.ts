import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getCachedExplanation, setCachedExplanation } from '@/utils/cache';
import { performSecurityCheck } from '@/utils/security';
import { calculateLimit } from '@/lib/math/integral-limit';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const expression = searchParams.get('equation');
    const target = searchParams.get('to') || '0';
    // AI explanation enabled when an API key is configured (see derivative route for rationale).
    const includeAiParam = searchParams.get('includeAi') ?? searchParams.get('include_ai');
    const includeAi = includeAiParam === 'false' ? false : !!process.env.OPENROUTER_API_KEY;

    if (!expression) {
        return NextResponse.json({ error: "No equation provided" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    // SECURITY: Use unified security check (includes bot detection, rate limiting, global quota)
    const securityResult = await performSecurityCheck(req.headers, searchParams, '/api/limit');

    if (!securityResult.success) {
        return NextResponse.json(
            { error: securityResult.error },
            {
                status: securityResult.blocked ? 403 : 429,
                headers: {
                    'Cache-Control': 'no-store',
                    ...(securityResult.retryAfter ? {
                        'Retry-After': securityResult.retryAfter.toString()
                    } : {})
                }
            }
        );
    }

    // Request size validation
    if (expression.length > 200) {
        return NextResponse.json(
            { error: "Expression too long. Maximum 200 characters." },
            { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
    }

    // Heuristic Check: reject descriptive slugs/sentences, accept real math.
    const looksLikeDescriptive = /[a-zA-Z]{4,}-[a-zA-Z]{4,}-[a-zA-Z]{4,}/.test(expression);
    const hasMathSymbols = /[\+\*\/\^\(\)=]/.test(expression);
    const looksLikeMath = hasMathSymbols || /^[a-zA-Z0-9_\^\(\)\+\-\*\/\.\s]+$/.test(expression);

    if (looksLikeDescriptive || !looksLikeMath) {
        return NextResponse.json({ error: "Invalid mathematical expression" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    try {
        // 1. Deterministic limit. The steps name the technique and why it applies.
        let solutionLatex = "";
        let solutionRaw = "";
        let ruleUsed = "";
        let deterministicSteps: string[] = [];
        try {
            const solved = calculateLimit(expression, target);
            if (solved.isValid) {
                solutionLatex = solved.solutionLatex;
                solutionRaw = solved.solutionRaw;
                ruleUsed = solved.rule;
                deterministicSteps = solved.steps;
            }
        } catch (nerdError) {
            console.error("Nerdamer Limit Error:", nerdError);
        }

        let stepsContent = deterministicSteps.length > 0
            ? deterministicSteps.map((step, index) => `**Step ${index + 1}:** ${step}`).join('\n\n')
            : "Step-by-step solution unavailable.";
        let aiExplanation = "AI explanation unavailable.";

        const apiKey = process.env.OPENROUTER_API_KEY;

        if (includeAi) {
            const cacheKey = `limit:${expression.replace(/\s+/g, '')}:${target}`;
            const cached = await getCachedExplanation(cacheKey);

            if (cached) {
                const aiData = JSON.parse(cached);
                aiExplanation = aiData.explanation;
                stepsContent = aiData.steps;
            } else if (apiKey) {
                try {
                    const client = new OpenAI({
                        baseURL: "https://openrouter.ai/api/v1",
                        apiKey: apiKey,
                        timeout: 5000, // OPTIMIZED: 5s timeout (reduce CPU time, faster failover)
                    });

                    const prompt = `Limit of ${expression} as x->${target}. JSON: {"explanation": "1 sentence", "steps": "max 3 steps"}`;

                    const completion = await client.chat.completions.create({
                        model: "deepseek/deepseek-chat",
                        messages: [
                            { role: "system", content: "Math tutor. JSON only. Be brief." },
                            { role: "user", content: prompt }
                        ],
                        // @ts-ignore
                        response_format: { type: "json_object" },
                        max_tokens: 300
                    });

                    const content = completion.choices[0].message?.content;
                    if (content) {
                        const aiData = JSON.parse(content);
                        aiExplanation = aiData.explanation || "";
                        stepsContent = aiData.steps || "";
                        await setCachedExplanation(cacheKey, content);
                    }
                } catch (aiError) {
                    console.error("AI Error:", aiError);
                }
            }
        }

        // SECURITY: private, no-store — prevents Cloudflare edge caching that
        // bypasses security checks. Pass headers in constructor because CF Pages
        // overrides headers set after response creation. See Phase 1.6 R1.
        return NextResponse.json({
            solution: solutionLatex,
            solution_raw: solutionRaw,
            steps: stepsContent,
            ai_explanation: aiExplanation,
            rule: ruleUsed,
        }, { headers: { 'Cache-Control': 'private, no-store' } });

    } catch (e: any) {
        return NextResponse.json({ error: `Calculation error: ${e.message}` }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
}
