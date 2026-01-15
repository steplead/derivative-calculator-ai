import { NextRequest, NextResponse } from 'next/server';
import nerdamer from 'nerdamer';
import 'nerdamer/Calculus';
import { OpenAI } from 'openai';
import { getCachedExplanation, setCachedExplanation, ratelimit } from '@/utils/cache';
import { looksLikeLegitimateBrowser } from '@/utils/turnstile';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const expression = searchParams.get('equation');
    const target = searchParams.get('to') || '0';
    const includeAi = false; // EMERGENCY: AI completely disabled to reduce quota usage

    if (!expression) {
        return NextResponse.json({ error: "No equation provided" }, { status: 400 });
    }

    // Bot detection: Block non-browser requests
    const userAgent = req.headers.get('user-agent');
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const isLegitimateBrowser = looksLikeLegitimateBrowser(userAgent, req.headers);

    if (!isLegitimateBrowser) {
        console.warn(`[BOT_BLOCKED] IP: ${ip}, UA: ${userAgent}, Endpoint: /api/limit`);
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
    if (expression.length > 200) {
        return NextResponse.json(
            { error: "Expression too long. Maximum 200 characters." },
            { status: 400 }
        );
    }

    // Heuristic Check: Ensure it doesn't look like a descriptive sentence/slug
    const hasMultipleHyphens = (expression.match(/-/g) || []).length > 2;
    const hasMathSymbols = /[\+\*\/\^\(\)=]/.test(expression);
    const looksLikeDescriptive = /[a-zA-Z]{4,}-[a-zA-Z]{4,}/.test(expression);
    const looksLikeMath = hasMathSymbols || (expression.length < 15 && !looksLikeDescriptive);

    if (hasMultipleHyphens || !looksLikeMath || expression.length > 200) {
        return NextResponse.json({ error: "Invalid mathematical expression" }, { status: 400 });
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
