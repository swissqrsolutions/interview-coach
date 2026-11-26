import json, re, sys, collections
R = 'C:/code/interview-coach/'
def nums(html):
    t = re.sub(r'<h[23][^>]*>.*?</h[23]>', ' ', html, flags=re.S)
    t = re.sub(r'<style.*?</style>|<!--.*?-->', ' ', t, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t)
    return collections.Counter(re.findall(r'\d+(?:[.,]\d+)*', t))
def convert(s):
    b0 = s.index('<body>') + 6; b1 = s.rindex('</body>')
    head, body = s[:b0], s[b0:b1]
    hs = list(re.finditer(r'<h2>(\d+)\. (.*?)</h2>', body, flags=re.S))
    if [int(h.group(1)) for h in hs] != list(range(1, 12)): raise ValueError('sections ' + str([h.group(1) for h in hs]))
    pre = body[:hs[0].start()]
    sec = {}
    for k, h in enumerate(hs):
        end = hs[k + 1].start() if k + 1 < len(hs) else len(body)
        sec[k + 1] = (h.group(2), body[h.end():end].strip('\n'))
    def take(pat):
        nonlocal pre
        m = re.search(pat, pre, flags=re.S)
        if not m: raise ValueError('missing ' + pat[:25])
        pre = pre[:m.start()] + pre[m.end():]; return m.group(0)
    ger = take(r'<div class="geruest">.*?</dl>\s*</div>')
    mus = take(r'<div class="muster">.*?</ol>\s*</div>')
    kern = take(r'<div class="kern">.*?</div>')
    if '<div' in pre: raise ValueError('extra div in preamble')
    g = re.sub(r'<div class="geruest">\s*<h2>.*?</h2>\s*<dl>', '<h3>Gerüst</h3>\n<ul>', ger, flags=re.S)
    g = re.sub(r'</dl>\s*</div>', '</ul>', g)
    g, n1 = re.subn(r'<dt>(.*?)</dt>\s*<dd>', r'<li><b>\1</b> ', g, flags=re.S); g = g.replace('</dd>', '</li>')
    if n1 != 6 or '<dl' in g: raise ValueError('geruest shape')
    for k in (10, 11):
        if not re.search('Fallen' if k == 10 else 'Selbsttest', sec[k][0]): raise ValueError('title %d %s' % (k, sec[k][0]))
    t2 = re.sub(r'\s*\((die )?Geschichte zum Merken\)', '', sec[2][0])
    H2 = lambda n, t, c: f'<h2>{n}. {t}</h2>\n{c}\n\n'
    H3 = lambda t, c: f'<h3>{t}</h3>\n{c}\n'
    out = (head + pre.rstrip() + '\n\n' + kern + '\n\n' + mus + '\n\n' + H2(1, t2, sec[2][1]) + H2(2, 'Aufbau', sec[1][1]) + H2(3, sec[4][0], sec[4][1])
           + H2(4, 'Fallen', sec[10][1]) + H2(5, 'Selbsttest', sec[11][1])
           + '<details class="mehr"><summary>Mehr</summary>\n' + g + '\n' + ''.join(H3(sec[k][0], sec[k][1]) for k in (3, 5, 6, 7, 8))
           + '<h3>Dein Beispiel</h3>\n</details>\n\n' + s[b1:])
    out = re.sub(r'<a\s[^>]*href="https?://[^"]*"[^>]*>(.*?)</a>', r'\1', out, flags=re.S)
    out = re.sub(r'(<details)\s+open(>)', r'\1\2', out)
    # nothing lost: numbers equal except the removed project section
    src = s[:b0] + body[:hs[8].start()] + body[hs[9].start():] + s[b1:]
    a, b = nums(src), nums(out)
    if a != b: raise ValueError('numbers differ ' + str((a - b) + (b - a))[:120])
    if out.count('<details>') != s.count('<details') or out.count('<svg') != s.count('<svg') or out.count('<pre') != s.count('<pre'): raise ValueError('counts')
    return out
if __name__ == '__main__':
    P = json.load(open('ic-pages.json', encoding='utf8'))['have']
    V = json.load(open(R + 'content/visuals.json', encoding='utf8'))
    ok, bad = [], []
    for tid, i, k, _ in P:
        if k != 'new': continue
        f = R + f'content/topics/{tid}/{i}.html'; s = open(f, encoding='utf8').read()
        try: o = convert(s)
        except Exception as e: bad.append(f'{tid}/{i}: {e}'); continue
        open(f, 'w', encoding='utf8', newline='\n').write(o); V.pop(f'{tid}/{i}', None); ok.append(f'{tid}/{i}')
    open(R + 'content/visuals.json', 'w', encoding='utf8', newline='\n').write(json.dumps(V, ensure_ascii=False, indent=1) + '\n')
    print(len(ok), 'ok'); print('\n'.join(bad))
    json.dump(ok, open('ic-restructured.json', 'w'))
