'use strict';
/* Mini-jeux (suite) : infiltration, kente, rythme, confrontation. */

/* ======================================================================
   INFILTRATION : tour par tour, éviter le regard des gardes
   Cases : # obstacle  . sol  ~ eau (bloque le passage, pas le regard)
           * buisson (cache)  S départ  E sortie  F fragment
   Gardes : static (regarde toujours d), turn (tourne selon dirs),
            patrol (aller-retour sur path, regarde où il va). r = portée.
   ====================================================================== */
const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

const INF_LEVELS = {
  lac: [
    { name: 'La rive', map: [
      '~~~E~~~',
      '~..*..~',
      '~.#.#.~',
      '.......',
      '..~~~..',
      '*.....*',
      '.#...#.',
      '...S...',
    ], guards: [{ x: 3, y: 3, mode: 'turn', dirs: ['W', 'E'], r: 3 }] },
    { name: 'Les palmiers', map: [
      '#E#~~~~',
      '#.*..~~',
      '#..#...',
      '..*....',
      '.##.#*.',
      '.......',
      '*..#..*',
      '...S...',
    ], guards: [{ mode: 'patrol', path: [[6, 3], [6, 2], [5, 2], [4, 2]], r: 3 }, { x: 0, y: 5, mode: 'turn', dirs: ['E', 'N'], r: 4 }] },
    { name: 'La cabane', map: [
      '~~~E~~~',
      '......~',
      '~.#.#.~',
      '*.....*',
      '.~~.~~.',
      'F#...#.',
      '.......',
      '#..S..#',
    ], guards: [{ mode: 'patrol', path: [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6]], r: 2 }, { x: 0, y: 1, mode: 'turn', dirs: ['E', 'S', 'S'], r: 4 }, { mode: 'patrol', path: [[3, 3], [3, 4], [3, 5]], r: 2 }] },
  ],
  souk: [
    { name: 'L\'entrée du souk', map: [
      '##E####',
      '#..*..#',
      '#.#.#.#',
      '.......',
      '.#*#.#.',
      '.......',
      '#.#.#.#',
      '...S...',
    ], guards: [{ mode: 'patrol', path: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3]], r: 2 }, { x: 6, y: 5, mode: 'static', d: 'W', r: 3 }] },
    { name: 'Les lanternes', map: [
      '#####E#',
      '#*....#',
      '#.##..#',
      '#....*.',
      '##.#...',
      '*....#.',
      '.#.#...',
      '...S..#',
    ], guards: [{ x: 4, y: 1, mode: 'turn', dirs: ['W', 'S'], r: 3 }, { mode: 'patrol', path: [[6, 3], [6, 4], [6, 5], [6, 6]], r: 2 }, { x: 0, y: 6, mode: 'turn', dirs: ['N', 'E'], r: 3 }] },
    { name: 'L\'escalier oublié', map: [
      '###E###',
      '#..*.F#',
      '#.#.#.#',
      '*.....*',
      '.#.#.#.',
      '.......',
      '#*#.#*#',
      '...S...',
    ], guards: [{ mode: 'patrol', path: [[1, 5], [2, 5], [3, 5], [4, 5], [5, 5]], r: 2 }, { x: 3, y: 2, mode: 'turn', dirs: ['W', 'E'], r: 3 }, { x: 0, y: 3, mode: 'turn', dirs: ['E', 'N'], r: 3 }] },
  ],
};

