import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Página no encontrada',
    robots: { index: false, follow: false },
};

export default function SpanishNotFound() {
    return (
        <div className="text-center py-24">
            <h1 id="page-not-found" className="text-6xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-ink mb-4">Página no encontrada</h2>
            <p className="text-muted mb-8">
                La página que buscas no existe.
            </p>
            <Link
                href="/es"
                className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-full transition-colors"
            >
                Volver al inicio
            </Link>
        </div>
    );
}
