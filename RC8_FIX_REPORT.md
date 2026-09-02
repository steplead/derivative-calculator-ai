# RC-8 Production Fix Report — Wrong Formulas Rendered on 3,100 / 3,137 Pages

**Date:** 2026-09-02
**Commit:** `e9a3a9e` (pushed to `origin/main`; deployed to Cloudflare Pages)
**Severity:** P0 — the site was publishing mathematically wrong answers to Google
**Status:** Code fix **DEPLOYED and verified at origin**. CDN rollover incomplete (see §7).

---

## 1. Executive summary

Two independent incidents were in flight:

| # | Incident | Status |
|---|---|---|
| A | D1 `rows_read` overage from `ORDER BY RANDOM()` | Fixed in `144ef72`; indexes applied to production this session |
| B | **3,100 / 3,137 pages (98.82%) rendered a formula inconsistent with the authoritative dataset** | Fixed in `e9a3a9e`; verified at origin 16/16 |

B was the more damaging one: Google was being served pages whose `<h1>`, derivative
answer, and worked steps were derived from the URL slug, not from the problem library.
`/derivative-of-1-x` published **"Derivative of 1x"** (answer: `1`) when the library says
the problem is **1/x** (answer: `-1/x²`).

---

## 2. Exact root cause

On Cloudflare Pages with `@cloudflare/next-on-pages`, this fetch never returns data:

```ts
fetch(url, { cache: 'force-cache', next: { revalidate: 3600 } })
```

Mechanism (verified in `node_modules`):

1. Next.js only installs a fetch cache handler when the platform adapter supplies an
   `IncrementalCache`:
   `node_modules/next/dist/server/web/adapter.js` —
   `if (!globalThis.__incrementalCache && params.IncrementalCache) { … }`
2. `next-on-pages` does **not** supply one. `globalThis.__incrementalCache` is never set.
3. With `cache`/`next.revalidate` set, Next routes the request through the cache branch;
   with no handler the response body is never delivered.

Net effect in production:

* The **authoritative** `/problems.json` fetch (force-cache) returned nothing on every page.
* `/[slug]` silently fell through to `parseSlugToMath(slug)` and published a **slug-derived
  formula**.
* `/problems` and `/problems/[type]` rendered with **zero** problems.
* Meanwhile `generateMetadata` used a *plain* fetch, which works — so `<title>` said `1/x`
  while `<h1>` said `1x` on the very same response. That divergence is the proof.

### Evidence (production HTML, pre-fix)

| slug | library formula | `<title>` (plain fetch) | `<h1>` (force-cache page body) |
|---|---|---|---|
| `derivative-of-1-x` | `1/x` | **1/x** ✅ | **1x** ❌ |
| `derivative-of-acosx-minus-over-minus-2` | `acos(x/2)` | **acos(x/2)** ✅ | **acosx-/-2** ❌ |

Controlled A/B on the live site:

| Route | fetch style | result |
|---|---|---|
| `/directory` | plain `fetch` | **1,084 problem links** (4 MB) |
| `/problems` | `force-cache` + `revalidate` | **0 links** (27 KB) |
| `/problems/derivative` | `force-cache` + `revalidate` | **0 links** (27 KB) |

Blast radius (preflight over the whole library, `scripts/simulate_ssr_coverage.ts`):
**3,100 / 3,137 pages (98.82%)** rendered a formula inconsistent with `public/problems.json`.

---

## 3. Files changed

### New

| File | Purpose |
|---|---|
| `lib/problems-source.ts` | Single authoritative loader. Plain fetch only, memoised per isolate. Exports `loadStaticProblemsSafe`, `findStaticProblem`, `filterByType`, `pickStableRelated`. |
| `lib/slug-math.ts` | `parseSlugToMath()` extracted from the page so it is unit-testable. Now a **last-resort** fallback only. |
| `__tests__/rc8-production-source.test.ts` | 26 regression guards (task 7). |
| `__tests__/problems-source.test.ts` | 21 guards for RC-6 / RC-7 / RC-8b. |
| `scripts/verify_rc8_production.py` | Production verifier — origin pass + CDN pass. |
| `scripts/simulate_ssr_coverage.ts` | Whole-library preflight used to size the blast radius. |

### Modified