const INF = {
  parse(L) {
    const grid = L.map.map(r => r.split(''));
    const h = grid.length, w = grid[0].length;
    let start, exit, frag = null;
    grid.forEach((row, y) => row.forEach((c, x) => {
      if (c === 'S') { start = [x, y]; row[x] = '.'; }
      if (c === 'E') exit = [x, y];
      if (c === 'F') { frag = [x, y]; row[x] = '.'; }
    }));
    return { w, h, grid, start, exit, frag, guards: L.guards };
  },
  walk(P, x, y) { return x >= 0 && y >= 0 && x < P.w && y < P.h && !'#~'.includes(P.grid[y][x]); },
  period(g) { return g.mode === 'patrol' ? Math.max(1, 2 * (g.path.length - 1)) : g.mode === 'turn' ? g.dirs.length : 1; },
  guard(g, t) {
    if (g.mode === 'static') return { x: g.x, y: g.y, d: g.d };
    if (g.mode === 'turn') return { x: g.x, y: g.y, d: g.dirs[t % g.dirs.length] };
    const n = g.path.length - 1, per = 2 * n;
    const idx = k => { const m = ((k % per) + per) % per; return m <= n ? m : per - m; };
    const [x, y] = g.path[idx(t)], [nx, ny] = g.path[idx(t + 1)];
    const d = Object.keys(DIRS).find(k => DIRS[k][0] === Math.sign(nx - x) && DIRS[k][1] === Math.sign(ny - y)) || 'S';
    return { x, y, d };
  },
  sight(P, t) {
    const seen = new Set();
    for (const g of P.guards) {
      const s = this.guard(g, t), [dx, dy] = DIRS[s.d];
      for (let k = 1; k <= (g.r || 3); k++) {
        const x = s.x + dx * k, y = s.y + dy * k;
        if (x < 0 || y < 0 || x >= P.w || y >= P.h || P.grid[y][x] === '#') break;
        if (P.grid[y][x] !== '*') seen.add(x + ',' + y);
      }
    }
    return seen;
  },
  occupied(P, t) { return new Set(P.guards.map(g => { const s = this.guard(g, t); return s.x + ',' + s.y; })); },
  /** Le joueur passe de (px,py) à (x,y) ; les gardes passent de t à t+1. Renvoie true si repéré. */
  caught(P, px, py, x, y, t) {
    if (this.occupied(P, t + 1).has(x + ',' + y) || this.sight(P, t + 1).has(x + ',' + y)) return true;
    for (const g of P.guards) {
      const a = this.guard(g, t), b = this.guard(g, t + 1);
      if (a.x === x && a.y === y && b.x === px && b.y === py) return true;
    }
    return false;
  },
  /** Plus court chemin (sert aux tests de conception des niveaux). */
  solve(P) {
    const per = P.guards.reduce((a, g) => { const p = this.period(g); let l = a; while (l % p) l += a; return l; }, 1);
    const key = (x, y, t) => `${x},${y},${t % per}`;
    const q = [[...P.start, 0]], seen = new Set([key(...P.start, 0)]);
    while (q.length) {
      const [x, y, t] = q.shift();
      if (x === P.exit[0] && y === P.exit[1]) return t;
      for (const [dx, dy] of [[0, 0], [0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = x + dx, ny = y + dy;
        if (!this.walk(P, nx, ny) || (dx || dy) && this.occupied(P, t).has(nx + ',' + ny)) continue;
        if (this.caught(P, x, y, nx, ny, t)) continue;
        const k = key(nx, ny, t + 1);
        if (seen.has(k) || t > 60) continue;
        seen.add(k); q.push([nx, ny, t + 1]);
      }
    }
    return -1;
  },
};

const INF_ART = {
  lac: {
    wall: '<svg viewBox="0 0 40 40"><path d="M20 40V14" stroke="#4a3424" stroke-width="4"/><path d="M20 14Q8 8 2 16M20 14Q32 8 38 16M20 14Q12 2 6 4M20 14Q28 2 34 4M20 14Q20 4 20 0" stroke="#2f6a3a" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
    water: '<svg viewBox="0 0 40 40"><path d="M6 16q4-3 8 0t8 0M18 28q4-3 8 0t8 0" stroke="rgba(255,255,255,.25)" stroke-width="1.5" fill="none"/></svg>',
    croc: '<svg viewBox="0 0 40 40"><path d="M4 22Q14 16 24 18Q32 16 38 20Q32 24 24 23Q14 26 4 22Z" fill="#0a120c"/><circle cx="30" cy="19" r="1.6" fill="#ffd23f"/><circle cx="34" cy="19" r="1.6" fill="#ffd23f"/></svg>',
    bush: '<svg viewBox="0 0 40 40"><circle cx="13" cy="24" r="10" fill="#3d7a4a"/><circle cx="26" cy="22" r="11" fill="#2f6a3a"/><circle cx="20" cy="14" r="9" fill="#4a8a52"/></svg>',
    exit: '<svg viewBox="0 0 40 40"><path d="M6 20L20 8L34 20V34H6Z" fill="#8a5a2a"/><path d="M4 21L20 6L36 21" stroke="#c9a24a" stroke-width="3" fill="none"/><rect x="16" y="24" width="8" height="10" fill="#2a1608"/></svg>',
    floor: '#2f3d3a', floor2: '#34443f',
  },
  souk: {
    wall: '<svg viewBox="0 0 40 40"><rect x="3" y="14" width="34" height="24" fill="#5a3a2a"/><path d="M1 14H39L35 4H5Z" fill="#c8553d"/><path d="M8 14L10 4M16 14V4M24 14V4M32 14L30 4" stroke="#f2b33d" stroke-width="2"/><rect x="8" y="20" width="8" height="8" fill="#f2b33d"/><rect x="22" y="22" width="10" height="6" fill="#2f9e62"/></svg>',
    water: '', croc: '',
    bush: '<svg viewBox="0 0 40 40"><path d="M4 2H36" stroke="#5a4a3a" stroke-width="3"/><rect x="6" y="3" width="28" height="34" fill="#8a2f3a"/><path d="M6 10H34M6 30H34" stroke="#f2b33d" stroke-width="2.5"/><path d="M20 14L28 20L20 26L12 20Z" fill="#f2b33d"/></svg>',
    exit: '<svg viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" fill="#1a1008"/><path d="M8 32H32M10 26H30M12 20H28M14 14H26" stroke="#c9a24a" stroke-width="3"/></svg>',
    floor: '#4a3a40', floor2: '#52424a',
  },
};

GAME_TYPES.infiltration = (stage, cfg, ctl) => new Promise(res => {
  const A = INF_ART[cfg.theme], levels = INF_LEVELS[cfg.levels];
  let li = 0, P, px, py, t, catches = 0, frag = false, over = false, busy = false, gotFragThisLevel = false;
  stage.innerHTML = `<div class="g-hud"><span id="if-l"></span><span class="grow"></span><span id="if-c"></span></div>
    <div class="g-sub" id="if-s">Touche une case voisine pour avancer. Touche Awa pour attendre.</div>
    <div class="inf"><div class="inf-grid"></div></div><div class="g-foot"></div>`;
  const gridEl = $('.inf-grid', stage);
  let showNext = false;
  $('.g-foot', stage).append(hintButton(10, 'Prévoir', () => { if (showNext) return false; showNext = true; draw(); UI.toast('Les cases jaunes : ce que verront les gardes au tour suivant.'); }));
  const tileSize = () => {
    const box = $('.inf', stage);
    return Math.floor(Math.min((box.clientWidth - 20) / P.w, (box.clientHeight - 20) / P.h, 58)) - 3;
  };
  const load = () => {
    P = INF.parse(levels[li]);
    [px, py] = P.start; t = 0; gotFragThisLevel = false;
    $('#if-l').textContent = `${levels[li].name} · ${li + 1}/${levels.length}`;
    build();
  };
  const build = () => {
    const s = tileSize();
    gridEl.style.gridTemplateColumns = `repeat(${P.w}, ${s}px)`;
    gridEl.style.gridAutoRows = s + 'px';
    let html = '';
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      const c = P.grid[y][x];
      const cls = c === '#' ? 'wall' : c === '~' ? 'water' : c === '*' ? 'bush' : c === 'E' ? 'exit' : '';
      const art = c === '#' ? A.wall : c === '~' ? ((x * 7 + y * 3) % 5 === 0 && A.croc ? A.croc : A.water) : c === '*' ? A.bush : c === 'E' ? A.exit : '';
      const bg = c === '.' || c === 'S' ? `style="background:${(x + y) % 2 ? A.floor : A.floor2}"` : '';
      html += `<div class="tile ${cls}" data-x="${x}" data-y="${y}" ${bg}>${art ? `<span class="deco">${art}</span>` : ''}</div>`;
    }
    gridEl.innerHTML = html;
    if (P.frag) gridEl.insertAdjacentHTML('beforeend', `<div class="tok frag" style="width:${s}px;height:${s}px">${Icons.get('cauri')}</div>`);
    gridEl.insertAdjacentHTML('beforeend', P.guards.map((g, i) => `<div class="tok guard" data-g="${i}" style="width:${s}px;height:${s}px"></div>`).join(''));
    gridEl.insertAdjacentHTML('beforeend', `<div class="tok player" style="width:${s}px;height:${s}px">${tokenSvg('awa')}</div>`);
    draw();
  };
  const pos = (node, x, y) => { const s = tileSize() + 3; node.style.left = (6 + x * s) + 'px'; node.style.top = (6 + y * s) + 'px'; };
  const draw = () => {
    const seen = INF.sight(P, t), next = INF.sight(P, t + 1), occ = INF.occupied(P, t);
    for (const tile of $$('.tile', gridEl)) {
      const x = +tile.dataset.x, y = +tile.dataset.y, k = x + ',' + y;
      tile.classList.toggle('vis', seen.has(k));
      tile.classList.toggle('next', showNext && next.has(k) && !seen.has(k));
      const adj = Math.abs(x - px) + Math.abs(y - py) === 1 && INF.walk(P, x, y) && !occ.has(k);
      tile.classList.toggle('can', adj && !over);
    }
    P.guards.forEach((g, i) => {
      const s = INF.guard(g, t), n = $(`.tok.guard[data-g="${i}"]`, gridEl);
      pos(n, s.x, s.y);
      n.innerHTML = tokenSvg('agent', s.d);
    });
    pos($('.tok.player', gridEl), px, py);
    const f = $('.tok.frag', gridEl);
    if (f) { if (P.frag && !gotFragThisLevel && !frag) pos(f, ...P.frag); else f.remove(); }
    $('#if-c').textContent = catches ? `Repérée : ${catches}` : 'Invisible';
  };
  const step = async (x, y) => {
    if (busy || over || ctl.paused) return;
    const wait = x === px && y === py;
    if (!wait && (Math.abs(x - px) + Math.abs(y - py) !== 1 || !INF.walk(P, x, y) || INF.occupied(P, t).has(x + ',' + y))) return;
    busy = true;
    const was = INF.caught(P, px, py, x, y, t);
    const opx = px, opy = py;
    px = x; py = y; t++;
    Sfx.play('step'); Haptic.tap();
    if (P.frag && !frag && x === P.frag[0] && y === P.frag[1]) { frag = true; gotFragThisLevel = true; Sfx.play('coin'); UI.toast('✦ Fragment de mémoire !'); }
    draw();
    if (was) {
      catches++;
      Sfx.play('alarm'); Haptic.hard(); UI.flash(true);
      $('.tok.player', gridEl).classList.add('caught');
      $('#if-s').textContent = 'Repérée ! On recommence ce passage.';
      await ctl.sleep(1100);
      if (frag && gotFragThisLevel) frag = false;
      load(); busy = false; return;
    }
    if (x === P.exit[0] && y === P.exit[1]) {
      Sfx.play('ok');
      li++;
      if (li >= levels.length) {
        over = true; draw();
        if (catches === 0) unlockTrophy('ombre');
        await ctl.sleep(500);
        res({ win: true, stars: catches === 0 ? 3 : catches <= 2 ? 2 : 1, frag, title: 'Passée inaperçue !', text: catches ? `Repérée ${catches} fois, mais jamais rattrapée.` : 'Pas une seule fois repérée. Une vraie ombre.' });
        return;
      }
      $('#if-s').textContent = 'Passage suivant…';
      await ctl.sleep(500);
      load();
      $('#if-s').textContent = 'Touche une case voisine pour avancer. Touche Awa pour attendre.';
    }
    void opx; void opy;
    busy = false;
  };
  ctl.listen(gridEl, 'click', e => {
    const tile = e.target.closest('.tile');
    if (tile) step(+tile.dataset.x, +tile.dataset.y);
    else if (e.target.closest('.tok.player')) step(px, py);
  });
  ctl.listen(window, 'keydown', e => {
    const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], ' ': [0, 0] }[e.key];
    if (m) step(px + m[0], py + m[1]);
  });
  ctl.listen(window, 'resize', () => build());
  load();
});

