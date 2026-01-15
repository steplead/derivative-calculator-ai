-- Global Counters Table for Quota Management
-- Run this in Cloudflare D1 Console to create the counters table
-- Command: wrangler d1 execute problems-db --local --file=scripts/add_global_counters.sql
-- Then: wrangler d1 execute problems-db --file=scripts/add_global_counters.sql

-- ============================================
-- Global Counters Table
-- Tracks hourly and daily request counts for quota management
-- ============================================
CREATE TABLE IF NOT EXISTS counters (
    key TEXT PRIMARY KEY,                  -- Format: "global:hour:{timestamp}" or "global:day:{timestamp}"
    value INTEGER NOT NULL DEFAULT 1,      -- Counter value
    last_updated INTEGER NOT NULL          -- Unix timestamp of last update
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_counters_key ON counters(key);
CREATE INDEX IF NOT EXISTS idx_counters_updated ON counters(last_updated);

-- ============================================
-- Cleanup Query (run periodically)
-- ============================================

-- Remove old counters (older than 2 days)
-- DELETE FROM counters WHERE last_updated < strftime('%s', 'now') - 172800;

-- ============================================
-- Monitoring Queries
-- ============================================

-- Current hour requests
-- SELECT value FROM counters WHERE key = 'global:hour:' || (strftime('%s', 'now') / 3600);

-- Current day requests
-- SELECT value FROM counters WHERE key = 'global:day:' || (strftime('%s', 'now') / 86400);

-- Total requests in last 24 hours
-- SELECT SUM(value) as total FROM counters WHERE key LIKE 'global:hour:%' AND last_updated > strftime('%s', 'now') - 86400;