| File | Change |
|---|---|
| `app/[slug]/page.tsx` | Library is the **first and only** primary source. D1 / API / heuristic are fallbacks for slugs outside the library. `generateMetadata` uses the same source, so `<title>` and `<h1>` can never disagree. `SELECT *` → explicit columns. |
| `app/problems/page.tsx` | force-cache → shared loader. Type filtering now via shared `filterByType`. |
| `app/problems/[type]/page.tsx` | Same. |
| `app/directory/page.tsx` | Shared loader is now **primary** (was fallback after a dead force-cache fetch). |
| `app/page.tsx` | force-cache → shared loader. |
| `app/layout.tsx` | Removed `/api/problems?limit=100` — that was **100 D1 rows read on every page view of the entire site**. Footer now reads the memoised library. `wiki.json` force-cache → plain fetch. |
| `app/problems/tag/[tag]/page.tsx` | force-cache removed. |
| `app/practice/[level]/page.tsx` | force-cache removed; dropped the `difficulty=` param the API never implemented. |
| `lib/math/math-core.ts` | (from the earlier commit) `Abs(x)` and `floor(x)` defects fixed. |

---

## 4. Task-by-task status

| # | Task | Status |
|---|---|---|
| 1 | Remove `force-cache` / `next.revalidate` from all production problem-data fetches | **DONE** — zero occurrences remain in `app/`, `lib/`, `utils/`, `components/` (guarded by test) |
| 2 | One shared authoritative loader used everywhere | **DONE** — `lib/problems-source.ts` |
| 3 | No `parseSlugToMath()` fallback when the dataset contains the slug | **DONE** — library lookup precedes the heuristic in both the page body and `generateMetadata` (order asserted by test) |
| 4 | Unknown slugs → 404 | **DONE** — `parseSlugToMath` returns `null` for non-descriptive slugs → `notFound()` |
| 5 | `parseSlugToMath()` is a fallback, not a source | **DONE** |
| 6 | `over` binds tighter than `+/-` | **DONE** — `31-over-x2-plus-1` → `31/(x^2+1)`, was `31/x^2+1` |
| 7 | Regression tests | **DONE** — 26 new + existing; see §5 |
| 8 | typecheck / lint / jest / build / pages:build | **DONE** — all green, see §5 |
| 9 | Deploy | **DONE** — commit `e9a3a9e`, Pages deployment 10 min after push |
| 10 | Verify production HTML | **DONE** — 16/16 at origin, 4/4 CDN pending cache rollover (§7) |
| 11 | Report | This document |

---

## 5. Test / build gate

```
npx tsc --noEmit          clean
npx next lint             0 errors (warnings only, pre-existing)
npx jest                  152/152 passed, 9 suites
npm run build             OK
npm run pages:build       OK
```

Test suites touching this fix:

| Suite | Tests | Covers |
|---|---|---|
| `__tests__/rc8-production-source.test.ts` | 26 | No force-cache/revalidate anywhere; no `ORDER BY RANDOM()`/`RAND()`; no `Math.random` in the data path; real-library formula resolution; `/problems` + `/problems/derivative` link volume; 404 for random slugs; `over` grouping; `SELECT *` ban |
| `__tests__/problems-source.test.ts` | 21 | Loader contract, determinism, RC-7 soft-404 rejection |
| `__tests__/d1-quota.test.ts` | 9 | Index range seek, rows_read ≤ 2×limit, no RANDOM |

---

## 6. Before / after evidence

### 6.1 Page content (origin, cache-buster `?cb=`)

| URL | Before | After |
|---|---|---|
| `/derivative-of-1-x` | `<h1>Derivative of 1x</h1>`, answer `1` | `<h1>Derivative of 1/x</h1>`, answer `-x^(-2)` |
| `/derivative-of-acosx-minus-over-minus-2` | `<h1>Derivative of acosx-/-2</h1>`, **no Solution block** | `<h1>Derivative of acos(x/2)</h1>`, Solution block present |
| `/problems` | 0 problem links (27 KB) | **2,306** problem links (3.26 MB) |
| `/problems/derivative` | 0 problem links (27 KB) | **1,084** problem links (1.41 MB) |
| `/qqqzzz999` | HTTP 200 (hollow soft-404) | **HTTP 404** |
| `/asdfgh` | HTTP 200 | **HTTP 404** |

Raw artefacts:

* `audit-output/derivative-seo-v2-phase1-fix/RC8_BEFORE_EVIDENCE.json` — 8/16 passing, captured before deploy
* `audit-output/derivative-seo-v2-phase1-fix/RC8_PRODUCTION_VERIFICATION.json` — 16/20 (16/16 origin) after deploy
* `audit-output/derivative-seo-v2-phase1-fix/FORMULA_MISMATCH_INVENTORY.csv` — the 3,100 mismatched pages

### 6.2 D1 independence — the strongest proof

While D1 is **still over its daily quota** (`/api/problem/derivative-of-1-x` → HTTP 500
`D1_ERROR: … exceeded D1's free tier daily row read limit`), the pages render correctly:

```
GET /api/problem/derivative-of-1-x   -> 500  (D1 unavailable)
GET /derivative-of-1-x               -> 200  <h1>Derivative of 1/x</h1>
```