/** Jeton rond (tête du personnage) ; pour les gardes, une lampe indique la direction. */
function tokenSvg(who, dir) {
  const face = portrait(who, who === 'agent' ? 'colere' : 'determine').replace(/^<svg viewBox="0 0 200 240"/, '<svg viewBox="40 40 120 120" x="6" y="6" width="28" height="28"');
  const rot = { N: 0, E: 90, S: 180, W: 270 }[dir] || 0;
  return `<svg viewBox="0 0 40 40">${dir ? `<g transform="rotate(${rot} 20 20)"><path d="M20 20L13 -2H27Z" fill="#ffe08a" opacity=".55"/></g>` : ''}
    <circle cx="20" cy="20" r="16" fill="${who === 'awa' ? '#f2b33d' : '#2c2d34'}" stroke="${who === 'awa' ? '#fff4e0' : '#ff4a3d'}" stroke-width="2.5"/>${face}</svg>`;
}

/* ======================================================================
   KENTE : remettre les bandes tissées en place
   ====================================================================== */
const KENTE_COLORS = { G: '#f2b33d', V: '#1d7a3e', R: '#c22d23', N: '#15110e' };
const KENTE_DESIGN = [
  'NVGGVN',
  'VRVVRV',
  'GVGGVG',
  'RGNNGR',
  'GNGGNG',
  'NGRRGN',
  'VNGGNV',
  'RVNNVR',
  'GRVVRG',
  'NGGGGN',
];

