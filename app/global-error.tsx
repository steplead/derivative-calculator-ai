'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const isDev = process.env.NODE_ENV === 'development';

    return (
        <html>
            <body className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-4">
                <div className="text-center max-w-2xl">
                    <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                        We encountered an unexpected error. Please try again.
                    </p>

                    {isDev && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm font-mono text-left text-red-800 dark:text-red-300 break-words">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}

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

                    <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                        If this problem persists, please <a href="mailto:support@derivativecalculatorai.com" className="text-blue-600 dark:text-blue-400 hover:underline">contact us</a>.
                    </p>
                </div>
            </body>
        </html>
    );
}
