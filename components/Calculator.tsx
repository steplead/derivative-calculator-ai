'use client';

import { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import MathKeyStrip from '@/components/MathKeyStrip';
import CopyLatexButton from '@/components/CopyLatexButton';
import { sanitizeMathFormula, sanitizeLimitValue } from '@/utils/sanitize';
import { useTurnstile, addTokenToUrl } from './TurnstileProvider';
import { calculationEventName, trackEvent } from '@/lib/analytics';
import { errorFromResponse, fetchWithTimeout } from '@/lib/fetch-timeout';

const MathDisplay = dynamic(() => import('./MathDisplay'));
const Graph = dynamic(() => import('./Graph'));
const StepDisplay = dynamic(() => import('./StepDisplay'));
const ShareResultCard = dynamic(() => import('./ShareResultCard'));
const AnswerCheck = dynamic(() => import('./AnswerCheck'));

type CalculatorProps = {
    initialEquation?: string;
    initialLimitTo?: string;
    mode?: 'derivative' | 'integral' | 'limit' | 'ode';
    /** Server-rendered deterministic result — shown immediately without a first API call. */
    initialResult?: any;
    dict?: any;
    embedded?: boolean;
    /** Render the share card under a successful result (homepage). Problem pages pass their own. */
    showShare?: boolean;
    shareUrl?: string;
    locale?: string;
    /** Skip the interactive graph. Problem pages already ship an inline SVG. */
    deferGraph?: boolean;
    /** Example chips under the input. Homepage and tool pages. */
    examples?: string[];
    /**
     * Long-tail pages render the answer in a server card under the H1.
     * Keep initialResult so the first paint does not refetch, but do not
     * repeat that answer inside the input card.
     */
    showInitialResult?: boolean;
};

export default function Calculator({
    initialEquation = '',
    initialLimitTo = '0',
    mode = 'derivative',
    initialResult,
    dict,
    embedded = false,
    showShare = false,
    shareUrl = '',
    locale = 'en',
    deferGraph = false,
    examples,
    showInitialResult = true,
}: CalculatorProps) {
    const searchParams = useSearchParams();
    const equationParam = searchParams.get('equation');
    const limitToParam = searchParams.get('to');
    const { token } = useTurnstile();
    const inputRef = useRef<HTMLInputElement>(null);

    const [input, setInput] = useState((equationParam || initialEquation || '').toString().replace(/^null$/i, ''));
    const [limitTo, setLimitTo] = useState((limitToParam || initialLimitTo || '0').toString().replace(/^null$/i, '0'));
    const [result, setResult] = useState<any>(showInitialResult ? (initialResult || null) : null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const t = dict || {
        placeholder: "e.g. x^2, sin(x), ln(x)",
        solve: "Solve",
        integrate: "Integrate",
        limit: "Find Limit",
        ode: "Solve ODE",
        solving: "Solving...",
        solution: "Solution",
        steps: "Step-by-Step",
        graph: "Graph",
        ai: "AI Explanation",
    };

    useEffect(() => {
        const eq = (equationParam || initialEquation || '').toString().replace(/^null$/i, '');
        const to = (limitToParam || initialLimitTo || '0').toString().replace(/^null$/i, '0');

        // RC-1 FIX: if the server already rendered a deterministic result,
        // do NOT re-fetch on first paint — avoid double API call and hydration
        // flicker. Only recalculate when the user changes the expression.
        if (eq && !initialResult) {
            setInput(eq);
            if (mode === 'limit') setLimitTo(to);
            handleCalculate(eq, to);
        }
    }, [equationParam, limitToParam, initialEquation, initialLimitTo, mode, initialResult]);

    const handleCalculate = async (equationToSolve = input, targetToSolve = limitTo) => {
        const rawFormula = (equationToSolve || '').toString().replace(/^null$/i, '');
        const formula = sanitizeMathFormula(rawFormula);
        const target = sanitizeLimitValue((targetToSolve || '0').toString().replace(/^null$/i, '0'));
        if (!formula) {
            if (rawFormula.trim()) {
                setError('That expression uses a character this calculator cannot accept.');
            }
            return;
        }

        console.log('[Calculator] Starting calculation...');

        setLoading(true);
        setError('');
        setResult(null);

        try {
            let turnstileToken = token;
            if (token) {
                console.log('[Calculator] Using existing Turnstile token');
            } else {
                console.log('[Calculator] No Turnstile token, proceeding without it');
            }

            let baseUrl = '';
            if (mode === 'derivative') {
                baseUrl = `/api/derivative?equation=${encodeURIComponent(formula)}`;
            } else if (mode === 'integral') {
                baseUrl = `/api/integral?equation=${encodeURIComponent(formula)}`;
            } else if (mode === 'limit') {
                baseUrl = `/api/limit?equation=${encodeURIComponent(formula)}&to=${encodeURIComponent(target)}`;
            } else if (mode === 'ode') {
                baseUrl = `/api/ode?equation=${encodeURIComponent(formula)}`;
            }

            const urlWithToken = addTokenToUrl(`${baseUrl}&includeAi=false`, turnstileToken);
            console.log('[Calculator] Fetching URL:', urlWithToken);
            const resFast = await fetchWithTimeout(urlWithToken, { method: 'GET' });
            if (!resFast.ok) {
                throw new Error(await errorFromResponse(resFast));
            }
            const dataFast = await resFast.json();

            setResult(dataFast);
            setLoading(false);

            trackEvent(calculationEventName(mode), {
                type: mode,
                mode,
                formula_length: formula.length,
                source: 'client',
            });

            try {
                const resFull = await fetchWithTimeout(addTokenToUrl(`${baseUrl}&includeAi=true`, turnstileToken), { method: 'GET' }, 20000);
                if (resFull.ok) {
                    const dataFull = await resFull.json();
                    setResult(dataFull);
                } else {
                    console.error("AI fetch failed:", await errorFromResponse(resFull));
                }
            } catch (aiErr) {
                console.error("AI fetch failed", aiErr);
            }

            try {
                const historyItem = {
                    equation: equationToSolve,
                    timestamp: Date.now(),
                    mode: mode,
                    limitTo: mode === 'limit' ? limitTo : undefined
                };
                const existing = localStorage.getItem('calc_history');
                const history = existing ? JSON.parse(existing) : [];
                const newHistory = [historyItem, ...history].slice(0, 50);
                localStorage.setItem('calc_history', JSON.stringify(newHistory));
                window.dispatchEvent(new Event('historyUpdated'));
            } catch (e) {
                console.error('Failed to save history', e);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const insertSymbol = (snippet: string) => {
        const el = inputRef.current;
        const start = el?.selectionStart ?? input.length;
        const end = el?.selectionEnd ?? input.length;
        const next = `${input.slice(0, start)}${snippet}${input.slice(end)}`;
        setInput(next);
        requestAnimationFrame(() => {
            el?.focus();
            const pos = start + snippet.length;
            el?.setSelectionRange(pos, pos);
        });
    };

    const getPlaceholder = () => {
        if (mode === 'limit') return 'e.g. (sin(x))/x';
        if (mode === 'ode') return "e.g. y' + y = x";
        return t.placeholder;
    };

    const getButtonText = () => {
        if (loading) return t.solving;
        if (mode === 'integral') return t.integrate;
        if (mode === 'limit') return t.limit;
        if (mode === 'ode') return t.ode || 'Solve ODE';
        return t.solve;
    };

    return (
        <div className={`calc-card ${embedded ? '' : ''}`}>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                    <label className="sr-only" htmlFor={`calc-input-${mode}`}>Expression</label>
                    <input
                        id={`calc-input-${mode}`}
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={getPlaceholder()}
                        className="calc-input"
                        onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                    />
                    <MathKeyStrip onInsert={insertSymbol} />
                </div>

                {mode === 'limit' && (
                    <div className="flex items-center gap-2 min-h-12 px-4 rounded-xl border border-line bg-chip">
                        <span className="text-muted whitespace-nowrap">x &rarr;</span>
                        <input
                            type="text"
                            value={limitTo}
                            aria-label="Limit target"
                            onChange={(e) => setLimitTo(e.target.value)}
                            className="w-16 bg-transparent text-ink font-mono focus:outline-none"
                        />
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => handleCalculate()}
                    disabled={loading}
                    aria-label={getButtonText()}
                    className="solve-btn"
                >
                    {getButtonText()}
                </button>
            </div>

            {examples && examples.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-4" role="list" aria-label="Examples">
                    {examples.map((example) => (
                        <button
                            key={example}
                            type="button"
                            className="example-chip"
                            aria-label={`Solve ${example}`}
                            onClick={() => {
                                setInput(example);
                                handleCalculate(example, limitTo);
                            }}
                        >
                            {example}
                        </button>
                    ))}
                </div>
            ) : null}

            {error && (
                <div className="error-banner" role="alert">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-8 space-y-6 result-enter">
                    <div className="answer-panel answer-flash">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <h3 className="answer-kicker m-0">{t.solution}</h3>
                            <CopyLatexButton latex={result.solution || result.solution_raw || ''} />
                        </div>
                        {result.solution ? (
                            <MathDisplay latex={result.solution} />
                        ) : (
                            <p className="answer-math font-mono">{result.solution_raw}</p>
                        )}
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-ink mb-4">{t.steps}</h3>
                        <StepDisplay content={result.steps} equation={mode === 'ode' ? undefined : input} rule={result.rule} locale={locale} />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-muted mb-2">{t.ai}</h3>
                        <p className="text-ink leading-relaxed">
                            {result.ai_explanation && result.ai_explanation.toLowerCase().includes("generating") || result.ai_explanation?.toLowerCase().includes("processing") ? (
                                <span className="text-muted">Generating explanation...</span>
                            ) : (
                                result.ai_explanation || "No explanation available."
                            )}
                        </p>
                    </div>

                    {(mode === 'derivative' || mode === 'integral' || mode === 'limit') && result.solution_raw ? (
                        <AnswerCheck equation={input} locale={locale} mode={mode} limitTo={limitTo} />
                    ) : null}

                    {mode === 'derivative' && !deferGraph && (
                        <div>
                            <h3 className="text-sm font-semibold text-ink mb-4">{t.graph}</h3>
                            <div className="h-64 w-full overflow-hidden">
                                <Graph equation={input} derivative={result.solution_raw} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showShare && result && !embedded && (
                <ShareResultCard
                    formula={input}
                    result={result.solution_raw || result.solution}
                    url={shareUrl || (typeof window !== 'undefined' ? window.location.href : '')}
                    type={mode}
                />
            )}
        </div>
    );
}
