'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [darkMode, setDarkMode] = useState<boolean | undefined>(undefined);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('theme');
        const isDark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('light', !isDark);
    }, []);

    const toggleTheme = () => {
        const nextDark = !darkMode;
        document.documentElement.classList.toggle('dark', nextDark);
        document.documentElement.classList.toggle('light', !nextDark);
        localStorage.setItem('theme', nextDark ? 'dark' : 'light');
        setDarkMode(nextDark);
    };

    // Don't render until mounted to avoid hydration mismatch
    if (!mounted) {
        return <div className="nav-tap" aria-hidden="true" />;
    }

    return (
        <button
            onClick={toggleTheme}
            className="nav-tap inline-flex items-center justify-center rounded-xl border border-line bg-card text-muted hover:text-ink hover:bg-hover transition-colors duration-200"
            aria-label="Toggle Dark Mode"
        >
            {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
            )}
        </button>
    );
}
