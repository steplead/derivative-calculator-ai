import { useEffect, useState } from 'react';

export default function SidePanel() {
    const [selection, setSelection] = useState<string>('');

    useEffect(() => {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((request: any) => {
            if (request.action === &quot;SOLVE_SELECTION&quot;) {
                setSelection(request.text);
            }
        });
    }, []);

    return (
        <div className="p-4 w-full h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-y-auto">
            <h1 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">Derivative AI</h1>

            {!selection ? (
                <div className="text-center mt-10 opacity-60">
                    <p>Highlight math on any page,</p>
                    <p>Right-click &rarr; &quot;Solve&quot;</p>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                        <div className="text-xs uppercase tracking-wider opacity-50 mb-1">Input</div>
                        <code className="font-mono text-lg block overflow-x-auto">{selection}</code>
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
                        Solve Now
                    </button>
                </div>
            )}
        </div>
    );
}
