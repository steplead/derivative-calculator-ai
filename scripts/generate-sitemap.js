/**
 * Curated sitemap generator (`npm run generate-sitemap`; output is committed as
 * public/sitemap.xml).
 *
 * 2026-11-07 (owner-approved): only the homepage is indexed and Google had
 * discovered ~255 URLs (85 locs + es/pt hreflang alternates). The sitemap is
 * now exactly the English URLs in SITEMAP_URLS below, with NO hreflang
 * alternates and no es/pt URLs. Every other page stays live, linked, and
 * self-canonical; it is just not submitted. Edit SITEMAP_URLS to add/remove.
 *
 * 2026-11-27 (owner-approved): 18 -> 218. The 200 long-tail problem pages come
 * from the library, selected by `scripts/rank-sitemap-picks.js` and mirrored in
 * data/sitemap-problem-slugs.json (which is what lifts their noindex). The
 * sitemap is still a curated list, not a dump of the 3,137-row library.
 *
 * lastmod is the git commit time of the file(s) that own the URL.
 */

const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'public', 'sitemap.xml');
const BASE_URL = 'https://derivativecalculatorai.com';
// Long-tail problem pages: real answer + steps, but not a hub page.
const LONG_TAIL_PRIORITY = '0.6';

// The one list to edit. `file` drives lastmod; `problem: true` entries must
// exist in data/problems.json and use the problem-lesson lastmod.
const SITEMAP_URLS = [
  { path: '/', file: 'app/(site)/page.tsx', priority: '1.0' },
  { path: '/integral', file: 'app/(site)/integral/page.tsx', priority: '0.9' },
  { path: '/limit', file: 'app/(site)/limit/page.tsx', priority: '0.9' },
  { path: '/partial-derivative-calculator', file: 'app/(site)/partial-derivative-calculator/page.tsx', priority: '0.9' },
  { path: '/implicit-differentiation-calculator', file: 'app/(site)/implicit-differentiation-calculator/page.tsx', priority: '0.9' },
  { path: '/chain-rule-calculator', file: 'app/(site)/chain-rule-calculator/page.tsx', priority: '0.9' },
  { path: '/derivative-of-sin-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-cos-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-tan-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-ln-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-e-to-the-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-1-over-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-sqrt-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-x-squared', problem: true, priority: '0.8' },
  { path: '/derivative-of-arctan-x', problem: true, priority: '0.8' },
  { path: '/derivative-of-sec-x', problem: true, priority: '0.8' },
  { path: '/derivatives-of-trig-functions', file: 'app/(site)/derivatives-of-trig-functions/page.tsx', priority: '0.8' },
  { path: '/wiki/chain-rule', file: 'data/wiki.json', priority: '0.7' },

  // 2026-11-27 (owner-approved): the 100 best integrals and the 100 best
  // limits from the problem library. Ranked by textbook value first (the
  // primitive rules people actually search for), then by shape simplicity,
  // and gated on the page really carrying an answer: no definite integrals
  // (the solver ignores the bounds), no abs() branches, no ambiguous
  // x^3^2 forms, no unevaluated "1/infinity" answers, and nothing whose
  // limit is not a plain number. Paths use the "plus" spelling because a
  // literal "+" 404s on the live site (see lib/seo.ts plusFreeSlug).
  // Each one is also in data/sitemap-problem-slugs.json, which is what
  // lifts the noindex on the 37 that a previous pruning pass had blocked.
  { path: '/integral-of-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x4', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-sin-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-cos-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-ex', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-lnx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-cosx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sinx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-secx2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sqrtx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-1plusx2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-sqrt1-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-ex', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-4x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-3x3', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x--sinx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x4-plus-5x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x2--secx2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-2tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x2-plus-2tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-sqrtx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x4-plus-sqrtx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x2-plus-4tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x--x4', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x2--x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x4-plus-1-over-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x2-plus-1-over-2x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-1-over-2x3', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x2-plus-1-over-2ex', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-1-over-2secx2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-1-over-2sqrtx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-1-over-2secx2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x4-plus-1-over-2secx2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-ex--x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-lnx--x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-lnx-plus-3x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-ex-plus-5x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-cosx-plus-5x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-lnx--tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-lnx-plus-4ex', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-lnx--cosx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-tanx-plus-3x3', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sqrtx-plus-3x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-ex-plus-4tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-cosx-plus-4x3', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-ex-plus-5tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-cosx-plus-3lnx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sqrtx-plus-4ex', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-tanx-plus-cosx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sqrtx--cosx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-ex--1-over-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-cosx-plus-5sinx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-tanx-plus-2cosx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sinx-plus-3tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-cosx-plus-3sinx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x--lnx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x-plus-5x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x2--lnx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sqrtx-plus-5sqrtx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x2-plus-ex', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x-plus-3x4', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-ex-plus-1-over-2x3', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x2-plus-5x4', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x-plus-sqrtx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x2-plus-5lnx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-tanx-plus-21-over-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sqrtx-plus-1-over-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x-plus-3sqrtx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sqrtx-plus-31-over-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-sinx-plus-1-over-2x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x2-plus-5sqrtx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-2x4-plus-x3', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-cosx-plus-1-over-2tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x2--cosx-plus-5x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x2-plus-ex-plus-2lnx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x-plus-51-over-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-1-over-x2-plus-1-over-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-2x-plus-2tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-lnx-plus-1-over-21-over-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-1-over-1plusx2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x--sqrtx-plus-3tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x4-plus-4sinx-plus-3lnx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-1-over-sqrt1-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-1-over-2ex-plus-4x4', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-x3-plus-1-over-2tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x4-plus-5x2-plus-31-over-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-41-over-x-plus-5tanx', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-5secx2-plus-31-over-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-5secx2-plus-41-over-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-21-over-x2-plus-41-over-x', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x3-plus-1-over-21-over-sqrt1-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-x-plus-1-over-2tanx-plus-1-over-21-over-x2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-lnx-plus-5ex-plus-x3', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/integral-of-tanx-plus-ex-plus-3x4', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x-over-ex-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2-over-sqrtx-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x3-1-over-x-1-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2-1-over-x-1-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2-4-over-x-2-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2plusx-2-over-x-1-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sinx-over-x-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx-over-x-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-ex-1-over-x-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-lnx-over-x-1-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sqrtx-1-over-x-1-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-cosx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sinx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x-ex-over-x3-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2--sqrtx2-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-cosx-over-ex-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx-over-tanx-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx-over-tanx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx-sinx-over-x-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-lnx-lnx-over-x3-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sqrtx-sqrtx-over-x2-as-x-to--1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-lnx-tanx-over-cosx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx--sinx-over-x2--sinx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sinx--sinx-over-sinx--x3-as-x-to--1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x-over-4x-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x-over-3x3-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x-over-3x2-as-x-to--1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x3-over-4lnx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2-over-3sqrtx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x3-sqrtx-over-x-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2-5x-over-ex-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x3-4ex-over-x-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-2x3-over-x3-as-x-to--1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-2x3-over-x3-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-ex-over-2ex-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x3-2lnx-over-lnx-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-ex-over-3tanx-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx-over-3x2-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2--5ex-over-lnx--tanx-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sqrtx-over-2x2-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-5x3-over-sqrtx-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x3-3sqrtx-over-sqrtx-as-x-to--1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-2x3-over-4x3-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-3x2--1-over-x22-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-cosx-over-4sinx-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-5sinx-over-4x-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-5cosx-over-3x-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-2x-over-3sinx-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-5lnx-over-2x3-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sinx-5x-over-x-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-3x3-sinx-over-x3-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-4cosx--ex-over-x2--x-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-4sqrtx2--31-over-x2-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-2tanx-x3-over-cosx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx-4cosx-over-ex-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sinx-5x2-over-sqrtx-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-3sqrtx-sinx-over-ex-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-3sqrtx-sinx-over-ex-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-4ex-3ex-over-tanx-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-3lnx-5lnx-over-ex-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx-3cosx-over-sqrtx-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-3ex-2sinx-over-lnx-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-3cosx-5ex-over-lnx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-2ex--2x2-over-sinx--lnx-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-2sqrtx-4ex-over-sqrtx-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x-over-1-over-x-as-x-to--1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2-over-1-over-x-as-x-to--1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2-over-ex-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x3-over-1-over-x2-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x3--1-over-x-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x2--sqrtx2-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x--sqrtx-over-ex--x-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x--sinx-over-ex--1-over-x-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2--x3-over-x2--x3-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-tanx-over-1-over-x-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2--x3-over-1-over-x--1-over-x2-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2--cosx-over-ex--tanx-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sinx--tanx-over-1-over-x2--ex-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sqrtx--sqrtx3-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sqrtx--1-over-x2-over-sqrtx--lnx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-sqrtex--sqrtsqrtx-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2-over-5x-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x3-over-21-over-x2-as-x-to--1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-2x--1-over-x-as-x-to--1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-x3-x2-over-1-over-x-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-3x--1-over-x2-as-x-to-1', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x--1-over-4x3-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-2x--1-over-ex-as-x-to-0', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x2-over-2tanx-as-x-to-pi', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-3x3--1-over-x2-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-x3--1-over-3ex-as-x-to-2', problem: true, priority: LONG_TAIL_PRIORITY },
  { path: '/limit-of-1-over-1-over-x--1-over-2x3-as-x-to--2', problem: true, priority: LONG_TAIL_PRIORITY },
];

