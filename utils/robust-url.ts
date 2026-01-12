
/**
 * robust-url.ts
 * 
 * Provides a guaranteed absolute URL for server-side fetches.
 * Prevents "Only absolute URLs are supported" errors in Edge Runtimes
 * when environment variables are missing.
 */

export function getBaseUrl(): string {
    // Safe logic for Edge environments where process might be undefined OR shimmed differently
    const isProcessDefined = typeof process !== 'undefined';
    const isWindowDefined = typeof window !== 'undefined';

    // 1. Client-side fallback (most reliable relative path preservation)
    if (isWindowDefined) {
        return window.location.origin;
    }

    // 2. Check strict environment variable (set in Cloudflare/Vercel)
    if (isProcessDefined && process.env.NEXT_PUBLIC_BASE_URL) {
        let url = process.env.NEXT_PUBLIC_BASE_URL;
        if (url.endsWith('/')) url = url.slice(0, -1);
        if (!url.startsWith('http')) url = `https://${url}`;
        return url;
    }

    // 3. Check Vercel system variable
    if (isProcessDefined && process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // 4. Last resort fallback: Production Domain (use custom domain, not Cloudflare's default)
    return 'https://derivativecalculatorai.com';
}
