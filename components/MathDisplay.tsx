'use client';
import 'katex/dist/katex.min.css';
import dynamic from 'next/dynamic';

const Latex = dynamic(() => import('react-latex-next'), { ssr: false });

interface MathDisplayProps {
    latex: string;
}

export default function MathDisplay({ latex }: MathDisplayProps) {
    return (
        <div className="text-2xl py-4 overflow-x-auto text-center">
            <Latex>{`$${latex}$`}</Latex>
        </div>
    );
}
