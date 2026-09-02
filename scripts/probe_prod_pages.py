"""Temporary diagnostic: does the production [slug] page use the real formula
from /problems.json, or the parseSlugToMath() fallback?

Signal: compare the H1 text on the page with the formula stored in the
production /problems.json for the same slug.
"""
import json
import re
import time
import urllib.request
import gzip

BASE = 'https://derivativecalculatorai.com'
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')


def get(url, timeout=40):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip'})
    r = urllib.request.urlopen(req, timeout=timeout)
    body = r.read()
    if r.headers.get('Content-Encoding') == 'gzip':
        body = gzip.decompress(body)
    return r.status, body.decode('utf-8', 'replace')


def main():
    st, raw = get(BASE + '/problems.json')
    rows = json.loads(raw)
    idx = {r['slug']: r for r in rows}

    slugs = [
        'derivative-of-x-squared',
        'derivative-of-sin-x',
        'derivative-of-1-x',
        'derivative-of-10-to-the-x',
        'derivative-of-acosx-minus-over-minus-2',
        'derivative-of-x-to-the-1-over-5',
        'derivative-of-e-to-the-x',
        'derivative-of-ln-x',
    ]
    print(f'{"slug":46s} {"json.formula":16s} {"page H1":28s} {"SSR":4s} {"answer":26s} src')
    print('-' * 140)
    for s in slugs:
        expected = idx.get(s, {}).get('formula')
        try:
            st, h = get(f'{BASE}/{s}')
        except Exception as e:
            print(f'{s:46s} ERR {e}')
            continue
        m = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
        h1 = re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', m.group(1))) if m else ''
        h1 = h1.replace('Derivativeof', '')
        ssr = 'YES' if 'aria-label="Solution"' in h else 'NO'
        am = re.search(r'>Answer</dt>.*?font-math">(.*?)</dd>', h, re.S)
        ans = re.sub(r'<[^>]+>', '', am.group(1)).strip() if am else '-'
        used_json = (expected is not None and h1.replace(' ', '') == expected.replace(' ', ''))
        print(f'{s:46s} {str(expected):16s} {h1:28s} {ssr:4s} {ans[:26]:26s} '
              f'{"problems.json" if used_json else "FALLBACK/parseSlug"}')
        time.sleep(0.3)


if __name__ == '__main__':
    main()
