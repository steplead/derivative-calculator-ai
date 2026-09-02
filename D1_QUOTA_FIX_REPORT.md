# D1 Quota Hotfix Report — `ORDER BY RANDOM()` full table scan

**Date:** 2026-08-10
**Database:** `problems-db` (`83d5e571-4a16-4255-ab9a-5f8a95b11b6b`)
**Binding:** `DB` on Cloudflare Pages project `derivative-calculator-ai`
**Incident:** D1 `rows_read` overage — bad query executed **1,700+ times / 24h**, reading **~8M rows** against a **5M rows/day** free-tier limit.

---

## 1. Search results — every candidate, and the verdict

Searched the whole repo for `ORDER BY RAND`, `ORDER BY RANDOM`, `RANDOM()`, `SELECT * FROM problems`, `slug !=`, `related problem`, `random problem`, plus a full sweep of every `db.prepare(` call site.

| # | Location | Code | D1 cost | Verdict |
|---|----------|------|---------|---------|
| 1 | **`app/[slug]/page.tsx:346`** | `SELECT * FROM problems WHERE slug != ? ORDER BY RANDOM() LIMIT 10` | **3,137 rows_read / page view** | 🔴 **THE CULPRIT — removed** |
| 2 | `app/[slug]/page.tsx` (parallel fetch) | `fetch('/api/problems?limit=50')` → `SELECT * FROM problems ORDER BY id LIMIT 50` | 50 rows_read / page view | 🟠 Secondary waste — **removed** |
| 3 | `app/[slug]/page.tsx:247, 380` | `SELECT * FROM problems WHERE slug = ?` | 1 row each (indexed) | ✅ fine |
| 4 | `app/api/problem/[slug]/route.ts:21` | `SELECT * FROM problems WHERE slug = ?` | 1 row (indexed) | ✅ fine |
| 5 | `app/api/problems/route.ts:22` | `SELECT * FROM problems ... ORDER BY id LIMIT ≤100` | ≤100 rows (rowid-ordered, early exit) | 🟡 bounded; extra composite index added |
| 6 | `app/wiki/[slug]/page.tsx:169` | `.filter(t => t.slug !== slug).sort(() => 0.5 - Math.random())` | **0 D1 rows** — pure in-memory JS on `wiki.json` | ✅ no D1 cost |
| 7 | `components/Footer.tsx:24-25` | `.sort(() => 0.5 - Math.random())` | **0 D1 rows** — in-memory | ✅ no D1 cost |
| 8 | `components/DynamicRecommendations.tsx:41`, `SmartRecommendations.tsx:44` | `Math.random()` shuffle | **0 D1 rows** — in-memory | ✅ no D1 cost |
| 9 | `app/[slug]/page.tsx:34-46` (`pickStableRelated`) | `.filter(p => p.slug !== currentSlug)` | **0 D1 rows** — in-memory | ✅ no D1 cost |
| 10 | `utils/ratelimit-d1.ts`, `utils/security.ts` | `SELECT/UPDATE ... WHERE ip = ?` | indexed (PK); **no explicit index existed** | 🟡 index added |

**Only two code paths actually billed D1 rows for "related problems", and both are gone.**

---

## 2. Which file contained the bad query

**`app/[slug]/page.tsx`** — inside the page component's `Promise.allSettled([...])` block (line ~346 before the fix).

```tsx
// D1 related problems query
(async () => {
    try {
        if (db) {
            const { results } = await db.prepare(
                "SELECT * FROM problems WHERE slug != ? ORDER BY RANDOM() LIMIT 10"
            ).bind(slug).all();
            return Array.isArray(results) ? results : [];
        }
    } catch (e) { return []; }
})()
```

It ran on **every single `/[slug]` page render** — which is the dominant route on the site (3,137 problem pages). It was also redundant: the same block already fetched `/problems.json` (force-cached, zero D1 cost) and `pickStableRelated()` produced a *better*, deterministic related set from it, so the D1 result was only ever a third-tier fallback.

---

## 3. What replaced it

New module: **`lib/d1/related-problems.ts`** (extracted so it is unit-testable without booting the Cloudflare runtime).

```sql
-- forward pass
SELECT slug, formula, title, type, difficulty
  FROM problems WHERE slug >  ? ORDER BY slug      LIMIT ?

-- wrap-around pass, only if the forward pass returned < limit rows
SELECT slug, formula, title, type, difficulty
  FROM problems WHERE slug <= ? ORDER BY slug DESC LIMIT ?
```

Selection precedence after the fix (all deterministic, all cheap):

1. `/problems.json` static JSON — **0 D1 rows** (primary, `force-cache` + `revalidate: 3600`)
2. `fetchRelatedFromD1()` index range-seek — **≤ 20 rows** (fallback only if static fails)
3. *(removed)* ~~`/api/problems?limit=50`~~ — was 50 rows/view

Related Problems still renders on the page. Nothing was disabled.

### Verified query plans (SQLite EXPLAIN, 3,137-row table)

```
NEW forward   →  SEARCH problems USING INDEX idx_problems_slug (slug>?)
NEW backward  →  SEARCH problems USING INDEX idx_problems_slug (slug<?)
OLD (removed) →  SCAN problems
                 USE TEMP B-TREE FOR ORDER BY          ← the killer
```

---

## 4. Why this reduces `rows_read`

