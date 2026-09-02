import { NextRequest, NextResponse } from 'next/server';
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra';
import 'nerdamer/Calculus';
import { OpenAI } from 'openai';
import { getCachedExplanation, setCachedExplanation } from '@/utils/cache';
import { performSecurityCheck } from '@/utils/security';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const equation = searchParams.get('equation');
    // AI explanation enabled when an API key is configured (see derivative route for rationale).
    const includeAi = !!process.env.OPENROUTER_API_KEY;

    if (!equation) {
        return NextResponse.json({ error: "No equation provided" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    // Unified Security Check (Rate limiting, Bot detection, IP blacklist)
    const securityResult = await performSecurityCheck(req.headers, searchParams, '/api/ode');

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
    if (equation.length > 200) {
        return NextResponse.json(
            { error: "Equation too long. Maximum 200 characters." },
            { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
    }

    // Heuristic Check for ODE format: reject descriptive slugs, accept math.
    const hasMathSymbols = /[\+\*\/\^\(\)=]/.test(equation);
    const hasODENotation = /y['']|^dy\/dx/.test(equation);
    const looksLikeDescriptive = /[a-zA-Z]{4,}-[a-zA-Z]{4,}-[a-zA-Z]{4,}/.test(equation);
    const looksLikeMath = hasMathSymbols || hasODENotation || /^[a-zA-Z0-9_\^\(\)\+\-\*\/\.\s'']+$/.test(equation);

    if (looksLikeDescriptive || !looksLikeMath) {
        return NextResponse.json({ error: "Invalid ODE expression" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    try {
        // 1. Solve ODE with Nerdamer (basic support)
        let solutionLatex = "";
        let solutionRaw = "";
        try {
            // Try to solve the ODE using nerdamer's ode solver
            const result = nerdamer(`ode(${equation})`);
            solutionLatex = result.toTeX();
            solutionRaw = result.toString();
        } catch (nerdError) {
            console.error("Nerdamer ODE Error:", nerdError);
            // Fallback: Return symbolic representation
            solutionLatex = `\\text{Solution to } ${equation}`;
            solutionRaw = `Solution to ${equation}`;
        }

        let stepsContent: string | string[] = "Step-by-step solution unavailable.";
        let aiExplanation = "AI explanation unavailable.";

        // 2. AI Explanation (DeepSeek via OpenRouter + Redis Cache)
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (includeAi) {
            const cacheKey = `ode:${equation.replace(/\s+/g, '')}`;
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

                    const prompt = `Solve ODE: ${equation}. JSON: {"explanation": "1 sentence method", "steps": "max 3 steps"}`;

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

        // If no steps from AI, provide basic steps
        if (!stepsContent || stepsContent === "Step-by-step solution unavailable.") {
            stepsContent = [
                "Identify the type of differential equation.",
                "Apply the appropriate solution method.",
                "Verify the solution by substitution."
            ];
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
