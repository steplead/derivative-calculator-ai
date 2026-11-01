import type { Metadata } from 'next';
import { localizedMetadata, LocalizedPage } from '@/lib/localized-page';
import { localeCatchAllParams } from '@/lib/prerender-paths';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
    return localeCatchAllParams().filter((entry) => entry.path.length > 0);
}

export function generateMetadata({ params }: { params: { path: string[] } }): Promise<Metadata> {
    return localizedMetadata('pt', params.path);
}

export default function PortuguesePage({ params }: { params: { path: string[] } }) {
    return LocalizedPage({ locale: 'pt', segments: params.path });
}
