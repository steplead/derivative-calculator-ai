'use client';
import 'katex/dist/katex.min.css';
import dynamic from 'next/dynamic';

const Latex = dynamic(() => import('react-latex-next'), { ssr: false });

interface StepDisplayProps {
    content: string;
}

export default function StepDisplay({ content }: StepDisplayProps) {
    return (
        <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm font-mono">
            <Latex>{content}</Latex>
        </div>
    );
}
