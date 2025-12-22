import { NextRequest, NextResponse } from 'next/server';
import nerdamer from 'nerdamer';
import 'nerdamer/Calculus';
import { OpenAI } from 'openai';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const expression = searchParams.get('equation');
    const target = searchParams.get('to') || '0';
    const includeAi = searchParams.get('include_ai') !== 'false';

    if (!expression) {
        return NextResponse.json({ error: "No equation provided" }, { status: 400 });
    }

    try {
        // 1. Calculate Limit
        // limit(expr, variable, value)
        const l = nerdamer(`limit(${expression}, x, ${target})`);
        const solutionLatex = l.toTeX();
        const solutionRaw = l.toString();

        let stepsContent = "Step-by-step solution unavailable.";
        let aiExplanation = "AI explanation unavailable.";

        const apiKey = process.env.OPENROUTER_API_KEY;

        if (includeAi && apiKey) {
            try {
                const client = new OpenAI({
                    baseURL: "https://openrouter.ai/api/v1",
                    apiKey: apiKey,
                });

                const prompt = `
                You are a Calculus Tutor.
                1. Explain the limit technique used for: limit of ${expression} as x -> ${target}
                2. Provide a step-by-step evaluation (max 3 steps).
                3. Use LaTeX for math.
                
                Output strictly valid JSON:
                {
                    "explanation": "...",
                    "steps": "..."
                }
                `;

                const completion = await client.chat.completions.create({
                    model: "deepseek/deepseek-chat",
                    messages: [
                        { role: "system", content: "You are a helpful math tutor. Output JSON only." },
                        { role: "user", content: prompt }
                    ],
                    // @ts-ignore
                    response_format: { type: "json_object" }
                });

                const content = completion.choices[0].message?.content;
                if (content) {
                    const aiData = JSON.parse(content);
                    aiExplanation = aiData.explanation || "";
                    stepsContent = aiData.steps || "";
                }
            } catch (aiError) {
                console.error("AI Error:", aiError);
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
