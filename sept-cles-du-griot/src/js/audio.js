'use strict';
/* Son entièrement synthétisé (aucun fichier audio) :
   - kora, guitare et oud par l'algorithme de Karplus-Strong (corde pincée)
   - djembé, doum et cœur par oscillateurs et bruit filtré
   - musiques génératives par ambiance, calées sur l'horloge audio */

const Snd = {
  ctx: null, master: null, musBus: null, sfxBus: null, noiseBuf: null, cache: new Map(), unlocked: false,
  ensure() {
    if (!this.unlocked) return null;
    if (this.ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume().catch(() => {}); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const c = this.ctx = new AC();
    this.master = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp).connect(c.destination);
    this.musBus = c.createGain(); this.musBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
    // réverbe légère : réponse impulsionnelle de bruit décroissant
    this.rev = c.createConvolver();
    const len = c.sampleRate * 1.8, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.rev.buffer = ir;
    this.revGain = c.createGain(); this.revGain.gain.value = 0.22;
    this.rev.connect(this.revGain).connect(this.master);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    this.applyVolumes();
    return c;
  },
  applyVolumes() {
    if (!this.ctx) return;
    const s = Save.d.settings;
    this.musBus.gain.value = s.music * 0.55;
    this.sfxBus.gain.value = s.sfx * 0.9;
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },

  /** Corde pincée (Karplus-Strong), mise en cache par fréquence et timbre. */
  string(freq, kind = 'kora') {
    const key = kind + Math.round(freq * 10);
    if (this.cache.has(key)) return this.cache.get(key);
    const c = this.ctx, sr = c.sampleRate;
    const P = { kora: [2.6, 0.9965, 0.5], guitar: [1.6, 0.994, 0.75], oud: [2.0, 0.993, 0.35], krar: [1.8, 0.995, 0.6], bass: [1.4, 0.996, 0.2] }[kind] || [2, 0.995, 0.5];
    const [dur, decay, bright] = P;
    const N = Math.max(2, Math.round(sr / freq)), len = Math.floor(sr * dur);
    const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0);
    const ring = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { const w = Math.random() * 2 - 1; prev = prev + bright * (w - prev); ring[i] = prev; }
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const a = ring[idx], b = ring[(idx + 1) % N];
      d[i] = a;
      ring[idx] = (a + b) * 0.5 * decay;
      idx = (idx + 1) % N;
    }
    for (let i = 0; i < 400; i++) d[len - 1 - i] *= i / 400;
    this.cache.set(key, buf);
    return buf;
  },
  pluck(freq, t, vol = 0.5, kind = 'kora', bus = this.sfxBus, pan = 0) {
    const c = this.ctx; if (!c) return;
    const src = c.createBufferSource(); src.buffer = this.string(freq, kind);
    const g = c.createGain(); g.gain.value = vol;
    let out = g;
    if (c.createStereoPanner && pan) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    src.connect(g); out.connect(bus);
    const r = c.createGain(); r.gain.value = 0.5; out.connect(r).connect(this.rev);
    src.start(t);
  },
  tone(freq, t, dur, { type = 'sine', vol = 0.3, attack = 0.005, bus = this.sfxBus, slide = 0, rev = 0 } = {}) {
    const c = this.ctx; if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    if (rev) { const r = c.createGain(); r.gain.value = rev; g.connect(r).connect(this.rev); }
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(t, dur, { vol = 0.3, type = 'bandpass', freq = 1000, q = 1, bus = this.sfxBus, sweep = 0 } = {}) {
    const c = this.ctx; if (!c) return;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(bus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  /* percussions */
  djembe(t, kind, vol = 0.5, bus = this.musBus) {
    if (kind === 'bass') { this.tone(110, t, 0.28, { vol: vol * 1.2, slide: 0.45, bus }); this.noise(t, 0.05, { vol: vol * 0.3, freq: 300, bus }); }
    else if (kind === 'tone') { this.tone(260, t, 0.16, { vol: vol * 0.7, slide: 0.7, bus }); this.noise(t, 0.06, { vol: vol * 0.25, freq: 900, q: 2, bus }); }
    else { this.noise(t, 0.09, { vol: vol * 0.7, freq: 2600, q: 1.5, bus }); this.tone(420, t, 0.06, { vol: vol * 0.3, bus }); }
  },
  shaker(t, vol = 0.12, bus = this.musBus) { this.noise(t, 0.05, { vol, type: 'highpass', freq: 6000, bus }); },
  heart(t, vol = 0.8, bus = this.sfxBus) { this.tone(58, t, 0.16, { vol, slide: 0.6, bus }); this.tone(52, t + 0.2, 0.2, { vol: vol * 0.75, slide: 0.6, bus }); },
};

/* Fréquence d'une note : demi-tons depuis La 440 */
const nf = semis => 440 * Math.pow(2, semis / 12);
// Gamme pentatonique de Fa (accord de kora silaba simplifié), du grave à l'aigu
const KORA = [-16, -14, -12, -9, -7, -4, -2, 0, 3, 5, 8, 10, 12].map(nf);

const Sfx = {
  play(name, opt = {}) {
    const c = Snd.ensure(); if (!c) return;
    const t = c.currentTime + 0.01, S = Snd;
    switch (name) {
      case 'tap': S.tone(880, t, 0.05, { vol: 0.12, type: 'triangle' }); break;
      case 'type': S.tone(opt.f || 660, t, 0.03, { vol: 0.035, type: 'square' }); break;
      case 'ok': S.tone(660, t, 0.12, { vol: 0.2, type: 'triangle' }); S.tone(990, t + 0.08, 0.2, { vol: 0.2, type: 'triangle' }); break;
      case 'bad': S.tone(160, t, 0.25, { vol: 0.25, type: 'sawtooth', slide: 0.7 }); break;
      case 'coin': S.tone(1320, t, 0.08, { vol: 0.14, type: 'triangle' }); S.tone(1760, t + 0.06, 0.16, { vol: 0.14, type: 'triangle' }); break;
      case 'clue': [0, 4, 7, 12].forEach((s, i) => S.pluck(nf(s + 3), t + i * 0.08, 0.35)); S.tone(nf(15) * 2, t + 0.3, 0.6, { vol: 0.06, rev: 0.5 }); break;
      case 'fact': [7, 12, 16].forEach((s, i) => S.pluck(nf(s), t + i * 0.1, 0.32)); break;
      case 'key':
        [-12, -5, 0, 4, 7, 12, 16, 19, 24].forEach((s, i) => S.pluck(nf(s), t + i * 0.07, 0.38, 'kora', S.sfxBus, (i % 3 - 1) * 0.4));
        [0, 4, 7].forEach(s => S.tone(nf(s), t + 0.6, 1.8, { vol: 0.07, type: 'triangle', attack: 0.3, rev: 0.8 }));
        break;
      case 'sms': S.tone(1568, t, 0.09, { vol: 0.16 }); S.tone(2093, t + 0.12, 0.14, { vol: 0.16 }); break;
      case 'smsBad': S.tone(330, t, 0.15, { vol: 0.2, type: 'square' }); S.tone(311, t + 0.16, 0.25, { vol: 0.2, type: 'square' }); break;
      case 'door': S.noise(t, 0.35, { vol: 0.9, type: 'lowpass', freq: 400 }); S.tone(70, t, 0.4, { vol: 0.6, slide: 0.5 }); break;
      case 'heart': S.heart(t, opt.vol || 0.8); break;
      case 'whoosh': S.noise(t, 0.35, { vol: 0.35, freq: 400, q: 0.8, sweep: 6 }); break;
      case 'step': S.noise(t, 0.04, { vol: 0.2, freq: 1800, q: 3 }); break;
      case 'alarm': for (let i = 0; i < 4; i++) { S.tone(880, t + i * 0.3, 0.15, { vol: 0.16, type: 'square' }); S.tone(660, t + i * 0.3 + 0.15, 0.15, { vol: 0.16, type: 'square' }); } break;
      case 'stinger':
        S.tone(55, t, 1.6, { vol: 0.6, type: 'sawtooth', slide: 0.8 });
        S.noise(t, 0.6, { vol: 0.5, type: 'lowpass', freq: 300 });
        [1, 1.06, 1.5].forEach(m => S.tone(220 * m, t, 1.4, { vol: 0.06, type: 'sawtooth', attack: 0.02, rev: 0.6 }));
        break;
      case 'reveal': [0, 3, 7, 10, 14].forEach((s, i) => S.pluck(nf(s - 5), t + i * 0.12, 0.4, 'kora')); S.tone(nf(-17), t, 2, { vol: 0.25, type: 'triangle', rev: 0.6 }); break;
      case 'win': [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => S.pluck(nf(s + 3), t + i * 0.09, 0.4)); S.djembe(t, 'bass', 0.5, S.sfxBus); S.djembe(t + 0.54, 'slap', 0.5, S.sfxBus); break;
      case 'lose': [7, 3, 0, -5].forEach((s, i) => S.pluck(nf(s - 2), t + i * 0.16, 0.4, 'oud')); break;
      case 'hit': S.noise(t, 0.25, { vol: 0.7, type: 'lowpass', freq: 600 }); S.tone(90, t, 0.25, { vol: 0.5, slide: 0.5 }); break;
      case 'jump': S.tone(300, t, 0.18, { vol: 0.14, type: 'triangle', slide: 2.2 }); break;
      case 'drum': S.djembe(t, opt.kind || 'tone', 0.7, S.sfxBus); break;
      case 'kora': S.pluck(KORA[opt.i] || 440, t, 0.6, opt.kind || 'kora', S.sfxBus, ((opt.i || 0) % 5 - 2) * 0.15); break;
      case 'page': S.noise(t, 0.12, { vol: 0.12, freq: 3000, q: 0.6, sweep: 0.5 }); break;
      case 'crowd': S.noise(t, 1.4, { vol: 0.25, freq: 1200, q: 0.4 }); break;
    }
  },
};

/* ---------- musiques génératives ---------- */
const THEMES = {
  // root : demi-tons depuis La 440 ; scale : degrés utilisés pour les arpèges
  titre:   { bpm: 84, inst: 'kora', root: -4, scale: [0, 2, 4, 7, 9], prog: [0, -3, 5, 7], perc: 'soft', drone: true },
  calme:   { bpm: 92, inst: 'kora', root: -4, scale: [0, 2, 4, 7, 9], prog: [0, 5, -3, 7], perc: 'soft' },
  sahel:   { bpm: 96, inst: 'kora', root: -2, scale: [0, 3, 5, 7, 10], prog: [0, 0, 5, 3], perc: 'soft', drone: true },
  lagune:  { bpm: 100, inst: 'kora', root: -5, scale: [0, 2, 4, 7, 9], prog: [0, 5, 7, 5], perc: 'soft' },
  ville:   { bpm: 104, inst: 'guitar', root: -3, scale: [0, 2, 4, 7, 9], prog: [0, 5, 7, 0], perc: 'soft' },
  addis:   { bpm: 88, inst: 'krar', root: -7, scale: [0, 2, 3, 7, 8], prog: [0, 0, 5, 3], perc: 'soft', drone: true },
  caire:   { bpm: 90, inst: 'oud', root: -7, scale: [0, 1, 4, 5, 7, 8, 10], prog: [0, 0, 5, 0], perc: 'doum', drone: true },
  tension: { bpm: 66, inst: 'kora', root: -9, scale: [0, 1, 3, 6, 7], prog: [0], perc: 'heart', drone: true, sparse: true },
  action:  { bpm: 138, inst: 'kora', root: -7, scale: [0, 3, 5, 7, 10], prog: [0, 0, 3, 5], perc: 'djembe', bass: true },
  savane:  { bpm: 100, inst: 'krar', root: -5, scale: [0, 2, 4, 7, 9], prog: [0, 5, 7, 0], perc: 'soft', drone: true },
  semba:   { bpm: 124, inst: 'guitar', root: 0, scale: [0, 2, 4, 5, 7, 9], prog: [0, 5, 7, 0], perc: 'rumba', bass: true },
  maroc:   { bpm: 86, inst: 'oud', root: -5, scale: [0, 1, 4, 5, 7, 8, 10], prog: [0, 0, 5, 0], perc: 'doum', drone: true },
  rumba:   { bpm: 116, inst: 'guitar', root: -2, scale: [0, 2, 4, 7, 9, 11], prog: [0, 5, 7, 5], perc: 'rumba', bass: true },
};

const Music = {
  cur: null, timer: 0, step: 0, next: 0, gain: null, t0: 0, theme: null,
  play(name) {
    if (this.cur === name) return;
    const c = Snd.ensure(); if (!c) { this.cur = name; return; }
    this.stop(0.9);
    if (!name || !THEMES[name]) return;
    this.cur = name; this.theme = THEMES[name];
    const g = this.gain = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(1, c.currentTime + 1.2);
    g.connect(Snd.musBus);
    this.step = 0;
    this.t0 = this.next = c.currentTime + 0.12;
    if (this.theme.drone) this.startDrone();
    this.timer = setInterval(() => this.tick(), 40);
    this.tick();
  },
  stop(fade = 0.6) {
    clearInterval(this.timer); this.timer = 0;
    const c = Snd.ctx;
    if (c && this.gain) {
      const g = this.gain;
      g.gain.cancelScheduledValues(c.currentTime);
      g.gain.setValueAtTime(g.gain.value || 0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + fade);
      setTimeout(() => g.disconnect(), fade * 1000 + 100);
    }
    if (this.drone) { const d = this.drone; setTimeout(() => d.forEach(o => { try { o.stop(); } catch (e) {} }), fade * 1000 + 50); this.drone = null; }
    this.gain = null; this.cur = null;
  },
  startDrone() {
    const c = Snd.ctx, th = this.theme, f = nf(th.root - 24);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    const g = c.createGain(); g.gain.value = 0.07;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 160;
    lfo.connect(lg).connect(lp.frequency);
    const os = [f, f * 1.003, f * 1.5].map(fr => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(lp); o.start(); return o; });
    lp.connect(g).connect(this.gain);
    lfo.start();
    this.drone = [...os, lfo];
  },
  tick() {
    const c = Snd.ctx; if (!c || !this.gain) return;
    const th = this.theme, sp = 60 / th.bpm / 4; // une double-croche
    while (this.next < c.currentTime + 0.2) {
      this.note(this.step, this.next, th);
      this.step++; this.next += sp;
    }
  },
  note(s, t, th) {
    const S = Snd, bus = this.gain, bar = Math.floor(s / 16), q = s % 16;
    const chord = th.prog[bar % th.prog.length];
    const deg = i => { const n = th.scale.length; const o = Math.floor(i / n); return th.root + chord + th.scale[((i % n) + n) % n] + 12 * o; };
    const rng = (s * 9301 + 49297) % 233280 / 233280; // pseudo-hasard stable par pas
    // mélodie / arpège
    if (th.sparse) {
      if (q === 0 && bar % 2 === 0) S.pluck(nf(deg(irnd(2, 6))), t, 0.18, th.inst, bus);
      if (q === 10 && rng > 0.6) S.pluck(nf(deg(7) + 1), t, 0.08, th.inst, bus);
    } else if (th.perc === 'rumba') {
      // sebene : guitare aiguë en triolets syncopés
      const pat = [0, 3, 6, 8, 10, 12, 14];
      if (pat.includes(q)) S.pluck(nf(deg([7, 9, 8, 10, 9, 7, 8][pat.indexOf(q)])), t, 0.22, 'guitar', bus, 0.3);
      if (q === 4 || q === 12) S.pluck(nf(deg(4)), t, 0.14, 'guitar', bus, -0.3);
    } else {
      const arp = [0, 2, 4, 5, 7, 5, 4, 2];
      if (q % 2 === 0) {
        const i = arp[(q / 2 + bar) % arp.length] + (th.inst === 'oud' ? 0 : 3);
        if (!(rng > 0.82 && q % 4)) S.pluck(nf(deg(i)), t, q % 4 === 0 ? 0.26 : 0.17, th.inst, bus, (q % 8 - 4) * 0.08);
      }
      if (th.bpm < 100 && q === 6 && rng > 0.5) S.pluck(nf(deg(9)), t, 0.1, th.inst, bus, 0.3);
    }
    // basse
    if (th.bass && (q === 0 || q === 6 || q === 10)) S.pluck(nf(th.root + chord - 24 + (q === 10 ? 7 : 0)), t, 0.4, 'bass', bus);
    else if (q === 0 && !th.sparse) S.pluck(nf(th.root + chord - 12), t, 0.22, th.inst === 'oud' ? 'oud' : 'bass', bus);
    // percussions
    switch (th.perc) {
      case 'soft': if (q % 4 === 2) S.shaker(t, 0.05, bus); if (q === 0) S.djembe(t, 'bass', 0.18, bus); if (q === 10) S.djembe(t, 'tone', 0.1, bus); break;
      case 'heart': if (q === 0) S.heart(t, 0.45, bus); break;
      case 'doum': if (q === 0 || q === 6) S.djembe(t, 'bass', 0.25, bus); if (q === 4 || q === 12 || q === 14) S.djembe(t, 'slap', 0.12, bus); break;
      case 'djembe': {
        const P = 'B..sT.s.B.sTs.T.';
        const k = P[q];
        if (k === 'B') S.djembe(t, 'bass', 0.42, bus); else if (k === 'T') S.djembe(t, 'tone', 0.3, bus); else if (k === 's') S.djembe(t, 'slap', 0.2, bus);
        if (q % 2 === 1) S.shaker(t, 0.06, bus);
        break;
      }
      case 'rumba':
        if (q === 0 || q === 8) S.djembe(t, 'bass', 0.32, bus);
        if (q === 4 || q === 12) S.noise(t, 0.08, { vol: 0.18, freq: 2200, q: 1, bus });
        if (q % 2 === 0) S.shaker(t, 0.05, bus);
        break;
    }
  },
  /** Moment (horloge audio) du temps n depuis le début de la musique en cours. */
  beatTime(n) { return this.t0 + n * 60 / this.theme.bpm; },
};

document.addEventListener('visibilitychange', () => {
  const c = Snd.ctx; if (!c) return;
  if (document.hidden) c.suspend().catch(() => {}); else c.resume().catch(() => {});
});
