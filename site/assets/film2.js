// Teaching films v2 (flat blocks on a Canvas 2D). Mount: <div data-film2="<id>"></div> inside #app.
// media/<id>-film.json = sentences with start times, chapters, questions; media/<id>.mp3 = the voice.
// The picture is create(J).render(ctx, t): a pure function of time, so seeking and the reduced-motion still are free.
// Same controls as the v1 player (film.js): play/pause, seek, time, ±10 s, speed, volume (Web Audio gain), full screen, chapters, questions, captions.
const SCENES = { 'java-hashmap-1': './film2-hm1.js?f=2' };
const VER = '1';   // bump when a film is re-recorded: the service worker caches media files for good
const SC = 3, LW = 390, LH = 560;   // canvas = 3x of the logical 390 x 560 picture
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function build(host, id) {
  host.classList.add('motion', 'f2');
  host.innerHTML = `<div class="mwrap"><canvas width="${LW * SC}" height="${LH * SC}" aria-hidden="true"></canvas><button type="button" class="mbig" aria-label="Film abspielen">▶</button></div>
    <div class="mctl"><button type="button" class="mpp" aria-label="Abspielen oder Pause">▶</button><input class="mseek" type="range" min="0" max="1000" value="0" aria-label="Position"><span class="mtime">0:00</span></div>
    <div class="mctl mctl2"><button type="button" class="mback" aria-label="10 Sekunden zurück">⟲ 10</button><button type="button" class="mfwd" aria-label="10 Sekunden vor">10 ⟳</button><button type="button" class="mspd" aria-label="Geschwindigkeit">1×</button><span class="mvolbox"><button type="button" class="msnd" aria-label="Ton an oder aus">🔇</button><input class="mvol" type="range" min="0" max="100" value="80" aria-label="Lautstärke"></span><button type="button" class="mfs" aria-label="Vollbild">⛶</button></div>
    <p class="mcap" aria-live="polite"></p>`;
  const media = f => new URL(`../media/${f}?v=${VER}`, import.meta.url);
  const [J, mod] = await Promise.all([fetch(media(id + '-film.json')).then(r => { if (!r.ok) throw new Error('film ' + r.status); return r.json(); }), import(SCENES[id])]);
  const scene = mod.create(J), END = J.end;
  const $ = q => host.querySelector(q);
  $('.mwrap').insertAdjacentHTML('beforeend', '<div class="mq" hidden></div>');
  const chs = J.phrases.filter(p => p.ch);
  $('.mcap').insertAdjacentHTML('beforebegin', `<div class="mchap" role="group" aria-label="Kapitel">${chs.map(p => `<button type="button" data-t="${p.t}">${esc(p.ch)}</button>`).join('')}</div>`);
  const phAt = t => { let c = null; for (const p of J.phrases) { if (t < p.t) break; c = p; } return c; };
  // captions: key words coloured like the picture (J.kw = {r:[…], g:[…], o:[…], b:[…]})
  const KW = Object.entries(J.kw || {}).flatMap(([c, ws]) => ws.map(w => [w, c])).sort((x, y) => y[0].length - x[0].length), kwC = Object.fromEntries(KW);
  const kwRe = KW.length ? new RegExp('(^|[^\\w-])(' + KW.map(k => k[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\w-])', 'g') : null;
  const capHtml = s0 => (kwRe ? esc(s0).replace(kwRe, (m, pre, w) => `${pre}<b class="k${kwC[w]}">${w}</b>`) : esc(s0));
  const cv = $('canvas'), ctx = cv.getContext('2d'), cap = $('.mcap'), big = $('.mbig'), pp = $('.mpp'), bar = $('.mseek'), time = $('.mtime'), snd = $('.msnd'), fs = $('.mfs'), vol = $('.mvol'), spd = $('.mspd');
  const pref = (k, d) => { try { const v = JSON.parse(localStorage.getItem('ic:film-' + k)); return v ?? d; } catch { return d; } };
  const keep = (k, v) => { try { localStorage.setItem('ic:film-' + k, JSON.stringify(v)); } catch {} };
  let raf = 0, playing = false, T = 0, last = 0, muted = true, rate = pref('rate', 1), gain = null;
  const RATES = [.75, 1, 1.25, 1.5]; if (!RATES.includes(rate)) rate = 1;
  const audio = new Audio(media(id + '.mp3').href); audio.preload = 'auto';
  vol.value = Math.round(pref('vol', .8) * 100);
  // volume through the Web Audio mixer: iPhones ignore audio.volume, a gain node works everywhere
  const applyVol = () => { const v = vol.value / 100; keep('vol', v); if (gain) gain.gain.value = v * v; else audio.volume = v; snd.textContent = muted || v === 0 ? '🔇' : v < .5 ? '🔉' : '🔊'; };
  const mixer = () => { if (gain) return; try { const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(); const src = ac.createMediaElementSource(audio); gain = ac.createGain(); src.connect(gain).connect(ac.destination); ac.resume?.(); } catch { gain = null; } applyVol(); };
  const setRate = r => { rate = r; keep('rate', r); spd.textContent = (r === 1 ? '1' : String(r)) + '×'; audio.playbackRate = r; };
  setRate(rate);
  const syncAudio = () => { audio.playbackRate = rate; if (playing && !muted) { if (Math.abs(audio.currentTime - T) > .3) try { audio.currentTime = T; } catch {} audio.play().catch(() => {}); } else audio.pause(); };
  const soundOn = on => { muted = !on; if (on) { mixer(); if (vol.value == 0) vol.value = 60; } applyVol(); syncAudio(); };
  snd.onclick = () => soundOn(muted);
  vol.oninput = () => { if (muted && vol.value > 0) soundOn(true); else applyVol(); };
  spd.onclick = () => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]);
  const showCap = t => {
    const c = phAt(t);
    if (!c) { cap.style.opacity = 0; return; }
    if (cap.dataset.s !== c.cap) { cap.dataset.s = c.cap; cap.innerHTML = capHtml(c.cap); }
    cap.style.opacity = Math.min(1, (t - c.t) / .4 + .2);
  };
  const qEl = $('.mq'), qDone = new Set(), chB = [...host.querySelectorAll('.mchap button')];
  let chOn = null;
  const extras = t => {
    let on = null; for (const b of chB) if (+b.dataset.t <= t + .01) on = b;
    if (on !== chOn) { chB.forEach(b => b.classList.toggle('on', b === on)); chOn = on; if (on) { const box = on.parentElement; box.scrollLeft = on.offsetLeft - box.offsetLeft - 40; } }
  };
  const frame = t => {
    ctx.setTransform(SC, 0, 0, SC, 0, 0); scene.render(ctx, t);
    showCap(t); extras(t); if (!bar.dragging) bar.value = Math.round(t / END * 1000); time.textContent = `${fmt(t)} / ${fmt(END)}`;
  };
  const jump = d => { qEl.hidden = true; T = Math.max(0, Math.min(END, T + d)); frame(T); syncAudio(); };
  $('.mback').onclick = () => jump(-10); $('.mfwd').onclick = () => jump(10);
  const ask = q => {
    pause(); qEl.hidden = false;
    qEl.innerHTML = `<p class="mqq">❓ ${esc(q.q)}</p>${q.opts.map((o, i) => `<button type="button" data-i="${i}">${esc(o[0])}</button>`).join('')}<p class="mqf" aria-live="polite"></p>`;
    qEl.querySelectorAll('button').forEach(b => b.onclick = () => {
      const o = q.opts[+b.dataset.i], f = qEl.querySelector('.mqf');
      if (o[1]) { b.classList.add('right'); f.textContent = '✓ Richtig.'; qDone.add(q.id); setTimeout(() => { if (qEl.hidden) return; qEl.hidden = true; play(); }, 1100); }
      else { b.classList.add('wrong'); f.textContent = `${o[2]} Nochmal versuchen.`; }
    });
  };
  const checkQ = (t0, t1) => { const q = (J.questions || []).find(q => !qDone.has(q.id) && q.t > t0 && q.t <= t1); if (q) { T = q.t; frame(T); ask(q); return true; } return false; };
  const setUI = () => { pp.textContent = playing ? '⏸' : '▶'; big.hidden = playing; };
  const tick = now => {
    if (!playing) return; if (!host.isConnected) return pause();
    const dt = Math.min(.05, (now - last) / 1000); last = now; const T0 = T;
    // the sound leads while it plays; if it is far off (a jump, or a file that can't seek yet), the film keeps its own clock and pulls the sound along
    if (!muted && !audio.paused && Math.abs(audio.currentTime - T) < 1.5) T = audio.currentTime;
    else { T += dt * rate; if (!muted && Math.abs(audio.currentTime - T) > 1.5) try { audio.currentTime = T; } catch {} }
    if (checkQ(T0, T)) return;
    frame(Math.min(T, END));
    if (T < END) raf = requestAnimationFrame(tick); else { playing = false; setUI(); syncAudio(); }
  };
  let first = true;
  const play = () => { if (!qEl.hidden) return; if (first) { first = false; soundOn(true); } if (T >= END - .05) T = 0; playing = true; last = performance.now(); setUI(); syncAudio(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
  const pause = () => { playing = false; cancelAnimationFrame(raf); setUI(); syncAudio(); };
  chB.forEach(b => b.onclick = () => { qEl.hidden = true; T = +b.dataset.t; frame(T); syncAudio(); if (!playing) play(); });
  pp.onclick = () => (playing ? pause() : play()); big.onclick = play; cv.onclick = () => (playing ? pause() : play());
  bar.oninput = () => { bar.dragging = true; qEl.hidden = true; T = bar.value / 1000 * END; frame(T); bar.dragging = false; };
  bar.onchange = () => { T = bar.value / 1000 * END; frame(T); syncAudio(); };
  const setFull = on => {
    host.classList.toggle('mfull', on); document.body.classList.toggle('mfull-open', on); fs.textContent = on ? '✕' : '⛶';
    if (on && host.requestFullscreen && !document.fullscreenElement) host.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  fs.onclick = () => setFull(!host.classList.contains('mfull'));
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && host.classList.contains('mfull')) setFull(false); });
  host._seek = t => { pause(); qEl.hidden = true; T = Math.min(t, END); frame(T); };   // for screenshots
  host._film = { J, end: END, play, pause, time: () => T, ask: i => ask(J.questions[i]) };
  setUI();
  if (reduce()) { T = END; frame(T); return; }
  frame(0);
}
function scan(root) {
  root.querySelectorAll('[data-film2]:not(.motion)').forEach(h => {
    const id = h.dataset.film2;
    if (/^[a-z0-9-]+$/.test(id) && SCENES[id]) build(h, id).catch(e => { console.warn('film2', e); h.remove(); });
    else h.remove();
  });
}
const app = document.getElementById('app');
if (app) { scan(app); new MutationObserver(() => scan(app)).observe(app, { childList: true }); }
