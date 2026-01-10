-- Rate Limiting Table for D1 Database
-- Run this in Cloudflare D1 Console

CREATE TABLE IF NOT EXISTS rate_limits (
    ip TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    reset_time INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_time);

-- Optional: Clean up old entries
-- DELETE FROM rate_limits WHERE reset_time < strftime('%s', 'now') - 86400;
