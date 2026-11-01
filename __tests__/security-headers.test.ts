/**
 * Cloudflare Pages only applies a _headers rule when the header lines are
 * indented under a URL path. The document CSP must also match the policy
 * middleware attaches, because Pages Functions do not receive _headers.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS, applySecurityHeaders } from '@/lib/security-headers';

const HEADERS_PATH = path.resolve(__dirname, '..', 'public', '_headers');

type Rule = { path: string; headers: Record<string, string> };

function parseHeadersFile(source: string): Rule[] {
    const rules: Rule[] = [];
    let current: Rule | null = null;

    for (const raw of source.split('\n')) {
        const line = raw.replace(/\r$/, '');
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const indented = line.startsWith(' ') || line.startsWith('\t');
        if (!indented) {
            current = { path: trimmed, headers: {} };
            rules.push(current);
            continue;
        }

        if (!current) {
            throw new Error(`Header is not under a path: ${trimmed}`);
        }
        const separator = trimmed.indexOf(':');
        if (separator === -1) {
            throw new Error(`Header line has no name: ${trimmed}`);
        }
        const name = trimmed.slice(0, separator).trim();
        const value = trimmed.slice(separator + 1).trim();
        current.headers[name] = value;
    }

    return rules;
}

describe('public/_headers', () => {
    const rules = parseHeadersFile(fs.readFileSync(HEADERS_PATH, 'utf8'));
    const globalRule = rules.find((rule) => rule.path === '/*');

    it('puts every header under a path, starting with /*', () => {
        expect(rules[0]?.path).toBe('/*');
        expect(globalRule).toBeTruthy();
    });

    it('applies the security headers and the GA4/Turnstile CSP on /*', () => {
        expect(globalRule!.headers['X-Frame-Options']).toBe('DENY');
        expect(globalRule!.headers['X-Content-Type-Options']).toBe('nosniff');
        expect(globalRule!.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
        const csp = globalRule!.headers['Content-Security-Policy'];
        expect(csp).toBe(CONTENT_SECURITY_POLICY);
        expect(csp).toContain('https://www.googletagmanager.com');
        expect(csp).toContain('https://www.google-analytics.com');
        expect(csp).toContain('https://*.analytics.google.com');
        expect(csp).toContain('https://challenges.cloudflare.com');
        expect(csp).toContain("connect-src 'self'");
        expect(csp).toContain("'unsafe-inline'");
        expect(csp).toContain("'unsafe-eval'");
    });

    it('stays inside the Cloudflare 2000-character header line limit', () => {
        const source = fs.readFileSync(HEADERS_PATH, 'utf8');
        for (const line of source.split('\n')) {
            expect(line.length).toBeLessThanOrEqual(2000);
        }
    });

    it('keeps cache rules for static files and API responses', () => {
        expect(rules.find((rule) => rule.path === '/_next/static/*')?.headers['Cache-Control']).toContain('immutable');
        expect(rules.find((rule) => rule.path === '/api/*')?.headers['Cache-Control']).toBe('private, no-store');
    });

    it('does not edge-cache HTML for hours', () => {
        expect(globalRule!.headers['Cache-Control']).toBe('public, max-age=0, must-revalidate');
        const middleware = fs.readFileSync(path.resolve(__dirname, '..', 'middleware.ts'), 'utf8');
        expect(middleware).toContain('public, max-age=0, must-revalidate');
        expect(middleware).not.toContain('s-maxage=7200');
    });
});

describe('middleware security policy', () => {
    it('sets the same CSP a browser will enforce on the HTML document', () => {
        const headers = new Headers();
        applySecurityHeaders(headers);
        expect(headers.get('Content-Security-Policy')).toBe(CONTENT_SECURITY_POLICY);
        expect(headers.get('X-Frame-Options')).toBe(SECURITY_HEADERS['X-Frame-Options']);
        expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('is attached on the middleware responses that serve HTML', () => {
        const src = fs.readFileSync(path.resolve(__dirname, '..', 'middleware.ts'), 'utf8');
        expect(src).toContain('applySecurityHeaders');
        expect(src).toContain('withSecurityHeaders(response)');
        expect(src).toContain('withSecurityHeaders(NextResponse.next())');
    });
});
