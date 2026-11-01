import type { Metadata } from 'next';
import { localizedMetadata, LocalizedPage } from '@/lib/localized-page';
import { localeCatchAllParams } from '@/lib/prerender-paths';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
    return localeCatchAllParams().filter((entry) => entry.path.length > 0);
}

export function generateMetadata({ params }: { params: { path: string[] } }): Promise<Metadata> {
    return localizedMetadata('es', params.path);
}

export default function SpanishPage({ params }: { params: { path: string[] } }) {
    return LocalizedPage({ locale: 'es', segments: params.path });
}
