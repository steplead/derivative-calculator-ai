#!/usr/bin/env python3
"""
Phase 4 production-readiness audit — production verification sample.

Hits the 10 URLs from the audit brief at ORIGIN (cache-buster `?cb=`) so we
prove what the deployed code renders, not what a stale CDN edge keeps.

For math pages we capture BOTH the <h1> formula AND the SSR answer block
(aria-label="Solution") so we can judge math-engine correctness, not just that
the page renders.
"""

import gzip
import re
import time
import urllib.request

BASE = "https://derivativecalculatorai.com"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0 Safari/537.36"
)


def get(path: str):
    url = f"{BASE}{path}"
    if "?" not in url:
        url += f"?cb={int(time.time() * 1000)}"
    else:
        url += f"&cb={int(time.time() * 1000)}"
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept": "text/html,application/json",
                      "Accept-Encoding": "gzip"}
    )
    r = urllib.request.urlopen(req, timeout=60)
    body = r.read()
    if r.headers.get("Content-Encoding") == "gzip":
        body = gzip.decompress(body)
    return r.status, body.decode("utf-8", "replace"), dict(r.headers)


def h1_of(html: str) -> str:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    return re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""


def title_of(html: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.S)
    return m.group(1).strip() if m else ""


def solution_block(html: str) -> str:
    """Return the answer text inside aria-label=\"Solution\" if present."""
    m = re.search(
        r'aria-label="Solution".*?Answer</dt>.*?<dd[^>]*>(.*?)</dd>',
        html, re.S,
    )
    if not m:
        return ""
    return re.sub(r"<[^>]+>", "", m.group(1)).strip()


def count_links(html: str) -> int:
    return len(set(re.findall(
        r'href="/(?:derivative-of|integral-of|limit-of)-[a-z0-9-]*"', html)))


PAGES = [
    "/derivative-of-1-x",
    "/derivative-of-acosx-minus-over-minus-2",
    "/derivative-of-x",
    "/derivative-of-x-squared",
    "/derivative-of-ln-x",
    "/derivative-of-abs-x",
    "/qqqzzz999",                       # known invalid slug -> expect 404
    "/problems",
    "/problems/derivative",
    "/directory",
]

print(f"{'URL':<42}{'http':<6}{'<h1> formula':<22}{'SSR answer':<24}links")
print("-" * 100)
for p in PAGES:
    try:
        st, html, hd = get(p)
    except Exception as e:
        print(f"{p:<42}{'ERR':<6}{str(e)[:60]}")
        continue
    if p in ("/problems", "/problems/derivative", "/directory"):
        print(f"{p:<42}{st:<6}{'-':<22}{'-':<24}{count_links(html)}")
    else:
        print(f"{p:<42}{st:<6}{h1_of(html)[:20]:<22}{solution_block(html)[:22]:<24}-")
    time.sleep(0.4)

print()
print("=== API reliability (D1-backed routes) ===")
for api in ["/api/problem/derivative-of-1-x", "/api/problems?limit=3&type=derivative"]:
    try:
        st, body, hd = get(api)
        snippet = body[:120].replace("\n", " ")
        print(f"{api:<42}{st}  {snippet}")
    except Exception as e:
        print(f"{api:<42}ERR {e}")
    time.sleep(0.4)
