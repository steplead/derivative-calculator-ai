'use client';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface StepDisplayProps {
    content: string;
}

export default function StepDisplay({ content }: StepDisplayProps) {
    return (
        <div className="text-gray-300 leading-relaxed text-sm font-mono">
            <Latex>{content}</Latex>
        </div>
    );
}
