import { NextRequest, NextResponse } from 'next/server';
import nerdamer from 'nerdamer';
import 'nerdamer/Calculus';
import { OpenAI } from 'openai';
import { getCachedExplanation, setCachedExplanation } from '@/utils/cache';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const expression = searchParams.get('equation');
    const target = searchParams.get('to') || '0';
    const includeAi = searchParams.get('include_ai') !== 'false';

    if (!expression) {
        return NextResponse.json({ error: "No equation provided" }, { status: 400 });
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
                    });

                    const prompt = `Limit of ${expression} as x->${target}. 1. Brief technique. 2. Max 3 LaTeX steps. JSON: {"explanation": "...", "steps": "..."}`;

                    const completion = await client.chat.completions.create({
                        model: "deepseek/deepseek-chat",
                        messages: [
                            { role: "system", content: "Math tutor. JSON only. Be extremely brief." },
                            { role: "user", content: prompt }
                        ],
                        // @ts-ignore
                        response_format: { type: "json_object" },
                        max_tokens: 1000
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
