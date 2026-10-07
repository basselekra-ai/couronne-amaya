'use strict';
/* Moteur : écran titre, carte, déroulé des chapitres (dialogues, SMS, choix, cartes),
   carnet, réglages, fin de chapitre, quiz et démarrage. */

const chapterById = id => CHAPTERS.find(c => c.id === id);
const chapterIndex = id => CHAPTERS.findIndex(c => c.id === id);
const PARSED = {};
const parsed = id => PARSED[id] || (PARSED[id] = parseScript(chapterById(id).script));
const fmt = t => esc(t).replace(/\*(.+?)\*/g, '<em>$1</em>');

function unlockTrophy(id) {
  const d = Save.d;
  if (d.trophies.includes(id) || !TROPHIES[id]) return;
  d.trophies.push(id); Save.save();
  setTimeout(() => { UI.toast(`${Icons.get('etoile').replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} Trophée : <b>${TROPHIES[id][0]}</b>`, '', 3200); Sfx.play('coin'); }, 400);
}

/* ======================= TITRE ======================= */
const Title = {
  show() {
    UI.show('scr-title');
    Music.play('titre');
    $('#title-bg').innerHTML = backdrop('dakar', 'soir');
    const started = Save.d.started;
    $('#btn-play').textContent = started ? 'Continuer' : 'Jouer';
    $('#btn-new').hidden = !started;
  },
};

/* ======================= CARTE ======================= */
const MapScreen = {
  sel: null,
  show(focus) {
    UI.show('scr-map');
    if (!Music.cur || ['tension', 'action', 'rumba'].includes(Music.cur)) Music.play('calme');
    $('#map-keys').textContent = Save.d.keys.length + '/7';
    UI.refreshCauris();
    this.render();
    this.select(focus || this.current());
  },
  current() {
    const d = Save.d;
    const next = CHAPTERS.find(c => !d.chapters[c.id]?.done);
    return next ? next.id : CHAPTERS[CHAPTERS.length - 1].id;
  },
  unlocked(id) { const i = chapterIndex(id); return i === 0 || !!Save.d.chapters[CHAPTERS[i - 1].id]?.done; },
  render() {
    const d = Save.d;
    const pts = CHAPTERS.map(c => proj(c.ll).map(Number));
    let route = '';
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      const mx = (x1 + x2) / 2 + (y2 - y1) * 0.18, my = (y1 + y2) / 2 - (x2 - x1) * 0.18;
      const done = d.chapters[CHAPTERS[i - 1].id]?.done;
      route += `<path d="M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${done ? '#f2b33d' : 'rgba(255,255,255,.35)'}" stroke-width="${done ? 2.6 : 1.8}" ${done ? '' : 'class="map-route"'} stroke-linecap="round"/>`;
    }
    const LBL = { dakar: [-4, -12, 'middle'], bamako: [6, -12, 'start'], yamoussoukro: [-6, 18, 'end'], accra: [10, 16, 'start'], kinshasa: [-12, 4, 'end'], addis: [12, 4, 'start'], caire: [12, 4, 'start'] };
    const nodes = CHAPTERS.map((c, i) => {
      const [x, y] = pts[i], ch = d.chapters[c.id], open = this.unlocked(c.id), cur = open && !ch?.done;
      const [lx, ly, la] = LBL[c.id];
      return `<g class="map-node" data-id="${c.id}">
        <circle cx="${x}" cy="${y}" r="20" fill="transparent"/>
        ${cur ? `<circle class="halo" cx="${x}" cy="${y}" r="10" fill="none" stroke="#ffe08a" stroke-width="2.5"/>` : ''}
        <circle cx="${x}" cy="${y}" r="${cur ? 8.5 : 7}" fill="${ch?.done ? '#f2b33d' : open ? '#c8553d' : '#4a3a5a'}" stroke="#fff4e0" stroke-width="2"/>
        ${ch?.done ? `<path d="M${x - 3.2} ${y}l2.2 2.4 4.4-4.8" stroke="#3c1f04" stroke-width="2" fill="none" stroke-linecap="round"/>` : ''}
        <text x="${x + lx}" y="${y + ly}" text-anchor="${la}" font-family="Lilita One,sans-serif" font-size="12.5" fill="${open ? '#fff4e0' : 'rgba(255,244,224,.45)'}" stroke="#140c1f" stroke-width="3" paint-order="stroke">${c.city}</text>
      </g>`;
    }).join('');
    $('#map-wrap').innerHTML = `<svg viewBox="-34 -6 446 404" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="mapLand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6b874"/><stop offset=".5" stop-color="#c98a4a"/><stop offset="1" stop-color="#8a6a3a"/></linearGradient>
      <pattern id="mapDots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#5a3a1a" opacity=".25"/></pattern></defs>
      <path d="${polyPath(AFRICA)}" fill="#0c1430" opacity=".5" transform="translate(4 7)"/>
      <path d="${polyPath(AFRICA)}" fill="url(#mapLand)" stroke="#ffe0a0" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="${polyPath(AFRICA)}" fill="url(#mapDots)"/>
      <path d="${polyPath(MADA)}" fill="url(#mapLand)" stroke="#ffe0a0" stroke-width="1.4"/>
      <path d="M${proj([31, 31])[0]} ${proj([31, 31])[1]}Q${proj([32, 24])[0]} ${proj([32, 24])[1]} ${proj([33, 15])[0]} ${proj([33, 15])[1]}" stroke="#3a8fc0" stroke-width="2" fill="none" opacity=".7"/>
      ${route}${nodes}</svg>`;
    $('#map-wrap svg').addEventListener('click', e => {
      const n = e.target.closest('.map-node');
      if (n) { Sfx.play('tap'); Haptic.tap(); this.select(n.dataset.id); }
    });
  },
  select(id) {
    this.sel = id;
    const c = chapterById(id), d = Save.d, ch = d.chapters[id], open = this.unlocked(id);
    const games = CH_GAMES[id], stars = games.reduce((a, g) => a + (ch?.stars[g] || 0), 0), maxS = games.length * 3;
    const resume = d.cur && d.cur.ch === id;
    let acts = '';
    if (!open) acts = `<div class="g-sub" style="padding:0;text-align:left">Termine le chapitre précédent pour débloquer cette ville.</div>`;
    else {
      if (resume) acts += `<button class="btn" data-a="resume">Reprendre</button>`;
      acts += `<button class="btn ${resume ? 'ghost' : ''}" data-a="play">${ch?.done ? 'Rejouer' : resume ? 'Recommencer' : 'Jouer'}</button>`;
      if (ch?.done) acts += `<button class="btn terra" data-a="quiz">Quiz ${ch.quiz ? '✓' : ''}</button>`;
    }
    $('#map-panel').innerHTML = `<div class="mp-head"><div class="mp-flag">${flag(c.flag)}</div>
      <div><div class="mp-city">${c.city}</div><div class="mp-sub">Chapitre ${c.num} · ${c.country}</div></div>
      ${ch?.done ? `<div class="mp-stars" title="Étoiles">★ ${stars}/${maxS}</div>` : open ? '' : `<span class="ico" style="margin-left:auto;width:28px;height:28px">${Icons.get('cadenas')}</span>`}</div>
      <div class="mp-desc"><b style="color:var(--gold-hi)">${c.sub}.</b> ${open ? c.desc : 'Une nouvelle porte attend…'}</div>
      <div class="mp-actions">${acts}</div>`;
    $('#map-panel').onclick = async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      Sfx.play('tap'); Haptic.tap();
      if (b.dataset.a === 'resume') Story.play(id, d.cur.step, d.cur.scene);
      else if (b.dataset.a === 'play') {
        if (resume && !(await UI.modal({ title: 'Recommencer ?', html: '<p>Tu perdras ta progression dans ce chapitre.</p>', buttons: [{ label: 'Recommencer', value: true }, { label: 'Annuler', cls: 'ghost', value: false }] }))) return;
        Story.play(id, 0);
      } else if (b.dataset.a === 'quiz') Quiz.run(id);
    };
  },
};

