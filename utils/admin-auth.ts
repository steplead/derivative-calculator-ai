/**
 * Admin Authentication Utility
 *
 * Protects sensitive admin endpoints from unauthorized access.
 *
 * SECURITY POLICY (2026-07-08): Only Bearer token authentication is supported.
 * No API Key header, no IP whitelist, no expanded auth surface.
 *
 * Required environment variable:
 *   ADMIN_MONITORING_TOKEN — shared secret for admin endpoint access
 *
 * Production behavior:
 *   - If ADMIN_MONITORING_TOKEN is missing → deny all requests (fail closed)
 *   - No fallback auth methods
 *
 * Development behavior:
 *   - If ADMIN_MONITORING_TOKEN is missing → allow localhost for convenience
 *   - This is dev/test only; production must always have the token set
 */

/**
 * Check if request is from an authorized admin.
 *
 * ONLY Bearer token auth is supported. No other auth methods.
 *
 * @returns true if authorized, false if denied
 */
export function isAdminRequest(headers: Headers): boolean {
    // --- Bearer token auth (the ONLY auth method) ---
    const authorization = headers.get('authorization');
    const monitoringToken = process.env.ADMIN_MONITORING_TOKEN;

    if (authorization && monitoringToken) {
        const match = authorization.match(/^Bearer\s+(.+)$/i);
        if (match && match[1] === monitoringToken) {
            return true;
        }
    }

    // --- Production: fail closed if no token configured ---
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        // No fallback auth. No IP whitelist. No API key header.
        // If Bearer token didn't match (or wasn't provided), deny.
        return false;
    }

    // --- Development/test only: allow localhost when no token is set ---
    if (!monitoringToken) {
        const ip = getClientIp(headers);
        if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
            return true;
        }
    }

    return false;
}

/**
 * Get client IP from headers (minimal helper to avoid circular import).
 * Only used for dev/test localhost check — never used for auth in production.
 */
function getClientIp(headers: Headers): string {
    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;
    const xff = headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    return 'unknown';
}
