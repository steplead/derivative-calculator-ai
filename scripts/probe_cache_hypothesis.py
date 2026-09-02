"""Temporary diagnostic: is the wrong/fallback formula an EDGE-CACHE artifact
(HTML rendered long ago, before D1 went over quota), or does a FRESH render
also fail?

Method: fetch each slug twice — once normally (may hit the Cloudflare edge
cache) and once with a cache-busting query string (forces a fresh Function
invocation). Compare the H1 formula against /problems.json.
"""
import json
import re
import time
import urllib.request
import gzip

BASE = 'https://derivativecalculatorai.com'
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')


def get(url, timeout=45):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip'})
    r = urllib.request.urlopen(req, timeout=timeout)
    body = r.read()
    if r.headers.get('Content-Encoding') == 'gzip':
        body = gzip.decompress(body)
    hdr = {}
    for k in ('cf-cache-status', 'age', 'server'):
        v = r.headers.get(k)
        if v:
            hdr[k] = v
    return r.status, body.decode('utf-8', 'replace'), hdr


def strip(h):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
    return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', m.group(1))).replace('Derivativeof', '') if m else ''


def main():
    rows = json.loads(get(BASE + '/problems.json')[1])
    idx = {r['slug']: r for r in rows}

    slugs = [
        'derivative-of-x-squared', 'derivative-of-sin-x', 'derivative-of-1-x',
        'derivative-of-10-to-the-x', 'derivative-of-acosx-minus-over-minus-2',
        'derivative-of-e-to-the-x', 'derivative-of-x-cubed', 'derivative-of-tan-x',
    ]
    print(f'{"slug":44s} {"json":14s} {"cached-H1":16s} {"fresh-H1":16s} {"cf-cache":26s} verdict')
    print('-' * 150)
    for s in slugs:
        exp = (idx.get(s) or {}).get('formula')
        try:
            _, h1, _ = get(f'{BASE}/{s}')
            time.sleep(0.2)
            _, h2, hdr = get(f'{BASE}/{s}?cb={int(time.time() * 1000)}')
        except Exception as e:
            print(f'{s:44s} ERR {e}')
            continue
        a, b = strip(h1), strip(h2)
        ok_a = exp is not None and a == exp
        ok_b = exp is not None and b == exp
        verdict = ('both-ok' if ok_a and ok_b else
                   'cached-ok/fresh-BAD' if ok_a and not ok_b else
                   'both-BAD')
        print(f'{s:44s} {str(exp):14s} {a:16s} {b:16s} {str(hdr):26s} {verdict}')
        time.sleep(0.3)


if __name__ == '__main__':
    main()