GAME_TYPES.kente = (stage, cfg, ctl) => new Promise(res => {
  const rows = KENTE_DESIGN.length, cols = KENTE_DESIGN[0].length;
  const col = c => KENTE_DESIGN.map(r => r[c]);
  const off = Array.from({ length: cols }, () => irnd(2, rows - 2));
  const optimal = off.reduce((a, o) => a + Math.min(o, rows - o), 0);
  let moves = 0, over = false;
  const cellH = () => Math.max(18, Math.min(30, Math.floor(($('.kt', stage)?.clientHeight || 500) - 140) / rows));
  stage.innerHTML = `<div class="g-hud"><span id="kt-m">Mouvements : 0</span><span class="grow"></span><span id="kt-ok"></span></div>
    <div class="kt"><div class="kt-row"><div class="kt-cloth"></div><div class="kt-target">Modèle<div class="mini"></div></div></div>
    <div class="g-sub">Glisse une bande vers le haut ou le bas, ou utilise les flèches.</div></div><div class="g-foot"></div>`;
  const cloth = $('.kt-cloth', stage);
  $('.kt-target .mini', stage).innerHTML = Array.from({ length: cols }, (_, c) => `<div style="display:flex;flex-direction:column">${col(c).map(k => `<i style="display:block;width:9px;height:7px;background:${KENTE_COLORS[k]}"></i>`).join('')}</div>`).join('');
  $('.g-foot', stage).append(hintButton(15, 'Ajuster', () => {
    const c = off.findIndex(o => o !== 0);
    if (c < 0) return false;
    off[c] = 0; render(); check();
  }));
  const cellHtml = (k, h) => `<span class="kt-cell" style="width:40px;height:${h}px;background:${KENTE_COLORS[k]};background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.12) 0 2px,transparent 2px 5px),repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0 1px,transparent 1px 4px)"></span>`;
  const render = () => {
    const h = cellH();
    cloth.innerHTML = Array.from({ length: cols }, (_, c) => {
      const cells = col(c), shown = cells.map((_, r) => cells[(r + off[c]) % rows]);
      return `<div class="kt-strip" data-c="${c}"><button class="arr" data-c="${c}" data-d="-1" aria-label="Monter">▲</button>
        <div class="kt-col ${off[c] === 0 ? 'ok' : ''}" data-c="${c}">${shown.map(k => cellHtml(k, h)).join('')}</div>
        <button class="arr" data-c="${c}" data-d="1" aria-label="Descendre">▼</button></div>`;
    }).join('');
    $('#kt-m').textContent = 'Mouvements : ' + moves;
    $('#kt-ok').textContent = `${off.filter(o => o === 0).length}/${cols} bandes`;
  };
  const shift = (c, d) => {
    if (over || ctl.paused) return;
    off[c] = (off[c] - d + rows) % rows;
    moves++;
    Sfx.play(off[c] === 0 ? 'ok' : 'tap'); Haptic.tap();
    render(); check();
  };
  const check = () => {
    if (off.some(o => o !== 0) || over) return;
    over = true;
    stage.classList.add('kt-done');
    Sfx.play('reveal');
    ctl.timeout(() => { stage.classList.remove('kt-done'); res({ win: true, stars: moves <= optimal + 4 ? 3 : moves <= optimal + 12 ? 2 : 1, title: 'Le tissu parle !', text: 'Une flèche d\'or apparaît au centre du motif.' }); }, 1500);
  };
  ctl.listen(cloth, 'click', e => { const b = e.target.closest('.arr'); if (b) shift(+b.dataset.c, +b.dataset.d); });
  // glisser une bande
  let drag = null;
  ctl.listen(cloth, 'pointerdown', e => { const s = e.target.closest('.kt-col'); if (!s) return; drag = { c: +s.dataset.c, y: e.clientY }; s.setPointerCapture?.(e.pointerId); });
  ctl.listen(cloth, 'pointermove', e => {
    if (!drag) return;
    const h = cellH(), dy = e.clientY - drag.y;
    if (Math.abs(dy) >= h) { const n = Math.trunc(dy / h); for (let i = 0; i < Math.abs(n); i++) shift(drag.c, Math.sign(n)); drag.y += n * h; }
  });
  ctl.listen(window, 'pointerup', () => (drag = null));
  render();
});

