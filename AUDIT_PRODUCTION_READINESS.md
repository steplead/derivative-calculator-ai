# Production-Readiness Audit — derivative-calculator-ai

**Date:** 2026-09-02 (UTC+8)
**Scope:** 10 categories (per audit brief) + 10 must-verify items
**Mode:** READ-ONLY audit. No code changes in this pass.
**Code state reviewed:** `main` @ `c271648` (RC-8 deployed + indexes applied)

---

## 1. Executive summary

The two bleeding incidents from the prior phase are **closed and verified in production**:

- **D1 over-quota** (`ORDER BY RANDOM()` full-table scan) — removed; 7 indexes applied to prod.
- **SSR wrong formulas** (force-cache fetch never returned data → slug fallback) — fixed; library is now the sole primary source.

A fresh read of the code + live production sampling surfaced **two residual risks the RC-8 fix did not touch**:

1. **P1 — per-request D1 writes in the security/analytics layer.** `middleware.ts` → `performSecurityCheck` + `trackPath` issue ~3 D1 reads + ~4 D1 writes **on every cache-miss page request**. The free tier caps writes at 50k/day, so moderate SEO traffic (cached 2h/TTL) can exhaust the write quota and start returning 500s — exactly the failure class we just patched on the read side.
2. **P1 — CDN deploy staleness.** `middleware.ts` sets `Cache-Control: public, s-maxage=7200` on every page, so a new deploy is invisible at any PoP for up to 2h. Verified live: LAX served a pre-deploy `1x` page at `Age 2099` (cached at deploy instant 11:01:13 UTC) while AMS already served the correct `1/x`. **This needs a manual CF Dashboard → Purge Everything** (no purge credential exists on disk or in the wrangler grant).

No P0 issues are open. Severity tally: **P0: 0 · P1: 4 · P2: 5 · P3: 6**.

---

## 2. Live evidence (production, origin / cache-buster, today)

Production verification sample from the audit brief, fetched at origin so we prove what the
deployed code renders, not a stale edge copy.

| URL | http | `<h1>` formula | SSR answer | note |
|---|---|---|---|---|
| `/derivative-of-1-x` | 200 | `Derivative of 1/x` | `-x^(-2)` | ✅ correct |
| `/derivative-of-acosx-minus-over-minus-2` | 200 | `Derivative of acos(x/2)` | `(-1/2)*sqrt((-1/4)*x^2…)` | ✅ correct (unsimplified) |
| `/derivative-of-x` | 200 | `Derivative of x` | `1` | ✅ |
| `/derivative-of-x-squared` | 200 | `Derivative of x^2` | `2*x` | ✅ |
| `/derivative-of-ln-x` | 200 | `Derivative of ln(x)` | `x^(-1)` | ✅ `ln→log` normalized, correct |
| `/derivative-of-abs-x` | 200 | `Derivative of Abs(x)` | `abs(x)^(-1)*x` (= `x/\|x\|`) | ✅ correct (sign form) |
| `/qqqzzz999` (invalid) | **404** | — | — | ✅ soft-404 fixed |
| `/problems` | 200 | — | 2,306 real links | ✅ |
| `/problems/derivative` | 200 | — | 1,084 real links (0 integral/limit leak) | ✅ |
| `/directory` | 200 | — | 2,306 real links | ✅ |

**API reliability (D1-backed):**

| Endpoint | result |
|---|---|
| `/api/problem/derivative-of-1-x` | **500** (`D1_ERROR: exceeded free tier daily row read limit`) |
| `/api/problems?limit=3&type=derivative` | **500** (same) |

The page still renders correctly because it does **not** depend on these APIs for library slugs — this is the decisive proof that the SSR path is D1-independent. But the public API surface is currently broken under quota (P1).

