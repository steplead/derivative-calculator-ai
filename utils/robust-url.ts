
/**
 * robust-url.ts
 * 
 * Provides a guaranteed absolute URL for server-side fetches.
 * Prevents "Only absolute URLs are supported" errors in Edge Runtimes
 * when environment variables are missing.
 */

export function getBaseUrl(): string {
    // 1. Check strict environment variable (set in Cloudflare/Vercel)
    if (process.env.NEXT_PUBLIC_BASE_URL) {
        let url = process.env.NEXT_PUBLIC_BASE_URL;
        if (url.endsWith('/')) url = url.slice(0, -1);
        if (!url.startsWith('http')) url = `https://${url}`;
        return url;
    }

    // 2. Check Vercel system variable
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // 3. Last result fallback: Production Domain
    // This ensures we NEVER return an empty string or relative path
    return 'https://derivative-calculator-ai.pages.dev';
}
