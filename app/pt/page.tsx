import type { Metadata } from 'next';
import { localizedMetadata, LocalizedPage } from '@/lib/localized-page';

export const dynamic = 'force-static';

export function generateMetadata(): Promise<Metadata> {
    return localizedMetadata('pt', []);
}

export default function PortugueseHome() {
    return LocalizedPage({ locale: 'pt', segments: [] });
}
