import type { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Derivative Calculator AI',
  description: 'AI-powered derivative calculator',
};

export default function Page() {
  return (
    <main className="min-h-screen p-8 bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Derivative Calculator AI
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">Safe Mode Active</h2>
        <p className="text-gray-600 mb-4">
          The core application is temporarily disabled to isolate a persistent 500 error.
          If you see this, the server infrastructure is working correctly.
        </p>
        <div className="text-xs font-mono text-gray-500 bg-gray-100 p-2 rounded">
          Status: Core Online <br />
          Components: Disabled
        </div>
      </div>
    </main>
  );
}
