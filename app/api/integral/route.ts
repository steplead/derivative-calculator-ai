import { NextRequest, NextResponse } from 'next/server';
import nerdamer from 'nerdamer';
import 'nerdamer/Calculus';
import { OpenAI } from 'openai';
import { getCachedExplanation, setCachedExplanation } from '@/utils/cache';
import { performSecurityCheck } from '@/utils/security';
import { extractRealContent } from '@/utils/validate-ai-content';
import { normalizeExpression } from '@/lib/math/math-core';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const expression = searchParams.get('equation');
    // AI explanation: controlled by ?includeAi=false query param or OPENROUTER_API_KEY env var.
    // includeAi=false → no AI call, no cache read/write, symbolic result only.
    const includeAiParam = searchParams.get('includeAi');
    const includeAi = includeAiParam === 'false' ? false : !!process.env.OPENROUTER_API_KEY;

    if (!expression) {
        return NextResponse.json({ error: "No equation provided" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    // Unified Security Check (Rate limiting, Bot detection, IP blacklist)
    const securityResult = await performSecurityCheck(req.headers, searchParams, '/api/integral');

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
        // 1. Calculate Integral with Nerdamer
        let solutionLatex = "";
        let solutionRaw = "";
        try {
            // RC-4: normalize ln( → log( (nerdamer natural log) before integrating
            const integral = nerdamer(`integrate(${normalizeExpression(expression)}, x)`);
            solutionLatex = integral.toTeX() + " + C";
            solutionRaw = integral.toString();
        } catch (nerdError) {
            console.error("Nerdamer Integral Error:", nerdError);
        }

        let stepsContent = "Step-by-step solution unavailable.";
        let aiExplanation = "AI explanation unavailable.";
        const symbolicResult = solutionLatex || solutionRaw || "unavailable";

        // 2. AI Explanation (DeepSeek via OpenRouter + Redis Cache)
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (includeAi) {
            // Versioned cache key: integral:v2 isolates from old integral: keys (30-day TTL expiry)
            const cacheKey = `integral:v2:${expression.replace(/\s+/g, '')}`;
            const cached = await getCachedExplanation(cacheKey);

            if (cached) {
                const aiData = JSON.parse(cached);
                aiExplanation = aiData.explanation;
                stepsContent = aiData.steps;
            } else if (apiKey) {
                let retryCount = 0;
                const maxRetries = 1; // 2 attempts max (initial + 1 retry), worst case ~17s
                let aiContent = null;
                let lastError = null;

                while (retryCount <= maxRetries && !aiContent) {
                    try {
                        const client = new OpenAI({
                            baseURL: "https://openrouter.ai/api/v1",
                            apiKey: apiKey,
                            timeout: 8000, // Aligned with derivative: 8s timeout
                        });

                        // Pedagogical prompt — comprehensive but not verbose
                        const prompt = `You are an expert Calculus Tutor. Create a comprehensive, educational explanation for finding the integral of: ${expression}

Pedagogical Requirements:
1. Conceptual Understanding: Explain WHAT integration technique applies and WHY
2. Step-by-Step Reasoning: Show EVERY intermediate step using LaTeX format ($$...$$)
3. Common Mistakes: Mention typical errors students make with this type of integral
4. Verification: Show how to verify the answer by differentiating the result

Output Format (strict JSON):
{
  "explanation": "A comprehensive 2-3 sentence explanation covering the concept, technique, and significance (must be > 50 characters)",
  "steps": "Detailed step-by-step integration with:\\nStep 1: [Identify the technique]\\nStep 2: [Apply the technique]\\nStep 3: [Show intermediate work]\\nStep 4: [Simplify and add +C]\\nStep 5: [Verify by differentiation]\\nMust use $$LaTeX$$ for all math expressions"
}`;

                        const completion = await client.chat.completions.create({
                            model: "deepseek/deepseek-chat",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are an expert Calculus Tutor. Output valid JSON only. Be comprehensive, pedagogical, and detailed. Help students understand integration, not just get the answer."
                                },
                                { role: "user", content: prompt }
                            ],
                            // @ts-ignore - OpenRouter specific
                            response_format: { type: "json_object" },
                            max_tokens: 1500 // Aligned with derivative: 1500 tokens for detailed steps
                        });

                        const content = completion.choices[0].message?.content;

                        if (content) {
                            const aiData = JSON.parse(content);

                            // Inline quality checks (first layer — fast rejection)
                            if (!aiData.explanation || !aiData.steps) {
                                throw new Error("Missing required fields: explanation or steps");
                            }
                            if (aiData.explanation.length < 50) {
                                throw new Error("Explanation too brief (< 50 chars)");
                            }
                            if (aiData.steps.length < 100) {
                                throw new Error("Steps too brief (< 100 chars)");
                            }

                            // Second layer validation via extractRealContent
                            const validated = extractRealContent(
                                'integral',
                                expression,
                                symbolicResult,
                                aiData.explanation,
                                aiData.steps
                            );

                            aiExplanation = validated.explanation;
                            stepsContent = validated.steps;
                            aiContent = aiData;

                            // Only cache AI response if quality score >= 60
                            if (validated.quality.isValid) {
                                await setCachedExplanation(cacheKey, JSON.stringify(aiData));
                            }

                            break;
                        }

                    } catch (aiError: any) {
                        lastError = aiError;
                        retryCount++;

                        console.error(`Integral AI Attempt ${retryCount}/${maxRetries + 1} failed:`, aiError.message);

                        if (retryCount <= maxRetries) {
                            // Exponential backoff: 1s
                            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                        }
                    }
                }

                // All attempts exhausted — use extractRealContent fallback
                if (!aiContent) {
                    console.error("All integral AI attempts failed, using fallback:", lastError?.message);

                    const fallback = extractRealContent(
                        'integral',
                        expression,
                        symbolicResult
                    );

                    aiExplanation = fallback.explanation;
                    stepsContent = fallback.steps;
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
            ai_explanation: aiExplanation
        }, { headers: { 'Cache-Control': 'private, no-store' } });

    } catch (e: any) {
        return NextResponse.json({ error: `Calculation error: ${e.message}` }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
}
