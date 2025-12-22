'use client';

// Global error boundary for the root of the app
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white flex items-center justify-center min-h-screen">
                <div className="max-w-md p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                    <div className="text-left bg-gray-100 dark:bg-slate-800 p-4 rounded-lg mb-6 overflow-auto max-h-48 text-sm font-mono text-red-600">
                        <p><strong>Error:</strong> {error.message || "Unknown Error"}</p>
                        {error.digest && <p className="mt-2 text-xs text-gray-500">Digest: {error.digest}</p>}
                    </div>
                    <button
                        onClick={() => reset()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