/* ======================================================================
   RYTHME : notes qui tombent sur trois tambours
   ====================================================================== */
const RHYTHM_BARS = [
  '0...1...2...1...', '0...0...1...2...', '0.1.2.1.0.1.2...', '0...1.1.2...2...',
  '0.0.1...2.2.1...', '0.1.0.2.0.1.2...', '2...1...0.1.2...', '0.1.2.2.1.0.1.2.',
  '0...2...0.1.2...', '1.1.0...2.2.0...', '0.1.2.1.0.2.1...', '2.1.0.1.2.1.0...',
  '0.0.1.1.2.2.1...', '0.1.2.0.1.2.1...', '2.2.1.1.0.0.1...', '0...1...2...0...',
];

GAME_TYPES.rythme = (stage, cfg, ctl) => new Promise(res => {
  stage.innerHTML = `<div class="g-hud"><span>La foule</span><div class="bar" id="ry-c"><i style="transform:scaleX(.5)"></i></div><b id="ry-p">0%</b></div>
    <div class="cv-wrap"><canvas></canvas><div class="cv-help">Touche le tambour quand la note arrive sur la ligne</div></div>`;
  const wrap = $('.cv-wrap', stage), cv = $('canvas', wrap), g = cv.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(2, devicePixelRatio || 1); W = wrap.clientWidth; H = wrap.clientHeight; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
  resize(); ctl.listen(window, 'resize', resize);

  const c = Snd.ensure();
  Music.stop(0.2); Music.cur = null;
  Music.play('rumba');
  const bpm = THEMES.rumba.bpm, beat = 60 / bpm, startBeat = 8;
  const notes = [];
  const bars = RHYTHM_BARS.slice(0, Math.ceil((cfg.beats || 64) / 4));
  bars.forEach((p, b) => [...p].forEach((ch, s) => { if (ch !== '.') notes.push({ lane: +ch, time: Music.beatTime(startBeat + b * 4 + s / 4) }); }));
  const clock = () => (c ? c.currentTime : performance.now() / 1000);
  const endTime = notes[notes.length - 1].time + 1.5;
  const LANES = [['#e2589a', 'bass'], ['#3ad0ff', 'tone'], ['#ffd23f', 'slap']];
  const fall = 1.6; // secondes de chute
  let score = 0, judged = 0, combo = 0, best = 0, pops = [], over = false, flashL = [0, 0, 0];

  ctl.onPause(() => c?.suspend());
  ctl.onResume(() => c?.resume());
  ctl.onClean(() => { c?.resume(); });

  const judge = (n, q) => {
    n.done = true; judged++;
    if (q > 0) { score += q; combo++; best = Math.max(best, combo); } else combo = 0;
    pops.push({ lane: n.lane, text: q === 1 ? 'Parfait !' : q > 0 ? 'Bien' : 'Raté', col: q === 1 ? '#ffe08a' : q > 0 ? '#9ff0c8' : '#ff8a7a', t: clock() });
  };
  const tap = lane => {
    if (over || ctl.paused) return;
    const now = clock();
    flashL[lane] = 1;
    Sfx.play('drum', { kind: LANES[lane][1] });
    Haptic.tap();
    let bestN = null, bd = 1;
    for (const n of notes) if (!n.done && n.lane === lane) { const d = Math.abs(n.time - now); if (d < bd) { bd = d; bestN = n; } }
    if (bestN && bd <= 0.16) judge(bestN, bd <= 0.07 ? 1 : 0.6);
    $('.cv-help', wrap).style.opacity = 0;
  };
  ctl.listen(cv, 'pointerdown', e => { const r = cv.getBoundingClientRect(); tap(clamp(Math.floor((e.clientX - r.left) / r.width * 3), 0, 2)); });
  ctl.listen(window, 'keydown', e => { const k = { ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2, a: 0, s: 1, d: 2 }[e.key]; if (k != null) tap(k); });

  const hitY = () => H * 0.84;
  ctl.loop(dt => {
    const now = clock();
    for (const n of notes) if (!n.done && now - n.time > 0.16) judge(n, 0);
    // fond de scène
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#1a0a2a'); gr.addColorStop(1, '#05030a');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const pulse = Math.max(0, 1 - ((now - Music.t0) % beat) / beat);
    LANES.forEach(([col], i) => {
      const x = (i + 0.5) * W / 3;
      g.globalAlpha = 0.08 + pulse * 0.08 + flashL[i] * 0.3;
      g.fillStyle = col; g.beginPath(); g.moveTo(x - 10, 0); g.lineTo(x - W / 6, H); g.lineTo(x + W / 6, H); g.lineTo(x + 10, 0); g.fill();
      g.globalAlpha = 1;
      flashL[i] = Math.max(0, flashL[i] - dt * 5);
    });
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1;
    for (const i of [1, 2]) { g.beginPath(); g.moveTo(i * W / 3, 0); g.lineTo(i * W / 3, H); g.stroke(); }
    // ligne de frappe et tambours
    g.fillStyle = '#f2b33d'; g.fillRect(0, hitY() - 2, W, 4);
    LANES.forEach(([col], i) => {
      const x = (i + 0.5) * W / 3, r = Math.min(W / 8, 40) * (1 + flashL[i] * 0.15);
      g.fillStyle = '#3a2010'; g.beginPath(); g.ellipse(x, hitY() + r * 0.5, r, r * 0.55, 0, 0, 7); g.fill();
      g.fillStyle = '#ecd3a2'; g.beginPath(); g.ellipse(x, hitY(), r, r * 0.45, 0, 0, 7); g.fill();
      g.strokeStyle = col; g.lineWidth = 4; g.stroke();
    });
    // notes
    for (const n of notes) {
      if (n.done) continue;
      const k = 1 - (n.time - now) / fall;
      if (k < 0 || k > 1.15) continue;
      const x = (n.lane + 0.5) * W / 3, y = k * hitY(), r = Math.min(W / 11, 26);
      g.fillStyle = LANES[n.lane][0]; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    }
    // jugements
    g.textAlign = 'center'; g.font = '22px "Lilita One",sans-serif';
    pops = pops.filter(p => now - p.t < 0.6);
    for (const p of pops) { g.globalAlpha = 1 - (now - p.t) / 0.6; g.fillStyle = p.col; g.fillText(p.text, (p.lane + 0.5) * W / 3, hitY() - 50 - (now - p.t) * 60); }
    g.globalAlpha = 1;
    if (combo >= 5) { g.font = '30px "Lilita One",sans-serif'; g.fillStyle = '#fff4e0'; g.fillText(`Combo ×${combo}`, W / 2, H * 0.2); }
    if (now < notes[0].time - 0.4) { g.font = '26px "Lilita One",sans-serif'; g.fillStyle = '#ffe08a'; g.fillText(['3', '2', '1', 'Rumba !'][clamp(Math.floor((now - (notes[0].time - 4 * beat - 0.4)) / beat), 0, 3)] || '', W / 2, H * 0.4); }
    const acc = judged ? score / judged : 0.5;
    $('#ry-c i').style.transform = `scaleX(${acc})`;
    $('#ry-p').textContent = Math.round((judged ? score / notes.length : 0) * 100) + '%';
    if (!over && now > endTime) {
      over = true;
      const fin = score / notes.length;
      if (fin >= 0.95) unlockTrophy('rumba');
      Sfx.play('crowd');
      ctl.timeout(() => res(fin >= 0.6
        ? { win: true, stars: fin >= 0.9 ? 3 : fin >= 0.75 ? 2 : 1, frag: fin >= 0.9, title: 'La salle est en feu !', text: `Précision : ${Math.round(fin * 100)} % · meilleur combo ×${best}.` }
        : { win: false, title: 'La foule décroche…', text: `Précision : ${Math.round(fin * 100)} %. Il faut au moins 60 % pour approcher la guitare.` }), 600);
    }
  });
});

