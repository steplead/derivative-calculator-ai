'use client';

import { useState, useEffect } from 'react';

interface MatrixInputProps {
    rows: number;
    cols: number;
    onChange: (_data: number[][]) => void;
}

export default function MatrixInput({ rows: initialRows, cols: initialCols, onChange }: MatrixInputProps) {
    const [matrix, setMatrix] = useState<number[][]>([]);

    // Initialize or resize matrix when props change
    useEffect(() => {
        setMatrix(prev => {
            // Create new matrix with correct dimensions
            // Preserve existing values if possible
            const newMatrix = Array(initialRows).fill(0).map((_, r) =>
                Array(initialCols).fill(0).map((_, c) => {
                    // Check if we have a value at this position in the previous matrix
                    return prev[r]?.[c] !== undefined ? prev[r][c] : 0;
                })
            );

            return newMatrix;
        });
    }, [initialRows, initialCols]);

    // Notify parent whenever matrix state changes
    useEffect(() => {
        if (matrix.length > 0) {
            onChange(matrix);
        }
    }, [matrix, onChange]);

    const handleInputChange = (r: number, c: number, value: string) => {
        // Allow empty string to mean 0 for calculation but display as empty
        // But for state we need a number. 
        // Let's store 0 if empty/NaN, but standard inputs are tricky.
        // Better: parse immediately.
        const numVal = value === '' ? 0 : parseFloat(value);

        setMatrix(prev => {
            const newMatrix = prev.map(row => [...row]); // Deep copy rows
            newMatrix[r][c] = isNaN(numVal) ? 0 : numVal;
            return newMatrix;
        });
    };

    if (matrix.length === 0) return null;

    return (
        <div className="overflow-x-auto p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner">
            <div
                className="grid gap-2 mx-auto w-fit"
                style={{
                    gridTemplateColumns: `repeat(${initialCols}, minmax(60px, 1fr))`
                }}
            >
                {matrix.map((row, r) => (
                    row.map((val, c) => (
                        <input
                            key={`${r}-${c}`}
                            type="number"
                            // If value is 0 and it's not being typed, maybe show 0? 
                            // Standard behavior: 0 is 0. 
                            defaultValue={val}
                            // Controlled input is safer here but defaultValue + key update is simpler for now
                            // Let's use value + onChange for true control if we wanted validation
                            // For now, simple standard unmanaged-ish or managed
                            placeholder="0"
                            onChange={(e) => handleInputChange(r, c, e.target.value)}
                            className="w-16 h-12 text-center text-lg bg-white/50 dark:bg-slate-800/50 
                         border border-gray-200 dark:border-slate-700 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all
                         text-gray-900 dark:text-gray-100"
                        />
                    ))
                ))}
            </div>
        </div>
    );
}
