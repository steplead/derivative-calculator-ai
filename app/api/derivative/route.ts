import { NextRequest, NextResponse } from 'next/server';
import nerdamer from 'nerdamer';
import 'nerdamer/Calculus'; // Load calculus plugin
import { OpenAI } from 'openai';
import { getCachedExplanation, setCachedExplanation } from '@/utils/cache';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const expression = searchParams.get('equation');
    const includeAi = searchParams.get('include_ai') !== 'false'; // Default to true

    if (!expression) {
        return NextResponse.json({ error: "No equation provided" }, { status: 400 });
    }

    // Heuristic Check: Ensure it doesn't look like a descriptive sentence/slug
    const hasMultipleHyphens = (expression.match(/-/g) || []).length > 2;
    // Math usually contains symbols, or no hyphens if it's a single variable
    const hasMathSymbols = /[\+\*\/\^\(\)=]/.test(expression);
    const looksLikeDescriptive = /[a-zA-Z]{4,}-[a-zA-Z]{4,}/.test(expression); // e.g. "derivative-of"
    const looksLikeMath = hasMathSymbols || (expression.length < 15 && !looksLikeDescriptive);

    if (hasMultipleHyphens || !looksLikeMath || expression.length > 100) {
        return NextResponse.json({ error: "Invalid mathematical expression" }, { status: 400 });
    }

    try {
        // 1. Calculate Derivative with Nerdamer (local verification)
        let solutionLatex = "";
        let solutionRaw = "";
        try {
            const d = nerdamer(`diff(${expression}, x)`);
            solutionLatex = d.toTeX();
            solutionRaw = d.toString();
        } catch (nerdError) {
            console.error("Nerdamer Error:", nerdError);
            // We will let AI provide the solution if Nerdamer fails
        }

        let stepsContent = "Step-by-step solution unavailable (AI disabled).";
        let aiExplanation = "AI explanation unavailable (AI disabled).";

        // 2. AI Explanation (DeepSeek via OpenRouter + Redis Cache)
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (includeAi) {
            // Try cache first
            const cacheKey = `derivative:${expression.replace(/\s+/g, '')}`;
            const cached = await getCachedExplanation(cacheKey);

            if (cached) {
                const aiData = JSON.parse(cached);
                aiExplanation = aiData.explanation;
                stepsContent = aiData.steps;
            } else if (apiKey) {
                // If not cached, call AI
                try {
                    const client = new OpenAI({
                        baseURL: "https://openrouter.ai/api/v1",
                        apiKey: apiKey,
                    });

                    const prompt = `Solve d/dx(${expression}). 1. Brief rule explanation. 2. Max 3 LaTeX steps. JSON format: {"explanation": "...", "steps": "..."}`;

                    const completion = await client.chat.completions.create({
                        model: "deepseek/deepseek-chat",
                        messages: [
                            { role: "system", content: "Math tutor. JSON only. Be extremely brief." },
                            { role: "user", content: prompt }
                        ],
                        // @ts-ignore - OpenRouter specific
                        response_format: { type: "json_object" },
                        max_tokens: 1000
                    });

                    const content = completion.choices[0].message?.content;
                    if (content) {
                        const aiData = JSON.parse(content);
                        aiExplanation = aiData.explanation || "No explanation provided.";
                        stepsContent = aiData.steps || "No steps provided.";

                        // Save to cache
                        await setCachedExplanation(cacheKey, content);
                    }
                } catch (aiError) {
                    console.error("AI Error:", aiError);
                    aiExplanation = "AI temporary unavailable.";
                    stepsContent = "Could not generate steps.";
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
