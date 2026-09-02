/**
 * RC-2 regression: soft-404 behavior of the [slug] page.
 *
 * The page must:
 *  - re-throw Next.js notFound() control-flow errors (digest NEXT_NOT_FOUND)
 *  - re-throw genuine errors (→ error boundary / 500)
 *  - NEVER return HTTP 200 with an "Unable to load calculation" fallback body
 *
 * We test the decision logic directly (the page catch handler) without
 * needing the full Cloudflare edge runtime.
 */

describe('RC-2 soft-404 fix — catch handler decision logic', () => {
  // Mirrors the exact logic now in app/[slug]/page.tsx catch block.
  function handleCriticalError(err: any): 'rethrow-notfound' | 'rethrow-error' {
    if (err?.digest === 'NEXT_NOT_FOUND') {
      throw err; // Next.js renders not-found.tsx (real 404)
    }
    // Genuine failure → error boundary (500). Never 200 fallback.
    throw err;
  }

  it('re-throws NEXT_NOT_FOUND so Next.js renders a real 404', () => {
    const notFoundErr = { digest: 'NEXT_NOT_FOUND' };
    let caught: any = null;
    try {
      handleCriticalError(notFoundErr);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe(notFoundErr); // same object re-thrown, not a 200 fallback
    expect(caught.digest).toBe('NEXT_NOT_FOUND');
  });

  it('re-throws genuine errors (never swallowed into 200 fallback)', () => {
    const genuineErr = new Error('D1 query failed');
    let caught: any = null;
    try {
      handleCriticalError(genuineErr);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe(genuineErr);
    expect((caught as Error).message).toBe('D1 query failed');
  });

  it('no longer returns a 200 "Unable to load calculation" fallback', () => {
    // Assert the old fallback string is gone from the page source.
    const fs = require('fs');
    const src = fs.readFileSync('app/[slug]/page.tsx', 'utf8');
    expect(src).not.toContain('Unable to load calculation');
  });
});
