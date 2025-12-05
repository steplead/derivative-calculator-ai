'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type HistoryItem = {
    equation: string;
    timestamp: number;
    mode?: 'derivative' | 'integral' | 'limit';
    limitTo?: string;
};

export default function HistorySidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const loadHistory = () => {
            try {
                const stored = localStorage.getItem('calc_history');
                if (stored) {
                    setHistory(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Failed to load history', e);
            }
        };

        loadHistory();
        // Listen for custom event to update history when a new calculation is made
        window.addEventListener('historyUpdated', loadHistory);
        return () => window.removeEventListener('historyUpdated', loadHistory);
    }, []);

    const clearHistory = () => {
        localStorage.removeItem('calc_history');
        setHistory([]);
        window.dispatchEvent(new Event('historyUpdated'));
    };

    const getLink = (item: HistoryItem) => {
        const eq = encodeURIComponent(item.equation);
        if (item.mode === 'integral') {
            return `/integral?equation=${eq}`;
        }
        if (item.mode === 'limit') {
            return `/limit?equation=${eq}&to=${encodeURIComponent(item.limitTo || '0')}`;
        }
        // Default to derivative (homepage)
        return `/?equation=${eq}`;
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-r-lg shadow-lg z-50 hover:bg-blue-700 transition-colors"
                aria-label="Toggle History"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">History</h2>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {history.length === 0 ? (
                            <p className="text-gray-500 text-center italic mt-10">No recent calculations</p>
                        ) : (
                            history.map((item, index) => (
                                <Link
                                    key={index}
                                    href={getLink(item)}
                                    onClick={() => setIsOpen(false)}
                                    className="block p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-gray-100 dark:border-transparent"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">{item.mode || 'Derivative'}</span>
                                        <span className="text-gray-400 dark:text-gray-500 text-xs">{new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-blue-600 dark:text-blue-300 font-mono text-sm truncate">{item.equation}</div>
                                </Link>
                            ))
                        )}
                    </div>

                    {history.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="mt-4 w-full py-2 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                            Clear History
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
