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

    try {
        // 1. Calculate Derivative with Nerdamer (local verification)
        const d = nerdamer(`diff(${expression}, x)`);
        const solutionLatex = d.toTeX();
        const solutionRaw = d.toString();

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

                    const prompt = `
                    You are a Calculus Tutor.
                    1. Explain the derivative rule used for: d/dx (${expression})
                    2. Provide a step-by-step derivation (max 3 steps).
                    3. Use LaTeX for math (e.g. $$ x^2 $$).
                    
                    Output strictly valid JSON:
                    {
                        "explanation": "Simple sentence explaining the rule...",
                        "steps": "LaTeX formatted steps..."
                    }
                    `;

                    const completion = await client.chat.completions.create({
                        model: "deepseek/deepseek-chat",
                        messages: [
                            { role: "system", content: "You are a helpful math tutor. Output JSON only." },
                            { role: "user", content: prompt }
                        ],
                        // @ts-ignore - OpenRouter specific
                        response_format: { type: "json_object" }
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