If the page still depended on D1 or on `/api/problem/*`, it would have fallen back to the
heuristic and rendered `1x`. It rendered `1/x`. **The render path no longer touches D1.**

---

## 7. D1 status

### Indexes — APPLIED

```
npx wrangler login
npx wrangler d1 execute problems-db --remote --file=scripts/ensure_d1_indexes.sql

🌀 Processed 7 queries.
🚣 Executed 7 queries in 13.46ms (14579 rows read, 7237 rows written)
   success: true
```

7 statements: `idx_problems_slug`, `idx_rate_limits_ip` (**was missing entirely**),
`idx_counters_key`, `idx_path_stats_path`, `idx_rate_limits_reset`,
`idx_path_stats_timestamp`, `idx_problems_type_id`.

Verification of the created indexes was blocked — the follow-up
`SELECT … FROM sqlite_master` query returned HTTP 7500 (daily row-read limit already
exceeded). The `success: true` on the DDL execution is the evidence available.

### rows_read — is it still increasing abnormally?

**No, on the page-render path. Confirmed by three independent facts:**

1. **Zero D1 reads for library slugs.** All 3,137 library pages now resolve from
   `/problems.json` and never open a D1 statement.
2. **The layout no longer reads 100 rows on every page view.** `app/layout.tsx` runs on
   *every* request on *every* route; it used to issue `/api/problems?limit=100`.
   Removed — this alone was the largest steady-state D1 consumer on the site.
3. **Pages render correctly while D1 is returning 500.** See §6.2.

| Path | rows_read before | rows_read after |
|---|---|---|
| `/[slug]` related problems | 3,137 (full scan + temp B-tree) | ≤ 20 (index range seek) |
| `/[slug]` self-fetch `/api/problems?limit=50` | 50 | 0 (removed) |
| **every** page view (layout footer) | **100** | **0** |
| `/[slug]` metadata D1 lookup | 1 (only for non-library slugs) | 0 for library slugs |

**Caveat — two routes still read D1.** `/problems/tag/[tag]` and `/practice/[level]` need
`tags` / `difficulty`, which exist only in D1 and are **absent from `/problems.json`**
(verified: 0 of 3,137 rows carry either field). Both are outside `sitemap.xml` and are not
linked from any other page except themselves. `/api/problems` also still does
`SELECT * … WHERE tags LIKE '%x%'`, which is a non-indexable full scan.

**Recommendation (not actioned — outside the RC-8 task list):** either add `tags` /
`difficulty` to `/problems.json` so these routes become D1-free, or `noindex` them.

### Still over quota today

The daily limit was already exhausted before this session's changes. It resets at
**midnight UTC**. The site renders correctly anyway (§6.2), which is the point.

---

## 8. ⚠️ ACTION REQUIRED — Cloudflare CDN purge

The origin is fixed, but **Cloudflare edge PoPs still hold pre-deploy HTML**:

```
cache-control: public, max-age=14400, s-maxage=7200, stale-while-revalidate=86400
```

Measured divergence, same URL, same second:

| Client route | PoP | `cf-cache-status` | `<h1>` |
|---|---|---|---|
| curl | AMS | HIT (age 559) | `Derivative of 1/x` ✅ |
| python urllib | LAX | HIT (age 702) | `Derivative of 1x` ❌ |

`Cache-Control: no-cache` sent by the client is ignored by Cloudflare, so this cannot be
forced from the outside. **The stale entries are still inside `s-maxage` (7,200 s), so they
will not revalidate on their own for up to ~2 hours.**

I could not purge programmatically: the wrangler OAuth grant is `zone:read` (no
`cache_purge`), and no `CF_API_TOKEN` / `CF_ZONE_ID` exists in this project.

**Please run:** Cloudflare Dashboard → Caching → Configuration → **Purge Everything**
(or `curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache"
-H "Authorization: Bearer <token>" -d '{"purge_everything":true}'`).

Then re-run:

```bash
python3 scripts/verify_rc8_production.py
```

All 20 checks should pass (16 origin + 4 CDN).

---

## 9. New finding — RC-9 (reported, not fixed)

`components/Footer.tsx` shuffles the footer's internal links on **every request**:

```tsx
const randomWiki    = wikiTopics.sort(() => 0.5 - Math.random()).slice(0, 4);
const randomProblems = problems.sort(() => 0.5 - Math.random()).slice(0, 6);
```

The footer is the site's largest internal-link surface. Randomising it means each crawl
sees a different link set, so no page accumulates stable internal link equity. The same
pattern appears in `app/wiki/[slug]/page.tsx` (`.sort(() => 0.5 - Math.random())` for
"More Calculus Topics"). `components/DynamicRecommendations.tsx` is client-side and
therefore harmless.

This is out of scope for the RC-8 task list, so it was deliberately **not** changed.
Suggest a follow-up task to make these deterministic.
