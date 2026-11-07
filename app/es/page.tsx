import type { Metadata } from 'next';
import { localizedMetadata, LocalizedPage } from '@/lib/localized-page';

export const dynamic = 'force-static';

// 2026-11-07 (owner-approved): keep the es homepage out of the index until
// the English site is indexed. Scoped to this route only; es inner pages
// (app/es/[...path]) are unaffected.
export async function generateMetadata(): Promise<Metadata> {
    const meta = await localizedMetadata('es', []);
    return { ...meta, robots: { index: false, follow: true } };
}

export default function SpanishHome() {
    return LocalizedPage({ locale: 'es', segments: [] });
}