**Source scan (repo, excluding node_modules/venv/chrome-extension):**
- `ORDER BY RANDOM` / `ORDER BY RAND` — **0 live executions**. Only in test files (guards) and doc comments of `lib/d1/related-problems.ts`.
- `slug !=` — **0 live executions**. Only in comments/tests.
- `cache: 'force-cache'` / `next: { revalidate }` on a fetch — **0 live fetches**. Only in comments/tests.
- `SELECT * FROM problems` — **2 live**: `app/api/problems/route.ts:22` and `app/api/problem/[slug]/route.ts:21` (single-row or bounded, not full scans).

---

## 3. Category findings

### 3.1 D1 / database cost audit — **P1 (residual)**
- ✅ RANDOM() scan removed; `lib/d1/related-problems.ts` uses indexed `WHERE slug > ? ORDER BY slug LIMIT ?` + wrap-around.
- ⚠️ **Per-request D1 writes in middleware** (`utils/security.ts` `_checkGlobalQuota` 2 writes, `_checkD1RateLimit` 1 write; `utils/path-tracker.ts` `trackPath` 1 write). ~4 writes/request. Free tier = 50k writes/day → exceeded at moderate traffic. **This is the next quota cliff.**
- ⚠️ `app/api/problems/route.ts:22` `SELECT *` + `:32` `tags LIKE '%x%'` (non-indexable full scan) — only fires on `/problems/tag/[tag]`, which is out of sitemap, but still a cost sink.
- Indexes applied: `idx_problems_slug`, `idx_rate_limits_ip`, `idx_counters_key`, `idx_path_stats_path`, `idx_rate_limits_reset`, `idx_path_stats_timestamp`, `idx_problems_type_id` (7, idempotent, `success: true` in prod).

### 3.2 SSR correctness audit — **PASS (P0 closed)**
- `app/[slug]/page.tsx`: library (`findStaticProblem`) consulted first (line 232); D1/API only for slugs outside the library (line 243+); `parseSlugToMath` only as final fallback (line 284); `notFound()` on miss (line 288). Live sample confirms correct formulas.

### 3.3 Data source consistency audit — **PASS**
- `generateMetadata` (line 123) and page body (line 232) both call `findStaticProblem(await loadStaticProblemsSafe(), slug)` first. `<title>` and `<h1>` cannot disagree (verified: both `Derivative of 1/x`).

### 3.4 SEO page validity audit — **P2**
- ✅ `/problems`, `/problems/derivative` render 1,084–2,306 real links in prod.
- ⚠️ `sitemap.xml` is now 9,483 `<loc>` (generated at build from `problems.json`) — much improved vs the old 9-URL sitemap. But type categorization rests on a fragile assumption (see 3.5/3.7).

### 3.5 404 / soft-404 audit — **PASS (P0 closed)**
- Invalid slugs (`/qqqzzz999`, `/asdfgh`, `/not-a-math-page-xyz`) return **404** in prod.
- `catch` block re-throws `NEXT_NOT_FOUND` (line 453) so soft-404s cannot become 200.

### 3.6 Math engine correctness audit — **PASS (with P3 note)**
- `lib/math/math-core.ts` `validateDerivativeResult` rejects echoed `diff(...)`, bare multi-letter tokens (`ln`, `Abs`), and `=` equations; page sets `ssrSolution=null` when `!isValid`. So invalid results never publish.
- Live: `ln(x)→1/x`, `abs(x)→x/|x|` (correct sign form), `acos(x/2)` correct.
- P3: validation is regex-heuristic; a well-formed-but-wrong nerdamer output is not caught. No live false-positive observed.

### 3.7 Cloudflare Pages / next-on-pages compatibility audit — **P1**
- ✅ No `force-cache` / `next:{revalidate}` fetch remains.
- ⚠️ `export const revalidate = 3600` on `app/[slug]/page.tsx` (and integral/limit/ode/directory/page) — segment-level ISR config. The page is effectively dynamic (`headers()`, `getRequestContext()`), so this is a no-op but should be confirmed/removed for clarity (P3).
- ⚠️ **CDN `s-maxage=7200`** (middleware lines 148, 156) → every deploy stale up to 2h per PoP. P1 operational risk (Googlebot may index wrong formula during the window). Fix = Purge Everything after each deploy, or lower `s-maxage`.