/* ======================================================================
   CONFRONTATION : présenter l'indice qui contredit
   ====================================================================== */
const CONFRONT = [
  { text: 'Ce téléphone ? Je l\'ai acheté au marché Sandaga, le matin même. Au hasard, chez le premier vendeur venu.', ev: 'puce', react: ['inquiet', 'Je… Des tas d\'entreprises s\'appellent « IS » !'] },
  { text: 'Ton grand-père et moi, on ne s\'était pas parlé depuis des mois. Aucune dispute. Rien du tout.', ev: 'lettre', react: ['inquiet', 'Une offre… Une simple offre d\'affaires, entre vieux amis.'] },
  { text: 'Et comment aurais-je su que tu partais pour Bamako, hein ? Je ne suis pas devin.', ev: 'billet', react: ['peur', 'Je… J\'ai pu deviner, voilà tout…'] },
  { text: 'Les Sept ? Une photo de 1987 ? Je n\'y étais pas. Je ne connais aucun de ces gens.', ev: 'bague', react: ['colere', 'Cette bague… Seydou garde vraiment tout.'] },
];
const CONFRONT_MOCK = ['Et alors ? Ça ne prouve rien, ma petite.', 'Tu perds ton temps. Et celui de Seydou.', 'Hm. Tu es fatiguée, Awa. Va dormir.'];

