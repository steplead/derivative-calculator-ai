'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function LanguageSwitcher() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (locale: string) => {
        let newPath = pathname;

        // Remove existing locale prefix if present
        if (newPath.startsWith('/es')) newPath = newPath.replace('/es', '');
        else if (newPath.startsWith('/pt')) newPath = newPath.replace('/pt', '');

        // Ensure path starts with /
        if (!newPath.startsWith('/')) newPath = '/' + newPath;

        // Add new locale prefix (unless it's English, which is default)
        if (locale !== 'en') {
            newPath = `/${locale}${newPath === '/' ? '' : newPath}`;
        }

        // Force full page reload to ensure server middleware runs
        window.location.href = newPath;
    };

    const getCurrentLocale = () => {
        if (pathname.startsWith('/es')) return 'ES';
        if (pathname.startsWith('/pt')) return 'PT';
        return 'EN';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all active:scale-95"
                title="Change Language"
            >
                {/* Globe Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span className="text-sm font-medium">{getCurrentLocale()}</span>
                {/* Chevron */}
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <LanguageOption label="English" code="en" current={!pathname.startsWith('/es') && !pathname.startsWith('/pt')} onClick={handleLanguageChange} />
                    <LanguageOption label="Español" code="es" current={pathname.startsWith('/es')} onClick={handleLanguageChange} />
                    <LanguageOption label="Português" code="pt" current={pathname.startsWith('/pt')} onClick={handleLanguageChange} />
                </div>
            )}
        </div>
    );
}

function LanguageOption({ label, code, current, onClick }: { label: string, code: string, current: boolean, onClick: (c: string) => void }) {
    return (
        <button
            onClick={() => onClick(code)}
            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors
                ${current
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }
            `}
        >
            <span>{label}</span>
            {current && (
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </button>
    );
}
