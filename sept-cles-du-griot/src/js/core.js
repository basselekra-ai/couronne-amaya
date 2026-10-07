'use strict';
/* Outils communs : DOM, hasard, sauvegarde, vibrations, fenêtres et notifications. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Crée un élément : el('div.cls#id', {attrs}, enfants…) */
function el(sel, attrs, ...kids) {
  const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
  const node = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][\w-]+/g) || []).forEach(t => t[0] === '.' ? node.classList.add(t.slice(1)) : (node.id = t.slice(1)));
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) node.append(k.nodeType ? k : document.createTextNode(k));
  return node;
}

/* ---------- pont natif (Capacitor) ---------- */
const Native = {
  get prefs() { try { return window.SCNative?.Preferences || null; } catch (e) { return null; } },
  get app() { try { return window.SCNative?.App || null; } catch (e) { return null; } },
  get haptics() { try { return window.SCNative?.Haptics || null; } catch (e) { return null; } },
};

/* ---------- sauvegarde ---------- */
const SAVE_KEY = 'sept-cles-du-griot-v1';
const Save = {
  d: null,
  defaults() {
    return {
      v: 1, started: false,
      chapters: {},          // id -> {done, stars:{gameId:n}, quiz}
      cur: null,             // {ch, step, scene}
      flags: {}, trust: 0,
      cauris: 40,
      clues: [], facts: [], keys: [], frags: [], trophies: [], endings: [],
      settings: { music: 0.6, sfx: 0.9, vib: true, speed: 1 },
      seenTuto: {},
    };
  },
  async load() {
    let raw = null;
    try { if (Native.prefs) raw = (await Native.prefs.get({ key: SAVE_KEY })).value; } catch (e) {}
    if (!raw) try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
    let d = null;
    try { d = raw ? JSON.parse(raw) : null; } catch (e) {}
    const def = this.defaults();
    this.d = d && d.v === 1 ? { ...def, ...d, settings: { ...def.settings, ...(d.settings || {}) } } : def;
  },
  _t: 0,
  save(now) {
    clearTimeout(this._t);
    const write = () => {
      const s = JSON.stringify(this.d);
      try { localStorage.setItem(SAVE_KEY, s); } catch (e) {}
      try { Native.prefs?.set({ key: SAVE_KEY, value: s }); } catch (e) {}
    };
    if (now) write(); else this._t = setTimeout(write, 250);
  },
  reset() {
    const settings = this.d.settings;
    this.d = this.defaults();
    this.d.settings = settings;
    this.save(true);
  },
  chap(id) { return this.d.chapters[id] || (this.d.chapters[id] = { done: false, stars: {}, quiz: 0 }); },
  addCauris(n) { this.d.cauris = Math.max(0, this.d.cauris + n); this.save(); UI.refreshCauris(); },
};

/* ---------- vibrations ---------- */
const Haptic = {
  tap() { this._do('LIGHT', 10); },
  mid() { this._do('MEDIUM', 25); },
  hard() { this._do('HEAVY', [40, 40, 60]); },
  _do(style, ms) {
    if (!Save.d?.settings.vib) return;
    const H = Native.haptics;
    if (H) { H.impact({ style }).catch(() => {}); return; }
    try { navigator.vibrate?.(ms); } catch (e) {}
  },
};