const PROBLEM_FILES = [
  'data/problems.json',
  'content/derivative-facts.json',
  'content/striking-lessons.ts',
  'content/inverse-trig-lessons.ts',
  'content/derivative-lesson.ts',
  'app/(site)/[slug]/page.tsx',
];

function gitLastmod(relFile) {
  let iso = '';
  try {
    iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', relFile], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch (e) {
    // fall back to mtime
  }
  if (!iso) iso = fs.statSync(path.join(ROOT, relFile)).mtime.toISOString();
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toISOString();
}

function absolute(relPath) {
  return relPath === '/' ? BASE_URL : `${BASE_URL}${relPath}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateSitemap() {
  const problems = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'problems.json'), 'utf8'));
  const wiki = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'wiki.json'), 'utf8'));
  // Sitemap paths are the public spelling: '+' is written as 'plus'.
  const problemSlugs = new Set(problems.map((p) => p && p.slug.replace(/\+/g, 'plus').replace(/ /g, 'plus')));
  const wikiSlugs = new Set(wiki.map((t) => t && t.slug));
  const problemLastmod = PROBLEM_FILES.map(gitLastmod).sort().at(-1);

  const seen = new Set();
  const entries = SITEMAP_URLS.map((entry) => {
    if (seen.has(entry.path)) throw new Error(`Duplicate sitemap path: ${entry.path}`);
    seen.add(entry.path);
    if (/^\/(es|pt)(\/|$)/.test(entry.path)) throw new Error(`Locale URL not allowed: ${entry.path}`);
    if (entry.problem && !problemSlugs.has(entry.path.slice(1))) {
      throw new Error(`Not in the problem library: ${entry.path}`);
    }
    if (entry.problem && entry.path.includes('+')) {
      throw new Error(`A literal '+' 404s on the live site, use the plus spelling: ${entry.path}`);
    }
    if (entry.path.startsWith('/wiki/') && !wikiSlugs.has(entry.path.slice(6))) {
      throw new Error(`Not in wiki.json: ${entry.path}`);
    }
    const lastmod = entry.problem ? problemLastmod : gitLastmod(entry.file);
    return `  <url>
    <loc>${escapeXml(absolute(entry.path))}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log(`Sitemap generated at ${SITEMAP_PATH} with ${entries.length} URLs`);
  return entries.length;
}

if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap, SITEMAP_URLS };
