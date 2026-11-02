'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import LogoMark from './LogoMark';

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

    const locale = pathname === '/es' || pathname.startsWith('/es/')
        ? 'es'
        : pathname === '/pt' || pathname.startsWith('/pt/')
            ? 'pt'
            : 'en';
    const hrefFor = (path: string) => {
        if (locale === 'en') return path;
        return path === '/' ? `/${locale}` : `/${locale}${path}`;
    };

    const navItems = [
        { name: dict.navShort.derivative, href: hrefFor('/'), path: '/', id: 'nav-deriv' },
        { name: dict.navShort.integral, href: hrefFor('/integral'), path: '/integral', id: 'nav-int' },
        { name: dict.navShort.limit, href: hrefFor('/limit'), path: '/limit', id: 'nav-lim' },
        { name: dict.navShort.matrix, href: hrefFor('/matrix'), path: '/matrix', id: 'nav-mat' },
        { name: dict.navShort.ode, href: hrefFor('/ode'), path: '/ode', id: 'nav-ode' },
        { name: dict.navShort.wiki, href: hrefFor('/wiki'), path: '/wiki', id: 'nav-wiki' },
        { name: dict.navShort.trig, href: hrefFor('/derivatives-of-trig-functions'), path: '/derivatives-of-trig-functions', id: 'nav-trig' },
        { name: dict.navShort.directory, href: hrefFor('/directory'), path: '/directory', id: 'nav-dir' },
        { name: dict.navShort.problems, href: hrefFor('/problems'), path: '/problems', id: 'nav-problems' },
        { name: dict.navShort.practice, href: hrefFor('/practice'), path: '/practice', id: 'nav-practice' },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-line">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center pr-4">
                        <Link href={hrefFor('/')} className="flex items-center gap-2 min-h-12" aria-label="Derivative Calculator AI">
                            <LogoMark className="h-9 w-9 text-primary" />
                            <span className="text-sm font-semibold leading-tight text-ink">
                                Derivative Calculator <span className="text-primary">AI</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu - Professional Spacing */}
                    <div className="hidden lg:flex items-center gap-x-1 xl:gap-x-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 relative group
                                    ${isActive(item.path)
                                        ? 'text-primary bg-answer-bg'
                                        : 'text-muted hover:text-ink hover:bg-hover'
                                    }`}
                            >
                                {item.name}
                                {isActive(item.href) && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full" />
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
                            className="nav-tap inline-flex items-center justify-center rounded-xl text-muted hover:text-ink hover:bg-hover transition-colors duration-200 focus:outline-none border border-line"
                            aria-label={isOpen ? 'Close main menu' : 'Open main menu'}
                        >
                            <span className="sr-only">{isOpen ? 'Close main menu' : 'Open main menu'}</span>
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
                <div className="lg:hidden bg-card border-t border-line">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`nav-tap block px-4 rounded-xl text-base font-semibold transition-colors duration-200
                                    ${isActive(item.path)
                                        ? 'bg-answer-bg text-primary'
                                        : 'text-ink hover:bg-hover'
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
