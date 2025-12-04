'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MathDisplay from './MathDisplay';
import Graph from './Graph';
import StepDisplay from './StepDisplay';
import AdUnit from './AdUnit';

type CalculatorProps = {
    initialEquation?: string;
    mode?: 'derivative' | 'integral' | 'limit';
};

export default function Calculator({ initialEquation = '', mode = 'derivative' }: CalculatorProps) {
    const searchParams = useSearchParams();
    const equationParam = searchParams.get('equation');
    const limitToParam = searchParams.get('to');

    const [input, setInput] = useState(equationParam || initialEquation);
    const [limitTo, setLimitTo] = useState(limitToParam || '0');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const eq = equationParam || initialEquation;
        const to = limitToParam || '0';

        if (eq) {
            setInput(eq);
            if (mode === 'limit') setLimitTo(to);
            handleCalculate(eq);
        }
    }, [equationParam, limitToParam, initialEquation, mode]);

    const handleCalculate = async (equationToSolve = input) => {
        if (!equationToSolve) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            let baseUrl = '';
            if (mode === 'derivative') {
                baseUrl = `/api/derivative?equation=${encodeURIComponent(equationToSolve)}`;
            } else if (mode === 'integral') {
                baseUrl = `/api/integral?equation=${encodeURIComponent(equationToSolve)}`;
            } else if (mode === 'limit') {
                baseUrl = `/api/limit?equation=${encodeURIComponent(equationToSolve)}&to=${encodeURIComponent(limitTo)}`;
            }

            // Step 1: Fast fetch (Math only)
            const resFast = await fetch(`${baseUrl}&include_ai=false`);
            if (!resFast.ok) {
                const text = await resFast.text();
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.error || `Server Error (${resFast.status})`);
                } catch {
                    throw new Error(`Server Error (${resFast.status}): ${text.substring(0, 100)}...`);
                }
            }
            const dataFast = await resFast.json();

            // Show math result immediately
            setResult(dataFast);
            setLoading(false); // Stop main loading spinner

            // Step 2: Slow fetch (AI Explanation)
            // We keep the result but maybe show a loading indicator for the explanation part
            try {
                const resFull = await fetch(`${baseUrl}&include_ai=true`);
                if (resFull.ok) {
                    const dataFull = await resFull.json();
                    setResult(dataFull); // Update with full data including AI
                } else {
                    const text = await resFull.text();
                    try {
                        const json = JSON.parse(text);
                        console.error("AI fetch failed:", json.error || `Server Error (${resFull.status})`);
                    } catch {
                        console.error(`AI fetch failed: Server Error (${resFull.status}): ${text.substring(0, 100)}...`);
                    }
                }
            } catch (aiErr) {
                console.error("AI fetch failed", aiErr);
                // Don't fail the whole request if AI fails, just keep the math result
            }

            // Save to history
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
            setError(`Connection Error: ${err instanceof Error ? err.message : String(err)}`);
            setLoading(false);
        }
    };

    const getPlaceholder = () => {
        if (mode === 'integral') return 'e.g. x^2, sin(x)';
        if (mode === 'limit') return 'e.g. (sin(x))/x';
        return 'e.g. x^2, sin(x), ln(x)';
    };

    const getButtonText = () => {
        if (loading) return 'Solving...';
        if (mode === 'integral') return 'Integrate';
        if (mode === 'limit') return 'Find Limit';
        return 'Solve';
    };

    return (
        <div className="max-w-4xl mx-auto bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="p-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full px-6 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono"
                            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                        />
                    </div>

                    {mode === 'limit' && (
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4">
                            <span className="text-gray-400 whitespace-nowrap">x &rarr;</span>
                            <input
                                type="text"
                                value={limitTo}
                                onChange={(e) => setLimitTo(e.target.value)}
                                className="w-16 bg-transparent text-white focus:outline-none font-mono"
                            />
                        </div>
                    )}

                    <button
                        onClick={() => handleCalculate()}
                        disabled={loading}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        {getButtonText()}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-4 font-semibold">Solution</h3>
                            <div className="text-3xl text-white font-math">
                                <MathDisplay latex={result.solution} />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm uppercase tracking-wider text-blue-400 mb-4 font-semibold flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                        <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                                    </svg>
                                    AI Explanation
                                </h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {result.ai_explanation.includes("unavailable") ? (
                                        <span className="animate-pulse text-gray-500">Generating explanation...</span>
                                    ) : (
                                        result.ai_explanation
                                    )}
                                </p>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm uppercase tracking-wider text-purple-400 mb-4 font-semibold flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                    </svg>
                                    Step-by-Step
                                </h3>
                                <StepDisplay content={result.steps} />
                            </div>
                        </div>

                        {mode === 'derivative' && (
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm uppercase tracking-wider text-green-400 mb-4 font-semibold">Graph</h3>
                                <div className="h-64 w-full">
                                    <Graph equation={input} derivative={result.solution_raw} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Ad Unit */}
                <div className="mt-8">
                    {/* Use a placeholder slot ID for now */}
                    <AdUnit slot="1234567890" />
                </div>
            </div>
        </div>
    );
}
