// Turns content/ into site/data.json and stamps versions into index.html.
// usage: node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { marked } from 'marked';
marked.setOptions({ breaks: true });

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const C = p => path.join(ROOT, 'content', p);
const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const renderer = new marked.Renderer();
renderer.code = ({ text }) => `<div class="code"><button class="copy" type="button">Copy</button><pre><code>${text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</code></pre></div>`;
const html = s => marked.parse(String(s || '').trim(), { renderer });

const tech = JSON.parse(read(C('tech.json')));
const rounds = JSON.parse(read(C('rounds.json')));
const techIds = new Set(tech.map(t => t.id)), roundIds = new Set(rounds.map(r => r.id));
const errors = [];

// ---- cards: content/cards/*.md with a small front matter block
function frontMatter(src, file) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { errors.push(`${file}: no front matter`); return [{}, src]; }
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/); if (!kv) continue;
    let v = kv[2].trim();
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    else if (/^\d+$/.test(v)) v = +v;
    meta[kv[1]] = v;
  }
  return [meta, m[2]];
}
const sections = body => {
  const out = {}; let cur = null, fence = false;
  for (const line of body.split('\n')) {
    if (/^```/.test(line)) fence = !fence;
    const h = !fence && line.match(/^## (.+)$/);
    if (h) { cur = h[1].trim().toLowerCase(); out[cur] = ''; continue; }
    if (cur) out[cur] += line + '\n';
  }
  return out;
};
const cards = [], todo = [];
for (const f of fs.readdirSync(C('cards')).filter(f => f.endsWith('.md')).sort()) {
  const src = read(path.join(C('cards'), f));
  const [meta, body] = frontMatter(src, f);
  // placeholders the candidate must fill in: *(Ihr echtes Beispiel …)*, *(Prüfen …)*, *(Beispiel …)*
  const ph = [...src.matchAll(/\*\(((?:Ihr|Prüfen|Beispiel|Nur|Vorschlag|Hier)[^*]*?)\)\*/g)].map(m => m[1].trim());
  if (ph.length) todo.push({ id: meta.id || f.replace(/\.md$/, ''), q: meta.q, round: meta.round, ph: [...new Set(ph)] });
  const s = sections(body);
  const id = meta.id || f.replace(/\.md$/, '');
  const ts = [].concat(meta.tech || []);
  if (!roundIds.has(meta.round)) errors.push(`${f}: unknown round "${meta.round}"`);
  for (const t of ts) if (!techIds.has(t)) errors.push(`${f}: unknown tech "${t}"`);
  if (!meta.q) errors.push(`${f}: no q`);
  if (!s['30s']) errors.push(`${f}: no "## 30s"`);
  // follow-ups: "- question → answer" (answer optional)
  const follow = (s['follow-ups'] || '').split('\n').map(l => l.match(/^-\s+(.+?)(?:\s+→\s+(.+))?$/)).filter(Boolean)
    .map(m => ({ q: m[1].trim(), a: m[2] ? marked.parseInline(m[2].trim()) : '' }));
  const proof = meta.proof || (ts.length && tech.find(t => t.id === ts[0])?.proof) || 'project';
  cards.push({
    id, round: meta.round, tech: ts, tier: meta.tier || 2, proof, project: meta.project || '',
    q: meta.q, en: meta.en || '', minutes: meta.minutes || 0,
    l1: html(s['30s']), l2: html(s['90s'] || ''), l3: html(s['3min'] || ''),
    follow, words: html(s['words'] || ''), dont: html(s["don't say"] || s["don't"] || ''),
  });
}
const dup = cards.map(c => c.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dup.length) errors.push('duplicate ids: ' + dup.join(', '));

// ---- extra pages: content/pages/*.md → { id, title, html }
let pages = fs.existsSync(C('pages')) ? fs.readdirSync(C('pages')).filter(f => f.endsWith('.md')).sort().map(f => {
  const src = read(path.join(C('pages'), f));
  const title = (src.match(/^# (.+)$/m) || [])[1] || f;
  return { id: f.replace(/^\d+-/, '').replace(/\.md$/, ''), title, html: html(src.replace(/^# .+\n/, '')) };
}) : [];

if (errors.length) { console.error('CONTENT ERRORS:\n  ' + errors.join('\n  ')); process.exit(1); }

// generated page: everything only the candidate can fill in, grouped by round
if (todo.length) {
  const esc = s => String(s).replace(/[<>]/g, c => ({ '<': '&lt;', '>': '&gt;' }[c]));
  let md = `${todo.reduce((a, t) => a + t.ph.length, 0)} gaps in ${todo.length} cards. Only you know these facts. Fill them in, then the answers are fully yours.\n\nTell Claude your answers (for example: "rate 120 CHF, reason for change: …") and they get written into the cards.\n`;
  for (const r of rounds) {
    const ts = todo.filter(t => t.round === r.id); if (!ts.length) continue;
    md += `\n## ${r.n}. ${r.name}\n`;
    for (const t of ts) md += `\n**[${esc(t.q)}](#c-${t.id})**\n${t.ph.map(p => `- ${esc(p)}`).join('\n')}\n`;
  }
  pages.push({ id: 'fill-in', title: 'To fill in (only you know)', html: html(md) });
}

const data = { built: new Date().toISOString(), tech, rounds, cards, pages };
const json = JSON.stringify(data);
fs.writeFileSync(path.join(ROOT, 'site', 'data.json'), json);
const h = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
const idx = path.join(ROOT, 'site', 'index.html');
let ih = read(idx);
ih = ih.replace(/data\.json\?v=\w*/, 'data.json?v=' + h(json))
  .replace(/app\.js\?v=\w*/, 'app.js?v=' + h(read(path.join(ROOT, 'site', 'assets', 'app.js'))))
  .replace(/style\.css\?v=\w*/, 'style.css?v=' + h(read(path.join(ROOT, 'site', 'assets', 'style.css'))));
fs.writeFileSync(idx, ih);
const by = {}; for (const c of cards) by[c.round] = (by[c.round] || 0) + 1;
console.log(`cards ${cards.length} · pages ${pages.length} · tech ${tech.length} · rounds ${rounds.length}`);
console.log('per round: ' + rounds.map(r => `${r.id} ${by[r.id] || 0}`).join(' · '));
