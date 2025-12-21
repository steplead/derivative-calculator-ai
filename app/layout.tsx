export const runtime = 'edge';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <h1>Layout Loaded</h1>
                {children}
            </body>
        </html>
    )
}
