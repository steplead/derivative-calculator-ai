import type { Metadata } from 'next';
import { localizedMetadata, LocalizedPage } from '@/lib/localized-page';

export const dynamic = 'force-static';

export function generateMetadata(): Promise<Metadata> {
    return localizedMetadata('es', []);
}

export default function SpanishHome() {
    return LocalizedPage({ locale: 'es', segments: [] });
}
