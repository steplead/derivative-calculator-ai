'use client';
import { useEffect, useRef } from 'react';
import functionPlot from 'function-plot';

interface GraphProps {
    equation: string;
    derivative?: string;
}

export default function Graph({ equation, derivative }: GraphProps) {
    const rootEl = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            if (rootEl.current) {
                // Basic sanitization/formatting for function-plot
                // It expects 'x^2' style, which is standard.
                // We might need to convert some python syntax if needed, but for now pass raw.
                const data = [
                    {
                        fn: equation,
                        color: '#3b82f6', // blue-500
                        graphType: 'polyline' as const
                    }
                ];

                if (derivative) {
                    // We can't easily plot the derivative string if it's LaTeX.
                    // function-plot needs a math string.
                    // For now, let's just plot the original function.
                }

                functionPlot({
                    target: rootEl.current,
                    width: 600,
                    height: 400,
                    grid: true,
                    data: data,
                    xAxis: { domain: [-10, 10] },
                    yAxis: { domain: [-10, 10] }
                });
            }
        } catch (e) {
            console.error("Graph error", e);
        }
    }, [equation]);

    return <div ref={rootEl} className="w-full h-[400px] flex justify-center items-center overflow-hidden" />;
}
