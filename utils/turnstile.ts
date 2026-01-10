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

    if (!secretKey) {
        // Turnstile not configured - fail open for development
        console.warn('TURNSTILE_SECRET_KEY not configured');
        return { success: true };
    }

    if (!token) {
        return { success: false, error: 'No token provided' };
    }

    try {
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

        if (result.success) {
            return { success: true };
        } else {
            return {
                success: false,
                error: result['error-codes']?.join(', ') || 'Verification failed'
            };
        }
    } catch (error) {
        console.error('Turnstile verification error:', error);
        // Fail open on network errors
        return { success: true };
    }
}

/**
 * Check if request looks like a legitimate browser
 */
export function looksLikeLegitimateBrowser(userAgent: string | null): boolean {
    if (!userAgent) return false;

    // Block common bot/crawler patterns
    const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /curl/i, /wget/i, /python/i, /node/i, /java/i,
        /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
    ];

    for (const pattern of botPatterns) {
        if (pattern.test(userAgent)) return false;
    }

    // Must contain common browser identifiers
    const browserPatterns = [
        /mozilla/i, /chrome/i, /safari/i, /firefox/i,
        /edge/i, /opr\//i, /edg/i, /trident/i,
    ];

    return browserPatterns.some(pattern => pattern.test(userAgent));
}
