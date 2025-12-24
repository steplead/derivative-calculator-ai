'use client';
import 'katex/dist/katex.min.css';
import dynamic from 'next/dynamic';

const Latex = dynamic(() => import('react-latex-next'), { ssr: false });

interface StepDisplayProps {
    content: string;
}

export default function StepDisplay({ content }: StepDisplayProps) {
    if (!content) return null;

    // Split by literal newline characters
    const steps = content.split('\n').filter(step => step.trim().length > 0);

    return (
        <div className="space-y-3">
            {steps.map((step, index) => {
                const isStepLabel = step.trim().startsWith('Step') || step.trim().startsWith('Final Answer');

                return (
                    <div key={index} className={`text-sm leading-relaxed ${isStepLabel ? 'pl-2 border-l-2 border-blue-500/30' : ''}`}>
                        <div className="text-gray-700 dark:text-gray-300">
                            <Latex>{step}</Latex>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
