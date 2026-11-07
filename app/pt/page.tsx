import type { Metadata } from 'next';
import { localizedMetadata, LocalizedPage } from '@/lib/localized-page';

export const dynamic = 'force-static';

// 2026-11-07 (owner-approved): keep the pt homepage out of the index until
// the English site is indexed. Scoped to this route only; pt inner pages
// (app/pt/[...path]) are unaffected.
export async function generateMetadata(): Promise<Metadata> {
    const meta = await localizedMetadata('pt', []);
    return { ...meta, robots: { index: false, follow: true } };
}

export default function PortugueseHome() {
    return LocalizedPage({ locale: 'pt', segments: [] });
}