### 3.8 API reliability audit — **P1**
- `/api/problem`, `/api/problems` return 500 under D1 quota. Pages are resilient (library source), but the public API contract is broken whenever quota is hit. `SELECT *` on both routes should become explicit columns.

### 3.9 Bot / rate-limit abuse audit — **P2**
- ✅ UA blacklist (middleware + `security.ts`) blocks scripted clients (curl/python/wget/go-http/scrapy/httpx) while preserving Googlebot/Bingbot. API referer check prevents hotlinking. Rate limit 30/min pages, 20/min API, fail-open on D1 error.
- ⚠️ The same security path is what writes to D1 every request (see 3.1). Abuse protection and quota cost are coupled — fixing 3.1 helps both.

### 3.10 Deployment and rollback safety audit — **PASS (P3 note)**
- ✅ No `vercel.json` (would break CF Pages deploy). CI: `.github/workflows/deploy.yml` → `wrangler pages deploy`. Rollback = redeploy prior commit.
- ⚠️ D1 indexes applied manually via `scripts/ensure_d1_indexes.sql` (not in CI) — a fresh DB restore would lack them until re-run. P3.

---

## 4. Consolidated issue list

### P0 (production-breaking / publishes wrong answers)
- **None open.**

### P1 (quota / cost / reliability risk — fix next)
- **P1-1** Per-request D1 writes in `middleware.ts`→`utils/security.ts` (`_checkGlobalQuota`, `_checkD1RateLimit`) + `utils/path-tracker.ts` (`trackPath`). ~4 writes/req will exceed the 50k/day free write cap. *Files:* `middleware.ts`, `utils/security.ts`, `utils/path-tracker.ts`. *Fix:* make analytics/quota writes fire-and-forget + off the request path (or move to CF Analytics/Workers Analytics); keep rate-limit reads indexed (already are).
- **P1-2** `/api/problems` + `/api/problem/[slug]` return 500 under quota; `SELECT *` on both. *Files:* `app/api/problems/route.ts`, `app/api/problem/[slug]/route.ts`. *Fix:* explicit columns; `/api/problems` drop `tags LIKE '%x%'` or add a `tags` index; consider reading from `problems.json` instead of D1.
- **P1-3** CDN `s-maxage=7200` causes deploy-time staleness (LAX served pre-deploy `1x` at Age 2099). *File:* `middleware.ts` (148, 156). *Fix:* Purge Everything after each deploy (manual, no credential) **or** lower `s-maxage` / add a Cache Rule. **Action required now: CF Dashboard → Caching → Configuration → Purge Everything.**
- **P1-4** `app/api/problems/route.ts:32` `tags LIKE '%x%'` non-indexable full scan on `/problems/tag/[tag]`. *Fix:* add `idx_problems_tags` or read tags from `problems.json`.

### P2 (SEO / indexing / UX)
- **P2-1** `sitemap.xml` type categorization relies on `problems.json` `type` being present for all rows; 1,073/3,137 rows have `type=null` (works today only because untyped rows coincide with `derivative-of-` slugs — fragile). *File:* `lib/problems-source.ts` `filterByType`, `public/problems.json`. *Fix:* backfill `type` in the `problems.json` export from slug prefix.
- **P2-2** `/problems/tag/[tag]` and `/practice/[level]` still depend on D1 (`tags`/`difficulty` absent from `problems.json`); out of sitemap, but cost + fragility. *Fix:* add fields to `problems.json` or `noindex`.
- **P2-3** Math engine validation is regex-heuristic (3.6 P3 note elevated if any wrong-but-well-formed output is found later).
- **P2-4** `/api/problems` `OFFSET ?` deep-pagination scans offset+limit rows (bounded by usage, but unbounded under crawler pagination).
- **P2-5** No `noindex` on the thin `/problems/tag/[tag]` / `/practice/[level]` routes (if kept, should be indexed intentionally; if not, noindex).

