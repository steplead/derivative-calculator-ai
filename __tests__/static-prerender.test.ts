/**
 * Uncached HTML used to run KaTeX and the computer-algebra system inside the
 * Worker and return Cloudflare 1102. Sitemap pages must be force-static, and
 * the document shell must not call headers().
 */
import fs from 'fs';
import path from 'path';
import { readLocale, withLocale } from '@/lib/read-locale';
import { CONTENT_SECURITY_POLICY } from '@/lib/security-headers';

const ROOT = path.resolve(__dirname, '..');

describe('static HTML prerender', () => {
    it('reads locale from the build task, defaulting to English', () => {
        expect(readLocale()).toBe('en');
        expect(withLocale('es', () => readLocale())).toBe('es');
        expect(withLocale('pt', () => readLocale())).toBe('pt');
        expect(readLocale()).toBe('en');
    });

    it('prerenders the problem route instead of the edge runtime', () => {
        const src = fs.readFileSync(path.join(ROOT, 'app/(site)/[slug]/page.tsx'), 'utf8');
        expect(src).toContain("export const dynamic = 'force-static'");
        expect(src).toContain('export const dynamicParams = false');
        expect(src).toContain('generateStaticParams');
        expect(src).not.toMatch(/export const runtime = 'edge'/);
        expect(src).not.toMatch(/export const revalidate/);
        expect(src).not.toMatch(/from 'next\/headers'/);
    });

    it('does not rewrite /es or /pt onto the English page', () => {
        const src = fs.readFileSync(path.join(ROOT, 'middleware.ts'), 'utf8');
        expect(src).not.toContain('localeRewriteTarget');
        expect(src).not.toContain('x-next-locale');
    });

    it('allows the Cloudflare Web Analytics beacon', () => {
        expect(CONTENT_SECURITY_POLICY).toContain('https://static.cloudflareinsights.com');
        expect(CONTENT_SECURITY_POLICY).toContain('https://cloudflareinsights.com');
    });
});
