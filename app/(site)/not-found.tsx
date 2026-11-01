import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Page not found',
    robots: { index: false, follow: false },
};

export default function EnglishNotFound() {
    return (
        <div className="text-center py-24">
            <h1 id="page-not-found" className="text-6xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-ink mb-4">Page Not Found</h2>
            <p className="text-muted mb-8">
                The mathematical solution you&apos;re looking for doesn&apos;t exist here.
            </p>
            <Link
                href="/"
                className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-full transition-colors"
            >
                Back to Home
            </Link>
        </div>
    );
}
