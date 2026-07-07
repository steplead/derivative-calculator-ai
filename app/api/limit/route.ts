import { NextRequest, NextResponse } from 'next/server';
import nerdamer from 'nerdamer';
import 'nerdamer/Calculus';
import { OpenAI } from 'openai';
import { getCachedExplanation, setCachedExplanation } from '@/utils/cache';
import { performSecurityCheck } from '@/utils/security';
import { trackPath } from '@/utils/path-tracker';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const expression = searchParams.get('equation');
    const target = searchParams.get('to') || '0';
    // AI explanation enabled when an API key is configured (see derivative route for rationale).
    const includeAi = !!process.env.OPENROUTER_API_KEY;

    // Track API path for traffic analysis (async, non-blocking)
    trackPath('/api/limit', 200).catch(err => {
        console.error('[API] Error tracking path:', err);
    });

    if (!expression) {
        trackPath('/api/limit', 400).catch(() => {});
        return NextResponse.json({ error: "No equation provided" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    // SECURITY: Use unified security check (includes bot detection, rate limiting, global quota)
    const securityResult = await performSecurityCheck(req.headers, searchParams, '/api/limit');

    if (!securityResult.success) {
        trackPath('/api/limit', securityResult.blocked ? 403 : 429).catch(() => {});
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
        // 1. Calculate Limit
        let solutionLatex = "";
        let solutionRaw = "";
        try {
            const l = nerdamer(`limit(${expression}, x, ${target})`);
            solutionLatex = l.toTeX();
            solutionRaw = l.toString();
        } catch (nerdError) {
            console.error("Nerdamer Limit Error:", nerdError);
        }

        let stepsContent = "Step-by-step solution unavailable.";
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
        // bypasses security checks. See Phase 1.6 R1 for details.
        const response = NextResponse.json({
            solution: solutionLatex,
            solution_raw: solutionRaw,
            steps: stepsContent,
            ai_explanation: aiExplanation
        });

        response.headers.set('Cache-Control', 'private, no-store');
        
        return response;

    } catch (e: any) {
        return NextResponse.json({ error: `Calculation error: ${e.message}` }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
}
