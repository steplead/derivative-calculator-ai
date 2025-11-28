'use client';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

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
