import { NextRequest, NextResponse } from 'next/server';
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra';
import 'nerdamer/Calculus';
import { OpenAI } from 'openai';
import { getCachedExplanation, setCachedExplanation, ratelimit } from '@/utils/cache';
import { looksLikeLegitimateBrowser } from '@/utils/turnstile';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const equation = searchParams.get('equation');
    const includeAi = searchParams.get('include_ai') !== 'false';

    if (!equation) {
        return NextResponse.json({ error: "No equation provided" }, { status: 400 });
    }

    // Bot detection: Block non-browser requests
    const userAgent = req.headers.get('user-agent');
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const isLegitimateBrowser = looksLikeLegitimateBrowser(userAgent, req.headers);

    if (!isLegitimateBrowser) {
        console.warn(`[BOT_BLOCKED] IP: ${ip}, UA: ${userAgent}, Endpoint: /api/ode`);
        return NextResponse.json(
            { error: "Access denied. Please use a web browser." },
            { status: 403 }
        );
    }

    // Rate limiting: 10 requests per 10 seconds per IP
    if (ratelimit) {
        try {
            const { success } = await ratelimit.limit(ip);
            if (!success) {
                return NextResponse.json(
                    { error: "Too many requests. Please slow down." },
                    { status: 429 }
                );
            }
        } catch (rateLimitError) {
            console.error("Rate limit error:", rateLimitError);
        }
    }

    // Request size validation
    if (equation.length > 200) {
        return NextResponse.json(
            { error: "Equation too long. Maximum 200 characters." },
            { status: 400 }
        );
    }

    // Heuristic Check for ODE format
    const hasMultipleHyphens = (equation.match(/-/g) || []).length > 2;
    const hasMathSymbols = /[\+\*\/\^\(\)=]/.test(equation);
    const hasODENotation = /y['']|^dy\/dx/.test(equation);
    const looksLikeDescriptive = /[a-zA-Z]{4,}-[a-zA-Z]{4,}/.test(equation);
    const looksLikeMath = hasMathSymbols || hasODENotation || (equation.length < 20 && !looksLikeDescriptive);

    if (hasMultipleHyphens || !looksLikeMath || equation.length > 200) {
        return NextResponse.json({ error: "Invalid ODE expression" }, { status: 400 });
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
                        timeout: 10000, // 10 second timeout
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

        return NextResponse.json({
            solution: solutionLatex,
            solution_raw: solutionRaw,
            steps: stepsContent,
            ai_explanation: aiExplanation
        });

    } catch (e: any) {
        return NextResponse.json({ error: `Calculation error: ${e.message}` }, { status: 500 });
    }
}
