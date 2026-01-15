/**
 * Admin Authentication Utility
 * 
 * Protects sensitive admin endpoints from unauthorized access
 */

import { getClientIp } from './security';

/**
 * Check if request is from an authorized admin
 * 
 * Supports two methods:
 * 1. API Key authentication (via X-Admin-API-Key header)
 * 2. IP whitelist (via ADMIN_IPS environment variable)
 */
export function isAdminRequest(headers: Headers): boolean {
    // Method 1: Check API Key
    const apiKey = headers.get('x-admin-api-key');
    const validKey = process.env.ADMIN_API_KEY;
    
    if (apiKey && validKey && apiKey === validKey) {
        return true;
    }
    
    // Method 2: Check IP whitelist
    const ip = getClientIp(headers);
    const adminIps = (process.env.ADMIN_IPS || '').split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    
    if (adminIps.length > 0 && adminIps.includes(ip)) {
        return true;
    }
    
    // Method 3: Check if in production (disable admin endpoints in production if no auth configured)
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !validKey && adminIps.length === 0) {
        // No admin auth configured in production - deny access
        return false;
    }
    
    // Development mode: allow localhost
    if (!isProduction && (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost')) {
        return true;
    }
    
    return false;
}
