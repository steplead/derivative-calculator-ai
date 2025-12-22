'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar({ dict }: { dict: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Helper to check if a link is active
    const isActive = (path: string) => {
        // Remove locale prefix for comparison if necessary, but here we can just check endsWith or exact
        if (path === '/') {
            return pathname === '/' || pathname === '/es' || pathname === '/pt';
        }
        return pathname.includes(path);
    };

    const navItems = [
        { name: dict.navShort.derivative, href: '/', id: 'nav-deriv' },
        { name: dict.navShort.integral, href: '/integral', id: 'nav-int' },
        { name: dict.navShort.limit, href: '/limit', id: 'nav-lim' },
        { name: dict.navShort.matrix, href: '/matrix', id: 'nav-mat' },
        { name: dict.navShort.wiki, href: '/wiki', id: 'nav-wiki' },
        { name: dict.navShort.directory, href: '/directory', id: 'nav-dir' },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-all duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <div className="flex-shrink-0 flex items-center pr-4">
                        <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
                            <img
                                src="/logo-light.png"
                                alt="Derivative Calculator AI"
                                className="h-10 sm:h-12 w-auto dark:hidden"
                            />
                            <img
                                src="/logo-dark-v2.png"
                                alt="Derivative Calculator AI"
                                className="h-10 sm:h-12 w-auto hidden dark:block"
                            />
                        </Link>
                    </div>

                    {/* Desktop Menu - Professional Spacing */}
                    <div className="hidden lg:flex items-center gap-x-1 xl:gap-x-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 relative group
                                    ${isActive(item.href)
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                {item.name}
                                {isActive(item.href) && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                )}
                            </Link>
                        ))}

                        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2" />

                        <div className="flex items-center space-x-2">
                            <LanguageSwitcher />
                            <ThemeToggle />
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center space-x-3">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus:outline-none ring-1 ring-gray-200 dark:ring-slate-700"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Panel - Elegant Slide Down */}
            {isOpen && (
                <div className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 shadow-2xl animate-in slide-in-from-top duration-300">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors
                                    ${isActive(item.href)
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 mt-4">
                            <p className="px-4 mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Language / Idioma</p>
                            <div className="px-4">
                                <LanguageSwitcher />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