/* ======================= HISTOIRE ======================= */
const Story = {
  ch: null, steps: null, labels: null, i: 0, tok: 0,
  scene: null, waiter: null, typing: null, phoneFrom: null,

  async play(chId, from = 0, scene = null) {
    const tok = ++this.tok;
    const c = chapterById(chId);
    Object.assign(this, parsed(chId));
    this.ch = chId; this.i = from;
    Save.d.started = true;
    this.scene = { bg: null, time: 'jour', place: '', music: null, right: null, danger: false };
    this.resetView();
    UI.show('scr-story');
    if (scene) await this.restore(scene);
    else if (from === 0) for (const k of ['ecoute', 'doute', 'repondu', 'appel', 'kofi_tel', 'ruse']) if (this.ownsFlag(chId, k)) delete Save.d.flags[k];
    while (this.i < this.steps.length) {
      if (tok !== this.tok) return;
      const st = this.steps[this.i];
      Save.d.cur = { ch: chId, step: this.i, scene: { ...this.scene } };
      Save.save();
      const jump = await this.exec(st, c);
      if (tok !== this.tok) return;
      if (jump === 'END') return;
      this.i = jump != null ? this.labels[jump] : this.i + 1;
    }
  },
  /* Les drapeaux d'un chapitre sont remis à zéro quand on le rejoue depuis le début. */
  ownsFlag(chId, flag) { return new RegExp(`set ${flag}\\b`).test(chapterById(chId).script); },
  abort() { this.tok++; this.cancelChoice?.(); this.release(); this.stopTyping(); Music.stop(); },
  release(v) { const w = this.waiter; this.waiter = null; if (w) w(v); },
  wait() { return new Promise(r => (this.waiter = r)); },
  onTap() {
    if (this.typing) { this.typing.finish(); return; }
    this.release(true);
  },
  resetView() {
    $('#st-bg').innerHTML = '';
    for (const id of ['#st-narr', '#st-dlg', '#st-choices', '#st-phone', '#st-card']) $(id).hidden = true;
    $('#actor-l').className = 'actor left'; $('#actor-l').innerHTML = '';
    $('#actor-r').className = 'actor right'; $('#actor-r').innerHTML = '';
    $('#actor-l').dataset.k = ''; $('#actor-r').dataset.k = '';
    $('#st-place').textContent = '';
    $('#st-vignette').className = 'vignette';
    this.phoneFrom = null;
  },
  async restore(sc) {
    if (sc.bg) this.setBg(sc.bg, sc.time, true);
    if (sc.place) this.setPlace(sc.place);
    if (sc.music) Music.play(sc.music);
    if (sc.danger) this.setDanger(true);
  },
  setBg(name, time = 'jour', instant) {
    this.scene.bg = name; this.scene.time = time;
    const box = $('#st-bg');
    const layer = el('div.layer', { html: backdrop(name, time) });
    if (!instant) layer.style.opacity = 0;
    box.append(layer);
    requestAnimationFrame(() => { layer.style.opacity = 1; });
    const old = [...box.children].slice(0, -1);
    setTimeout(() => old.forEach(o => o.remove()), 900);
  },
  setPlace(t) { this.scene.place = t; $('#st-place').textContent = t; },
  setDanger(on) { this.scene.danger = on; $('#st-vignette').className = 'vignette' + (on ? ' danger' : ''); },

  /* ---------- acteurs ---------- */
  showActor(who, mood) {
    const side = who === 'awa' ? 'l' : 'r';
    const a = $('#actor-' + side), other = $('#actor-' + (side === 'l' ? 'r' : 'l'));
    const key = who + ':' + mood;
    const swap = side === 'r' && a.dataset.who && a.dataset.who !== who;
    const draw = () => {
      if (a.dataset.k !== key) { a.innerHTML = portrait(who, mood, side === 'l' ? 1 : -1); a.dataset.k = key; }
      a.dataset.who = who;
      a.classList.add('on'); a.classList.remove('dim');
      a.classList.remove('talk'); void a.offsetWidth; a.classList.add('talk');
    };
    if (swap) { a.classList.remove('on'); setTimeout(draw, 260); } else draw();
    if (other.classList.contains('on')) other.classList.add('dim');
    if (side === 'r') this.scene.right = who;
    if (!Save.d.seenCast) Save.d.seenCast = [];
    if (!Save.d.seenCast.includes(who)) Save.d.seenCast.push(who);
  },
  dimAll() { for (const a of $$('.actor')) if (a.classList.contains('on')) a.classList.add('dim'); },
  clearActors() {
    this.exitRight();
    const a = $('#actor-l'); a.classList.remove('on', 'dim');
  },
  exitRight() { const a = $('#actor-r'); a.classList.remove('on', 'dim'); a.dataset.who = ''; this.scene.right = null; },

  /* ---------- texte ---------- */
  stopTyping() { if (this.typing) { this.typing.finish(); this.typing = null; } },
  typeInto(node, text, voice) {
    const html = fmt(text);
    // chaque caractère dans un span invisible : la mise en page ne bouge pas pendant la frappe
    node.innerHTML = html.replace(/(<[^>]+>)|(&[a-z]+;)|([^<&])/g, (m, tag, ent, ch) => tag || `<span style="visibility:hidden">${ent || ch}</span>`);
    const spans = $$('span', node);
    const speed = [0, 1, 2, 4][Save.d.settings.speed + 1] || 2;
    let i = 0;
    return new Promise(res => {
      const finish = () => { clearInterval(t); spans.forEach(s => (s.style.visibility = '')); this.typing = null; res(); };
      const t = setInterval(() => {
        for (let k = 0; k < speed && i < spans.length; k++, i++) spans[i].style.visibility = '';
        if (voice && i % 3 === 0) Sfx.play('type', { f: voice });
        if (i >= spans.length) finish();
      }, 22);
      this.typing = { finish };
    });
  },
  async say(st) {
    const c = CAST[st.who] || { name: st.who };
    this.hideNarr();
    $('#st-phone').hidden = true; this.phoneFrom = null;
    this.showActor(st.who, st.mood);
    const dlg = $('#st-dlg');
    dlg.hidden = false; dlg.classList.remove('done');
    const nm = $('#st-name');
    nm.textContent = st.who === 'masque' && Save.d.flags.aveu ? 'Ibrahima' : c.name;
    nm.className = 'dlg-name' + (st.who === 'awa' ? '' : ' right') + (['agent', 'masque'].includes(st.who) ? ' dark' : '');
    const voice = { awa: 720, seydou: 300, ibrahima: 380, kofi: 460, fanta: 680, akissi: 760, nanan: 280, didi: 420, lukusa: 320, makeda: 640, nour: 700, agent: 220, masque: 180 }[st.who] || 500;
    if (st.mood === 'peur' || st.mood === 'colere') Haptic.tap();
    await this.typeInto($('#st-text'), st.text, voice);
    dlg.classList.add('done');
    await this.wait();
    Sfx.play('page');
  },
  hideNarr() { $('#st-narr').hidden = true; },
  async narr(st) {
    $('#st-dlg').hidden = true; $('#st-phone').hidden = true; this.phoneFrom = null;
    this.dimAll();
    const n = $('#st-narr');
    n.className = 'narr' + (st.big ? ' big' : '');
    n.hidden = false;
    await this.typeInto(n, st.text, 0);
    await this.wait();
    n.hidden = true;
  },

  /* ---------- téléphone ---------- */
  async sms(st, photo) {
    $('#st-dlg').hidden = true; this.hideNarr(); this.dimAll();
    const ph = $('#st-phone'), body = $('#ph-body');
    const from = st.from === 'me' ? this.phoneFrom : st.from;
    if (this.phoneFrom !== from || ph.hidden) {
      const names = { hibou: 'Le Hibou', gris: 'Numéro inconnu', papi: 'Papi', inconnu: 'Numéro masqué' };
      $('#ph-name').textContent = names[from] || from;
      $('#ph-av').innerHTML = avatar(from === 'papi' ? 'seydou' : from);
      body.innerHTML = '';
      ph.hidden = false;
      ph.style.animation = 'none'; void ph.offsetWidth; ph.style.animation = '';
      this.phoneFrom = from;
    }
    if (photo) {
      body.append(el('div.bubble.photo', { html: photo === 'hostage' ? hostagePhoto() : guardiansPhoto('complete') }));
      Sfx.play('smsBad'); Haptic.hard();
    } else if (st.from === 'me') {
      await sleep(250);
      body.append(el('div.bubble.me', { html: fmt(st.text) }));
      Sfx.play('whoosh');
    } else {
      const typing = el('div.bubble.typing', { text: '•••' });
      body.append(typing); body.scrollTop = body.scrollHeight;
      await sleep(650);
      typing.remove();
      body.append(el('div.bubble' + (from === 'gris' ? '.threat' : ''), { html: fmt(st.text) }));
      Sfx.play(from === 'gris' ? 'smsBad' : 'sms');
      from === 'gris' ? Haptic.hard() : Haptic.mid();
    }
    body.scrollTop = body.scrollHeight;
    await this.wait();
  },

  /* ---------- cartes ---------- */
  async card(html, cls = '') {
    const c = $('#st-card');
    c.innerHTML = `<div class="cp ${cls}">${html}<div class="cp-foot">Touchez pour continuer</div></div>`;
    c.hidden = false;
    await sleep(350);
    await this.wait();
    c.hidden = true;
  },
  async clue(id) {
    const cl = CLUES[id]; if (!cl) return;
    const fresh = !Save.d.clues.includes(id);
    if (fresh) { Save.d.clues.push(id); Save.save(); }
    Sfx.play('clue'); Haptic.mid();
    const art = id === 'photo' ? guardiansPhoto('dechiree') : id === 'photo_complete' ? guardiansPhoto('complete') : clueArt(cl.art);
    await this.card(`<div class="cp-kind">${fresh ? 'Nouvel indice' : 'Indice'}</div><div class="cp-art" ${id.startsWith('photo') ? 'style="width:220px;height:156px"' : ''}>${art}</div>
      <div class="cp-title">${cl.t}</div><div class="cp-text">${fmt(cl.d)}</div>`);
  },
  async fact(id) {
    const f = FACTS[id]; if (!f) return;
    if (!Save.d.facts.includes(id)) { Save.d.facts.push(id); Save.save(); }
    Sfx.play('fact');
    const c = chapterById(f.city);
    await this.card(`<div class="cp-kind">Le saviez-vous ?</div><div class="mp-flag" style="margin:10px auto;width:54px;height:36px">${flag(c.flag)}</div>
      <div class="cp-title">${f.t}</div><div class="cp-text">${fmt(f.d)}</div>`, 'fact');
  },
  async key(n) {
    if (!Save.d.keys.includes(n)) { Save.d.keys.push(n); Save.save(); }
    Sfx.play('key'); Haptic.hard(); UI.flash();
    if (n === 1) unlockTrophy('premiere_cle');
    if (Save.d.keys.length >= 7) unlockTrophy('sept_cles');
    await this.card(`<div class="rays"></div><div class="cp-kind">Clé de mémoire</div><div class="cp-art">${medallion(n, 170)}</div>
      <div class="cp-title">${['Le baobab', 'Le caïman', 'L\'éléphant', 'L\'étoile', 'Le léopard', 'Le caféier', 'La pyramide'][n - 1]}</div>
      <div class="cp-text">${Save.d.keys.length} clé${Save.d.keys.length > 1 ? 's' : ''} sur 7</div>`, 'key');
  },

  /* ---------- choix ---------- */
  async choice(st) {
    $('#st-dlg').hidden = true; this.hideNarr(); $('#st-phone').hidden = true; this.phoneFrom = null;
    const box = $('#st-choices');
    box.innerHTML = (st.q ? `<div class="choice-head">${fmt(st.q)}</div>` : '') + (st.timer ? '<div class="choice-timer"><i></i></div>' : '') +
      st.opts.map((o, i) => `<button class="choice" data-i="${i}" data-n="${i + 1}" style="animation-delay:${i * 0.08}s">${fmt(o.text)}</button>`).join('');
    box.hidden = false;
    let timer = 0, raf = 0;
    const picked = await new Promise(res => {
      box.onclick = e => { const b = e.target.closest('.choice'); if (b) res(+b.dataset.i); };
      this.cancelChoice = () => res(-1);
      if (st.timer) {
        const bar = $('.choice-timer i', box), t0 = performance.now(), dur = st.timer * 1000;
        let beat = 0;
        const tick = () => {
          const k = 1 - (performance.now() - t0) / dur;
          bar.style.transform = `scaleX(${Math.max(0, k)})`;
          if (performance.now() - t0 > beat * 900) { Sfx.play('heart', { vol: 0.5 }); beat++; }
          if (k <= 0) res(st.opts.length - 1); else raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
    });
    cancelAnimationFrame(raf); clearTimeout(timer);
    box.onclick = null; this.cancelChoice = null; box.hidden = true;
    if (picked < 0) return undefined;
    Sfx.play('ok'); Haptic.mid();
    let jump;
    for (const a of st.opts[picked].acts) {
      const [k, v] = a.split(/\s+/);
      if (k === 'goto') jump = v;
      else if (k === 'set') this.setFlag(v);
      else if (k === 'trust') this.trust(+v);
    }
    return jump;
  },
  setFlag(f) {
    Save.d.flags[f] = true; Save.save();
    if (f === 'doute') unlockTrophy('mefiance');
  },
  trust(n) {
    Save.d.trust = clamp(Save.d.trust + n, -3, 3); Save.save();
    UI.toast(n > 0 ? 'Kofi s\'en souviendra.' : 'Kofi s\'en souviendra…', 'trust' + (n < 0 ? ' down' : ''));
  },
  test(cond) {
    return cond.split('&').every(c => {
      let m;
      if ((m = c.match(/^trust>=(-?\d+)$/))) return Save.d.trust >= +m[1];
      if ((m = c.match(/^frags>=(\d+)$/))) return Save.d.frags.length >= +m[1];
      if (c[0] === '!') return !Save.d.flags[c.slice(1)];
      return !!Save.d.flags[c];
    });
  },

  /* ---------- exécution d'une instruction ---------- */
  async exec(st, c) {
    switch (st.t) {
      case 'say': return this.say(st);
      case 'narr': return this.narr(st);
      case 'sms': return this.sms(st);
      case 'choice': return this.choice(st);
      case 'bg': this.clearActors(); this.setBg(st.a[0], st.a[1] || 'jour'); await sleep(250); return;
      case 'music': this.scene.music = st.a[0] === 'none' ? null : st.a[0]; st.a[0] === 'none' ? Music.stop(1.2) : Music.play(st.a[0]); return;
      case 'place': this.setPlace(st.rest); return;
      case 'title': return this.titleCard(c);
      case 'clue': return this.clue(st.a[0]);
      case 'fact': return this.fact(st.a[0]);
      case 'key': return this.key(+st.a[0]);
      case 'sfx': Sfx.play(st.a[0]); if (st.a[0] === 'stinger') Haptic.hard(); return;
      case 'wait': await sleep(+st.a[0]); return;
      case 'shake': UI.shake(); Haptic.hard(); return;
      case 'flash': UI.flash(); return;
      case 'danger': this.setDanger(st.a[0] === 'on'); return;
      case 'exit': this.exitRight(); await sleep(200); return;
      case 'phone': $('#st-phone').hidden = true; this.phoneFrom = null; return;
      case 'photo': return this.sms({ from: this.phoneFrom || 'gris' }, st.a[0]);
      case 'goto': return st.a[0];
      case 'if': return this.test(st.a[0]) ? st.a[1] : undefined;
      case 'set': this.setFlag(st.a[0]); return;
      case 'trust': this.trust(+st.a[0]); return;
      case 'game': return this.game(st.a[0]);
      case 'ending': return this.ending(st.a[0]);
      case 'end': await this.endChapter(c); return 'END';
    }
  },
  async titleCard(c) {
    const card = el('div.chap-card', { html: `<div class="cc-num">Chapitre ${c.num}</div><div class="cc-city">${c.city}</div>
      <div class="cc-country"><span class="mp-flag">${flag(c.flag)}</span>${c.country}</div><div class="cc-sub">${c.sub}</div><div class="cc-line"></div>` });
    $('#scr-story').append(card);
    Sfx.play('reveal');
    await Promise.race([sleep(3600), this.wait()]);
    this.waiter = null;
    card.style.transition = 'opacity .5s'; card.style.opacity = 0;
    await sleep(450); card.remove();
  },
  async game(id) {
    const tok = this.tok;
    $('#st-dlg').hidden = true; this.hideNarr(); $('#st-phone').hidden = true; this.phoneFrom = null;
    const music = this.scene.music;
    const res = await Games.run(id, this.ch);
    if (tok !== this.tok) return 'END';
    if (res.quit) { this.abort(); MapScreen.show(this.ch); return 'END'; }
    UI.show('scr-story');
    if (music) { Music.cur = null; Music.play(music); }
    return undefined;
  },
  async ending(kind) {
    if (!Save.d.endings.includes(kind)) Save.d.endings.push(kind);
    Save.save();
    unlockTrophy(kind);
    const T = { lumiere: ['La mémoire libre', 'Le Collectionneur est arrêté. Le Livre des Rives sera partagé avec tout le continent.'], aube: ['L\'aube incertaine', 'Papi est sauvé. Mais le Collectionneur s\'est enfui dans la nuit, avec une page du Livre.'] }[kind];
    Sfx.play('win');
    await this.card(`<div class="rays"></div><div class="cp-kind">Fin ${kind === 'lumiere' ? '1/2 · la meilleure' : '2/2'}</div><div class="cp-title" style="font-size:30px">${T[0]}</div><div class="cp-text">${T[1]}</div>
      ${kind === 'aube' ? '<div class="cp-text" style="margin-top:10px;color:var(--gold-hi)">Il existe une autre fin… Fais confiance à tes alliés, et retourne ses armes contre le Collectionneur.</div>' : ''}`, 'key');
  },

  /* ---------- fin de chapitre ---------- */
  async endChapter(c) {
    const d = Save.d, ch = Save.chap(c.id);
    const first = !ch.done;
    ch.done = true; d.cur = null;
    const games = CH_GAMES[c.id], stars = games.reduce((a, g) => a + (ch.stars[g] || 0), 0), maxS = games.length * 3;
    if (games.every(g => ch.stars[g] === 3)) unlockTrophy('etoiles');
    const reward = first ? 25 : 0;
    if (reward) Save.addCauris(reward);
    Save.save(true);
    const next = CHAPTERS[chapterIndex(c.id) + 1];
    Music.play('titre');
    const last = !next;
    const v = await UI.modal({
      title: last ? 'L\'aventure est terminée !' : `${c.city} : chapitre terminé`,
      html: `<div class="stars">${'<b>★</b>'.repeat(Math.round(stars / maxS * 3))}${'★'.repeat(3 - Math.round(stars / maxS * 3))}</div>
        <p>${stars} étoile${stars > 1 ? 's' : ''} sur ${maxS} dans les défis.</p>
        ${reward ? `<div class="reward">${Icons.get('cauri').replace('<svg', '<svg width="26" height="26"')} +${reward} cauris</div>` : ''}
        <p>${last ? 'Merci d\'avoir joué ! Rejoue les chapitres pour découvrir l\'autre fin et tous les fragments de mémoire.' : `Prochaine étape : <b>${next.city}</b>. Teste d'abord tes connaissances sur ${c.city} ?`}</p>`,
      buttons: last ? [{ label: 'Voir la carte', value: 'map' }] : [{ label: `Continuer vers ${next.city}`, value: 'next' }, { label: `Quiz : ${c.city}`, cls: 'terra', value: 'quiz' }, { label: 'Carte', cls: 'ghost', value: 'map' }],
    });
    if (v === 'next') Story.play(next.id, 0);
    else if (v === 'quiz') Quiz.run(c.id, next?.id);
    else MapScreen.show(next ? next.id : c.id);
  },

  async menu() {
    const v = await UI.modal({ title: 'Pause', closable: true, buttons: [{ label: 'Reprendre', value: 'go' }, { label: 'Réglages', cls: 'ghost', value: 'set' }, { label: 'Carte de l\'Afrique', cls: 'ghost', value: 'map' }] });
    if (v === 'set') { await Settings.open(); return; }
    if (v === 'map') { this.abort(); MapScreen.show(this.ch); }
  },
};

/* ======================= QUIZ ======================= */
const Quiz = {
  async run(chId, nextId) {
    const qs = QUIZ[chId], c = chapterById(chId);
    UI.show('scr-game');
    $('#g-title').textContent = 'Quiz : ' + c.city;
    UI.refreshCauris();
    Music.play('calme');
    const stage = $('#g-stage');
    let good = 0;
    for (let i = 0; i < qs.length; i++) {
      const [q, ans, ok, factId] = qs[i];
      const order = shuffle(ans.map((a, k) => k));
      stage.innerHTML = `<div class="g-hud"><span>Question ${i + 1}/${qs.length}</span><span class="grow"></span><span>${'●'.repeat(good)}</span></div>
        <div class="qz"><div class="qz-q">${esc(q)}</div>${order.map(k => `<button class="qz-a" data-k="${k}">${esc(ans[k])}</button>`).join('')}<div class="qz-ex" hidden></div></div>`;
      const k = await new Promise(res => stage.onclick = e => { const b = e.target.closest('.qz-a'); if (b) res(+b.dataset.k); });
      stage.onclick = null;
      const right = k === ok;
      if (right) { good++; Sfx.play('ok'); Haptic.tap(); } else { Sfx.play('bad'); Haptic.mid(); }
      for (const b of $$('.qz-a', stage)) { if (+b.dataset.k === ok) b.classList.add('ok'); else if (+b.dataset.k === k) b.classList.add('ko'); b.disabled = true; }
      const ex = $('.qz-ex', stage); ex.hidden = false; ex.innerHTML = fmt(FACTS[factId].d);
      const nb = el('button.btn', { text: i < qs.length - 1 ? 'Question suivante' : 'Résultat' });
      $('.qz', stage).append(nb);
      await new Promise(r => nb.onclick = r);
      Sfx.play('tap');
    }
    const ch = Save.chap(chId);
    const reward = good * 5 * (ch.quiz >= good ? 0 : 1);
    if (good > ch.quiz) { Save.addCauris((good - ch.quiz) * 5); ch.quiz = good; }
    if (good === qs.length) unlockTrophy('quiz');
    if (CHAPTERS.every(cc => Save.d.chapters[cc.id]?.quiz === QUIZ[cc.id].length)) unlockTrophy('curieuse');
    Save.save();
    Sfx.play(good === qs.length ? 'win' : 'ok');
    const v = await UI.modal({
      title: good === qs.length ? 'Sans faute !' : `${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${qs.length}`,
      html: `<div class="stars">${'<b>★</b>'.repeat(good)}${'★'.repeat(qs.length - good)}</div>${reward ? `<div class="reward">${Icons.get('cauri').replace('<svg', '<svg width="26" height="26"')} +${reward} cauris</div>` : ''}`,
      buttons: nextId ? [{ label: `Continuer vers ${chapterById(nextId).city}`, value: 'next' }, { label: 'Carte', cls: 'ghost', value: 'map' }] : [{ label: 'Carte', value: 'map' }],
    });
    if (v === 'next') Story.play(nextId, 0); else MapScreen.show(nextId || chId);
  },
};

/* ======================= CARNET ======================= */
const Carnet = {
  tab: 'indices',
  async open() {
    const render = () => {
      const d = Save.d, tabs = [['indices', 'Indices'], ['perso', 'Personnages'], ['savoir', 'Le saviez-vous'], ['cles', 'Clés'], ['trophees', 'Trophées']];
      let body = '';
      if (this.tab === 'indices') {
        body = d.clues.length ? d.clues.map(id => { const c = CLUES[id]; return `<div class="cn-item"><div class="ic">${id.startsWith('photo') ? guardiansPhoto(id === 'photo' ? 'dechiree' : 'complete') : clueArt(c.art)}</div><div><b>${c.t}</b><p>${fmt(c.d)}</p></div></div>`; }).join('')
          : '<div class="cn-empty">Aucun indice pour l\'instant.</div>';
      } else if (this.tab === 'perso') {
        const seen = d.seenCast || [];
        body = Object.keys(BIOS).filter(k => seen.includes(k)).map(k => {
          const after = BIOS_AFTER[k] && ((k === 'seydou' && d.clues.includes('otage')) || (k !== 'seydou' && d.clues.includes('aveu')));
          return `<div class="cn-item"><div class="ic">${portrait(k, 'neutre').replace('viewBox="0 0 200 240"', 'viewBox="30 30 140 140"')}</div><div><b>${CAST[k].name}</b><p>${after ? BIOS_AFTER[k] : BIOS[k]}</p></div></div>`;
        }).join('') || '<div class="cn-empty">Personne pour l\'instant.</div>';
      } else if (this.tab === 'savoir') {
        body = CHAPTERS.map(c => {
          const fs = Object.entries(FACTS).filter(([, f]) => f.city === c.id);
          return `<div style="display:flex;align-items:center;gap:8px;margin:10px 0 6px"><span class="mp-flag" style="width:28px;height:19px">${flag(c.flag)}</span><b style="font-family:var(--f-display);font-weight:400;font-size:18px">${c.city}</b></div>` +
            fs.map(([id, f]) => d.facts.includes(id) ? `<div class="cn-item"><div><b>${f.t}</b><p>${fmt(f.d)}</p></div></div>` : `<div class="cn-item locked"><div><b>???</b><p>À découvrir à ${c.city}.</p></div></div>`).join('');
        }).join('');
      } else if (this.tab === 'cles') {
        body = `<div class="cn-keys">${[1, 2, 3, 4, 5, 6, 7].map(n => `<div class="cn-key"><div class="ic">${medallion(n, 80, d.keys.includes(n))}</div>${CHAPTERS[n - 1].city}</div>`).join('')}</div>
          <h3 style="font-family:var(--f-display);font-weight:400;margin:18px 0 6px">Fragments de mémoire · ${d.frags.length}/7</h3>
          <p style="color:var(--muted);font-size:13.5px;margin:0 0 8px">Un fragment doré se cache dans un défi de chaque ville. Réunis-les tous pour découvrir le secret de la fin.</p>
          <div class="cn-keys">${CHAPTERS.map(c => `<div class="cn-key"><div class="ic" style="display:grid;place-items:center;font-size:30px;filter:${d.frags.includes(c.id) ? 'none' : 'grayscale(1) brightness(.4)'}">${Icons.get('cauri')}</div>${c.city}</div>`).join('')}</div>`;
      } else {
        body = Object.entries(TROPHIES).map(([id, [t, dsc]]) => `<div class="cn-item ${d.trophies.includes(id) ? '' : 'locked'}"><div class="ic" style="display:grid;place-items:center;padding:10px">${Icons.get('etoile')}</div><div><b>${t}</b><p>${dsc}</p></div></div>`).join('');
      }
      return `<div class="carnet"><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${k === this.tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div><div class="cn-list">${body}</div></div>`;
    };
    const p = UI.modal({ title: 'Carnet d\'enquête', html: render(), buttons: [], closable: true });
    const m = $('#modal');
    const onTab = e => { const t = e.target.closest('[data-tab]'); if (!t) return; Sfx.play('page'); this.tab = t.dataset.tab; const tabsHtml = render(); $('.carnet', m).outerHTML = tabsHtml; };
    m.addEventListener('click', onTab);
    await p;
    m.removeEventListener('click', onTab);
  },
};

/* ======================= RÉGLAGES ======================= */
const Settings = {
  async open() {
    const s = Save.d.settings;
    const html = `<div style="text-align:left">
      <label class="set-row">Musique <input type="range" min="0" max="1" step="0.05" value="${s.music}" data-k="music"></label>
      <label class="set-row">Effets sonores <input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-k="sfx"></label>
      <div class="set-row">Vibrations <button class="switch ${s.vib ? 'on' : ''}" data-k="vib" aria-label="Vibrations"></button></div>
      <div class="set-row">Vitesse du texte <span style="display:flex;gap:6px">${['Lent', 'Normal', 'Rapide'].map((l, i) => `<button class="tab ${s.speed === i ? 'on' : ''}" data-speed="${i}">${l}</button>`).join('')}</span></div>
      <div class="set-row"><span>Progression</span><button class="btn small ghost" data-reset>Effacer</button></div>
      <p style="font-size:12.5px;color:var(--muted);margin-top:14px;text-align:center">Les 7 Clés du Griot · v1.0<br>Une fiction : les personnages et le Livre des Rives sont imaginaires ; les lieux et les « Le saviez-vous ? » sont réels.</p></div>`;
    const p = UI.modal({ title: 'Réglages', html, buttons: [{ label: 'OK', value: true }] });
    const m = $('#modal');
    m.oninput = e => { const k = e.target.dataset.k; if (!k) return; s[k] = +e.target.value; Snd.applyVolumes(); Save.save(); if (k === 'sfx') Sfx.play('tap'); };
    m.onclick = async e => {
      const t = e.target;
      if (t.dataset.k === 'vib') { s.vib = !s.vib; t.classList.toggle('on', s.vib); Save.save(); Haptic.mid(); }
      if (t.dataset.speed != null) { s.speed = +t.dataset.speed; $$('[data-speed]', m).forEach(b => b.classList.toggle('on', b === t)); Save.save(); }
      if (t.hasAttribute('data-reset')) {
        m.oninput = m.onclick = null;
        const ok = await UI.modal({ title: 'Tout effacer ?', html: '<p>Clés, indices, trophées et chapitres terminés seront perdus.</p>', buttons: [{ label: 'Effacer', cls: 'terra', value: true }, { label: 'Annuler', cls: 'ghost', value: false }] });
        if (ok) { Save.reset(); Title.show(); }
      }
    };
    await p;
    m.oninput = m.onclick = null;
  },
};

/* ======================= DÉMARRAGE ======================= */
async function boot() {
  await Save.load();
  Icons.hydrate();
  UI.refreshCauris();
  Title.show();

  // le son ne peut démarrer qu'après un premier geste
  const unlock = () => { Snd.unlocked = true; Snd.ensure(); if (!Music.timer) { const want = Music.cur || 'titre'; Music.cur = null; Music.play(want); } };
  document.addEventListener('pointerdown', unlock, { once: true, capture: true });

  $('#btn-play').onclick = () => {
    Sfx.play('ok'); Haptic.mid();
    if (!Save.d.started) { Story.play('dakar', 0); return; }
    MapScreen.show();
  };
  $('#btn-new').onclick = async () => {
    Sfx.play('tap');
    const ok = await UI.modal({ title: 'Nouvelle partie ?', html: '<p>Toute ta progression sera effacée.</p>', buttons: [{ label: 'Recommencer', cls: 'terra', value: true }, { label: 'Annuler', cls: 'ghost', value: false }] });
    if (ok) { Save.reset(); Story.play('dakar', 0); }
  };
  for (const id of ['#btn-carnet-t', '#btn-carnet-m', '#btn-carnet-s']) $(id).onclick = () => { Sfx.play('page'); Carnet.open(); };
  $('#btn-settings-t').onclick = () => { Sfx.play('tap'); Settings.open(); };
  $('#btn-map-home').onclick = () => { Sfx.play('tap'); Title.show(); };
  $('#btn-st-menu').onclick = () => { Sfx.play('tap'); Story.menu(); };
  $('#btn-g-pause').onclick = () => { Sfx.play('tap'); Games.pause(); };
  $('#scr-story').addEventListener('click', e => {
    if (e.target.closest('.topbar, .choices')) return;
    Story.onTap();
  });

  // bouton retour Android
  Native.app?.addListener('backButton', () => {
    if (UI.modalOpen()) { UI.closeModal(); return; }
    if (UI.cur === 'scr-story') Story.menu();
    else if (UI.cur === 'scr-game') Games.pause();
    else if (UI.cur === 'scr-map') Title.show();
    else Native.app.exitApp();
  });
  Native.app?.addListener('pause', () => { if (UI.cur === 'scr-game') Games.pause(); });
}
boot();
