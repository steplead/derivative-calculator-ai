'use client';
import { useEffect, useRef } from 'react';

interface GraphProps {
    equation: string;
    derivative?: string;
}

export default function Graph({ equation, derivative }: GraphProps) {
    const rootEl = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadGraph = async () => {
            try {
                if (rootEl.current) {
                    // Dynamically import function-plot to avoid SSR crash in Edge Runtime
                    const functionPlot = (await import('function-plot')).default;

                    const data: any[] = [
                        {
                            fn: equation,
                            color: '#3b82f6', // blue-500
                            graphType: 'polyline',
                            title: 'f(x)'
                        }
                    ];

                    if (derivative) {
                        data.push({
                            fn: derivative,
                            color: '#ef4444', // red-500
                            graphType: 'polyline',
                            attr: { "stroke-dasharray": "5,5" }, // Dashed line for result
                            title: 'Result'
                        });
                    }

                    functionPlot({
                        target: rootEl.current,
                        width: 600,
                        height: 400,
                        grid: true,
                        data: data,
                        tip: {
                            xLine: true,
                            yLine: true,
                        }
                    });
                }
            } catch (e) {
                console.error("Graph error", e);
            }
        };

        loadGraph();
    }, [equation, derivative]);

    return <div ref={rootEl} className="w-full h-[400px] flex justify-center items-center overflow-hidden bg-white rounded-lg" />;
}