/* ---------- interface ---------- */
const UI = {
  cur: null,
  show(id) {
    for (const s of $$('.screen')) {
      const on = s.id === id;
      if (on && s.hidden) { s.hidden = false; s.classList.remove('enter'); void s.offsetWidth; s.classList.add('enter'); }
      else if (!on) s.hidden = true;
    }
    this.cur = id;
  },
  _toastT: 0,
  toast(msg, cls = '', ms = 2300) {
    const t = $('#toast');
    t.className = 'toast ' + cls;
    t.innerHTML = msg;
    t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => (t.hidden = true), ms);
  },
  flash(red) {
    const f = $('#flash');
    f.className = 'flash' + (red ? ' red' : '');
    void f.offsetWidth;
    f.classList.add('go');
  },
  shake(node = $('#app')) {
    node.classList.remove('shake-screen'); void node.offsetWidth; node.classList.add('shake-screen');
    setTimeout(() => node.classList.remove('shake-screen'), 500);
  },
  refreshCauris() {
    for (const id of ['#map-cauris', '#g-cauris']) { const n = $(id); if (n) n.textContent = Save.d.cauris; }
  },
  /** Fenêtre modale. buttons: [{label, cls, value}] ; renvoie la valeur choisie. */
  _modalResolve: null,
  modal({ title = '', html = '', buttons = [{ label: 'OK', value: true }], closable = false, cls = '' }) {
    return new Promise(res => {
      const ov = $('#overlay'), m = $('#modal');
      if (this._modalResolve) this._modalResolve(undefined);
      m.className = 'modal ' + cls;
      m.innerHTML = (closable ? `<button class="icon-btn x" data-v="__close" aria-label="Fermer">${Icons.get('croix')}</button>` : '') +
        (title ? `<h2>${title}</h2>` : '') + html +
        (buttons.length ? `<div class="acts">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${b.label}</button>`).join('')}</div>` : '');
      ov.hidden = false;
      const done = v => { ov.hidden = true; this._modalResolve = null; ov.onclick = null; res(v); };
      this._modalResolve = done;
      ov.onclick = e => {
        const b = e.target.closest('[data-i],[data-v="__close"]');
        if (!b) return;
        Sfx.play('tap'); Haptic.tap();
        if (b.dataset.v === '__close') return done(undefined);
        done(buttons[+b.dataset.i].value);
      };
    });
  },
  modalOpen() { return !$('#overlay').hidden; },
  closeModal() { if (this._modalResolve) this._modalResolve(undefined); },
};

/* Petites icônes vectorielles, colorées pour un fond sombre. */
const Icons = {
  lib: {
    cauri: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="10.5" fill="#f6ecd6" stroke="#b89b6a" stroke-width="1.2"/><path d="M12 3.5v17" stroke="#7a5d36" stroke-width="2.4" stroke-linecap="round"/><path d="M10 6.5h-2M10 9.5h-2.6M10 12.5h-2.8M10 15.5h-2.4M14 6.5h2M14 9.5h2.6M14 12.5h2.8M14 15.5h2.4" stroke="#b89b6a" stroke-width="1.2" stroke-linecap="round"/></svg>',
    cle: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="5.5" fill="none" stroke="#f2b33d" stroke-width="2.6"/><circle cx="8" cy="8" r="1.6" fill="#f2b33d"/><path d="M12 12l8.5 8.5M16.5 16.5l2.2-2.2M18.8 18.8l2-2" stroke="#f2b33d" stroke-width="2.6" stroke-linecap="round"/></svg>',
    carnet: '<svg viewBox="0 0 24 24"><rect x="4" y="2.5" width="16" height="19" rx="2.5" fill="#c8553d"/><rect x="4" y="2.5" width="4" height="19" rx="1.5" fill="#8a2f1e"/><path d="M11 8h6M11 11.5h6M11 15h4" stroke="#fff4e0" stroke-width="1.6" stroke-linecap="round"/></svg>',
    reglages: '<svg viewBox="0 0 24 24"><path d="M12 8.2a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6z" fill="none" stroke="#fff4e0" stroke-width="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke="#fff4e0" stroke-width="2.2" stroke-linecap="round"/></svg>',
    maison: '<svg viewBox="0 0 24 24"><path d="M3.5 11L12 4l8.5 7" fill="none" stroke="#fff4e0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9.5h4.5v-5h3v5H18V10" fill="none" stroke="#fff4e0" stroke-width="2.2" stroke-linejoin="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="#fff4e0" stroke-width="2.4" stroke-linecap="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="#fff4e0"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#fff4e0"/></svg>',
    croix: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6L6 18" stroke="#fff4e0" stroke-width="2.6" stroke-linecap="round"/></svg>',
    loupe: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6" fill="none" stroke="#fff4e0" stroke-width="2.4"/><path d="M14.5 14.5L20 20" stroke="#fff4e0" stroke-width="2.8" stroke-linecap="round"/></svg>',
    cadenas: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="#a59bb5"/><path d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke="#a59bb5" stroke-width="2.4"/></svg>',
    etoile: '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="#f2b33d"/></svg>',
    son: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff4e0"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" stroke="#fff4e0" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  },
  get(n) { return this.lib[n] || ''; },
  hydrate(root = document) { for (const s of $$('.ico[data-ico]', root)) if (!s.innerHTML) s.innerHTML = this.get(s.dataset.ico); },
};
