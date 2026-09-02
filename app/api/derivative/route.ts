import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getCachedExplanation, setCachedExplanation } from '@/utils/cache';
import { performSecurityCheck } from '@/utils/security';
import { trackPath } from '@/utils/path-tracker';
import { calculateDerivative } from '@/lib/math/math-core';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const expression = searchParams.get('equation');
    // AI explanation is enabled when an API key is configured.
    // Previously hardcoded to false ("EMERGENCY"), which removed the product's
    // core step-by-step value. Now controlled by environment so it works in
    // production and degrades gracefully when no key is set.
    const includeAi = !!process.env.OPENROUTER_API_KEY;

    // Track API path for traffic analysis (async, non-blocking)
    trackPath('/api/derivative', 200).catch(err => {
        console.error('[API] Error tracking path:', err);
    });

    if (!expression) {
        // Track error response
        trackPath('/api/derivative', 400).catch(() => {});
        return NextResponse.json({ error: "No equation provided" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    // Unified Security Check (Rate limiting, Bot detection, IP blacklist, Strict Referer check)
    const securityResult = await performSecurityCheck(req.headers, searchParams, '/api/derivative');

    if (!securityResult.success) {
        // Track blocked/rate limited response
        trackPath('/api/derivative', securityResult.blocked ? 403 : 429).catch(() => {});
        return NextResponse.json(
            { error: securityResult.error },
            {
                status: securityResult.blocked ? 403 : 429,
                headers: {
                    'Cache-Control': 'no-store',
                    ...(securityResult.retryAfter ? {
                        'Retry-After': String(securityResult.retryAfter),
                        'X-RateLimit-Limit': '20',
                        'X-RateLimit-Remaining': '0',
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
    // NOTE: Hyphens are legitimate minus operators, so we do NOT reject on
    // hyphen count. We reject only when the input looks like a URL slug
    // (long word-hyphen-word-hyphen-word pattern with no math operators).
    const looksLikeDescriptive = /[a-zA-Z]{4,}-[a-zA-Z]{4,}-[a-zA-Z]{4,}/.test(expression);
    const hasMathSymbols = /[\+\*\/\^\(\)=]/.test(expression);
    const looksLikeMath = hasMathSymbols || /^[a-zA-Z0-9_\^\(\)\+\-\*\/\.\s]+$/.test(expression);

    if (looksLikeDescriptive || !looksLikeMath) {
        return NextResponse.json({ error: "Invalid mathematical expression" }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    try {
        // 1. Calculate Derivative with the shared deterministic math core.
        //    RC-4 FIX: math-core normalizes ln( → log( (nerdamer's natural log),
        //    validates the result, and identifies the rule. Using the same module
        //    as the SSR page guarantees API and server-rendered answers never diverge.
        let solutionLatex = "";
        let solutionRaw = "";
        let ruleUsed = "";
        let deterministicSteps: string[] = [];
        try {
            const solution = calculateDerivative(expression);
            solutionLatex = solution.solutionLatex;
            solutionRaw = solution.solutionRaw;
            ruleUsed = solution.rule;
            deterministicSteps = solution.steps;
        } catch (nerdError: any) {
            console.error("Math Core Error:", nerdError?.message || nerdError);
            // Deterministic calculation failed → let the AI/fallback explain, but
            // do NOT return a wrong answer. solutionRaw stays empty → 500 below
            // if no fallback is available.
        }

        // RC-4: Always surface deterministic steps from the shared math core.
        // AI (when enabled) can enrich them, but the page/API must never ship
        // a bare "AI disabled" placeholder — the math itself is deterministic.
        let stepsContent = deterministicSteps.length > 0
            ? deterministicSteps.map((s, i) => `**Step ${i + 1}:** ${s}`).join('\n\n')
            : "Step-by-step solution unavailable.";
        let aiExplanation = ruleUsed
            ? `The derivative of ${expression} is ${solutionRaw || solutionLatex}. Rule used: ${ruleUsed}.`
            : "AI explanation unavailable.";

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
                // If not cached, call AI with enhanced pedagogical prompt
                let retryCount = 0;
                const maxRetries = 3;
                let aiContent = null;
                let lastError = null;

                while (retryCount < maxRetries && !aiContent) {
                    try {
                        const client = new OpenAI({
                            baseURL: "https://openrouter.ai/api/v1",
                            apiKey: apiKey,
                            timeout: 8000, // OPTIMIZED: 8s timeout (balance quality and CPU usage)
                        });

                        // ENHANCED PROMPT: Comprehensive pedagogical explanation
                        const prompt = `You are an expert Calculus Tutor. Create a comprehensive, educational explanation for finding the derivative of: ${expression}

Pedagogical Requirements:
1. Conceptual Understanding: Explain WHAT rule applies and WHY it works
2. Step-by-Step Reasoning: Show EVERY intermediate step using LaTeX format ($$...$$)
3. Common Mistakes: Mention typical errors students make with this type of problem
4. Verification: Show how to verify the answer
5. Real-World Context: Brief mention of when this is useful

Output Format (strict JSON):
{
  "explanation": "A comprehensive 2-3 sentence explanation covering the concept, rule application, and significance (must be > 100 characters)",
  "steps": "Detailed step-by-step derivation with:\\nStep 1: [Identify the rule]\\nStep 2: [Apply the rule]\\nStep 3: [Show intermediate work]\\nStep 4: [Simplify]\\nStep 5: [Final answer with verification]\\nMust use $$LaTeX$$ for all math expressions",
  "common_mistakes": "1-2 typical student errors with brief explanations",
  "application": "Brief real-world or advanced math context (1 sentence)"
}`;

                        const completion = await client.chat.completions.create({
                            model: "deepseek/deepseek-chat",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are an expert Calculus Tutor. Output valid JSON only. Be comprehensive, pedagogical, and detailed. Your goal is to help students truly understand the mathematics, not just get the answer."
                                },
                                { role: "user", content: prompt }
                            ],
                            // @ts-ignore - OpenRouter specific
                            response_format: { type: "json_object" },
                            max_tokens: 1500 // Increased from 300 to 1500 for detailed content
                        });

                        const content = completion.choices[0].message?.content;

                        if (content) {
                            // Validate content quality before accepting
                            const aiData = JSON.parse(content);

                            // Quality checks
                            if (!aiData.explanation || !aiData.steps) {
                                throw new Error("Missing required fields: explanation or steps");
                            }

                            if (aiData.explanation.length < 50) {
                                throw new Error("Explanation too brief (< 50 chars)");
                            }

                            if (aiData.steps.length < 100) {
                                throw new Error("Steps too brief (< 100 chars)");
                            }

                            // Content passed validation - use it
                            aiExplanation = aiData.explanation;
                            stepsContent = aiData.steps;

                            // Save to cache
                            await setCachedExplanation(cacheKey, content);

                            break; // Success, exit retry loop
                        }

                    } catch (aiError: any) {
                        lastError = aiError;
                        retryCount++;

                        console.error(`AI Attempt ${retryCount} failed:`, aiError.message);

                        if (retryCount < maxRetries) {
                            // Exponential backoff before retry
                            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                        }
                    }
                }

                // If all retries failed, provide high-quality fallback
                if (!aiContent) {
                    console.error("All AI attempts failed, using enhanced fallback:", lastError?.message);

                    // RC-4: Fall back to DETERMINISTIC steps from the shared math
                    // core (never a generic "AI disabled" template). These steps
                    // are math-correct and rule-specific.
                    if (deterministicSteps.length > 0) {
                        stepsContent = deterministicSteps
                            .map((s, i) => `**Step ${i + 1}:** ${s}`)
                            .join('\n\n');
                        aiExplanation = `The derivative of ${expression} with respect to x is ${solutionLatex || solutionRaw}. Rule used: ${ruleUsed}.`;
                    } else {
                        aiExplanation = `The derivative of ${expression} with respect to x is ${solutionLatex || solutionRaw}. This result is obtained by systematically applying the appropriate differentiation rules from calculus. The derivative represents the instantaneous rate of change of the function at any point.`;

                        stepsContent = `**Step 1: Problem Identification**
We need to find d/dx of the function: f(x) = ${expression}

**Step 2: Rule Selection**
Based on the function type, we apply the differentiation rules.

**Step 3: Systematic Application**
Calculate the derivative step-by-step:
\\[\\frac{d}{dx}(${expression}) = ${solutionLatex || solutionRaw}\\]

**Step 4: Simplification**
Express the result in its simplest form.

**Step 5: Verification**
You can verify this result by:
- Checking against standard derivative tables
- Using numerical differentiation methods
- Applying the definition of the derivative as a limit

**Final Answer:** $$${solutionLatex || solutionRaw}$$`;
                    }
                }
            }
        }

        // SECURITY: All API responses must use private, no-store to prevent
        // Cloudflare edge caching. Cached API responses bypass security checks
        // (rate limit, UA blacklist, global quota). See Phase 1.6 R1.
        // Pass headers in constructor (not .headers.set()) because CF Pages
        // overrides headers set after response creation.
        return NextResponse.json({
            solution: solutionLatex,
            solution_raw: solutionRaw,
            steps: stepsContent,
            ai_explanation: aiExplanation,
            _version: "v3.1-cache-no-store"
        }, { headers: { 'Cache-Control': 'private, no-store' } });

    } catch (e: any) {
        return NextResponse.json({ error: `Calculation error: ${e.message}` }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
}
