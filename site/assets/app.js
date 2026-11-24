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
  function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2400); }
  document.addEventListener('click', async e => {
    const b = e.target.closest('.copy'); if (!b) return;
    const txt = b.parentElement.querySelector('code').innerText;
    try { await navigator.clipboard.writeText(txt); } catch {}
    b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1400);
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
  const round = id => D.rounds.find(r => r.id === id);
  const techOf = id => D.tech.find(t => t.id === id);
  const jobs = () => store.get('jobs', []);
  const activeJob = () => { const a = store.get('activeJob', null); return jobs().find(j => j.id === a) || null; };
  const PROOF = { project: '<span class="badge ok">project experience</span>', study: '<span class="badge study">studied only</span>' };

  // queue: due reviews first, then up to 5 new cards (job focus first, then tier, then round order)
  function queue() {
    const t = today(), s = st(), job = activeJob();
    const due = D.cards.filter(c => s[c.id] && s[c.id].due <= t).sort((a, b) => s[a.id].due.localeCompare(s[b.id].due));
    const order = r => D.rounds.findIndex(x => x.id === r);
    const fit = c => !job ? 0 : (c.tech.some(x => job.techs.includes(x)) ? 2 : 0) + (job.rounds.includes(c.round) ? 1 : 0);
    const fresh = D.cards.filter(c => !s[c.id]).sort((a, b) => fit(b) - fit(a) || a.tier - b.tier || order(a.round) - order(b.round));
    const newToday = Object.values(s).filter(x => x.hist[0] && x.hist[0].d === t).length;
    return [...due, ...fresh.slice(0, Math.max(0, 5 - newToday))];
  }

  // ---------- TODAY ----------
  function weekKey() { const d = new Date(); const j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + '-w' + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); }
  const OUTSIDE = [['mock', 'One mock interview with a real person (camera on)'], ['code1', 'Coding with AI switched off (1)'], ['code2', 'Coding with AI switched off (2)'], ['code3', 'Coding with AI switched off (3)'], ['sql', 'SQL by hand in psql (2 queries)']];
  function todayView() {
    const q = queue(), job = activeJob(), base = store.get('baseline', {}), wk = store.get('week:' + weekKey(), {});
    const baseDone = ['design', 'sql', 'coding'].every(k => base[k]);
    let plan = '';
    if (job && job.date) {
      const left = daysBetween(today(), job.date);
      plan = left < 0 ? '' : `<section class="card plan"><div class="label">Interview: ${esc(job.name)}</div>
        <p class="big">${left === 0 ? 'Today. Read your intro once, then stop studying.' : left + ' day' + (left > 1 ? 's' : '') + ' left'}</p>
        ${left > 0 ? `<p>Today's focus: <b>${esc(planFor(job, left).name)}</b></p>` : ''}
        <a href="#plan" class="small">See the day-by-day plan →</a></section>`;
    }
    app.innerHTML = `<h1>Today</h1>
      ${!job ? `<div class="card hint"><b>No job yet.</b> Paste a job ad in <a href="#job">Job</a>. Then the app picks the right rounds and technologies.</div>` : ''}
      ${plan}
      ${!baseDone ? `<section class="card"><div class="label">Week 1: baseline (do this once)</div>
        <p>Do 3 tasks cold, without looking anything up. Then you know where you really are.</p>
        ${[['design', 'System design: image upload + search', '#c-design-image-search'], ['sql', 'SQL: top 3 per group, by hand', '#page-practice'], ['coding', 'Coding: 1 easy problem, AI off', '#page-practice']].map(([k, t, h]) => `<label class="check"><input type="checkbox" data-base="${k}" ${base[k] ? 'checked' : ''}> <a href="${h}">${t}</a></label>`).join('')}</section>` : ''}
      <h2>Practise aloud (${q.length})</h2>
      ${q.length ? `<a class="btn block" href="#q-${q[0].id}">Start</a><div class="card"><ul class="list">${q.map(rowCard).join('')}</ul></div>` : '<div class="card">Nothing due. Well done. Open the Library for more.</div>'}
      <h2>Outside the app this week</h2>
      <div class="card">${OUTSIDE.map(([k, t]) => `<label class="check"><input type="checkbox" data-wk="${k}" ${wk[k] ? 'checked' : ''}> ${t}</label>`).join('')}
        <p class="small">The app cannot do these for you. They are the real training.</p></div>`;
    $$('[data-base]').forEach(i => i.onchange = () => { const b = store.get('baseline', {}); b[i.dataset.base] = i.checked; store.set('baseline', b); });
    $$('[data-wk]').forEach(i => i.onchange = () => { const k = 'week:' + weekKey(), w = store.get(k, {}); w[i.dataset.wk] = i.checked; store.set(k, w); });
  }
  function rowCard(c) {
    const s = cardState(c.id), ls = lastScore(c.id);
    const tag = isReady(c.id) ? '<span class="st ok">ready</span>' : s ? `<span class="st ${ls >= 7 ? 'ok' : ls >= 5 ? 'mid' : 'bad'}">${ls}/8</span>` : '<span class="st new">new</span>';
    return `<li><a href="#c-${c.id}"><span class="rnum">${round(c.round).n}</span><span>${esc(c.q)}</span>${tag}</a></li>`;
  }

  // ---------- PLAN (interview date → one focus per day) ----------
  function planDays(job) {
    const rs = D.rounds.filter(r => job.rounds.includes(r.id) && r.id !== 'final');
    return rs.length ? rs : D.rounds.slice(0, 4);
  }
  function planFor(job, left) {
    if (left <= 1) return { name: 'Full mock: intro, 1 project, 3 tech questions. Then rest.' };
    const rs = planDays(job), i = Math.max(0, daysBetween(job.saved || today(), addDays(job.date, -left)));
    return rs[i % rs.length];
  }
  function planView() {
    const job = activeJob();
    if (!job || !job.date) { app.innerHTML = `<h1>Plan</h1><div class="card">Add a job with an interview date in <a href="#job">Job</a>.</div>`; return; }
    const left = daysBetween(today(), job.date), rows = [];
    for (let d = left; d >= 0; d--) {
      const day = addDays(job.date, -d);
      const f = d === 0 ? { name: 'Interview day. Read your intro once. No new topics.' } : planFor(job, d);
      rows.push(`<tr${d === left ? ' class="now"' : ''}><td>${day.slice(5)}</td><td>${d === 0 ? '🎯' : d}</td><td>${f.id ? `<a href="#r-${f.id}">${esc(f.name)}</a>` : esc(f.name)}</td></tr>`);
    }
    app.innerHTML = `<a href="#today" class="small">← Today</a><h1>Plan: ${esc(job.name)}</h1>
      <p class="sub">Every day: due cards in Today + the focus round below. Last 2 days: no new topics.</p>
      <table class="bt"><tr><th>Date</th><th>Days left</th><th>Focus</th></tr>${rows.join('')}</table>`;
  }

  // ---------- DRILL ----------
  let tick = 0;
  function drill(id, fromQueue) {
    const c = card(id); if (!c) return todayView();
    clearInterval(tick);
    const r = round(c.round), s = cardState(id);
    const techs = c.tech.map(t => `<a class="chip" href="#t-${t}">${esc(techOf(t).name)}</a>`).join(' ');
    app.innerHTML = `<a href="${fromQueue ? '#today' : '#r-' + r.id}" class="small">← ${fromQueue ? 'Today' : esc(r.name)}</a>
      <p class="sub"><a href="#r-${r.id}">Round ${r.n}: ${esc(r.name)}</a> ${PROOF[c.proof] || ''} ${s ? `· box ${s.box}` : ''}</p>
      <section class="card ask"><div class="label">Question</div><p class="q">${esc(c.q)}</p>
        ${c.en ? `<details class="en"><summary>English</summary><p>${esc(c.en)}</p></details>` : ''}
        ${c.project ? `<p class="small">Use your project: <b>${esc(c.project)}</b></p>` : ''}</section>
      <div class="card timer"><span id="tm">0:00</span><div class="row"><button class="btn" id="go">Start · speak aloud</button><button class="btn ghost" id="stop">Stop</button></div>
        <p class="small">Say the 30-second answer. If you can, go on to 90 seconds and 3 minutes. Then open the answer.</p></div>
      <details class="step reveal" id="ans"><summary>Show the answer</summary><div class="body">
        <div class="levels">${[['l1', '30 s'], ['l2', '90 s'], ['l3', '3 min']].filter(([k]) => c[k]).map(([k, l], i) => `<button class="lv ${i ? '' : 'on'}" data-lv="${k}">${l}</button>`).join('')}</div>
        ${['l1', 'l2', 'l3'].filter(k => c[k]).map((k, i) => `<div class="lvbody" data-body="${k}" ${i ? 'hidden' : ''}>${c[k]}</div>`).join('')}
        ${c.follow.length ? `<h3>Follow-up questions</h3>${c.follow.map(f => `<details class="fu"><summary>${esc(f.q)}</summary>${f.a ? `<p>${f.a}</p>` : '<p class="small">Answer it aloud in 30 seconds.</p>'}</details>`).join('')}` : ''}
        ${c.dont ? `<h3>Don't say</h3><div class="dont">${c.dont}</div>` : ''}
        ${c.words ? `<h3>Words</h3><div class="words">${c.words}</div>` : ''}
        <p class="techs">${techs}</p>
      </div></details>
      <section class="card grade"><div class="label">Grade yourself (0–2 each)</div>
        ${[['k', 'ZK14 Knowledge', 'Correct, exact, with depth'], ['c', 'ZK15 Calm', 'No panic, honest about gaps'], ['l', 'ZK16 Language', 'Short clear sentences, right level'], ['p', 'ZK17 Preparation', 'Project + number + link to the job']].map(([k, n, h]) => `<div class="gr"><div><b>${n}</b><br><span class="small">${h}</span></div><div class="seg" data-k="${k}">${[0, 1, 2].map(v => `<button data-v="${v}">${v}</button>`).join('')}</div></div>`).join('')}
        <div id="why" hidden><p class="small"><b>What went wrong most?</b></p><div class="seg" data-k="tag">${[['knowledge', 'Knowledge'], ['german', 'German'], ['structure', 'Structure'], ['practice', 'Hands-on']].map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('')}</div></div>
        <button class="btn block good" id="save" disabled>Save</button></section>`;
    // timer
    let t0 = 0; const tm = $('#tm');
    $('#go').onclick = () => { t0 = Date.now(); clearInterval(tick); tick = setInterval(() => { const x = Math.floor((Date.now() - t0) / 1000); tm.textContent = `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`; tm.className = x > 180 ? 'over' : x >= 30 ? 'ok' : ''; }, 250); };
    $('#stop').onclick = () => clearInterval(tick);
    // levels
    $$('.lv').forEach(b => b.onclick = () => { $$('.lv').forEach(x => x.classList.toggle('on', x === b)); $$('.lvbody').forEach(x => x.hidden = x.dataset.body !== b.dataset.lv); });
    // grading
    const g = {};
    const total = () => ['k', 'c', 'l', 'p'].reduce((a, k) => a + (g[k] ?? 0), 0);
    $$('.seg button').forEach(b => b.onclick = () => {
      const k = b.parentElement.dataset.k; g[k] = k === 'tag' ? b.dataset.v : +b.dataset.v;
      $$('button', b.parentElement).forEach(x => x.classList.toggle('on', x === b));
      const all = ['k', 'c', 'l', 'p'].every(x => g[x] !== undefined);
      $('#why').hidden = !(all && total() < 7);
      $('#save').disabled = !all || (total() < 7 && !g.tag);
      if (all) $('#save').textContent = `Save ${total()}/8`;
    });
    $('#save').onclick = () => {
      clearInterval(tick);
      const s2 = saveGrade(id, total(), g.tag);
      toast(total() >= 7 ? `Good. Back in ${GAP[s2.box]} days.` : total() >= 5 ? 'Almost. Back in a few days.' : 'Back tomorrow. That is normal.');
      if (fromQueue) { const n = queue().find(x => x.id !== id); location.hash = n ? `#q-${n.id}` : '#today'; }
      else location.hash = '#r-' + r.id;
    };
  }

  // ---------- JOB ----------
  const norm = s => ' ' + s.toLowerCase().replace(/[^a-z0-9äöüéèàç#+./\- ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  function analyse(text) {
    const t = norm(text);
    const has = a => { const x = a.toLowerCase(); return /^[a-z0-9]/.test(x) ? new RegExp(`[^a-z0-9]${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9]`).test(t) : t.includes(x); };
    const techs = D.tech.filter(x => x.aliases.some(has)).map(x => x.id);
    const r = new Set(['phone', 'hr', 'project', 'tech', 'behaviour', 'final']);
    if (/develop|entwickl|engineer|programm|coding/.test(t)) r.add('coding');
    if (techs.includes('postgres') || techs.includes('oracle') || / sql /.test(t)) r.add('sql');
    if (/senior|lead|architekt|architect|design/.test(t)) { r.add('design'); r.add('review'); }
    if (['spark', 'lakehouse', 'modelling', 'airflow', 'dbt', 'databricks', 'iceberg'].some(x => techs.includes(x))) r.add('data');
    if (/architekt|architect|lead/.test(t)) r.add('critique');
    if (/bund|bit |isc|ejpd|ausschreibung|wto|kanton|verwaltung/.test(t)) r.add('assessment');
    if (/take.?home|hausaufgabe|case study|fallstudie/.test(t)) r.add('takehome');
    const lang = (t.match(/\b(c2|c1|b2|b1)\b/) || [])[1] || (/fliessend|fließend|verhandlungssicher|muttersprache/.test(t) ? 'fluent' : '');
    return { techs, rounds: [...r].sort((a, b) => round(a).n - round(b).n), lang };
  }
  function jobView(editId) {
    const list = jobs(), act = store.get('activeJob', null), ed = list.find(j => j.id === editId);
    app.innerHTML = `<h1>Job</h1><p class="sub">Paste a job ad. The app finds the technologies and the likely rounds, and plans until the interview.</p>
      <div class="card"><label>Name<br><input id="jn" placeholder="e.g. Bank X – Senior Java" value="${esc(ed ? ed.name : '')}"></label>
        <label>Interview date (optional)<br><input id="jd" type="date" value="${ed && ed.date || ''}"></label>
        <label>Job ad text<br><textarea id="jt" rows="7" placeholder="Paste the whole ad here (German or English)">${esc(ed ? ed.text : '')}</textarea></label>
        <button class="btn block" id="an">Analyse and save</button></div>
      ${list.length ? `<h2>Your jobs</h2>${list.map(j => jobCard(j, j.id === act)).join('')}` : ''}`;
    $('#an').onclick = () => {
      const text = $('#jt').value.trim(); if (!text) return toast('Paste the job ad first.');
      const a = analyse(text), all = jobs(), id = ed ? ed.id : 'j' + Date.now();
      const j = { id, name: $('#jn').value.trim() || 'Job ' + (all.length + 1), date: $('#jd').value, text, saved: ed && ed.saved || today(), ...a };
      const i = all.findIndex(x => x.id === id); if (i >= 0) all[i] = j; else all.unshift(j);
      store.set('jobs', all.slice(0, 8)); store.set('activeJob', id); toast('Saved. Today now follows this job.'); jobView();
    };
    $$('[data-act]').forEach(b => b.onclick = () => { store.set('activeJob', b.dataset.act); jobView(); });
    $$('[data-edit]').forEach(b => b.onclick = () => jobView(b.dataset.edit));
    $$('[data-del]').forEach(b => b.onclick = () => { store.set('jobs', jobs().filter(j => j.id !== b.dataset.del)); jobView(); });
  }
  function jobCard(j, active) {
    const ts = j.techs.map(techOf).filter(Boolean);
    const proven = ts.filter(t => t.proof === 'project'), gaps = ts.filter(t => t.proof === 'study');
    const cnt = t => D.cards.filter(c => c.tech.includes(t.id)).length;
    return `<section class="card job ${active ? 'active' : ''}"><div class="label">${active ? 'Active job' : 'Job'}${j.date ? ' · interview ' + j.date : ''}</div>
      <h3>${esc(j.name)}</h3>
      ${j.lang ? `<p class="warn">German level asked: <b>${esc(j.lang.toUpperCase())}</b>. Practise these answers in German.</p>` : ''}
      <p><b>Your strengths here</b> (lead with these):<br>${proven.map(t => `<a class="chip ok" href="#t-${t.id}">${esc(t.name)} · ${cnt(t)}</a>`).join(' ') || '–'}</p>
      <p><b>Gaps</b> (no project, study the concept + one honest sentence):<br>${gaps.map(t => `<a class="chip gap" href="#t-${t.id}">${esc(t.name)} · ${cnt(t)}</a>`).join(' ') || 'none found'}</p>
      <p><b>Likely rounds:</b><br>${j.rounds.map(id => `<a class="chip" href="#r-${id}">${round(id).n} ${esc(round(id).name)}</a>`).join(' ')}</p>
      <p class="small">Keyword matching is rough. Read the ad yourself too.</p>
      <div class="row">${active ? '' : `<button class="btn" data-act="${j.id}">Make active</button>`}<button class="btn ghost" data-edit="${j.id}">Edit</button><button class="btn ghost" data-del="${j.id}">Remove</button></div></section>`;
  }

  // ---------- LIBRARY ----------
  function libView() {
    const groups = {}; for (const t of D.tech) (groups[t.group] ||= []).push(t);
    app.innerHTML = `<h1>Library</h1>
      <div class="row wrap">${D.pages.map(p => `<a class="btn ghost" href="#page-${p.id}">${esc(p.title)}</a>`).join('')}<a class="btn ghost" href="#evidence">My evidence (tenders)</a></div>
      <h2>Rounds, in order</h2><div class="card"><ul class="list">${D.rounds.map(r => { const cs = D.cards.filter(c => c.round === r.id); return `<li><a href="#r-${r.id}"><span class="rnum">${r.n}</span><span>${esc(r.name)}<br><span class="small">${esc(r.en)}</span></span><span class="st">${cs.filter(c => isReady(c.id)).length}/${cs.length}</span></a></li>`; }).join('')}</ul></div>
      <h2>Technologies</h2>${Object.entries(groups).map(([g, ts]) => `<h3>${esc(g)}</h3><div class="chips">${ts.map(t => `<a class="chip ${t.proof === 'study' ? 'gap' : 'ok'}" href="#t-${t.id}">${esc(t.name)} · ${D.cards.filter(c => c.tech.includes(t.id)).length}</a>`).join(' ')}</div>`).join('')}`;
  }
  function roundView(id) {
    const r = round(id); if (!r) return libView();
    const cs = D.cards.filter(c => c.round === id);
    app.innerHTML = `<a href="#lib" class="small">← Library</a><h1>${r.n}. ${esc(r.name)}</h1><p class="sub">${esc(r.en)} · ${esc(r.time)} · ${esc(r.who)}</p>
      <section class="card"><div class="label">What they check</div><p>${esc(r.tests)}</p></section>
      <section class="card frame"><div class="label">Your structure (learn this once)</div><p class="big">${esc(r.frame)}</p></section>
      <section class="card"><div class="label">Typical questions</div><ul>${r.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul></section>
      <section class="card"><div class="label">Ready when</div><p>${esc(r.ready)}</p></section>
      <h2>Practice cards (${cs.length})</h2>${cs.length ? `<div class="card"><ul class="list">${cs.map(rowCard).join('')}</ul></div>` : '<div class="card small">No cards yet for this round.</div>'}`;
  }
  function techView(id) {
    const t = techOf(id); if (!t) return libView();
    const cs = D.cards.filter(c => c.tech.includes(id));
    const ts = (D.topics || []).filter(x => x.tech === id);
    app.innerHTML = `<a href="#lib" class="small">← Library</a><h1>${esc(t.name)}</h1>
      <p class="sub">${PROOF[t.proof]} ${t.project ? '· ' + esc(t.project) : ''}</p>
      ${t.proof === 'study' ? `<div class="card hint">No project with this yet. In the interview say it honestly: <i>„Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich. Bei uns war es ähnlich mit …“</i></div>` : ''}
      ${ts.length ? `<h2>Learn: all topics (${ts.filter(x => x.done).length}/${ts.length} written)</h2><div class="card"><ul class="list">${ts.map(x => x.done
        ? `<li><a href="#k-${x.tech}--${x.id}"><span class="rnum">${x.tier}</span><span>${esc(x.title)}</span><span class="st">${x.nq || (x.qs || []).length} Q</span></a></li>`
        : `<li><a class="off"><span class="rnum">${x.tier}</span><span>${esc(x.title)}</span><span class="st new">coming</span></a></li>`).join('')}</ul>
        <p class="small">The number in the circle is the priority: 1 = asked in almost every interview.</p></div>` : ''}
      <h2>Practice cards (${cs.length})</h2>${cs.length ? `<div class="card"><ul class="list">${cs.map(rowCard).join('')}</ul></div>` : '<div class="card small">No cards yet.</div>'}`;
  }
  // a deep topic: read everything, then test yourself (tap a question to see the answer)
  function topicView(key) {
    const [tech, id] = key.split('--'), x = (D.topics || []).find(y => y.tech === tech && y.id === id);
    if (!x || !x.done) return techView(tech);
    const list = D.topics.filter(y => y.tech === tech && y.done), i = list.indexOf(x);
    if (x.html) {
      app.innerHTML = `<a href="#t-${tech}" class="small">← ${esc(techOf(tech).name)}</a><h1>${esc(x.title)}</h1><article class="topic">${x.html}</article>
        <div class="pager">${i > 0 ? `<a class="btn ghost" href="#k-${tech}--${list[i - 1].id}">← ${esc(list[i - 1].title)}</a>` : ""}${i < list.length - 1 ? `<a class="btn" href="#k-${tech}--${list[i + 1].id}">${esc(list[i + 1].title)} →</a>` : ""}</div>`;
      return;
    }
    const qa = (arr, cls) => arr.map(q => `<details class="qa ${cls}"><summary>${q.q}</summary><div class="ans">${q.a}</div></details>`).join('');
    app.innerHTML = `<a href="#t-${tech}" class="small">← ${esc(techOf(tech).name)}</a><h1>${esc(x.title)}</h1>
      <p class="sub">Read it once from top to bottom. Then test yourself with the questions.</p>
      ${x.parts.map((p, n) => `<section class="card prose tpart"><h2>${esc(p.h)}</h2>${p.html}</section>`).join('')}
      <h2>Interview questions (${x.qs.length})</h2><p class="small">Say your answer in your head, then tap to check.</p>
      <div class="card">${qa(x.qs, '')}</div>
      ${x.traps.length ? `<h2>Trick questions (${x.traps.length})</h2><div class="card">${qa(x.traps, 'trap')}</div>` : ''}
      <div class="pager">${i > 0 ? `<a class="btn ghost" href="#k-${tech}--${list[i - 1].id}">← ${esc(list[i - 1].title)}</a>` : ''}${i < list.length - 1 ? `<a class="btn" href="#k-${tech}--${list[i + 1].id}">${esc(list[i + 1].title)} →</a>` : ''}</div>`;
  }
  function pageView(id) {
    const p = D.pages.find(x => x.id === id); if (!p) return libView();
    app.innerHTML = `<a href="#lib" class="small">← Library</a><h1>${esc(p.title)}</h1><div class="card prose">${p.html}</div>`;
  }

  // ---------- EVIDENCE (tender sheets; stays on this phone) ----------
  function evidenceView() {
    const ev = store.get('evidence', []);
    const months = e => e.from && e.to ? Math.max(0, (+e.to.slice(0, 4) - +e.from.slice(0, 4)) * 12 + (+e.to.slice(5, 7) - +e.from.slice(5, 7)) + 1) : 0;
    const byTech = {}; for (const e of ev) for (const t of e.techs) byTech[t] = (byTech[t] || 0) + months(e);
    app.innerHTML = `<a href="#lib" class="small">← Library</a><h1>My evidence</h1>
      <p class="sub">For tender sheets: every year you claim needs a project row. This stays on this phone only.</p>
      <div class="card"><label>Project<br><input id="ep" placeholder="e.g. BIT NABODAT"></label><label>Client<br><input id="ec" placeholder="e.g. BIT"></label>
        <div class="row"><label>From<br><input id="ef" type="month"></label><label>To<br><input id="et" type="month"></label></div>
        <label>Technologies<br><select id="etk" multiple size="6">${D.tech.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
        <button class="btn block" id="eadd">Add row</button></div>
      ${ev.length ? `<h2>Years per technology</h2><table class="bt"><tr><th>Technology</th><th>Months</th></tr>${Object.entries(byTech).sort((a, b) => b[1] - a[1]).map(([t, m]) => `<tr><td>${esc(techOf(t)?.name || t)}</td><td>${m} (${(m / 12).toFixed(1)} y)</td></tr>`).join('')}</table>
      <h2>Rows</h2>${ev.map((e, i) => `<div class="card"><b>${esc(e.project)}</b> · ${esc(e.client)} · ${e.from}–${e.to}<br><span class="small">${e.techs.map(t => esc(techOf(t)?.name || t)).join(', ')}</span><br><button class="btn ghost" data-rm="${i}">Remove</button></div>`).join('')}
      <p class="small">Overlapping projects count only once per month in most tenders. Check the rules of each tender.</p>` : ''}`;
    $('#eadd').onclick = () => {
      const e = { project: $('#ep').value.trim(), client: $('#ec').value.trim(), from: $('#ef').value, to: $('#et').value, techs: [...$('#etk').selectedOptions].map(o => o.value) };
      if (!e.project || !e.from || !e.to) return toast('Project, from and to are needed.');
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
    const TIP = { knowledge: 'Read the 90 s and 3 min answers again. Check the docs.', german: 'Say the 30 s answer 3 times a day. Use the phrase page.', structure: 'Learn the round structure by heart.', practice: 'Do it by hand on the laptop, AI off.' };
    app.innerHTML = `<h1>Progress</h1>
      <div class="card stats"><div><b>${ready}</b><br>ready</div><div><b>${Object.keys(s).length}</b><br>started</div><div><b>${D.cards.length}</b><br>cards</div></div>
      <p class="small">Ready = 7/8 or more on two different days.</p>
      <h2>By round</h2><table class="bt"><tr><th>Round</th><th>Ready</th><th>Started</th></tr>${D.rounds.map(r => { const cs = D.cards.filter(c => c.round === r.id); return `<tr><td><a href="#r-${r.id}">${r.n}. ${esc(r.name)}</a></td><td>${cs.filter(c => isReady(c.id)).length}/${cs.length}</td><td>${cs.filter(c => s[c.id]).length}</td></tr>`; }).join('')}</table>
      ${Object.keys(tags).length ? `<h2>What goes wrong most</h2><div class="card">${Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<p><b>${k}</b> × ${n}<br><span class="small">${TIP[k] || ''}</span></p>`).join('')}</div>` : ''}
      ${weak.length ? `<h2>Weak cards</h2><div class="card"><ul class="list">${weak.map(rowCard).join('')}</ul></div>` : ''}
      <h2>Backup</h2>
      <p class="small">Your progress lives only in this browser. Copy the backup text before you change phone, and paste it on the new one.</p>
      <div class="row"><button class="btn ghost" id="exp">Show backup text</button></div>
      <textarea id="bk" rows="5" placeholder="Paste a backup here to import it"></textarea>
      <div class="row"><button class="btn ghost" id="cpy">Copy</button><button class="btn ghost" id="imp">Import pasted backup</button></div>`;
    const dump = () => { const out = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('ic:')) out[k] = localStorage.getItem(k); } } catch {} return JSON.stringify(out); };
    $('#exp').onclick = () => { $('#bk').value = dump(); $('#bk').select(); };
    $('#cpy').onclick = async () => { if (!$('#bk').value) $('#bk').value = dump(); try { await navigator.clipboard.writeText($('#bk').value); toast('Copied.'); } catch { $('#bk').select(); toast('Select all and copy by hand.'); } };
    $('#imp').onclick = () => {
      try { const o = JSON.parse($('#bk').value); let n = 0; for (const [k, v] of Object.entries(o)) if (k.startsWith('ic:')) { localStorage.setItem(k, v); n++; } toast(n ? 'Imported.' : 'Nothing to import.'); progressView(); }
      catch { toast('That text is not a backup. Copy the whole text again.'); }
    };
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
    else todayView();
    const tab = { '': 'today', plan: 'today', c: 'today', q: 'today', job: 'job', lib: 'lib', r: 'lib', t: 'lib', k: 'lib', page: 'lib', evidence: 'lib', progress: 'progress' }[p[0]] || 'today';
    $$('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  }
  addEventListener('hashchange', render);
  fetch(($('meta[name=datav]') || {}).content || 'data.json', { cache: 'no-cache' }).then(r => r.json()).then(d => { D = d; render(); })
    .catch(() => { app.innerHTML = '<p>Could not load. Open once with internet, then it works offline.</p>'; });
})();
