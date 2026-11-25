// Interview Coach — practise every interview round aloud. Plain JS, offline, no backend.
// Everything personal (grades, jobs, evidence) stays in this browser (localStorage, prefix "ic:").
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ic:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ic:' + k, JSON.stringify(v)); } catch {} },
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const app = $('#app');
  let D = null;

  // ---------- offline + updates ----------
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
  }
  $('#theme').onclick = () => {
    const dark = (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
    const t = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = t; store.set('theme', t);
  };
  // ---------- install (PWA) ----------
  let deferred = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const canInstall = () => !standalone() && (!!deferred || isIOS);
  function syncInstall() { $$('.install').forEach(b => b.hidden = !canInstall()); if (!canInstall()) $$('.ios-hint').forEach(h => h.hidden = true); }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; syncInstall(); });
  addEventListener('appinstalled', () => { deferred = null; syncInstall(); toast('Installiert. Die App ist jetzt auf dem Home-Bildschirm.'); });
  document.addEventListener('click', async e => {
    const b = e.target.closest('.install'); if (!b) return;
    if (deferred) {
      const ev = deferred; deferred = null;
      try { await ev.prompt(); await ev.userChoice; } catch {}
      syncInstall();
    } else if (isIOS) {
      const h = b.classList.contains('install-top') ? $('.top .ios-hint') : $('#app .ios-hint');
      if (h) { h.textContent = 'Tippe auf Teilen ⬆︎ und dann „Zum Home-Bildschirm“.'; h.hidden = !h.hidden; }
    }
  });
  syncInstall();
  function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2400); }
  document.addEventListener('click', async e => {
    const b = e.target.closest('.copy'); if (!b) return;
    const txt = b.parentElement.querySelector('code').innerText;
    try { await navigator.clipboard.writeText(txt); } catch {}
    b.textContent = 'Kopiert'; setTimeout(() => b.textContent = 'Kopieren', 1400);
  });

  // ---------- dates + spaced repetition ----------
  const today = () => new Date().toISOString().slice(0, 10);
  const addDays = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
  const GAP = { 1: 1, 2: 3, 3: 14 };
  const st = () => store.get('cards', {});
  const cardState = id => st()[id] || null;
  const isReady = id => { const s = cardState(id); return !!s && new Set(s.hist.filter(h => h.s >= 7).map(h => h.d)).size >= 2; };
  const lastScore = id => { const s = cardState(id); return s && s.hist.length ? s.hist[s.hist.length - 1].s : null; };
  function saveGrade(id, score, tag) {
    const all = st(), s = all[id] || { box: 1, due: today(), hist: [] };
    s.box = score >= 7 ? Math.min(3, s.box + 1) : score >= 5 ? s.box : 1;
    s.due = addDays(today(), GAP[s.box]);
    s.hist.push({ d: today(), s: score, tag: tag || '' });
    all[id] = s; store.set('cards', all);
    return s;
  }

  // ---------- lookups ----------
  const card = id => D.cards.find(c => c.id === id);
  const RS = () => D.rounds.filter(r => !r.hidden);
  const TS = () => D.tech.filter(t => !t.hidden);
  const CS = () => D.cards.filter(c => !(round(c.round) || {}).hidden);
  const round = id => D.rounds.find(r => r.id === id);
  const techOf = id => D.tech.find(t => t.id === id);
  const jobs = () => store.get('jobs', []);
  const activeJob = () => { const a = store.get('activeJob', null); return jobs().find(j => j.id === a) || null; };
  const PMARK = { study: '<span class="pm study">kein Projekt</span>', check: '<span class="pm check">prüfen</span>' };
  const PROOF = { project: '<span class="badge ok">Projekterfahrung</span>', study: '<span class="badge study">nur gelernt</span>' };

  // queue: due reviews first, then up to 5 new cards (job focus first, then tier, then round order)
  function queue() {
    const t = today(), s = st(), job = activeJob();
    const due = CS().filter(c => s[c.id] && s[c.id].due <= t).sort((a, b) => s[a.id].due.localeCompare(s[b.id].due));
    const order = r => D.rounds.findIndex(x => x.id === r);
    const fit = c => !job ? 0 : (c.tech.some(x => job.techs.includes(x)) ? 2 : 0) + (job.rounds.includes(c.round) ? 1 : 0);
    const fresh = CS().filter(c => !s[c.id]).sort((a, b) => fit(b) - fit(a) || a.tier - b.tier || order(a.round) - order(b.round));
    const newToday = Object.values(s).filter(x => x.hist[0] && x.hist[0].d === t).length;
    return [...due, ...fresh.slice(0, Math.max(0, 5 - newToday))];
  }

  // ---------- TODAY ----------
  function weekKey() { const d = new Date(); const j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + '-w' + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); }
  const OUTSIDE = [['mock', 'Ein Probe-Interview mit einem echten Menschen (Kamera an)'], ['code1', 'Coding ohne KI (1)'], ['code2', 'Coding ohne KI (2)'], ['code3', 'Coding ohne KI (3)'], ['sql', 'SQL von Hand in psql (2 Abfragen)']];
  function todayView() {
    const q = queue(), job = activeJob(), base = store.get('baseline', {}), wk = store.get('week:' + weekKey(), {});
    const baseDone = ['design', 'sql', 'coding'].every(k => base[k]);
    let plan = '';
    if (job && job.date) {
      const left = daysBetween(today(), job.date);
      plan = left < 0 ? '' : `<section class="card plan"><div class="label">Interview: ${esc(job.name)}</div>
        <p class="big">${left === 0 ? 'Heute. Lies deine Vorstellung einmal, dann nicht mehr lernen.' : 'Noch ' + left + (left > 1 ? ' Tage' : ' Tag')}</p>
        ${left > 0 ? `<p>Fokus heute: <b>${esc(planFor(job, left).name)}</b></p>` : ''}
        <a href="#plan" class="small">Plan Tag für Tag ansehen →</a></section>`;
    }
    app.innerHTML = `<h1>Heute</h1>
      ${!job ? `<div class="card hint"><b>Noch keine Stelle.</b> Füge ein Inserat unter <a href="#job">Stelle</a> ein. Dann wählt die App die passenden Runden und Technologien.</div>` : ''}
      ${plan}
      ${!baseDone ? `<section class="card"><div class="label">Woche 1: Ausgangslage (einmal machen)</div>
        <p>Mach 3 Aufgaben kalt, ohne nachzuschlagen. Dann weisst du, wo du wirklich stehst.</p>
        ${[['design', 'System Design: Bild-Upload + Suche', '#c-design-image-search'], ['sql', 'SQL: Top 3 pro Gruppe, von Hand', '#page-practice'], ['coding', 'Coding: 1 leichte Aufgabe, KI aus', '#page-practice']].map(([k, t, h]) => `<label class="check"><input type="checkbox" data-base="${k}" ${base[k] ? 'checked' : ''}> <a href="${h}">${t}</a></label>`).join('')}</section>` : ''}
      <h2>Laut üben (${q.length})</h2>
      ${q.length ? `<a class="btn block" href="#q-${q[0].id}">Los</a><div class="card"><ul class="list">${q.map(rowCard).join('')}</ul></div>` : '<div class="card">Nichts fällig. Gut gemacht. Mehr findest du in der Bibliothek.</div>'}
      <h2>Ausserhalb der App diese Woche</h2>
      <div class="card">${OUTSIDE.map(([k, t]) => `<label class="check"><input type="checkbox" data-wk="${k}" ${wk[k] ? 'checked' : ''}> ${t}</label>`).join('')}
        <p class="small">Das kann die App nicht für dich tun. Das ist das echte Training.</p></div>`;
    $$('[data-base]').forEach(i => i.onchange = () => { const b = store.get('baseline', {}); b[i.dataset.base] = i.checked; store.set('baseline', b); });
    $$('[data-wk]').forEach(i => i.onchange = () => { const k = 'week:' + weekKey(), w = store.get(k, {}); w[i.dataset.wk] = i.checked; store.set(k, w); });
  }
  function rowCard(c) {
    const s = cardState(c.id), ls = lastScore(c.id);
    const tag = isReady(c.id) ? '<span class="st ok">sicher</span>' : s ? `<span class="st ${ls >= 7 ? 'ok' : ls >= 5 ? 'mid' : 'bad'}">${ls}/8</span>` : '<span class="st new">neu</span>';
    return `<li><a href="#c-${c.id}"><span class="rnum">${round(c.round).n}</span><span>${esc(c.q)}</span>${tag}</a></li>`;
  }

  // ---------- PLAN (interview date → one focus per day) ----------
  function planDays(job) {
    const rs = D.rounds.filter(r => job.rounds.includes(r.id) && r.id !== 'final');
    return rs.length ? rs : D.rounds.slice(0, 4);
  }
  function planFor(job, left) {
    if (left <= 1) return { name: 'Ganzes Probe-Interview: Vorstellung, 1 Projekt, 3 Technikfragen. Dann ausruhen.' };
    const rs = planDays(job), i = Math.max(0, daysBetween(job.saved || today(), addDays(job.date, -left)));
    return rs[i % rs.length];
  }
  function planView() {
    const job = activeJob();
    if (!job || !job.date) { app.innerHTML = `<h1>Plan</h1><div class="card">Lege unter <a href="#job">Stelle</a> eine Stelle mit Interview-Datum an.</div>`; return; }
    const left = daysBetween(today(), job.date), rows = [];
    for (let d = left; d >= 0; d--) {
      const day = addDays(job.date, -d);
      const f = d === 0 ? { name: 'Interview-Tag. Vorstellung einmal lesen. Keine neuen Themen.' } : planFor(job, d);
      rows.push(`<tr${d === left ? ' class="now"' : ''}><td>${day.slice(5)}</td><td>${d === 0 ? '🎯' : d}</td><td>${f.id ? `<a href="#r-${f.id}">${esc(f.name)}</a>` : esc(f.name)}</td></tr>`);
    }
    app.innerHTML = `<a href="#today" class="back">← Heute</a><h1>Plan: ${esc(job.name)}</h1>
      <p class="sub">Jeden Tag: fällige Karten unter Heute + die Fokus-Runde unten. Letzte 2 Tage: keine neuen Themen.</p>
      <table class="bt"><tr><th>Datum</th><th>Tage</th><th>Fokus</th></tr>${rows.join('')}</table>`;
  }

  // ---------- DRILL ----------
  let tick = 0;
  function drill(id, fromQueue) {
    const c = card(id); if (!c) return todayView();
    clearInterval(tick);
    const r = round(c.round), s = cardState(id);
    const techs = c.tech.map(t => `<a class="chip" href="#t-${t}">${esc(techOf(t).name)}</a>`).join(' ');
    app.innerHTML = `<a href="${fromQueue ? '#today' : '#r-' + r.id}" class="back">← ${fromQueue ? 'Heute' : esc(r.name)}</a>
      <p class="sub"><a href="#r-${r.id}">Runde ${r.n}: ${esc(r.name)}</a> ${PROOF[c.proof] || ''} ${s ? `· Stufe ${s.box}` : ''}</p>
      <section class="card ask"><div class="label">Frage</div><p class="q">${esc(c.q)}</p>
        ${c.en ? `<details class="en"><summary>Englisch</summary><p>${esc(c.en)}</p></details>` : ''}
        ${c.project ? `<p class="small">Nimm dein Projekt: <b>${esc(c.project)}</b></p>` : ''}</section>
      <details class="step reveal" id="ans" open><summary>Antwort</summary><div class="body">
        <div class="levels">${[['l1', '30 s'], ['l2', '90 s'], ['l3', '3 min']].filter(([k]) => c[k]).map(([k, l], i) => `<button class="lv ${i ? '' : 'on'}" data-lv="${k}">${l}</button>`).join('')}</div>
        ${['l1', 'l2', 'l3'].filter(k => c[k]).map((k, i) => `<div class="lvbody" data-body="${k}" ${i ? 'hidden' : ''}>${c[k]}</div>`).join('')}
        ${c.follow.length ? `<h3>Nachfragen</h3>${c.follow.map(f => `<details class="fu"><summary>${esc(f.q)}</summary>${f.a ? `<p>${f.a}</p>` : '<p class="small">Beantworte sie laut in 30 Sekunden.</p>'}</details>`).join('')}` : ''}
        ${c.dont ? `<h3>Nicht sagen</h3><div class="dont">${c.dont}</div>` : ''}
        ${c.words ? `<h3>Wörter</h3><div class="words">${c.words}</div>` : ''}
        <p class="techs">${techs}</p>
      </div></details>`;
    // levels
    $$('.lv').forEach(b => b.onclick = () => { $$('.lv').forEach(x => x.classList.toggle('on', x === b)); $$('.lvbody').forEach(x => x.hidden = x.dataset.body !== b.dataset.lv); });
  }

  // ---------- JOB ----------
  const norm = s => ' ' + s.toLowerCase().replace(/[^a-z0-9äöüéèàç#+./\- ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  function analyse(text) {
    const t = norm(text);
    const has = a => { const x = a.toLowerCase(); return /^[a-z0-9]/.test(x) ? new RegExp(`[^a-z0-9]${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9]`).test(t) : t.includes(x); };
    const techs = TS().filter(x => x.aliases.some(has)).map(x => x.id);
    const r = new Set(['phone', 'hr', 'project', 'tech', 'behaviour', 'final']);
    if (/develop|entwickl|engineer|programm|coding/.test(t)) r.add('coding');
    if (techs.includes('postgres') || techs.includes('oracle') || / sql /.test(t)) r.add('sql');
    if (/senior|lead|architekt|architect|design/.test(t)) { r.add('design'); r.add('review'); }
    if (['spark', 'lakehouse', 'modelling', 'airflow', 'dbt', 'databricks', 'iceberg'].some(x => techs.includes(x))) r.add('data');
    if (/architekt|architect|lead/.test(t)) r.add('critique');
    if (/bund|bit |isc|ejpd|ausschreibung|wto|kanton|verwaltung/.test(t)) r.add('assessment');
    if (/take.?home|hausaufgabe|case study|fallstudie/.test(t)) r.add('takehome');
    const lang = (t.match(/\b(c2|c1|b2|b1)\b/) || [])[1] || (/fliessend|fließend|verhandlungssicher|muttersprache/.test(t) ? 'fluent' : '');
    return { techs, rounds: [...r].filter(id => !round(id).hidden).sort((a, b) => round(a).n - round(b).n), lang };
  }
  function jobView(editId) {
    const list = jobs(), act = store.get('activeJob', null), ed = list.find(j => j.id === editId);
    app.innerHTML = `<h1>Stelle</h1><p class="sub">Füge ein Stelleninserat ein. Die App findet die Technologien und die wahrscheinlichen Runden und plant bis zum Interview.</p>
      <div class="card"><label>Name<br><input id="jn" placeholder="z. B. Bank X – Senior Java" value="${esc(ed ? ed.name : '')}"></label>
        <label>Interview-Datum (optional)<br><input id="jd" type="date" value="${ed && ed.date || ''}"></label>
        <label>Text des Inserats<br><textarea id="jt" rows="7" placeholder="Ganzes Inserat hier einfügen (Deutsch oder Englisch)">${esc(ed ? ed.text : '')}</textarea></label>
        <button class="btn block" id="an">Analysieren und speichern</button></div>
      ${list.length ? `<h2>Deine Stellen</h2>${list.map(j => jobCard(j, j.id === act)).join('')}` : ''}`;
    $('#an').onclick = () => {
      const text = $('#jt').value.trim(); if (!text) return toast('Zuerst das Inserat einfügen.');
      const a = analyse(text), all = jobs(), id = ed ? ed.id : 'j' + Date.now();
      const j = { id, name: $('#jn').value.trim() || 'Stelle ' + (all.length + 1), date: $('#jd').value, text, saved: ed && ed.saved || today(), ...a };
      const i = all.findIndex(x => x.id === id); if (i >= 0) all[i] = j; else all.unshift(j);
      store.set('jobs', all.slice(0, 8)); store.set('activeJob', id); toast('Gespeichert. Heute richtet sich jetzt nach dieser Stelle.'); jobView();
    };
    $$('[data-act]').forEach(b => b.onclick = () => { store.set('activeJob', b.dataset.act); jobView(); });
    $$('[data-edit]').forEach(b => b.onclick = () => jobView(b.dataset.edit));
    $$('[data-del]').forEach(b => b.onclick = () => { store.set('jobs', jobs().filter(j => j.id !== b.dataset.del)); jobView(); });
  }
  function jobCard(j, active) {
    const ts = j.techs.map(techOf).filter(Boolean);
    const proven = ts.filter(t => t.proof === 'project'), gaps = ts.filter(t => t.proof === 'study');
    const cnt = t => D.cards.filter(c => c.tech.includes(t.id)).length;
    return `<section class="card job ${active ? 'active' : ''}"><div class="label">${active ? 'Aktive Stelle' : 'Stelle'}${j.date ? ' · Interview ' + j.date : ''}</div>
      <h3>${esc(j.name)}</h3>
      ${j.lang ? `<p class="warn">Verlangtes Deutsch-Niveau: <b>${esc(j.lang.toUpperCase())}</b>. Übe diese Antworten auf Deutsch.</p>` : ''}
      <p><b>Deine Stärken hier</b> (damit beginnen):<br>${proven.map(t => `<a class="chip ok" href="#t-${t.id}">${esc(t.name)} · ${cnt(t)}</a>`).join(' ') || '–'}</p>
      <p><b>Lücken</b> (kein Projekt: Konzept lernen + ein ehrlicher Satz):<br>${gaps.map(t => `<a class="chip gap" href="#t-${t.id}">${esc(t.name)} · ${cnt(t)}</a>`).join(' ') || 'keine gefunden'}</p>
      <p><b>Wahrscheinliche Runden:</b><br>${j.rounds.map(id => `<a class="chip" href="#r-${id}">${round(id).n} ${esc(round(id).name)}</a>`).join(' ')}</p>
      <p class="small">Die Stichwortsuche ist grob. Lies das Inserat auch selbst.</p>
      <div class="row">${active ? '' : `<button class="btn" data-act="${j.id}">Aktiv setzen</button>`}<button class="btn ghost" data-edit="${j.id}">Bearbeiten</button><button class="btn ghost" data-del="${j.id}">Entfernen</button></div></section>`;
  }

  // ---------- LIBRARY ----------
  function libView() {
    const groups = {}; for (const t of TS()) (groups[t.group] ||= []).push(t);
    app.innerHTML = `<a href="#home" class="back">← Themen</a><h1>Bibliothek</h1>
      <div class="row wrap">${D.pages.map(p => `<a class="btn ghost" href="#page-${p.id}">${esc(p.title)}</a>`).join('')}<a class="btn ghost" href="#evidence">Meine Nachweise (Ausschreibungen)</a></div>
      <h2>Runden, der Reihe nach</h2><div class="card"><ul class="list">${RS().map(r => { const cs = D.cards.filter(c => c.round === r.id); return `<li><a href="#r-${r.id}"><span class="rnum">${r.n}</span><span>${esc(r.name)}<br><span class="small">${esc(r.en)}</span></span><span class="st">${cs.filter(c => isReady(c.id)).length}/${cs.length}</span></a></li>`; }).join('')}</ul></div>
      <h2>Technologien</h2>${Object.entries(groups).map(([g, ts]) => `<h3>${esc(g)}</h3><div class="chips">${ts.map(t => `<a class="chip ${t.proof === 'study' ? 'gap' : 'ok'}" href="#t-${t.id}">${esc(t.name)} · ${D.cards.filter(c => c.tech.includes(t.id)).length}</a>`).join(' ')}</div>`).join('')}`;
  }
  function roundView(id) {
    const r = round(id); if (!r) return libView();
    const cs = D.cards.filter(c => c.round === id);
    app.innerHTML = `<a href="#lib" class="back">← Bibliothek</a><h1>${r.n}. ${esc(r.name)}</h1><p class="sub">${esc(r.en)} · ${esc(r.time)} · ${esc(r.who)}</p>
      <section class="card"><div class="label">Was geprüft wird</div><p>${esc(r.tests)}</p></section>
      <section class="card frame"><div class="label">Deine Struktur (einmal lernen)</div><p class="big">${esc(r.frame)}</p></section>
      <section class="card"><div class="label">Typische Fragen</div><ul>${r.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul></section>
      <section class="card"><div class="label">Bereit, wenn</div><p>${esc(r.ready)}</p></section>
      <h2>Übungskarten (${cs.length})</h2>${cs.length ? `<div class="card"><ul class="list">${cs.map(rowCard).join('')}</ul></div>` : '<div class="card small">Für diese Runde gibt es noch keine Karten.</div>'}`;
  }
  function techView(id) {
    const t = techOf(id); if (!t) return libView();
    const cs = D.cards.filter(c => c.tech.includes(id));
    const ts = (D.topics || []).filter(x => x.tech === id);
    const dn = ts.filter(x => x.done).length;
    app.innerHTML = `<a href="#home" class="back">← Themen</a>
      <p class="kicker">${esc(t.group || '')}</p><h1 class="tech-h1">${esc(t.name)}</h1>
      <p class="meta">${PROOF[t.proof] || ''} ${t.project ? '<span>' + esc(t.project) + '</span>' : ''}</p>
      ${ts.length ? `<div class="progress-line">${bar(dn, ts.length)}<span>${dn}/${ts.length}</span></div>` : ''}
      ${t.proof === 'study' ? `<div class="honest">Noch kein Projekt damit. Im Interview ehrlich sagen: <i>„Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich. Bei uns war es ähnlich mit …“</i></div>` : ''}
      ${ts.length ? `<div class="sec-h"><h2>Alle Themen</h2><span class="cnt">${dn}/${ts.length} geschrieben</span></div><div class="card"><ul class="tlist">${ts.map(x => x.done
        ? `<li><a href="#k-${x.tech}--${x.id}"><span class="pr p${x.tier}">P${x.tier}</span><span class="tt">${esc(x.title)}${PMARK[x.proof] || ""}</span><span class="q">${x.nq || (x.qs || []).length} Fragen</span></a></li>`
        : `<li><a class="off"><span class="pr p${x.tier}">P${x.tier}</span><span class="tt">${esc(x.title)}${PMARK[x.proof] || ""}</span><span class="q">folgt</span></a></li>`).join('')}</ul></div>
        <p class="legend"><span class="pr p1">P1</span> kommt in fast jedem Interview · <span class="pr p2">P2</span> oft · <span class="pr p3">P3</span> manchmal. <b>kein Projekt</b> = keine Projekterfahrung; <b>prüfen</b> = unklar, du entscheidest.</p>` : ''}
      <div class="sec-h"><h2>Übungskarten</h2><span class="cnt">${cs.length}</span></div>${cs.length ? `<div class="card"><ul class="list">${cs.map(rowCard).join('')}</ul></div>` : '<p class="small">Noch keine Karten.</p>'}`;
  }
  // a deep topic: read everything, then test yourself (tap a question to see the answer)
  // "Zum Anschauen": max 2 outside links that show the mechanism; links only (no iframes, no tracking), at the end of the page
  function visBlock(x) {
    const v = (x.vis || []).slice(0, 2); if (!v.length) return '';
    return `<section class="vis"><h2>Zum Anschauen</h2>${v.map(e => `<div class="vis-item">
      <b>${esc(e.title)}</b><p class="small">${esc(e.why || '')} <span class="vis-src">${esc(e.source || '')}</span></p>
      <a class="btn ghost" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">Öffnen ↗</a></div>`).join('')}</section>`;
  }
  function topicView(key) {
    const [tech, id] = key.split('--'), x = (D.topics || []).find(y => y.tech === tech && y.id === id);
    if (!x || !x.done) return techView(tech);
    const list = D.topics.filter(y => y.tech === tech && y.done), i = list.indexOf(x);
    if (x.html) {
      app.innerHTML = `<a href="#t-${tech}" class="back">← ${esc(techOf(tech).name)}</a>
        <header class="topic-head"><div class="crumbs"><span>${esc(techOf(tech).name.split(/ \(| \+ /)[0])}</span></div><h1>${esc(x.title)}</h1></header>
        <article class="topic">${x.html}</article>
        ${visBlock(x)}
        <nav class="pager">${i > 0 ? `<a class="prev" href="#k-${tech}--${list[i - 1].id}"><span>← Zurück</span>${esc(list[i - 1].title)}</a>` : ""}${i < list.length - 1 ? `<a class="next" href="#k-${tech}--${list[i + 1].id}"><span>Weiter →</span>${esc(list[i + 1].title)}</a>` : ""}</nav>`;
      // tables scroll sideways on phones; step names in the Antwort-Muster are bold
      $$('.topic table', app).forEach(t => { if (t.parentElement.classList.contains('tscroll')) return; const w = document.createElement('div'); w.className = 'tscroll'; t.before(w); w.append(t); });
      $$('.topic .muster li', app).forEach(li => { const n = li.firstChild, m = n && n.nodeType === 3 && n.nodeValue.match(/^\s*([^:.<]{2,30}:)/); if (!m) return; const b = document.createElement('b'); b.textContent = m[1]; n.nodeValue = n.nodeValue.slice(m[0].length); li.insertBefore(b, n); });
      return;
    }
    const qa = (arr, cls) => arr.map(q => `<details class="qa ${cls}"><summary>${q.q}</summary><div class="ans">${q.a}</div></details>`).join('');
    app.innerHTML = `<a href="#t-${tech}" class="back">← ${esc(techOf(tech).name)}</a><h1>${esc(x.title)}</h1>
      <p class="sub">Einmal von oben bis unten lesen. Dann mit den Fragen testen.</p>
      ${x.parts.map((p, n) => `<section class="card prose tpart"><h2>${esc(p.h)}</h2>${p.html}</section>`).join('')}
      <h2>Interviewfragen (${x.qs.length})</h2><p class="small">Antwort im Kopf sagen, dann antippen und prüfen.</p>
      <div class="card">${qa(x.qs, '')}</div>
      ${x.traps.length ? `<h2>Fangfragen (${x.traps.length})</h2><div class="card">${qa(x.traps, 'trap')}</div>` : ''}
      <div class="pager">${i > 0 ? `<a class="btn ghost" href="#k-${tech}--${list[i - 1].id}">← ${esc(list[i - 1].title)}</a>` : ''}${i < list.length - 1 ? `<a class="btn" href="#k-${tech}--${list[i + 1].id}">${esc(list[i + 1].title)} →</a>` : ''}</div>`;
  }
  function pageView(id) {
    const p = D.pages.find(x => x.id === id); if (!p) return libView();
    app.innerHTML = `<a href="#lib" class="back">← Bibliothek</a><h1>${esc(p.title)}</h1><div class="card prose">${p.html}</div>`;
  }

  // ---------- EVIDENCE (tender sheets; stays on this phone) ----------
  function evidenceView() {
    const ev = store.get('evidence', []);
    const months = e => e.from && e.to ? Math.max(0, (+e.to.slice(0, 4) - +e.from.slice(0, 4)) * 12 + (+e.to.slice(5, 7) - +e.from.slice(5, 7)) + 1) : 0;
    const byTech = {}; for (const e of ev) for (const t of e.techs) byTech[t] = (byTech[t] || 0) + months(e);
    app.innerHTML = `<a href="#lib" class="back">← Bibliothek</a><h1>Meine Nachweise</h1>
      <p class="sub">Für Ausschreibungen: Jedes angegebene Jahr braucht eine Projektzeile. Das bleibt nur auf diesem Handy.</p>
      <div class="card"><label>Projekt<br><input id="ep" placeholder="z. B. BIT NABODAT"></label><label>Kunde<br><input id="ec" placeholder="z. B. BIT"></label>
        <div class="row"><label>Von<br><input id="ef" type="month"></label><label>Bis<br><input id="et" type="month"></label></div>
        <label>Technologien<br><select id="etk" multiple size="6">${D.tech.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
        <button class="btn block" id="eadd">Zeile hinzufügen</button></div>
      ${ev.length ? `<h2>Jahre pro Technologie</h2><table class="bt"><tr><th>Technologie</th><th>Monate</th></tr>${Object.entries(byTech).sort((a, b) => b[1] - a[1]).map(([t, m]) => `<tr><td>${esc(techOf(t)?.name || t)}</td><td>${m} (${(m / 12).toFixed(1)} J.)</td></tr>`).join('')}</table>
      <h2>Zeilen</h2>${ev.map((e, i) => `<div class="card"><b>${esc(e.project)}</b> · ${esc(e.client)} · ${e.from}–${e.to}<br><span class="small">${e.techs.map(t => esc(techOf(t)?.name || t)).join(', ')}</span><br><button class="btn ghost" data-rm="${i}">Entfernen</button></div>`).join('')}
      <p class="small">Überlappende Projekte zählen in den meisten Ausschreibungen nur einmal pro Monat. Prüfe die Regeln jeder Ausschreibung.</p>` : ''}`;
    $('#eadd').onclick = () => {
      const e = { project: $('#ep').value.trim(), client: $('#ec').value.trim(), from: $('#ef').value, to: $('#et').value, techs: [...$('#etk').selectedOptions].map(o => o.value) };
      if (!e.project || !e.from || !e.to) return toast('Projekt, Von und Bis sind nötig.');
      store.set('evidence', [...ev, e]); evidenceView();
    };
    $$('[data-rm]').forEach(b => b.onclick = () => { ev.splice(+b.dataset.rm, 1); store.set('evidence', ev); evidenceView(); });
  }

  // ---------- PROGRESS ----------
  function progressView() {
    const s = st(), tags = {};
    for (const x of Object.values(s)) for (const h of x.hist) if (h.tag) tags[h.tag] = (tags[h.tag] || 0) + 1;
    const weak = D.cards.filter(c => s[c.id] && lastScore(c.id) < 5);
    const ready = D.cards.filter(c => isReady(c.id)).length;
    const TIP = { knowledge: 'Die 90-s- und 3-min-Antworten nochmals lesen. Die Doku prüfen.', german: 'Die 30-s-Antwort 3-mal am Tag sagen. Die Phrasen-Seite nutzen.', structure: 'Die Struktur der Runde auswendig lernen.', practice: 'Von Hand am Laptop machen, KI aus.' };
    app.innerHTML = `<h1>Fortschritt</h1>
      <div class="card stats"><div><b>${ready}</b><br>sicher</div><div><b>${Object.keys(s).length}</b><br>begonnen</div><div><b>${D.cards.length}</b><br>Karten</div></div>
      <p class="small">Sicher = 7/8 oder mehr an zwei verschiedenen Tagen.</p>
      <h2>Nach Runde</h2><table class="bt"><tr><th>Runde</th><th>Sicher</th><th>Begonnen</th></tr>${RS().map(r => { const cs = D.cards.filter(c => c.round === r.id); return `<tr><td><a href="#r-${r.id}">${r.n}. ${esc(r.name)}</a></td><td>${cs.filter(c => isReady(c.id)).length}/${cs.length}</td><td>${cs.filter(c => s[c.id]).length}</td></tr>`; }).join('')}</table>
      ${Object.keys(tags).length ? `<h2>Was am meisten schiefgeht</h2><div class="card">${Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<p><b>${({ knowledge: 'Wissen', german: 'Deutsch', structure: 'Struktur', practice: 'Praxis' })[k] || k}</b> × ${n}<br><span class="small">${TIP[k] || ''}</span></p>`).join('')}</div>` : ''}
      ${weak.length ? `<h2>Schwache Karten</h2><div class="card"><ul class="list">${weak.map(rowCard).join('')}</ul></div>` : ''}
      <h2>Sicherung</h2>
      <p class="small">Dein Fortschritt liegt nur in diesem Browser. Kopiere den Sicherungstext, bevor du das Handy wechselst, und füge ihn auf dem neuen ein.</p>
      <div class="row"><button class="btn ghost" id="exp">Sicherungstext zeigen</button></div>
      <textarea id="bk" rows="5" placeholder="Sicherung hier einfügen, um sie zu laden"></textarea>
      <div class="row"><button class="btn ghost" id="cpy">Kopieren</button><button class="btn ghost" id="imp">Eingefügte Sicherung laden</button></div>`;
    const dump = () => { const out = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('ic:')) out[k] = localStorage.getItem(k); } } catch {} return JSON.stringify(out); };
    $('#exp').onclick = () => { $('#bk').value = dump(); $('#bk').select(); };
    $('#cpy').onclick = async () => { if (!$('#bk').value) $('#bk').value = dump(); try { await navigator.clipboard.writeText($('#bk').value); toast('Kopiert.'); } catch { $('#bk').select(); toast('Alles markieren und von Hand kopieren.'); } };
    $('#imp').onclick = () => {
      try { const o = JSON.parse($('#bk').value); let n = 0; for (const [k, v] of Object.entries(o)) if (k.startsWith('ic:')) { localStorage.setItem(k, v); n++; } toast(n ? 'Geladen.' : 'Nichts zu laden.'); progressView(); }
      catch { toast('Dieser Text ist keine Sicherung. Kopiere den ganzen Text nochmals.'); }
    };
  }

  // ---------- HOME: technologies in study order → topics → topic page ----------
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const bar = (a, b, cls = '') => `<span class="bar ${cls}" aria-hidden="true"><i style="width:${pct(a, b)}%"></i></span>`;
  const ORDER = ["postgres","search","sysdesign","networking","microservices","kafka","k8s","signals","angular","azure","spark","iceberg","dremio","lakehouse","modelling","spring","hibernate","java","rest"];
  function topicsHome() {
    const all = (D.topics || []), ids = [...new Set(all.map(t => t.tech))].filter(id => techOf(id) && !techOf(id).hidden);
    ids.sort((a, b) => ((ORDER.indexOf(a) + 1) || 99) - ((ORDER.indexOf(b) + 1) || 99));
    const done = all.filter(t => t.done).length;
    const CATS = ['Datenbanken', 'System Design', 'Backend', 'Frontend', 'Cloud', 'Platform & DevOps', 'Data Engineering', 'Architektur & Qualität', 'Coding', 'Tools', 'Arbeitsweise'];
    const cats = CATS.concat([...new Set(ids.map(id => techOf(id).group))].filter(g => !CATS.includes(g)));
    const row = id => {
      const ts = all.filter(t => t.tech === id), d = ts.filter(t => t.done).length;
      return `<li><a href="#t-${id}" class="${d ? (d === ts.length ? 'full' : '') : 'zero'}"><span class="nm">${esc(techOf(id).name)}</span>${bar(d, ts.length, 'mini')}<span class="cnt">${d}/${ts.length}</span></a></li>`;
    };
    const p1 = all.filter(t => t.tier === 1), started = ids.filter(id => all.some(t => t.tech === id && t.done)).length;
    const used = cats.filter(g => ids.some(id => techOf(id).group === g));
    app.innerHTML = `<h1>Themen</h1><p class="sub">${ids.length} Technologien · Ein Thema ganz lesen, dann mit den Fragen am Ende testen.</p>
        <button class="install install-home btn block" type="button" ${canInstall() ? '' : 'hidden'}><span aria-hidden="true">↓</span>App installieren</button>
        <p class="ios-hint" role="status" hidden></p>
        <section class="card prog"><div class="score"><b>${done}<small> / ${all.length}</small></b><span class="small">Themen geschrieben</span></div>
        ${bar(done, all.length)}
        <dl class="strip"><div><dt>P1 fertig</dt><dd>${p1.filter(t => t.done).length}<small>/${p1.length}</small></dd></div>
          <div><dt>Begonnen</dt><dd>${started}<small>/${ids.length}</small></dd></div>
          <div><dt>Gesamt</dt><dd>${pct(done, all.length)}<small>%</small></dd></div></dl></section>` + used.map((g, n) => {
      const list = ids.filter(id => techOf(id).group === g);
      const tot = all.filter(t => list.includes(t.tech)), d0 = tot.filter(t => t.done).length;
      return `<section class="cat"><h2>${esc(g)} <span class="chip">${d0}/${tot.length}</span></h2><div class="card"><ul class="tech-rows">${list.map(row).join('')}</ul></div></section>`;
    }).join('') + `<p class="foot small">Zahlen: geschriebene Themen / geplante Themen. P1 = kommt in fast jedem Interview.</p>`;
  }

  // ---------- router ----------
  function render() {
    // plain hash names (claude.ai pages only keep "#name"): #today #job #lib #progress #plan #evidence, #c-<card> #q-<card> #r-<round> #t-<tech> #page-<page>
    const h = decodeURIComponent(location.hash.slice(1)), m = h.match(/^(c|q|r|t|k|page)-(.+)$/);
    const p = m ? [m[1], m[2]] : [h === 'today' ? '' : h];
    scrollTo(0, 0); clearInterval(tick);
    if (p[0] === 'c' || p[0] === 'q') drill(p[1], p[0] === 'q');
    else if (p[0] === 'job') jobView();
    else if (p[0] === 'lib') libView();
    else if (p[0] === 'r') roundView(p[1]);
    else if (p[0] === 't') techView(p[1]);
    else if (p[0] === 'k') topicView(p[1]);
    else if (p[0] === 'page') pageView(p[1]);
    else if (p[0] === 'evidence') evidenceView();
    else if (p[0] === 'progress') progressView();
    else if (p[0] === 'plan') planView();
    else topicsHome();
    $$('.copy', app).forEach(b => b.textContent = 'Kopieren');
    const tab = { '': 'today', plan: 'today', c: 'today', q: 'today', job: 'job', lib: 'lib', r: 'lib', t: 'today', k: 'today', page: 'lib', evidence: 'lib', progress: 'progress' }[p[0]] || 'today';
    $$('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  }
  addEventListener('hashchange', render);
  fetch(($('meta[name=datav]') || {}).content || 'data.json', { cache: 'no-cache' }).then(r => r.json()).then(d => { D = d; render(); })
    .catch(() => { app.innerHTML = '<p>Konnte nicht laden. Einmal mit Internet öffnen, dann geht es auch offline.</p>'; });
})();
