import DocumentShell from '@/components/DocumentShell';

export default function SpanishLayout({ children }: { children: React.ReactNode }) {
    return <DocumentShell locale="es">{children}</DocumentShell>;
}
