'use client';

import { useEffect, useState } from 'react';
import MathDisplay from './MathDisplay';
import AdShell from './AdShell';
import { Loader2, AlertCircle } from 'lucide-react';
interface MatrixResultProps {
    result: string | null;
    steps: string | null;
    error: string | null;
    isLoading: boolean;
}

export default function MatrixResult({ result, steps, error, isLoading }: MatrixResultProps) {
    if (isLoading) {
        return (
            <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 animate-pulse">
                <div className="h-6 w-32 bg-white/10 rounded mb-4"></div>
                <div className="h-12 w-full bg-white/5 rounded"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8 p-6 bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-500/20">
                <h3 className="text-red-400 font-semibold mb-2">Error</h3>
                <p className="text-gray-300">{error}</p>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Result Section */}
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <span className="text-green-400">✓</span> Result
                </h2>
                <div className="bg-black/20 p-4 rounded-lg overflow-x-auto flex justify-center">
                    <MathDisplay latex={result} />
                </div>
            </div>

            {/* Ad Unit: Sponsored Result */}
            <AdShell type="donation" className="mb-8" />

            {/* Steps Section */}
            {steps && (
                <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <h2 className="text-xl font-semibold text-gray-100 mb-4">Step-by-Step</h2>
                    <div className="prose prose-invert max-w-none">
                        {/* Simple parser for steps, assuming simple text + latex for now */}
                        <div className="text-gray-300 leading-relaxed">
                            {/* Replace $$...$$ with MathDisplay or simple render if MathDisplay handles blocks */}
                            {/* Current MathDisplay might handle simple strings or just latex. 
                     For safety, we treat steps as a single block containing LaTeX. */}
                            <p>{steps.split('$$')[0]}</p>
                            {steps.includes('$$') && (
                                <div className="my-4">
                                    <MathDisplay latex={steps.split('$$')[1]} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
