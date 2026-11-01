import DocumentShell from '@/components/DocumentShell';

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
    return <DocumentShell locale="en">{children}</DocumentShell>;
}
