// Builds dist/ for a private claude.ai Artifact: the page without <html>/<head>/<body> (the host adds them).
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const site = p => path.join(ROOT, 'site', p), dist = p => path.join(ROOT, 'dist', p);
fs.mkdirSync(dist('assets'), { recursive: true });
for (const f of ['assets/app.js', 'assets/style.css', 'assets/icon.svg', 'assets/latin.woff2', 'assets/latin-ext.woff2', 'data.json']) fs.copyFileSync(site(f), dist(f));
const src = fs.readFileSync(site('index.html'), 'utf8');
const head = src.match(/<head>([\s\S]*?)<\/head>/)[1], body = src.match(/<body>([\s\S]*?)<\/body>/)[1];
const keep = head.split('\n').filter(l => /<title>|name="description"|name="datav"|rel="stylesheet"|<script>try/.test(l))
  .map(l => l.replace(/\?v=\w+/g, ''));
const bodyClean = body.replace(/\?v=\w+/g, '');
fs.writeFileSync(dist('index.html'), ['<meta name="claude:viewport-fit-sides" content="cover">', ...keep, bodyClean.trim()].join('\n') + '\n');
console.log('dist ready:', fs.readdirSync(dist('.')).join(', '));