### P3 (cleanup / maintainability)
- **P3-1** `export const revalidate = 3600` on dynamic pages is a no-op; remove for clarity.
- **P3-2** `lib/d1/related-problems.ts` `fetchRelatedFromD1` is now only used in the library-miss fallback path; dead for the 3,137 library slugs. Keep (correct + tested) but note.
- **P3-3** D1 indexes not applied in CI (manual `ensure_d1_indexes.sql`).
- **P3-4** `problems.json` missing `type`/`difficulty`/`tags` for most rows — source-of-truth mismatch vs D1.
- **P3-5** `app/api/problem/[slug]/route.ts` `SELECT *` → explicit columns (cheap, do with P1-2).
- **P3-6** RC-9 (from prior phase, not yet fixed): `components/Footer.tsx` + `app/wiki/[slug]/page.tsx` shuffle internal links with `Math.random()` per request — non-deterministic internal-link surface hurts crawl efficiency.

---

## 5. Exact files involved

| File | Role in findings |
|---|---|
| `middleware.ts` | P1-1 (writes via security), P1-3 (s-maxage), UA/referer checks (P2 pass) |
| `utils/security.ts` | P1-1 (`_checkGlobalQuota`, `_checkD1RateLimit` D1 writes/reads) |
| `utils/path-tracker.ts` | P1-1 (`trackPath` D1 write/request) |
| `app/api/problems/route.ts` | P1-2 (`SELECT *`), P1-4 (`tags LIKE`), P2-4 (OFFSET) |
| `app/api/problem/[slug]/route.ts` | P1-2 (`SELECT *`, 500 under quota) |
| `app/[slug]/page.tsx` | P0 closed; P3-1 (`revalidate`) |
| `lib/problems-source.ts` | P2-1 `filterByType` fragility |
| `lib/d1/related-problems.ts` | RANDOM() removed (P0 closed); P3-2 |
| `lib/math/math-core.ts` | 3.6 math validation (pass) |
| `public/problems.json` | P2-1/P2-2/P3-4 missing `type`/`difficulty`/`tags` |
| `scripts/ensure_d1_indexes.sql` | P3-3 not in CI |
| `components/Footer.tsx`, `app/wiki/[slug]/page.tsx` | P3-6 RC-9 |

---

## 6. Recommended fix order

1. **P1-3 (now, manual):** CF Dashboard → Purge Everything. Zero code, removes the Googlebot wrong-formula window immediately.
2. **P1-1:** Decouple analytics/quota writes from the request path (fire-and-forget + Workers Analytics). Highest quota-leak risk after the read fix.
3. **P1-2 + P3-5:** Explicit columns in both API routes; `/api/problems` reads from `problems.json` (or add `idx_problems_tags`) to drop `tags LIKE`.
4. **P1-4 / P2-2:** `/problems/tag`, `/practice` → `noindex` or backfill fields into `problems.json`.
5. **P2-1:** Backfill `type` into `problems.json` export from slug prefix (removes categorization fragility).
6. **P3:** `revalidate` removal, CI index apply, RC-9 deterministic links.

---

## 7. Fix now vs later

**Fix now (this sprint):** P1-3 (purge, manual), P1-1 (write decoupling), P1-2 (API `SELECT *` + quota resilience).
**Fix later (next audit window):** P2-1/P2-2 (data backfill), P3 series, RC-9.

---

## 8. Verification artifacts
- `scripts/verify_rc8_production.py` — 20-check deploy verifier (16 origin + 4 CDN, PoP-aware).
- `scripts/audit_sample_check.py` — 10-URL production sample (this audit), origin channel.
- `audit-output/derivative-seo-v2-phase1-fix/RC8_PRODUCTION_VERIFICATION.json` — last RC-8 run (17/20; 3 CDN fails = LAX staleness, now covered by P1-3).
