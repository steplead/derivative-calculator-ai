-- ============================================================================
-- D1 Quota Hotfix - mandatory indexes
-- Database : problems-db  (id: 83d5e571-4a16-4255-ab9a-5f8a95b11b6b)
-- Purpose  : guarantee every hot-path query in the app is an index lookup,
--            never a table scan. All statements are idempotent (IF NOT EXISTS).
--
-- Apply (requires `npx wrangler login` first):
--   npx wrangler d1 execute problems-db --remote --file=scripts/ensure_d1_indexes.sql
--
-- Verify:
--   npx wrangler d1 execute problems-db --remote --command "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND tbl_name IN ('problems','rate_limits','counters','path_stats') ORDER BY tbl_name, name"
--
-- NOTE: this file intentionally contains no semicolons inside comments, so
--       wrangler's statement splitter cannot mis-parse it.
-- ============================================================================

-- 1. problems.slug -----------------------------------------------------------
--    Hot path (runs on every /[slug] page render):
--      SELECT *                FROM problems WHERE slug = ?          (metadata)
--      SELECT *                FROM problems WHERE slug = ?          (page body)
--      SELECT slug, formula, title, type, difficulty FROM problems
--                             WHERE slug  > ? ORDER BY slug      LIMIT 10
--      SELECT slug, formula, title, type, difficulty FROM problems
--                             WHERE slug <= ? ORDER BY slug DESC LIMIT 10
--    The UNIQUE constraint already implies an index, but we create an explicit
--    one so the planner (and anyone reading the schema) can rely on it.
CREATE INDEX IF NOT EXISTS idx_problems_slug ON problems(slug);

-- 2. rate_limits.ip ----------------------------------------------------------
--    Hot path (middleware, EVERY request):
--      SELECT * FROM rate_limits WHERE ip = ?
--      UPDATE rate_limits SET count = count + 1 WHERE ip = ?
--      INSERT OR REPLACE INTO rate_limits (ip, count, reset_time) VALUES (?, 1, ?)
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip);

-- 3. counters.key ------------------------------------------------------------
--    Hot path (global hourly / daily counters):
--      SELECT value FROM counters WHERE key = ?
--      INSERT OR REPLACE INTO counters (key, value, last_updated) VALUES (?, ?, ?)
CREATE INDEX IF NOT EXISTS idx_counters_key ON counters(key);

-- 4. path_stats.path ---------------------------------------------------------
--    Hot path (per-request path tracking + admin traffic analysis):
--      INSERT OR REPLACE INTO path_stats (...) WHERE path = ? AND timestamp = ?
CREATE INDEX IF NOT EXISTS idx_path_stats_path ON path_stats(path);

-- Companion indexes the same hot paths rely on:
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_time);
CREATE INDEX IF NOT EXISTS idx_path_stats_timestamp ON path_stats(timestamp);

-- Public endpoint /api/problems issues "... WHERE type = ? ORDER BY id LIMIT ?".
-- Without a composite index SQLite must read every row of that type and sort,
-- even though only LIMIT rows are returned. This index lets it seek on type and
-- then walk ids in order, so rows_read is bounded by LIMIT.
CREATE INDEX IF NOT EXISTS idx_problems_type_id ON problems(type, id);
