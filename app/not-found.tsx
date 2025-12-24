'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Calculator from '@/components/Calculator';

export default function NotFound() {
    const pathname = usePathname();
    const [potentialFormula, setPotentialFormula] = useState<string | null>(null);

    useEffect(() => {
        if (pathname) {
            try {
                // Remove leading slash
                const raw = pathname.substring(1);
                // Decode URI components (e.g. x%5E2 -> x^2)
                const decoded = decodeURIComponent(raw);

                // Heuristic: If it's not a known system route and short enough, treat as math
                const systemRoutes = ['api', '_next', 'favicon.ico', 'wiki', 'directory', 'integral', 'limit', 'matrix', 'ode', 'es', 'pt'];
                const isSystem = systemRoutes.some(r => decoded.startsWith(r) || decoded.includes(`/${r}/`));

                // Strict Math Heuristic
                const hasMultipleHyphens = (raw.match(/-/g) || []).length > 2;
                const looksLikeMath = /[\+\*\/\^\(\)]/.test(decoded) || (decoded.length < 15 && !decoded.includes('-'));

                if (!isSystem && decoded.length > 0 && decoded.length < 50 && looksLikeMath && !hasMultipleHyphens) {
                    setPotentialFormula(decoded);
                }
            } catch (e) {
                // Ignore decoding errors
            }
        }
    }, [pathname]);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
            {potentialFormula ? (
                <div className="w-full max-w-4xl text-center animate-in fade-in duration-500">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Calculating: <span className="text-blue-600 dark:text-blue-400">{potentialFormula}</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        We couldn't find a dedicated page for this, but our AI can solve it instantly!
                    </p>

                    <Calculator
                        initialEquation={potentialFormula}
                        mode="derivative"
                    />

                    <div className="mt-8 text-sm opacity-50">
                        <Link href="/" className="underline hover:text-blue-500">
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        The mathematical solution you're looking for doesn't exist here.
                    </p>
                    <Link
                        href="/"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            )}
        </div>
    );
}