GAME_TYPES.confrontation = (stage, cfg, ctl) => new Promise(res => {
  let cur = 0, lives = 3, over = false, mood = 'sourire', mock = 0;
  const done = new Set();
  stage.innerHTML = `<div class="g-hud"><span class="hearts" id="cf-h"></span><span class="grow"></span><span class="cf-dots" id="cf-d"></span></div>
    <div class="cf"><div class="cf-call">● Appel en cours · Tonton Ibrahima</div><div class="cf-port"></div>
    <div class="cf-stmt"><span class="n"></span><div class="tx"></div></div>
    <div class="cf-acts"><button class="btn ghost small" id="cf-prev">◀</button><button class="btn terra" id="cf-obj">Objection !</button><button class="btn ghost small" id="cf-next">▶</button></div>
    <div class="g-sub">Lis chaque phrase. Quand l'une d'elles est fausse, présente la preuve.</div></div><div class="g-foot"></div>`;
  const port = $('.cf-port', stage), stmt = $('.cf-stmt', stage);
  $('.g-foot', stage).append(hintButton(15, 'Piste', () => {
    const s = CONFRONT[cur];
    if (done.has(cur)) return false;
    UI.toast(`Pense à : « ${CLUES[s.ev].t} »`, '', 3200);
  }));
  const render = () => {
    $('#cf-h').textContent = '♥'.repeat(lives) + '♡'.repeat(3 - lives);
    $('#cf-d').innerHTML = CONFRONT.map((_, i) => `<i class="${done.has(i) ? 'done' : i === cur ? 'on' : ''}"></i>`).join('');
    port.innerHTML = portrait('ibrahima', mood, 1);
    $('.n', stmt).textContent = `Déclaration ${cur + 1}/${CONFRONT.length}`;
    $('.tx', stmt).innerHTML = fmt(done.has(cur) ? `~~${CONFRONT[cur].text}~~` : CONFRONT[cur].text).replace(/~~(.+)~~/, '<s style="opacity:.55">$1</s>');
    stmt.classList.toggle('hit', done.has(cur));
  };
  const say = async (m, text, ms = 1800) => {
    mood = m; render();
    $('.tx', stmt).innerHTML = `<b style="color:var(--gold-hi)">${esc(text)}</b>`;
    await ctl.sleep(ms);
    render();
  };
  const go = d => { if (over) return; cur = (cur + d + CONFRONT.length) % CONFRONT.length; Sfx.play('page'); render(); };
  $('#cf-prev').onclick = () => go(-1);
  $('#cf-next').onclick = () => go(1);
  $('#cf-obj').onclick = async () => {
    if (over || ctl.paused) return;
    if (done.has(cur)) { UI.toast('Celle-ci, tu l\'as déjà démontée.'); return; }
    Sfx.play('tap');
    const clues = Save.d.clues.filter(id => CLUES[id]);
    const pickP = UI.modal({
      title: 'Quelle preuve ?', closable: true, buttons: [],
      html: `<div class="ev-list">${clues.map(id => `<button class="ev" data-ev="${id}"><span class="ic">${id.startsWith('photo') ? guardiansPhoto(id === 'photo' ? 'dechiree' : 'complete') : clueArt(CLUES[id].art)}</span><span><b>${CLUES[id].t}</b><small>${esc(CLUES[id].d)}</small></span></button>`).join('')}</div>`,
    });
    const m = $('#modal');
    const onPick = e => { const b = e.target.closest('[data-ev]'); if (b) { picked = b.dataset.ev; UI.closeModal(); } };
    let picked = null;
    m.addEventListener('click', onPick);
    await pickP;
    m.removeEventListener('click', onPick);
    if (!picked || over) return;
    const s = CONFRONT[cur];
    if (picked === s.ev) {
      done.add(cur);
      Sfx.play('stinger'); Haptic.hard(); UI.flash(); UI.shake();
      const st = el('div.stamp', { text: 'CONTRADICTION !' });
      $('#scr-game').append(st); setTimeout(() => st.remove(), 1300);
      await say(s.react[0], s.react[1], 2200);
      mood = done.size >= 3 ? 'colere' : 'inquiet';
      if (done.size === CONFRONT.length) {
        over = true;
        await ctl.sleep(300);
        res({ win: true, stars: lives === 3 ? 3 : lives === 2 ? 2 : 1, title: 'Il est démasqué', text: 'Au bout du fil, un long silence. Puis un rire froid.' });
        return;
      }
      cur = [...Array(CONFRONT.length).keys()].find(i => !done.has(i));
      render();
    } else {
      lives--;
      Sfx.play('bad'); Haptic.mid();
      await say('malin', CONFRONT_MOCK[mock++ % CONFRONT_MOCK.length], 1700);
      if (lives <= 0) { over = true; res({ win: false, title: 'Il a raccroché', text: 'Tonton Ibrahima a coupé l\'appel. Relis tes indices, et rappelle-le.' }); }
    }
  };
  render();
});
