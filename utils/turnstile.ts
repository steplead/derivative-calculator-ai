/**
 * Cloudflare Turnstile Verification
 *
 * Free CAPTCHA alternative to prevent automated abuse
 * Works without any Dashboard configuration on Cloudflare Pages
 */

interface TurnstileResponse {
    success: boolean;
    'error-codes'?: string[];
    challenge_ts?: string;
    hostname?: string;
}

export async function verifyTurnstileToken(
    token: string,
    remoteIp?: string
): Promise<{ success: boolean; error?: string }> {

    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    console.log('[TURNSTILE_VERIFY] Starting verification...', {
        hasToken: !!token,
        tokenLength: token?.length,
        hasSecretKey: !!secretKey,
        remoteIp: remoteIp || 'none'
    });

    if (!secretKey) {
        // Turnstile not configured - fail open for development
        console.error('[TURNSTILE_VERIFY] TURNSTILE_SECRET_KEY not configured in environment');
        return { success: false, error: 'Server configuration error: TURNSTILE_SECRET_KEY not set' };
    }

    if (!token) {
        return { success: false, error: 'No token provided' };
    }

    try {
        console.log('[TURNSTILE_VERIFY] Sending request to Cloudflare...');
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
                remoteip: remoteIp || '',
            }),
        });

        const result: TurnstileResponse = await response.json();

        console.log('[TURNSTILE_VERIFY] Cloudflare response:', {
            success: result.success,
            errorCodes: result['error-codes'],
            challengeTs: result.challenge_ts,
            hostname: result.hostname,
            httpStatus: response.status
        });

        if (result.success) {
            console.log('[TURNSTILE_VERIFY] ✓ Token verified successfully');
            return { success: true };
        } else {
            console.error('[TURNSTILE_VERIFY] ✗ Token verification failed:', result['error-codes']);
            return {
                success: false,
                error: result['error-codes']?.join(', ') || 'Verification failed'
            };
        }
    } catch (error) {
        console.error('[TURNSTILE_VERIFY] Network error during verification:', error);
        // Fail open on network errors
        return { success: true };
    }
}

/**
 * Check if request looks like a legitimate browser
 * Enhanced detection with multiple signals
 */
export function looksLikeLegitimateBrowser(
    userAgent: string | null,
    headers?: Headers | Record<string, string | null>
): boolean {
    if (!userAgent) return false;

    // Block common bot/crawler patterns
    const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /curl/i, /wget/i, /python/i, /node/i, /java/i,
        /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
        /http/i, /client/i, /library/i, /tool/i,
        /go-http/i, /okhttp/i, /apache/i, /requests/i,
    ];

    for (const pattern of botPatterns) {
        if (pattern.test(userAgent)) return false;
    }

    // Must contain common browser identifiers
    const browserPatterns = [
        /mozilla/i, /chrome/i, /safari/i, /firefox/i,
        /edge/i, /opr\//i, /edg/i, /trident/i,
    ];

    const hasBrowserUA = browserPatterns.some(pattern => pattern.test(userAgent));
    
    if (!hasBrowserUA) return false;

    // Additional checks if headers are provided
    if (headers) {
        const getHeader = (name: string) => {
            if (headers instanceof Headers) {
                return headers.get(name);
            }
            return headers[name.toLowerCase()] || headers[name];
        };

        // Check for missing Accept header (bots often omit this)
        const accept = getHeader('accept');
        if (!accept) {
            return false; // Bots often don't send Accept header
        }

        // Check for suspicious Accept patterns
        if (/^\*\/\*$/.test(accept.trim())) {
            return false; // Some bots send "*/*" only
        }

        // Check Accept header quality - browsers send detailed Accept headers
        // Bots often send minimal Accept headers
        const hasDetailedAccept = accept.includes('application/json') || 
                                  accept.includes('text/html') || 
                                  accept.includes('application/xhtml') ||
                                  accept.includes('*/*'); // Allow */* if combined with other indicators
        
        // Accept-Language check (browsers usually send this, but API calls from JS might not)
        // So we use this as a positive signal, not a blocker
        const acceptLanguage = getHeader('accept-language');
        const hasAcceptLanguage = acceptLanguage && acceptLanguage.length >= 2;

        // Check for suspicious Referer patterns
        const referer = getHeader('referer');
        if (referer && /^(http:\/\/|https:\/\/)[^\/]+\/?$/.test(referer)) {
            // Suspicious: just domain without path
            return false;
        }

        // If Accept header is too minimal and no Accept-Language, likely a bot
        if (!hasDetailedAccept && !hasAcceptLanguage) {
            return false;
        }

        // Additional browser fingerprinting checks
        // Real browsers typically send these headers
        const secFetchMode = getHeader('sec-fetch-mode');
        const secFetchSite = getHeader('sec-fetch-site');
        const secFetchUser = getHeader('sec-fetch-user');
        const secChUa = getHeader('sec-ch-ua');
        const secChUaPlatform = getHeader('sec-ch-ua-platform');

        // Modern browsers (Chrome 90+, Edge 90+, etc.) send Sec-Fetch-* headers
        // If User-Agent claims to be a modern browser but lacks these headers, suspicious
        const claimsModernBrowser = /chrome\/9[0-9]|edg\/9[0-9]|safari\/1[4-9]|firefox\/9[0-9]/i.test(userAgent);
        if (claimsModernBrowser && !secFetchMode && !secChUa) {
            // Modern browser UA but missing modern browser headers - likely spoofed
            return false;
        }

        // Check for suspicious header combinations
        // Real browsers don't send certain combinations
        const connection = getHeader('connection');
        if (connection && connection.toLowerCase() === 'close' && !secFetchMode) {
            // HTTP/1.0 style connection: close without modern headers - suspicious
            return false;
        }
    }

    return true;
}
