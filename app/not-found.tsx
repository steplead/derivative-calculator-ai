import Link from 'next/link';
import { headers } from 'next/headers';
import Calculator from '@/components/Calculator';
import { sanitizeSlug, sanitizeMathFormula } from '@/utils/sanitize';

// Server-side 404 page with proper status code
export default function NotFound() {
    const headersList = headers();
    const pathname = headersList.get('x-pathname') || '/';
    const locale = headersList.get('x-next-locale') || 'en';

    let potentialFormula: string | null = null;

    // Server-side formula detection
    try {
        // Remove leading slash and locale prefix
        let raw = pathname;
        if (raw.startsWith(`/${locale}`)) {
            raw = raw.substring(`/${locale}`.length);
        }
        raw = raw.substring(1); // Remove leading slash

        // Decode URI components
        const decoded = decodeURIComponent(raw);

        // Sanitize the input
        const sanitized = sanitizeSlug(decoded);

        // Heuristic: If it's not a known system route and looks like math
        const systemRoutes = ['api', '_next', 'favicon.ico', 'wiki', 'directory', 'integral', 'limit', 'matrix', 'ode', 'es', 'pt', 'problems', 'practice', 'calculators', 'about', 'privacy', 'contact'];
        const isSystem = systemRoutes.some(r => sanitized?.startsWith(r) || sanitized?.includes(`/${r}/`));

        // Strict Math Heuristic
        const hasMultipleHyphens = (raw.match(/-/g) || []).length > 2;
        const looksLikeMath = /[\+\*\/\^\(\)]/.test(decoded) || (decoded.length < 15 && !decoded.includes('-'));

        if (!isSystem && sanitized && sanitized.length > 0 && sanitized.length < 50 && looksLikeMath && !hasMultipleHyphens) {
            potentialFormula = sanitizeMathFormula(sanitized);
        }
    } catch (e) {
        // Ignore decoding errors
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
            {potentialFormula ? (
                <div className="w-full max-w-4xl text-center animate-in fade-in duration-500">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Calculating: <span className="text-blue-600 dark:text-blue-400">{potentialFormula}</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        We couldn&apos;t find a dedicated page for this, but our AI can solve it instantly!
                    </p>

                    <Calculator
                        initialEquation={potentialFormula}
                        mode="derivative"
                    />

                    <div className="mt-8 text-sm opacity-50">
                        <Link href={`/${locale === 'en' ? '' : locale}`} className="underline hover:text-blue-500">
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        The mathematical solution you&apos;re looking for doesn&apos;t exist here.
                    </p>
                    <Link
                        href={`/${locale === 'en' ? '' : locale}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            )}
        </div>
    );
}
