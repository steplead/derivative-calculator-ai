'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
    const pathname = usePathname();
    const router = useRouter();

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

        // Force full page reload to ensure server middleware runs and layout updates
        window.location.href = newPath;
    };

    return (
        <div className="flex items-center space-x-2 text-sm font-medium">
            <button
                onClick={() => handleLanguageChange('en')}
                className={`hover:text-blue-600 dark:hover:text-blue-400 ${!pathname.startsWith('/es') && !pathname.startsWith('/pt') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
                EN
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
                onClick={() => handleLanguageChange('es')}
                className={`hover:text-blue-600 dark:hover:text-blue-400 ${pathname.startsWith('/es') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
                ES
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
                onClick={() => handleLanguageChange('pt')}
                className={`hover:text-blue-600 dark:hover:text-blue-400 ${pathname.startsWith('/pt') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
                PT
            </button>
        </div>
    );
}
