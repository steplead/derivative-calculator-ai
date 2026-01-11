-- Security Tables for Derivative Calculator AI
-- Run this in Cloudflare D1 Console to create the security tables
-- Command: wrangler d1 execute problems-db --file=scripts/security_tables.sql

-- ============================================
-- IP Blacklist Table
-- Stores temporarily blocked IPs
-- ============================================
CREATE TABLE IF NOT EXISTS ip_blacklist (
    ip TEXT PRIMARY KEY,
    blocked_until INTEGER NOT NULL,       -- Unix timestamp when block expires
    reason TEXT NOT NULL,                 -- Reason for blocking
    offense_count INTEGER NOT NULL,       -- Number of offenses (for escalating penalties)
    created_at INTEGER NOT NULL           -- When first blocked
);

-- Index for performance (lookups by expiration time)
CREATE INDEX IF NOT EXISTS idx_ip_blacklist_expiration ON ip_blacklist(blocked_until);

-- Index for cleanup (delete expired blocks)
CREATE INDEX IF NOT EXISTS idx_ip_blacklist_created ON ip_blacklist(created_at);


-- ============================================
-- Abuse Scores Table
-- Tracks abuse scores for each IP
-- ============================================
CREATE TABLE IF NOT EXISTS abuse_scores (
    ip TEXT PRIMARY KEY,
    score INTEGER NOT NULL DEFAULT 0,     -- Current abuse score
    last_updated INTEGER NOT NULL         -- Unix timestamp of last update
);

-- Index for cleanup (old/decayed scores)
CREATE INDEX IF NOT EXISTS idx_abuse_scores_updated ON abuse_scores(last_updated);


-- ============================================
-- Rate Limits Table (already exists, but included for reference)
-- Tracks request counts per IP for rate limiting
-- ============================================
-- CREATE TABLE IF NOT EXISTS rate_limits (
--     ip TEXT PRIMARY KEY,
--     count INTEGER NOT NULL DEFAULT 1,
--     reset_time INTEGER NOT NULL,
--     created_at INTEGER DEFAULT (strftime('%s', 'now'))
-- );

-- CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_time);


-- ============================================
-- Cleanup Queries (run periodically)
-- ============================================

-- Remove expired IP blocks
-- DELETE FROM ip_blacklist WHERE blocked_until < strftime('%s', 'now');

-- Remove old abuse scores (older than 7 days)
-- DELETE FROM abuse_scores WHERE last_updated < strftime('%s', 'now') - 604800;

-- Remove old rate limit entries (older than 1 day)
-- DELETE FROM rate_limits WHERE reset_time < strftime('%s', 'now') - 86400;


-- ============================================
-- Monitoring Queries (for analytics)
-- ============================================

-- Count currently blocked IPs
-- SELECT COUNT(*) as blocked_count FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now');

-- Count high-risk IPs (abuse score > 50)
-- SELECT COUNT(*) as high_risk_count FROM abuse_scores WHERE score > 50;

-- Top 10 most abusive IPs
-- SELECT ip, score FROM abuse_scores ORDER BY score DESC LIMIT 10;

-- Recent blocks
-- SELECT ip, reason, blocked_until, offense_count FROM ip_blacklist WHERE blocked_until > strftime('%s', 'now') ORDER BY blocked_until DESC LIMIT 20;
