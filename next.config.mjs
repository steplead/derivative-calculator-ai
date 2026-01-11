/**
 * Next.js Configuration
 *
 * NOTE: CSP headers are configured via public/_headers for Cloudflare Pages deployment.
 * Next.js headers() is disabled to avoid conflicts with Cloudflare Pages _headers.
 * Cloudflare Pages prioritizes public/_headers over Next.js configuration.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
