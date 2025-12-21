import Link from 'next/link';

export const runtime = 'edge';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center px-4">
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
        </div>
    );
}
