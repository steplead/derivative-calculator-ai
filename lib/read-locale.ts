import { AsyncLocalStorage } from 'node:async_hooks';
import { normalizeLocale, type Locale } from '@/lib/seo';

/**
 * Locale for statically rendered pages.
 *
 * English routes call readLocale() with no store and get "en".
 * The /es and /pt prerender entrypoints run the same page functions inside
 * withLocale(), so one implementation emits all three HTML variants at build
 * time. AsyncLocalStorage follows the async build task, including awaits.
 * Do not read this from a client component.
 */
const localeStorage = new AsyncLocalStorage<Locale>();

export function readLocale(): Locale {
    return normalizeLocale(localeStorage.getStore());
}

export function withLocale<T>(locale: string, run: () => T): T {
    return localeStorage.run(normalizeLocale(locale), run);
}
