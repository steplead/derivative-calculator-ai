'use client';

import { useState } from 'react';
import MathDisplay from './MathDisplay';
import Graph from './Graph';

export default function Calculator({ initialEquation = '' }: { initialEquation?: string }) {
    const [input, setInput] = useState(initialEquation);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCalculate = async () => {
        if (!input) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`/api/derivative?equation=${encodeURIComponent(input)}`);
            const data = await res.json();

            if (res.ok) {
                setResult(data);
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to fetch result');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex flex-col space-y-2">
                <label htmlFor="equation" className="text-lg font-medium text-gray-300">
                    Enter a Function
                </label>
                <div className="flex space-x-2">
                    <input
                        id="equation"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g. x^2, sin(x), ln(x)"
                        className="flex-1 p-6 text-3xl border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 border-slate-700 text-white placeholder-gray-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                    />
                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="px-8 py-4 text-xl font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Solving...' : 'Solve'}
                    </button>
                </div>
                {error && <p className="text-red-500">{error}</p>}
            </div>

            {result && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Answer Section */}
                    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                        <h2 className="text-sm uppercase tracking-wide text-gray-400 font-semibold mb-2">Derivative</h2>
                        <div className="text-white">
                            <MathDisplay latex={result.solution} />
                        </div>
                    </div>

                    {/* AI Explanation Section */}
                    <div className="bg-slate-800 p-6 rounded-xl shadow-md border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
                        </div>
                        <h2 className="flex items-center text-purple-400 font-bold text-lg mb-3">
                            <span className="mr-2">✨</span> AI Explanation
                        </h2>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            {result.ai_explanation}
                        </p>
                    </div>

                    {/* Graph Section */}
                    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                        <h2 className="text-sm uppercase tracking-wide text-gray-400 font-semibold mb-4">Graph</h2>
                        <div className="bg-white rounded-xl overflow-hidden p-2">
                            <Graph equation={input} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
