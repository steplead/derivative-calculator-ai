'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-4">
                <div className="text-center max-w-md">
                    <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
                    <p className="mb-8 text-gray-600 dark:text-gray-400">
                        We encountered an unexpected error. Please try again.
                    </p>
                    <div className="space-x-4">
                        <button
                            onClick={() => reset()}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-2 bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