| Factor | Old query | New query |
|---|---|---|
| Predicate | `slug != ?` — **not a range constraint**, so SQLite cannot seek into the index | `slug > ?` / `slug <= ?` — **B-tree range seek**, jumps straight to the start position |
| Ordering | `ORDER BY RANDOM()` — a *non-indexable* function; SQLite must read **every row**, materialise it, and sort in a temp B-tree before `LIMIT` can even be applied | `ORDER BY slug` / `slug DESC` — **satisfied by the index itself**, zero sort step, `LIMIT` short-circuits the scan |
| Columns | `SELECT *` — pulls `description`, `tags`, `views`, ... | 5 named columns only |
| Rows touched | **3,137** (the whole table) | **≤ 10** typical, **≤ 20** worst case |
| Determinism | random on every render → hydration mismatch + unstable internal links for crawlers | deterministic neighbours → stable SSR, stable internal linking |

### Per-page-view budget for `/[slug]`

| Query | Before | After |
|---|---:|---:|
| `SELECT * ... WHERE slug = ?` (generateMetadata) | 1 | 1 |
| `SELECT * ... WHERE slug = ?` (page body, D1) | 1 | 1 |
| `SELECT * ... WHERE slug != ? ORDER BY RANDOM() LIMIT 10` | **3,137** | **0** (removed) |
| `/api/problems?limit=50` self-fetch | **50** | **0** (removed) |
| `/api/problem/[slug]` self-fetch | 1 | 1 |
| D1 related fallback (only if static JSON fails) | — | 0–20 (0 in practice) |
| **Total rows_read per view** | **3,190** | **3** |

**≈ 1,060× reduction.** At 1,700 views/day: **5.42M → ~5.1K rows/day** (0.1 % of the free tier).
(The 8M figure Cloudflare reported is consistent with ~2,500 page views/24h once the 50-row fetch and middleware reads are included.)

---

## 5. Indexes — `scripts/ensure_d1_indexes.sql`

All statements are `CREATE INDEX IF NOT EXISTS` (idempotent, safe to re-run).

| Required index | Status before | Statement |
|---|---|---|
| `problems.slug` | implicit only (`UNIQUE` → `sqlite_autoindex_problems_1`) | ✅ `idx_problems_slug` created explicitly |
| `rate_limits.ip` | ❌ **missing** (only `reset_time` was indexed) — middleware hits `WHERE ip = ?` on every request | ✅ `idx_rate_limits_ip` |
| `counters.key` | already in `add_global_counters.sql` | ✅ re-asserted |
| `path_stats.path` | already in `create_path_stats_table.sql` | ✅ re-asserted |
| bonus | `rate_limits(reset_time)`, `path_stats(timestamp)` | ✅ re-asserted |
| bonus | `/api/problems?type=… ORDER BY id LIMIT n` sorted the whole type slice | ✅ `idx_problems_type_id ON problems(type, id)` → verified `SEARCH problems USING INDEX idx_problems_type_id (type=?)` |

**Validated locally** against a 3,137-row replica: 7/7 statements apply cleanly under wrangler-style parsing (comment-stripped, `;`-split), and all 4 required indexes are present afterwards.

### ⚠️ NOT YET APPLIED TO PRODUCTION

`npx wrangler whoami` → **Not logged in** (auth token fetch returned 400). I could not run it for you. Execute:

```bash
npx wrangler login
npx wrangler d1 execute problems-db --remote --file=scripts/ensure_d1_indexes.sql

# verify
npx wrangler d1 execute problems-db --remote --command \
  "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND tbl_name IN ('problems','rate_limits','counters','path_stats') ORDER BY tbl_name, name"
```

Expected rows include `idx_problems_slug`, `idx_rate_limits_ip`, `idx_counters_key`, `idx_path_stats_path`.

**Note:** the code fix reduces `rows_read` by ~1,060× even *without* the new indexes (the UNIQUE constraint already gives a slug index). The indexes make it explicit and fix the un-indexed `rate_limits.ip` middleware path.

---

## 6. Regression guard — `__tests__/d1-quota.test.ts` (9 tests, new)

Fails the build if anyone reintroduces the incident:

* source scan: no `ORDER BY RANDOM`/`RAND`, no `slug != ? … ORDER BY RANDOM`, no `/api/problems?limit=`, no `Math.random()` sort (comments stripped first so documentation can't trip it)
* runtime: emitted SQL must contain `WHERE slug > ?` or `WHERE slug <= ?`, `LIMIT ?`, no `RANDOM`, no `SELECT *`
* runtime: **rows_read ≤ 2 × limit even on a 3,137-row table**
* runtime: stops after one query when the forward seek fills the limit
* runtime: deterministic — same slug ⇒ identical rows in identical order

---

## 7. Verification gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | ✅ clean |
| `npm run lint` | ✅ 0 errors (pre-existing `no-console` warnings only) |
| `npx jest` | ✅ **96 / 96 passed** (7 suites; was 87 before this fix) |
| `npm run build` | ✅ success |
| `npm run pages:build` | ✅ success (`_worker.js` generated) |

---

## 8. Changed files

| File | Change |
|---|---|
| `app/[slug]/page.tsx` | Removed the `ORDER BY RANDOM()` D1 query; removed the `/api/problems?limit=50` self-fetch; D1 fallback now calls `fetchRelatedFromD1()` |
| `lib/d1/related-problems.ts` | **new** — indexed, deterministic, testable related-problem lookup |
| `__tests__/d1-quota.test.ts` | **new** — 9 regression tests |
| `scripts/ensure_d1_indexes.sql` | **new** — idempotent index DDL |

No sitemap, no robots, no new pages, no new production dependencies.
