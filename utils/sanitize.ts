/**
 * Input Sanitization Utilities
 *
 * SECURITY PROTOCOL: "Input is garbage until validated"
 * All user input MUST be sanitized before use in prompts, logic, or rendering.
 */

/**
 * Sanitizes mathematical formulas by removing dangerous patterns
 * while preserving valid mathematical notation.
 */
export function sanitizeMathFormula(input: string): string {
    if (!input) return '';
    if (typeof input !== 'string') {
        // Handle numeric input by converting to string
        input = String(input);
    }

    let sanitized = input.trim();

    // Remove any HTML tags FIRST (before any other processing)
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove potentially dangerous JavaScript patterns
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // onclick=, onload=, etc.

    // Trim again after removing dangerous patterns
    sanitized = sanitized.trim();

    // If the result is empty after removing HTML/tags, return empty immediately
    if (!sanitized) return '';

    // Allow only safe mathematical characters
    // Variables: a-z, A-Z
    // Numbers: 0-9, decimal point
    // Operators: + - * / ^ ( ) { } [ ]
    // Functions: sin, cos, tan, ln, log, sqrt, cbrt, exp, arcsin, arccos, arctan, sec, csc, cot, abs, floor, ceil, round
    // Constants: pi, e
    // Spaces and commas
    const safeMathPattern = /^[a-zA-Z0-9\s\+\-\*\/\^\(\)\{\}\[\]\.\,\_\|]+$/;

    // If it contains unsafe characters, return empty string
    if (!safeMathPattern.test(sanitized)) {
        return '';
    }

    // Prevent eval-like patterns
    const evalPatterns = [
        /eval\(/gi,
        /function\(/gi,
        /return\b/gi,
        /=>\s*{/,
    ];

    for (const pattern of evalPatterns) {
        if (pattern.test(sanitized)) {
            return '';
        }
    }

    // Final check: if empty after sanitization, return empty
    if (!sanitized.trim()) return '';

    return sanitized;
}

/**
 * Sanitizes slugs (URL fragments) by removing stop words and cleaning format.
 */
export function sanitizeSlug(slug: string): string {
    if (!slug || typeof slug !== 'string') return '';

    let sanitized = slug.trim().toLowerCase();

    // Remove URL encoding first, then sanitize
    try {
        sanitized = decodeURIComponent(sanitized);
    } catch {
        // If decoding fails, continue with original
    }

    // Remove any HTML/script tags FIRST
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    sanitized = sanitized.replace(/javascript:/gi, '');

    // If empty after tag removal, return empty
    if (!sanitized.trim()) return '';

    // Remove common stop words at the beginning
    const stopWords = [
        'what-is', 'whats', 'what-is-the', 'define', 'definition-of',
        'how-to', 'how-do-i', 'how-do-you',
        'calculate', 'calculator', 'computing', 'computation',
        'find', 'finding', 'solve', 'solving', 'solution',
        'the-', 'a-', 'an-',
    ];

    for (const stopWord of stopWords) {
        if (sanitized.startsWith(stopWord)) {
            sanitized = sanitized.substring(stopWord.length);
            break;
        }
    }

    // Remove any "null" strings (common bug pattern)
    sanitized = sanitized.replace(/^null$/i, '');

    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');

    // Ensure only safe URL characters remain
    const safeSlugPattern = /^[a-z0-9\-_]+$/;
    if (!safeSlugPattern.test(sanitized)) {
        return '';
    }

    // Limit length (prevent DoS via extremely long slugs)
    if (sanitized.length > 200) {
        sanitized = sanitized.substring(0, 200);
    }

    // Final check: if empty after sanitization, return empty
    if (!sanitized.trim()) return '';

    return sanitized;
}

/**
 * Sanitizes user input for display by escaping HTML entities.
 * Use this before rendering any user content.
 */
export function escapeHtml(unsafe: string): string {
    if (!unsafe || typeof unsafe !== 'string') return '';

    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");  // Changed from &#039; to &#x27; for better compatibility
}

/**
 * Validates and sanitizes limit values (e.g., for limit calculations).
 */
export function sanitizeLimitValue(value: string): string {
    if (!value || typeof value !== 'string') return '0';

    let sanitized = value.trim();

    // Remove HTML and scripts
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Handle "minus-X" format (e.g., "minus-2" -> "-2")
    if (/^minus-\d+$/.test(sanitized)) {
        sanitized = sanitized.replace(/^minus-/, '-');
    }

    // Handle decimal notation (e.g., "1-5" -> "1.5")
    sanitized = sanitized.replace(/(\d)-(\d)/g, '$1.$2');

    // Validate it's a valid number
    const num = Number(sanitized);
    if (isNaN(num) || !isFinite(num)) {
        return '0';
    }

    return sanitized;
}

/**
 * Deep sanitizes an object by recursively sanitizing all string properties.
 * Useful for API responses or database entries.
 */
export function deepSanitizeObject<T extends Record<string, any>>(
    obj: T,
    maxDepth = 10
): T {
    if (maxDepth <= 0) return obj;

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        const value = obj[key];

        if (typeof value === 'string') {
            // Sanitize strings based on key name
            if (key.includes('formula') || key.includes('equation')) {
                sanitized[key] = sanitizeMathFormula(value);
            } else if (key.includes('slug')) {
                sanitized[key] = sanitizeSlug(value);
            } else if (key === 'limitTo' || key === 'to') {
                sanitized[key] = sanitizeLimitValue(value);
            } else {
                // Default: escape HTML but preserve content
                sanitized[key] = escapeHtml(value);
            }
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = deepSanitizeObject(value, maxDepth - 1);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Rate limiting key generator (for IP-based rate limiting).
 * Creates a safe, consistent key from IP address.
 */
export function sanitizeRateLimitKey(ip: string): string {
    if (!ip || typeof ip !== 'string') return 'unknown';

    // Remove any non-IP characters
    const cleaned = ip.replace(/[^\d\.\:a-fA-F]/g, '');

    // Hash the IP for privacy (optional, but recommended)
    // For now, just return the cleaned IP
    return cleaned.substring(0, 45); // Max IPv6 length
}
