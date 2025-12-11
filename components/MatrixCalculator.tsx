'use client';

import { useState } from 'react';
import MatrixInput from '@/components/MatrixInput';
import MatrixResult from '@/components/MatrixResult';

type Operation = 'determinant' | 'inverse' | 'transpose' | 'rank' | 'rref' | 'eigenvals';

interface MatrixCalculatorProps {
    dict: any;
}

export default function MatrixCalculator({ dict }: MatrixCalculatorProps) {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const [matrixData, setMatrixData] = useState<number[][]>([]);

    const [result, setResult] = useState<string | null>(null);
    const [steps, setSteps] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCalculate = async (op: Operation) => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setSteps(null);

        try {
            const response = await fetch('/api/matrix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matrix: matrixData, operation: op }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Calculation failed');
            }

            setResult(data.solution);
            setSteps(data.steps);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 text-white selection:bg-blue-500/30">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-4 pt-32 pb-20 relative">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {dict.matrix.h1.split(' ')[0]} <span className="text-white">{dict.matrix.h1.split(' ').slice(1).join(' ')}</span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        {dict.matrix.subtitle}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-6 mb-8 items-center bg-white/5 w-fit mx-auto p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-300">{dict.matrix.dimensions}</span>
                        <select
                            value={rows}
                            onChange={(e) => setRows(Number(e.target.value))}
                            className="bg-slate-800 border-none rounded-lg py-1 px-3 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Rows</option>)}
                        </select>
                        <span className="text-gray-500">×</span>
                        <select
                            value={cols}
                            onChange={(e) => setCols(Number(e.target.value))}
                            className="bg-slate-800 border-none rounded-lg py-1 px-3 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Cols</option>)}
                        </select>
                    </div>

                    <div className="h-8 w-px bg-white/10"></div>

                    <button
                        onClick={() => window.location.reload()}
                        className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5 font-bold"
                        title={dict.matrix.reset}
                    >
                        ⟳
                    </button>
                </div>

                {/* Matrix Input */}
                <div className="mb-10">
                    <MatrixInput
                        rows={rows}
                        cols={cols}
                        onChange={setMatrixData}
                    />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                    <ActionButton label={dict.matrix.ops.determinant} op="determinant" onClick={handleCalculate} color="blue" />
                    <ActionButton label={dict.matrix.ops.inverse} op="inverse" onClick={handleCalculate} color="purple" />
                    <ActionButton label={dict.matrix.ops.transpose} op="transpose" onClick={handleCalculate} color="emerald" />
                    <ActionButton label={dict.matrix.ops.rank} op="rank" onClick={handleCalculate} color="orange" />
                    <ActionButton label={dict.matrix.ops.rref} op="rref" onClick={handleCalculate} color="pink" />
                    <ActionButton label={dict.matrix.ops.eigenvals} op="eigenvals" onClick={handleCalculate} color="cyan" />
                </div>

                {/* Results */}
                <MatrixResult result={result} steps={steps} error={error} isLoading={isLoading} />
            </div>
        </main>
    );
}

function ActionButton({ label, op, onClick, color }: { label: string, op: Operation, onClick: any, color: string }) {
    const colors: any = {
        blue: "hover:bg-blue-600/20 hover:border-blue-500/50 text-blue-400",
        purple: "hover:bg-purple-600/20 hover:border-purple-500/50 text-purple-400",
        emerald: "hover:bg-emerald-600/20 hover:border-emerald-500/50 text-emerald-400",
        orange: "hover:bg-orange-600/20 hover:border-orange-500/50 text-orange-400",
        pink: "hover:bg-pink-600/20 hover:border-pink-500/50 text-pink-400",
        cyan: "hover:bg-cyan-600/20 hover:border-cyan-500/50 text-cyan-400",
    };

    return (
        <button
            onClick={() => onClick(op)}
            className={`
                p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                font-medium flex items-center justify-center gap-2
                ${colors[color]}
            `}
        >
            {label}
        </button>
    );
}
