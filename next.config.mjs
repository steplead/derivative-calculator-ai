/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
                            "script-src-attr 'unsafe-inline'",
                            "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
                            "img-src 'self' data: blob: https://challenges.cloudflare.com",
                            "font-src 'self' data: https://challenges.cloudflare.com",
                            "connect-src 'self' https://challenges.cloudflare.com",
                            "frame-src 'self' https://challenges.cloudflare.com",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
