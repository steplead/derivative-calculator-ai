import DocumentShell from '@/components/DocumentShell';

export default function PortugueseLayout({ children }: { children: React.ReactNode }) {
    return <DocumentShell locale="pt">{children}</DocumentShell>;
}
