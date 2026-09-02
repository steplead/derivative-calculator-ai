"""Temporary diagnostic: compare <title> (built by generateMetadata, which uses a
PLAIN fetch of /problems.json) against <h1> (built by the page body, which uses
fetch(..., {cache:'force-cache', next:{revalidate:3600}})).

If <title> shows the real formula while <h1> shows the slug-parsed one, the
static lookup in the page body is broken while the plain fetch works.
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
    return r.status, body.decode('utf-8', 'replace')


def main():
    rows = json.loads(get(BASE + '/problems.json')[1])
    idx = {r['slug']: r for r in rows}
    slugs = [
        'derivative-of-x-squared', 'derivative-of-sin-x', 'derivative-of-1-x',
        'derivative-of-10-to-the-x', 'derivative-of-acosx-minus-over-minus-2',
        'derivative-of-x-cubed', 'derivative-of-tan-x',
        'derivative-of-1-over-x', 'derivative-of-sin-x-over-x',
    ]
    print(f'{"slug":42s} {"json.formula":14s} {"<title> formula":20s} {"<h1> formula":18s} verdict')
    print('-' * 130)
    for s in slugs:
        exp = (idx.get(s) or {}).get('formula')
        try:
            st, h = get(f'{BASE}/{s}')
        except Exception as e:
            print(f'{s:42s} ERR {e}')
            continue
        tm = re.search(r'<title[^>]*>(.*?)</title>', h, re.S)
        title = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', tm.group(1))).strip() if tm else ''
        tf = re.match(r'Derivative of (.+?) -', title)
        tf = tf.group(1).strip() if tf else title[:20]
        hm = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
        h1 = re.sub(r'<[^>]+>', '', hm.group(1)).strip() if hm else ''
        h1 = re.sub(r'^Derivative of\s*', '', h1).strip()
        print(f'{s:42s} {str(exp):14s} {tf[:20]:20s} {h1[:18]:18s} '
              f'{"title=JSON" if tf == exp else "title!=JSON"}')
        time.sleep(0.3)


if __name__ == '__main__':
    main()
