/**
 * Next.js Configuration
 *
 * NOTE: CSP headers are configured via public/_headers for Cloudflare Pages deployment.
 * Next.js headers() is disabled to avoid conflicts with Cloudflare Pages _headers.
 * Cloudflare Pages prioritizes public/_headers over Next.js configuration.
 */
if (process.env.NODE_ENV === 'development') {
    const { setupDevPlatform } = await import('@cloudflare/next-on-pages/next-dev');
    await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    // Prerendering the problem library is CPU-heavy in aggregate. Cap workers
    // so a parallel static generation pass does not exhaust the build machine.
    experimental: {
        cpus: 2,
    },
    staticPageGenerationTimeout: 180,
};

export default nextConfig;
