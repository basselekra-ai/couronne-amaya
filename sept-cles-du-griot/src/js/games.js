'use strict';
/* Gestionnaire des mini-jeux, puis : fouille, kora, course-poursuite, cadenas.
   Chaque jeu est une fonction (stage, cfg, ctl) => Promise<{win, stars, cauris?, frag?, ...}>.
   ctl : pause / reprise, minuteries et nettoyage automatiques. */

function makeCtl() {
  const c = { paused: false, cleans: [], pauseFns: [], resumeFns: [] };
  c.forced = new Promise(r => (c.force = r));
  c.onClean = fn => c.cleans.push(fn);
  c.cleanup = () => { for (const f of c.cleans.splice(0)) try { f(); } catch (e) {} };
  c.onPause = fn => c.pauseFns.push(fn);
  c.onResume = fn => c.resumeFns.push(fn);
  c.pause = () => { c.paused = true; c.pauseFns.forEach(f => f()); };
  c.resume = () => { c.paused = false; c.resumeFns.forEach(f => f()); };
  c.timeout = (fn, ms) => { const t = setTimeout(fn, ms); c.onClean(() => clearTimeout(t)); return t; };
  c.sleep = ms => new Promise(r => c.timeout(r, ms));
  /** Boucle d'animation : fn(dt en secondes), gelée pendant la pause. */
  c.loop = fn => {
    let last = performance.now(), id = 0, alive = true;
    const step = now => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!c.paused) fn(dt);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    c.onClean(() => { alive = false; cancelAnimationFrame(id); });
  };
  c.listen = (node, ev, fn, opt) => { node.addEventListener(ev, fn, opt); c.onClean(() => node.removeEventListener(ev, fn, opt)); };
  return c;
}

const starsHtml = n => `<div class="stars">${'<b>★</b>'.repeat(n)}${'★'.repeat(3 - n)}</div>`;
const cauriIcon = (s = 22) => Icons.get('cauri').replace('<svg', `<svg width="${s}" height="${s}"`);

/** Bouton d'indice payé en cauris. */
function hintButton(cost, label, onUse) {
  const b = el('button.hint-btn', { html: `<span class="ico">${Icons.get('loupe')}</span>${label} · ${cost} <span class="ico">${Icons.get('cauri')}</span>` });
  b.onclick = () => {
    if (Save.d.cauris < cost) { UI.toast('Pas assez de cauris. Gagne-en dans les défis et les quiz !'); Sfx.play('bad'); return; }
    if (onUse() === false) return;
    Save.addCauris(-cost); Sfx.play('coin'); Haptic.tap();
  };
  return b;
}

const Games = {
  ctl: null, cfg: null,
  async run(id, chId) {
    const cfg = this.cfg = GAMES[id];
    UI.show('scr-game');
    $('#g-title').textContent = cfg.title;
    UI.refreshCauris();
    $('#g-stage').innerHTML = '';
    if (!Save.d.seenTuto[id]) {
      await UI.modal({ title: cfg.title, html: `<div class="tuto-art">${TUTO_ART[cfg.type] || ''}</div><p>${cfg.tuto}</p>`, buttons: [{ label: 'C\'est parti !', value: true }] });
      Save.d.seenTuto[id] = true; Save.save();
    }
    let fails = 0;
    for (;;) {
      const stage = $('#g-stage');
      stage.innerHTML = '';
      const ctl = this.ctl = makeCtl();
      let res;
      try { res = await Promise.race([GAME_TYPES[cfg.type](stage, cfg, ctl), ctl.forced]); }
      catch (e) { console.error(e); res = { win: true, stars: 1 }; }
      ctl.cleanup();
      this.ctl = null;
      if (res.quit) return res;
      if (res.restart) continue;
      if (res.win) { await this.reward(id, chId, cfg, res); return res; }
      fails++;
      Sfx.play('lose'); Haptic.hard();
      const v = await UI.modal({
        title: res.title || 'Raté !',
        html: `<p>${res.text || 'Ne lâche rien. Papi compte sur toi.'}</p>${fails >= 2 ? '<p style="color:var(--muted);font-size:13.5px">Tu peux aussi passer ce défi et continuer l\'histoire.</p>' : ''}`,
        buttons: [{ label: 'Réessayer', value: 'retry' }, ...(fails >= 2 ? [{ label: 'Passer ce défi', cls: 'ghost', value: 'skip' }] : [])],
      });
      if (v === 'skip') return { win: true, stars: 0, skipped: true };
    }
  },
  async reward(id, chId, cfg, res) {
    const ch = Save.chap(chId), prev = ch.stars[id] || 0, stars = clamp(res.stars || 1, 1, 3);
    ch.stars[id] = Math.max(prev, stars);
    const gain = (res.cauris || 0) + Math.max(0, stars - prev) * 5;
    if (gain) Save.addCauris(gain);
    let frag = false;
    if (res.frag && cfg.frag && !Save.d.frags.includes(cfg.frag)) { Save.d.frags.push(cfg.frag); frag = true; if (Save.d.frags.length >= 7) unlockTrophy('fragments'); }
    Save.save();
    Sfx.play('win'); Haptic.mid();
    await UI.modal({
      title: res.title || 'Réussi !',
      html: `${starsHtml(stars)}${res.text ? `<p>${res.text}</p>` : ''}${gain ? `<div class="reward">${cauriIcon(26)} +${gain} cauris</div>` : ''}
        ${frag ? `<p style="color:var(--gold-hi);font-weight:900">✦ Fragment de mémoire trouvé ! (${Save.d.frags.length}/7)</p>` : ''}`,
      buttons: [{ label: 'Continuer', value: true }],
    });
  },
  async pause() {
    const ctl = this.ctl;
    if (!ctl || ctl.paused || UI.modalOpen()) return;
    ctl.pause();
    const v = await UI.modal({ title: 'Pause', buttons: [{ label: 'Reprendre', value: 'go' }, { label: 'Recommencer', cls: 'ghost', value: 'restart' }, { label: 'Quitter vers la carte', cls: 'ghost', value: 'quit' }] });
    if (this.ctl !== ctl) return;
    if (v === 'restart') ctl.force({ restart: true });
    else if (v === 'quit') ctl.force({ quit: true });
    else ctl.resume();
  },
};

/* Petites illustrations des tutoriels */
const TUTO_ART = {
  fouille: `<svg viewBox="0 0 100 100"><circle cx="42" cy="42" r="26" fill="rgba(242,179,61,.15)" stroke="#f2b33d" stroke-width="7"/><path d="M62 62l22 22" stroke="#f2b33d" stroke-width="10" stroke-linecap="round"/></svg>`,
  kora: `<svg viewBox="0 0 100 100"><circle cx="50" cy="70" r="26" fill="#b5602a"/><circle cx="50" cy="70" r="18" fill="#e8c890"/><path d="M50 4v70" stroke="#5a3418" stroke-width="5"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${36 + i * 7} 74L50 14" stroke="#fff4e0" stroke-width="1.5"/>`).join('')}</svg>`,
  runner: `<svg viewBox="0 0 100 100"><path d="M50 10L10 95H90Z" fill="#3a2e3a"/><path d="M50 10L36 95M50 10L64 95" stroke="#f2b33d" stroke-dasharray="6 6" stroke-width="2"/><circle cx="50" cy="70" r="9" fill="#d9941f"/><path d="M20 50h-12l6-6M80 50h12l-6-6" stroke="#fff" stroke-width="4" fill="none"/></svg>`,
  cadenas: `<svg viewBox="0 0 100 100"><rect x="18" y="44" width="64" height="48" rx="8" fill="#c8862a"/><path d="M32 44V30a18 18 0 0136 0v14" fill="none" stroke="#c8862a" stroke-width="9"/><circle cx="40" cy="66" r="5" fill="#f2b33d"/><circle cx="60" cy="66" r="5" fill="#fff"/></svg>`,
  infiltration: `<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="10" fill="#3d3550"/><path d="M50 50L92 34V66Z" fill="rgba(255,60,50,.45)"/><circle cx="50" cy="50" r="10" fill="#2c2d34"/><circle cx="22" cy="78" r="9" fill="#d9941f"/></svg>`,
  kente: `<svg viewBox="0 0 100 100">${[0, 1, 2, 3].map(i => `<rect x="${14 + i * 19}" y="10" width="16" height="80" fill="${['#f2b33d', '#1d7a3e', '#c22d23', '#f2b33d'][i]}"/>`).join('')}<path d="M40 20l6-8 6 8M40 80l6 8 6-8" stroke="#fff" stroke-width="3" fill="none"/></svg>`,
  rythme: `<svg viewBox="0 0 100 100"><path d="M10 78h80" stroke="#f2b33d" stroke-width="4"/>${[0, 1, 2].map(i => `<circle cx="${25 + i * 25}" cy="${30 + i * 18}" r="9" fill="${['#e2589a', '#3ad0ff', '#ffd23f'][i]}"/>`).join('')}</svg>`,
  confrontation: `<svg viewBox="0 0 100 100"><rect x="14" y="20" width="72" height="46" rx="12" fill="#2c1a3d" stroke="#f2b33d" stroke-width="3"/><path d="M30 66l-6 16 18-16" fill="#2c1a3d"/><text x="50" y="52" text-anchor="middle" font-family="Lilita One" font-size="26" fill="#ff4a3d">!</text></svg>`,
};

/* ======================================================================
   FOUILLE : trouver des objets dans une scène
   ====================================================================== */
const ITEM_ART = {
  bobine: '<ellipse cx="32" cy="14" rx="16" ry="5" fill="#8a5a2a"/><rect x="18" y="14" width="28" height="36" fill="#ffd23f"/><path d="M18 22h28M18 30h28M18 38h28" stroke="#c99a10" stroke-width="2"/><ellipse cx="32" cy="50" rx="16" ry="5" fill="#8a5a2a"/>',
  antenne: '<path d="M10 50q6-30 12 0t12 0 12 0 12 0" stroke="#d88a3a" stroke-width="4" fill="none"/><circle cx="10" cy="50" r="4" fill="#d88a3a"/>',
  micro: '<circle cx="32" cy="30" r="16" fill="#3a3a44"/><g fill="#8a8a96">' + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${32 + Math.cos(i * 0.785) * 9}" cy="${30 + Math.sin(i * 0.785) * 9}" r="2"/>`).join('') + '<circle cx="32" cy="30" r="2.5"/></g><path d="M32 46v10" stroke="#3a3a44" stroke-width="4"/>',
};
const itemIcon = k => `<svg viewBox="0 0 64 64">${ITEM_ART[k] || CLUE_ART[k] || ''}</svg>`;

/* Scènes de fouille (viewBox 360 × 520). Les objets à trouver sont des <g class="hit" data-id>. */
const FOUILLE_SCENES = {
  chambre() {
    const book = (x, y, w, h, c, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c}" transform="rotate(${r} ${x + w / 2} ${y + h / 2})"/>`;
    const paper = (x, y, r) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - 14}" y="${y - 10}" width="28" height="20" fill="#e9e2d0"/><path d="M${x - 9} ${y - 4}h18M${x - 9} ${y + 1}h14M${x - 9} ${y + 6}h16" stroke="#9a9080" stroke-width="1.4"/></g>`;
    return {
      bg: '#1e1838',
      targets: [['photo', 'Photo déchirée', 'photo'], ['lettre', 'Lettre cachetée', 'lettre'], ['carnet', 'Carnet de Papi', 'carnet'], ['cassette', 'Cassette', 'cassette']],
      svg: `<rect width="360" height="520" fill="#2a2246"/><rect y="320" width="360" height="200" fill="#3d2a24"/><path d="M0 320H360" stroke="#1a1220" stroke-width="5"/>
        <path d="M0 0h360v40H0z" fill="#241d3e"/>
        <!-- fenêtre -->
        <rect x="236" y="56" width="104" height="120" rx="5" fill="#0d1236"/><path d="M288 76A16 16 0 1 0 288 108A10 16 0 0 1 288 76Z" fill="#f4f1e0"/>
        <path d="M236 116H340M288 56V176" stroke="#4a3a2a" stroke-width="5"/><rect x="230" y="50" width="116" height="132" rx="6" fill="none" stroke="#4a3a2a" stroke-width="7"/>
        <path d="M222 44Q244 140 226 196h8Q252 140 230 44Z" fill="#8a2f3a"/>
        <!-- fragment caché dans le coin de la fenêtre -->
        <g class="hit" data-id="frag"><circle cx="330" cy="168" r="11" fill="transparent"/><ellipse cx="330" cy="168" rx="5" ry="6.5" fill="#ffd23f" stroke="#a8680f" stroke-width="1.2"/><path d="M330 163v10" stroke="#a8680f" stroke-width="1.6"/></g>
        <!-- étagère et livres -->
        <rect x="16" y="96" width="150" height="8" fill="#5a3a24"/><rect x="16" y="176" width="150" height="8" fill="#5a3a24"/>
        ${book(22, 60, 11, 36, '#c8553d')}${book(35, 64, 10, 32, '#2f6f9e')}${book(47, 58, 12, 38, '#3d7a4a')}${book(64, 74, 30, 10, '#7a3a6a', -12)}${book(100, 62, 11, 34, '#f2b33d')}${book(113, 66, 9, 30, '#c8553d')}
        ${book(24, 142, 12, 34, '#3d7a4a')}${book(40, 146, 10, 30, '#f2b33d')}
        <g class="hit" data-id="cassette"><rect x="62" y="150" width="44" height="26" fill="transparent"/><rect x="66" y="152" width="38" height="24" rx="3" fill="#2a2a32"/><rect x="71" y="156" width="28" height="10" rx="2" fill="#f4ecd8"/><circle cx="78" cy="161" r="3.4" fill="#2a2a32"/><circle cx="92" cy="161" r="3.4" fill="#2a2a32"/></g>
        ${book(112, 140, 11, 36, '#2f6f9e')}${book(126, 150, 30, 10, '#c8553d', 8)}
        <!-- cadres -->
        <rect x="186" y="70" width="34" height="42" fill="#c9a24a"/><rect x="190" y="74" width="26" height="34" fill="#4a5a6a"/><path d="M190 74l26 34M216 78l-22 26" stroke="#e8f0f8" stroke-width="1.4" opacity=".7"/>
        <rect x="178" y="134" width="44" height="32" fill="#c9a24a" transform="rotate(14 200 150)"/><rect x="182" y="138" width="36" height="24" fill="#6a4a3a" transform="rotate(14 200 150)"/>
        <!-- masque au mur -->
        <g transform="translate(110 236)"><ellipse cx="0" cy="0" rx="18" ry="28" fill="#6a3a1a"/><path d="M-9-6h6M3-6h6M-4 10h8" stroke="#2a1608" stroke-width="3"/><path d="M0-28v-10" stroke="#6a3a1a" stroke-width="4"/></g>
        <!-- lit -->
        <rect x="200" y="300" width="160" height="60" fill="#5a3a24"/><path d="M196 290L360 278V330L196 336Z" fill="#e9e2d0"/><path d="M196 290L360 278V292L196 304Z" fill="#c8553d"/>
        <rect x="320" y="250" width="40" height="40" rx="8" fill="#f4ecd8" transform="rotate(-20 340 270)"/>
        <!-- radio-cassette -->
        <g transform="translate(24 300)"><rect width="70" height="36" rx="5" fill="#3a3a44"/><circle cx="16" cy="20" r="10" fill="#22222a"/><circle cx="54" cy="20" r="10" fill="#22222a"/><rect x="28" y="10" width="14" height="10" fill="#5a5a66"/><path d="M8 0L18-16" stroke="#3a3a44" stroke-width="3"/></g>
        <!-- tapis -->
        <ellipse cx="170" cy="440" rx="150" ry="44" fill="#8a2f2a"/><ellipse cx="170" cy="440" rx="124" ry="32" fill="none" stroke="#f2b33d" stroke-width="3.5" stroke-dasharray="9 7"/>
        <!-- kora cassée -->
        <g transform="translate(150 380) rotate(-24)"><path d="M0-150V10" stroke="#5a3418" stroke-width="7"/><circle cx="0" cy="30" r="34" fill="#b5602a"/><circle cx="0" cy="30" r="26" fill="#e8c890"/><path d="M-26 18L26 40" stroke="#3a2010" stroke-width="3"/>
          ${[-12, -6, 0, 6, 12].map(x => `<path d="M${x} 40L${x * 0.2}-140" stroke="#fff4e0" stroke-width=".9" opacity=".8"/>`).join('')}</g>
        <!-- chaise renversée -->
        <g transform="translate(62 410) rotate(80)"><rect x="-22" y="-22" width="44" height="8" fill="#7a4a2a"/><rect x="-22" y="-60" width="8" height="46" fill="#7a4a2a"/><rect x="14" y="-14" width="7" height="40" fill="#7a4a2a"/><rect x="-22" y="-14" width="7" height="40" fill="#7a4a2a"/></g>
        <!-- carnet sous la chaise -->
        <g class="hit" data-id="carnet"><rect x="20" y="452" width="56" height="44" fill="transparent"/><rect x="26" y="456" width="40" height="32" rx="3" fill="#7a4a24" transform="rotate(-8 46 472)"/><rect x="26" y="456" width="8" height="32" fill="#5a3418" transform="rotate(-8 46 472)"/></g>
        <!-- service à thé (ataya) -->
        <g transform="translate(286 446)"><ellipse cx="0" cy="18" rx="44" ry="10" fill="#9a9aa8"/><path d="M-14 14V-4Q-14-14 0-14Q14-14 14-4V14Z" fill="#c9c9d6"/><path d="M14 0Q28-4 30-14" stroke="#c9c9d6" stroke-width="4" fill="none"/><rect x="-4" y="-20" width="8" height="6" fill="#c9c9d6"/>
          <rect x="-36" y="4" width="10" height="14" fill="#cfe6f0" opacity=".7"/><rect x="22" y="6" width="10" height="12" fill="#cfe6f0" opacity=".7"/></g>
        <!-- papiers éparpillés (leurres) -->
        ${paper(130, 470, 12)}${paper(230, 404, -18)}${paper(96, 352, 30)}${paper(330, 388, 8)}
        <!-- lettre cachetée -->
        <g class="hit" data-id="lettre"><rect x="186" y="452" width="52" height="40" fill="transparent"/><g transform="rotate(-10 212 472)"><rect x="192" y="458" width="40" height="28" fill="#f4ecd8"/><path d="M192 458l20 14 20-14" stroke="#b8a888" stroke-width="1.5" fill="none"/><circle cx="212" cy="474" r="5" fill="#c22d23"/></g></g>
        <!-- photo déchirée près du lit -->
        <g class="hit" data-id="photo"><rect x="220" y="344" width="50" height="44" fill="transparent"/><g transform="rotate(16 244 366)"><rect x="226" y="350" width="38" height="30" fill="#efe6d2"/><rect x="229" y="353" width="32" height="20" fill="#6a5a4a"/><path d="M252 350l-4 10 5 8-3 12h14V350Z" fill="#3d2a24"/></g></g>
        <!-- lunettes (leurre) -->
        <g transform="translate(300 344)" fill="none" stroke="#2a1a14" stroke-width="2.5"><circle cx="-8" cy="0" r="6.5"/><circle cx="8" cy="0" r="6.5"/><path d="M-2 0h4"/></g>`,
    };
  },
  atelier() {
    const spool = (x, y, c) => `<g><ellipse cx="${x}" cy="${y - 14}" rx="10" ry="3.5" fill="#8a5a2a"/><rect x="${x - 8}" y="${y - 14}" width="16" height="22" fill="${c}"/><path d="M${x - 8} ${y - 8}h16M${x - 8} ${y - 2}h16" stroke="rgba(0,0,0,.2)"/><ellipse cx="${x}" cy="${y + 8}" rx="10" ry="3.5" fill="#8a5a2a"/></g>`;
    const k = uid('fk');
    return {
      bg: '#7a4a2a',
      targets: [['photo', 'Photo de groupe', 'photo'], ['croquis', 'Croquis du motif', 'croquis'], ['carte', 'Carte postale', 'carte'], ['bobine', 'Bobine de fil d\'or', 'bobine']],
      svg: `<defs><pattern id="${k}" width="16" height="30" patternUnits="userSpaceOnUse"><rect width="16" height="30" fill="#f2b33d"/><rect width="16" height="6" fill="#1d7a3e"/><rect y="12" width="16" height="5" fill="#c22d23"/><rect y="22" width="8" height="5" fill="#111"/></pattern></defs>
        <rect width="360" height="520" fill="#c98a4a"/><rect y="330" width="360" height="190" fill="#7a4a2a"/><path d="M0 330H360" stroke="#5a3418" stroke-width="5"/>
        <rect x="20" y="40" width="110" height="110" fill="#8fd0f0"/><path d="M20 95H130M75 40V150" stroke="#5a3a20" stroke-width="5"/><rect x="14" y="34" width="122" height="122" fill="none" stroke="#5a3a20" stroke-width="7"/>
        <path d="M30 140q20-30 40 0" fill="#3d7a4a"/>
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${236 + i * 24}" y="20" width="18" height="${190 + (i % 2) * 34}" fill="url(#${k})"/>`).join('')}
        <path d="M230 20H360" stroke="#5a3418" stroke-width="5"/>
        <!-- croquis épinglé -->
        <g class="hit" data-id="croquis"><rect x="150" y="50" width="62" height="70" fill="transparent"/><rect x="156" y="56" width="50" height="58" fill="#f4ecd8" transform="rotate(4 181 85)"/><path d="M164 70l8 8 8-8 8 8 8-8M164 92l8 8 8-8 8 8 8-8" stroke="#2a1a14" stroke-width="2" fill="none" transform="rotate(4 181 85)"/><circle cx="181" cy="58" r="3" fill="#c22d23"/></g>
        <!-- étagère de bobines -->
        <rect x="20" y="200" width="190" height="7" fill="#5a3418"/><rect x="20" y="268" width="190" height="7" fill="#5a3418"/>
        ${spool(36, 190, '#c22d23')}${spool(60, 190, '#1d7a3e')}${spool(84, 190, '#111')}${spool(108, 190, '#2f6f9e')}${spool(156, 190, '#c22d23')}${spool(180, 190, '#e8c84a')}
        ${spool(36, 258, '#1d7a3e')}${spool(60, 258, '#e8c84a')}${spool(108, 258, '#c22d23')}${spool(132, 258, '#111')}${spool(180, 258, '#1d7a3e')}
        <g class="hit" data-id="bobine"><rect x="118" y="168" width="28" height="36" fill="transparent"/>${spool(132, 190, '#ffd23f')}<path d="M126 178l3-3M138 180l2-3" stroke="#fff" stroke-width="2"/></g>
        <!-- métier à tisser -->
        <g><rect x="110" y="300" width="10" height="150" fill="#6a3a1a"/><rect x="250" y="300" width="10" height="150" fill="#6a3a1a"/><rect x="104" y="300" width="162" height="10" fill="#8a5a2a"/><rect x="104" y="380" width="162" height="12" fill="#8a5a2a"/>
          ${Array.from({ length: 14 }, (_, i) => `<path d="M${128 + i * 9} 310V380" stroke="#efe0c2" stroke-width="1.2"/>`).join('')}
          <rect x="140" y="392" width="90" height="40" fill="url(#${k})"/>
          <g class="hit" data-id="carte"><rect x="216" y="318" width="44" height="40" fill="transparent"/><g transform="rotate(-12 236 338)"><rect x="220" y="324" width="34" height="24" fill="#e8f0f8"/><rect x="223" y="327" width="14" height="18" fill="#3a8fc0"/><path d="M240 330h10M240 336h8M240 342h10" stroke="#7a8a9a" stroke-width="1.4"/></g></g></g>
        <!-- tabouret, panier -->
        <rect x="290" y="420" width="50" height="10" rx="4" fill="#8a5a2a"/><path d="M296 430l-6 40M334 430l6 40" stroke="#6a3a1a" stroke-width="6"/>
        <g class="hit" data-id="frag"><rect x="26" y="430" width="70" height="56" fill="transparent"/></g>
        <path d="M28 440Q60 500 92 440Z" fill="#c9a24a"/><path d="M34 452h52M40 466h40" stroke="#8a6a2a" stroke-width="2"/><ellipse cx="60" cy="440" rx="32" ry="7" fill="#a8822a"/>
        <ellipse cx="72" cy="438" rx="3.5" ry="4.5" fill="#ffd23f" stroke="#a8680f"/>
        <!-- radio, ventilateur -->
        <rect x="282" y="350" width="60" height="34" rx="6" fill="#3a6a5a"/><circle cx="298" cy="367" r="9" fill="#24443a"/><rect x="314" y="358" width="20" height="4" fill="#ffd27a"/>
        <!-- photo encadrée sur la table -->
        <rect x="150" y="470" width="120" height="10" fill="#5a3418"/>
        <g class="hit" data-id="photo"><rect x="160" y="420" width="56" height="52" fill="transparent"/><rect x="166" y="428" width="44" height="36" fill="#c9a24a"/><rect x="170" y="432" width="36" height="26" fill="#8a7a62"/>${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${174 + i * 5.6}" cy="444" r="2.2" fill="#2a1e14"/>`).join('')}<path d="M188 464l-6 6M188 464l6 6" stroke="#5a3418" stroke-width="3"/></g>
        <path d="M236 470q4-20 14-20q10 0 10 20" fill="#2f9e62"/>`,
    };
  },
  telephone() {
    const chip = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#22252b"/>${Array.from({ length: Math.floor(w / 6) }, (_, i) => `<path d="M${x + 3 + i * 6} ${y}v-3M${x + 3 + i * 6} ${y + h}v3" stroke="#c9a24a" stroke-width="1.4"/>`).join('')}`;
    const screw = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="#a8a8b4"/><path d="M${x - 2.5} ${y}h5" stroke="#5a5a66" stroke-width="1.2"/>`;
    return {
      bg: '#7a8a90',
      targets: [['puce', 'Puce étrangère', 'puce'], ['antenne', 'Antenne en trop', 'antenne'], ['micro', 'Micro espion', 'micro']],
      svg: `<rect width="360" height="520" fill="#8e9ca2"/>
        ${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 46}H360" stroke="#7a8a90" stroke-width="1"/>`).join('')}
        <!-- téléphone ouvert -->
        <rect x="90" y="70" width="180" height="350" rx="24" fill="#1a1a22"/><rect x="100" y="80" width="160" height="330" rx="16" fill="#1f6a4a"/>
        <path d="M110 100H250M110 200H250M110 300H250M130 90V400M230 90V400" stroke="#2a8a5e" stroke-width="2"/>
        <rect x="112" y="200" width="136" height="150" rx="8" fill="#2f2f3a"/><rect x="120" y="208" width="120" height="134" rx="5" fill="#3a3a48"/>
        <text x="180" y="282" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="14" fill="#6a6a7a">4000 mAh</text>
        <circle cx="140" cy="122" r="18" fill="#111"/><circle cx="140" cy="122" r="11" fill="#2a3a5a"/><circle cx="136" cy="118" r="3" fill="#8ab"/>
        ${chip(176, 106, 40, 30)}${chip(222, 110, 22, 18)}${chip(176, 150, 24, 30)}${chip(112, 160, 30, 22)}${chip(150, 362, 60, 26)}
        ${screw(112, 94)}${screw(248, 94)}${screw(112, 396)}${screw(248, 396)}
        <!-- puce étrangère, à moitié sous la batterie -->
        <g class="hit" data-id="puce"><rect x="206" y="336" width="40" height="34" fill="transparent"/><rect x="214" y="342" width="24" height="20" rx="2" fill="#b0262a"/><text x="226" y="356" text-anchor="middle" font-size="8" font-weight="900" font-family="sans-serif" fill="#fff">IS</text>${[0, 1, 2].map(i => `<path d="M${218 + i * 8} 342v-3M${218 + i * 8} 362v3" stroke="#c9a24a" stroke-width="1.4"/>`).join('')}</g>
        <!-- antenne en trop (fil de cuivre) -->
        <g class="hit" data-id="antenne"><rect x="230" y="150" width="34" height="50" fill="transparent"/><path d="M246 156q-8 6 0 12t0 12 0 12" stroke="#d88a3a" stroke-width="3" fill="none"/><circle cx="246" cy="156" r="3" fill="#d88a3a"/></g>
        <!-- micro espion -->
        <g class="hit" data-id="micro"><rect x="208" y="388" width="30" height="26" fill="transparent"/><circle cx="222" cy="400" r="7" fill="#3a3a44"/>${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${222 + Math.cos(i * 1.05) * 4}" cy="${400 + Math.sin(i * 1.05) * 4}" r="1.1" fill="#9a9aa6"/>`).join('')}</g>
        <!-- outils -->
        <g transform="translate(36 120) rotate(20)"><rect x="-5" y="0" width="10" height="70" rx="3" fill="#c8553d"/><rect x="-2" y="70" width="4" height="50" fill="#b8b8c4"/></g>
        <g transform="translate(316 140) rotate(-15)"><path d="M-6 0L-2 100M6 0L2 100" stroke="#b8b8c4" stroke-width="4"/></g>
        <g transform="translate(300 300)"><circle r="24" fill="rgba(200,230,255,.25)" stroke="#2a2a32" stroke-width="5"/><path d="M17 17l26 26" stroke="#2a2a32" stroke-width="9" stroke-linecap="round"/></g>
        <!-- tasse de café éthiopienne (sini) et soucoupe : fragment dessous -->
        <g class="hit" data-id="frag"><rect x="24" y="420" width="66" height="60" fill="transparent"/></g>
        <ellipse cx="56" cy="460" rx="30" ry="10" fill="#efe6d2"/><ellipse cx="72" cy="468" rx="3.5" ry="4.5" fill="#ffd23f" stroke="#a8680f"/><path d="M42 432h28l-4 26h-20Z" fill="#f4f1ea"/><path d="M44 440h24" stroke="#1f6a9a" stroke-width="3"/><ellipse cx="56" cy="432" rx="14" ry="4" fill="#3a1e10"/>
        ${screw(300, 440)}${screw(318, 456)}${screw(44, 300)}
        <rect x="270" y="470" width="70" height="40" rx="4" fill="#f4ecd8" transform="rotate(-6 305 490)"/><path d="M280 480h46M280 490h40" stroke="#9a9080" stroke-width="1.5" transform="rotate(-6 305 490)"/>`,
    };
  },
};

const GAME_TYPES = {};

GAME_TYPES.fouille = (stage, cfg, ctl) => new Promise(res => {
  const sc = FOUILLE_SCENES[cfg.scene]();
  const total = cfg.time;
  let left = total, found = new Set(), fragFound = false, misses = 0, over = false;
  stage.innerHTML = `<div class="g-hud"><span class="ico">${Icons.get('loupe')}</span><div class="bar"><i></i></div><b id="fo-t">${total}s</b></div>
    <div class="fo-scene" style="background:${sc.bg}"><svg viewBox="0 0 360 520" preserveAspectRatio="xMidYMid meet">${sc.svg}</svg></div>
    <div class="fo-list">${sc.targets.map(([id, label, art]) => `<span class="fo-chip" data-id="${id}"><span class="ic">${itemIcon(art)}</span>${label}</span>`).join('')}</div>
    <div class="g-foot"></div>`;
  const bar = $('.bar', stage), tEl = $('#fo-t'), scene = $('.fo-scene', stage), svg = $('svg', scene);
  $('.g-foot', stage).append(hintButton(15, 'Indice', () => {
    const rest = sc.targets.map(t => t[0]).filter(id => !found.has(id));
    if (!rest.length) return false;
    const g = $(`.hit[data-id="${rest[0]}"]`, svg);
    g.classList.remove('pulse'); void g.getBBox(); g.classList.add('pulse');
  }));
  const finish = r => { if (over) return; over = true; setTimeout(() => res(r), 650); };
  ctl.listen(svg, 'click', e => {
    if (ctl.paused || over) return;
    const hit = e.target.closest('.hit');
    if (hit) {
      const id = hit.dataset.id;
      if (id === 'frag') {
        if (fragFound) return;
        fragFound = true; hit.classList.add('found');
        Sfx.play('coin'); Haptic.mid(); UI.toast('✦ Un fragment de mémoire doré !');
        return;
      }
      if (found.has(id)) return;
      found.add(id);
      hit.classList.add('found');
      $(`.fo-chip[data-id="${id}"]`, stage).classList.add('ok');
      Sfx.play('clue'); Haptic.mid();
      if (found.size === sc.targets.length) {
        const k = left / total;
        finish({ win: true, stars: k > 0.5 ? 3 : k > 0.25 ? 2 : 1, frag: fragFound, cauris: fragFound ? 10 : 0, title: 'Tout est trouvé !' });
      }
      return;
    }
    misses++;
    left = Math.max(0, left - 4);
    Sfx.play('bad'); Haptic.tap();
    const r = scene.getBoundingClientRect();
    const m = el('div.fo-miss', { text: '✕' });
    m.style.left = (e.clientX - r.left) + 'px'; m.style.top = (e.clientY - r.top) + 'px';
    scene.append(m); setTimeout(() => m.remove(), 650);
  });
  ctl.loop(dt => {
    if (over) return;
    left -= dt;
    bar.querySelector('i').style.transform = `scaleX(${Math.max(0, left / total)})`;
    bar.classList.toggle('low', left < total * 0.25);
    tEl.textContent = Math.ceil(Math.max(0, left)) + 's';
    if (left <= 0) finish({ win: false, title: 'Le temps est écoulé', text: 'Les hommes gris approchent… Recommence, et touche plus calmement.' });
  });
});

/* ======================================================================
   KORA : répéter la mélodie
   ====================================================================== */
GAME_TYPES.kora = (stage, cfg, ctl) => new Promise(res => {
  const N = 7, seq = cfg.seq;
  const colors = ['#e2589a', '#ff8a3a', '#ffd23f', '#7ad05a', '#3ad0c0', '#3a9aff', '#a07aff'];
  const bx = i => 70 + i * 36, nx = i => 172 + (i - 3) * 5, ny = i => 40 + i * 4;
  let strings = '';
  for (let i = 0; i < N; i++) {
    const x1 = bx(i), y1 = 380, x2 = nx(i), y2 = ny(i);
    strings += `<g class="string" data-i="${i}">
      <path d="M${x1 - 18} ${y1 + 40}L${x1 + 18} ${y1 + 40}L${x2 + 6} ${y2}L${x2 - 6} ${y2}Z" fill="transparent"/>
      <path class="glow" d="M${x1} ${y1}L${x2} ${y2}" stroke="${colors[i]}" stroke-width="9" stroke-linecap="round" opacity="0"/>
      <path d="M${x1} ${y1}L${x2} ${y2}" stroke="#fff4e0" stroke-width="2.2"/>
      <circle cx="${x1}" cy="${y1 + 22}" r="14" fill="${colors[i]}" stroke="#2a1608" stroke-width="2.5"/></g>`;
  }
  stage.innerHTML = `<div class="g-hud"><span class="hearts" id="ko-h"></span><span class="grow"></span><span id="ko-r"></span></div>
    <div class="g-msg" id="ko-m">Écoute…</div>
    <div class="kora"><svg viewBox="0 0 360 560">
      <defs><radialGradient id="koraG" cx=".4" cy=".35"><stop offset="0" stop-color="#d98a4a"/><stop offset="1" stop-color="#7a3a14"/></radialGradient></defs>
      <rect x="164" y="20" width="16" height="400" rx="6" fill="#5a3418"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="160" y="${40 + i * 4.5}" width="24" height="3" rx="1.5" fill="#2a1608"/>`).join('')}
      <circle cx="172" cy="420" r="110" fill="url(#koraG)"/><circle cx="172" cy="420" r="92" fill="#ecd3a2"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => { const a = i * 0.52; return `<circle cx="${172 + Math.cos(a) * 100}" cy="${420 + Math.sin(a) * 100}" r="3" fill="#f2b33d"/>`; }).join('')}
      <rect x="62" y="376" width="236" height="10" rx="4" fill="#3a2010"/>
      ${strings}</svg></div>
    <div class="g-sub" id="ko-s">Retiens l'ordre des cordes.</div><div class="g-foot"></div>`;
  const svg = $('.kora svg', stage), msg = $('#ko-m'), sub = $('#ko-s');
  let lives = 3, len = cfg.start, pos = 0, listening = false, mistakes = 0, over = false;
  const hearts = () => ($('#ko-h').textContent = '♥'.repeat(lives) + '♡'.repeat(3 - lives));
  const round = () => ($('#ko-r').textContent = `Notes : ${len}/${seq.length}`);
  hearts(); round();
  const pluck = i => {
    Sfx.play('kora', { i: i + 3 });
    const g = $(`.string[data-i="${i}"]`, svg);
    g.classList.add('on'); $('.glow', g).style.opacity = 1;
    setTimeout(() => { g.classList.remove('on'); $('.glow', g).style.opacity = 0; }, 260);
  };
  const playSeq = async () => {
    listening = false; msg.textContent = 'Écoute…'; sub.textContent = 'Retiens l\'ordre des cordes.';
    await ctl.sleep(700);
    for (let k = 0; k < len; k++) {
      while (ctl.paused) await ctl.sleep(200);
      pluck(seq[k]); await ctl.sleep(cfg.finale ? 520 : 600);
    }
    msg.textContent = 'À toi !'; sub.textContent = `Rejoue les ${len} notes.`;
    pos = 0; listening = true;
  };
  $('.g-foot', stage).append(hintButton(10, 'Réécouter', () => { if (!listening) return false; playSeq(); }));
  ctl.listen(svg, 'pointerdown', async e => {
    const g = e.target.closest('.string');
    if (!g || !listening || ctl.paused || over) return;
    const i = +g.dataset.i;
    pluck(i); Haptic.tap();
    if (i !== seq[pos]) {
      listening = false; lives--; mistakes++; hearts();
      Sfx.play('bad'); Haptic.mid(); UI.shake($('.kora', stage));
      msg.textContent = 'Fausse note…';
      if (lives <= 0) { over = true; await ctl.sleep(700); res({ win: false, title: 'La mélodie s\'est perdue', text: 'Écoute bien, et rejoue la berceuse note après note.' }); return; }
      await ctl.sleep(900); playSeq(); return;
    }
    pos++;
    if (pos >= len) {
      listening = false;
      if (len >= seq.length) {
        over = true; msg.textContent = 'La berceuse est complète !';
        await ctl.sleep(500);
        for (let k = 0; k < seq.length; k++) { pluck(seq[k]); await ctl.sleep(230); }
        await ctl.sleep(500);
        res({ win: true, stars: mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1, title: 'Magnifique !', text: cfg.finale ? 'La porte frémit…' : 'Quelque chose a cliqué dans la calebasse…' });
        return;
      }
      Sfx.play('ok'); msg.textContent = 'Bien joué !';
      len++; round();
      await ctl.sleep(800); playSeq();
    }
  });
  playSeq();
});

/* ======================================================================
   COURSE-POURSUITE : couloirs en pseudo-3D
   ====================================================================== */
const RUN_THEMES = {
  medina: { sky: ['#070818', '#1d2557'], ground: '#2c2433', line: 'rgba(255,210,120,.18)', side: ['#3a2a3e', '#2c2032'], win: '#ffd27a', speed: 13,
    tall: [['🐑', 1.1], ['car'], ['🛵', 1]], low: [['📦', 0.8], ['🧺', 0.75]], player: 'awa', night: true },
  niger: { sky: ['#3d8fd6', '#cfe9f2'], ground: '#2c7fb0', line: 'rgba(255,255,255,.25)', side: ['#d8b27a', '#3d7a4a'], water: true, speed: 12,
    tall: [['rock'], ['🦛', 1.15], ['boat']], low: [['net']], player: 'pirogue' },
  kin: { sky: ['#0a0818', '#3a1a4a'], ground: '#26232e', line: 'rgba(255,255,255,.4)', side: ['#2a2040', '#3a2050'], win: '#ff7ad0', speed: 15,
    tall: [['🚌', 1.2], ['🛵', 1], ['🚕', 1.1]], low: [['hole'], ['📦', 0.8]], player: 'moto', night: true },
};

GAME_TYPES.runner = (stage, cfg, ctl) => new Promise(res => {
  const T = RUN_THEMES[cfg.theme];
  stage.innerHTML = `<div class="g-hud"><span>Avance</span><div class="bar" id="rn-p"><i></i></div><span>Écart</span><div class="bar" id="rn-g"><i></i></div></div>
    <div class="cv-wrap"><canvas></canvas><div class="cv-help">◀ glisse ▶ · ▲ saute</div></div>`;
  const wrap = $('.cv-wrap', stage), cv = $('canvas', wrap), g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = wrap.clientWidth; H = wrap.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); ctl.listen(window, 'resize', resize);

  let lane = 0, laneX = 0, jump = 0, vy = 0, t = 0, dist = 0, gap = 100, hits = 0, inv = 0, over = false, cauris = 0, frag = false;
  let objs = [], nextSpawn = 18, fragSpawned = false, deco = [];
  const Z0 = 7, PZ = 0.15, HZ = 0.4;
  const horizon = () => H * 0.34;
  const sc = z => 1 / (1 + z / Z0);
  const sy = z => horizon() + (H * 0.97 - horizon()) * sc(z);
  const laneW = () => W * 0.3;
  const sx = (l, z) => W / 2 + l * laneW() * sc(z);

  const spawn = () => {
    const free = irnd(-1, 1);
    const n = Math.random() < 0.35 + t / cfg.time * 0.3 ? 2 : 1;
    const lanes = shuffle([-1, 0, 1].filter(l => l !== free)).slice(0, n);
    for (const l of lanes) {
      const low = Math.random() < 0.3;
      const [kind, s = 1] = pick(low ? T.low : T.tall);
      objs.push({ l, z: 60, kind, s, low });
    }
    if (Math.random() < 0.7) for (let k = 0; k < 3; k++) objs.push({ l: free, z: 60 + k * 2.5, kind: 'cauri', pick: true });
    if (cfg.frag && !fragSpawned && t > cfg.time * 0.5) { fragSpawned = true; objs.push({ l: free, z: 66, kind: 'frag', pick: true }); }
  };
  for (let i = 0; i < 16; i++) deco.push({ z: i * 4, side: i % 2 ? 1 : -1, v: Math.random() });

  const move = d => { if (over || ctl.paused) return; const n = clamp(lane + d, -1, 1); if (n !== lane) { lane = n; Sfx.play('whoosh'); Haptic.tap(); } };
  const doJump = () => { if (over || ctl.paused || jump > 0.01) return; vy = 7.5; jump = 0.02; Sfx.play('jump'); };
  let sx0 = 0, sy0 = 0, st0 = 0;
  ctl.listen(cv, 'pointerdown', e => { sx0 = e.clientX; sy0 = e.clientY; st0 = performance.now(); $('.cv-help', wrap).style.opacity = 0; });
  ctl.listen(cv, 'pointerup', e => {
    const dx = e.clientX - sx0, dy = e.clientY - sy0;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
    else if (dy < -28) doJump();
    else if (performance.now() - st0 < 300) {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      if (x < 0.36) move(-1); else if (x > 0.64) move(1); else doJump();
    }
  });
  ctl.listen(window, 'keydown', e => {
    if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1); else if (e.key === 'ArrowUp' || e.key === ' ') doJump();
  });

  const pB = $('#rn-p i'), gB = $('#rn-g i'), gBar = $('#rn-g');

  /* ----- dessin ----- */
  const drawEmoji = (ch, x, y, size) => { g.font = `${size}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(ch, x, y); };
  const drawObj = o => {
    const s = sc(o.z), x = sx(o.l, o.z), y = sy(o.z), u = laneW() * s;
    g.globalAlpha = Math.min(1, (60 - o.z) / 8);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x, y, u * 0.38, u * 0.08, 0, 0, 7); g.fill();
    switch (o.kind) {
      case 'cauri': {
        const bob = Math.sin(t * 6 + o.z) * u * 0.05;
        g.fillStyle = '#f6ecd6'; g.strokeStyle = '#a8865a'; g.lineWidth = Math.max(1, u * 0.02);
        g.beginPath(); g.ellipse(x, y - u * 0.3 + bob, u * 0.09, u * 0.12, 0, 0, 7); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(x, y - u * 0.4 + bob); g.lineTo(x, y - u * 0.2 + bob); g.stroke();
        break;
      }
      case 'frag': {
        g.fillStyle = '#ffd23f'; g.shadowColor = '#ffd23f'; g.shadowBlur = 20;
        g.beginPath(); g.ellipse(x, y - u * 0.34, u * 0.13, u * 0.17, 0, 0, 7); g.fill(); g.shadowBlur = 0;
        break;
      }
      case 'car': {
        const w = u * 0.8, h = u * 0.7;
        g.fillStyle = '#f2c230'; g.fillRect(x - w / 2, y - h, w, h);
        g.fillStyle = '#2f6fb5'; g.fillRect(x - w / 2, y - h * 0.55, w, h * 0.2);
        g.fillStyle = '#cfe6f0'; g.fillRect(x - w * 0.4, y - h * 0.92, w * 0.8, h * 0.28);
        g.fillStyle = '#e0412f'; g.fillRect(x - w / 2, y - h * 0.15, w, h * 0.06);
        g.fillStyle = '#111'; g.fillRect(x - w * 0.42, y - h * 0.08, w * 0.18, h * 0.08); g.fillRect(x + w * 0.24, y - h * 0.08, w * 0.18, h * 0.08);
        break;
      }
      case 'rock': {
        g.fillStyle = '#6a6a72'; g.beginPath(); g.moveTo(x - u * 0.4, y); g.quadraticCurveTo(x - u * 0.38, y - u * 0.5, x - u * 0.05, y - u * 0.55);
        g.quadraticCurveTo(x + u * 0.36, y - u * 0.5, x + u * 0.4, y); g.fill();
        g.fillStyle = '#8a8a94'; g.beginPath(); g.ellipse(x - u * 0.12, y - u * 0.38, u * 0.12, u * 0.07, -0.4, 0, 7); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, u * 0.44, u * 0.06, 0, 0, 7); g.stroke();
        break;
      }
      case 'boat': {
        g.fillStyle = '#4a3424'; g.beginPath(); g.moveTo(x - u * 0.44, y - u * 0.3); g.quadraticCurveTo(x, y + u * 0.02, x + u * 0.44, y - u * 0.3); g.lineTo(x + u * 0.3, y - u * 0.12); g.lineTo(x - u * 0.3, y - u * 0.12); g.fill();
        g.fillStyle = '#2c2d34'; g.fillRect(x - u * 0.06, y - u * 0.62, u * 0.12, u * 0.34); g.beginPath(); g.arc(x, y - u * 0.66, u * 0.07, 0, 7); g.fill();
        break;
      }
      case 'net': {
        g.strokeStyle = '#efe0c2'; g.lineWidth = Math.max(1, u * 0.015);
        for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(x + k * u * 0.12, y - u * 0.18); g.lineTo(x + k * u * 0.12, y); g.stroke(); }
        g.beginPath(); g.moveTo(x - u * 0.42, y - u * 0.18); g.lineTo(x + u * 0.42, y - u * 0.18); g.stroke();
        g.fillStyle = '#e0412f'; for (const k of [-0.42, 0, 0.42]) { g.beginPath(); g.arc(x + k * u, y - u * 0.18, u * 0.04, 0, 7); g.fill(); }
        break;
      }
      case 'hole': {
        g.fillStyle = '#0a090e'; g.beginPath(); g.ellipse(x, y - u * 0.04, u * 0.36, u * 0.08, 0, 0, 7); g.fill();
        g.strokeStyle = '#4a4552'; g.lineWidth = 2; g.stroke();
        break;
      }
      default: drawEmoji(o.kind, x, y + u * 0.04, u * 0.62 * (o.s || 1));
    }
    g.globalAlpha = 1;
  };
  const drawPlayer = () => {
    const x = sx(laneX, PZ), base = sy(PZ), u = laneW() * sc(PZ), y = base - jump * u * 0.9;
    const run = Math.sin(t * 16);
    if (inv > 0 && Math.floor(inv * 12) % 2) return;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, base, u * 0.26, u * 0.06, 0, 0, 7); g.fill();
    if (T.player === 'awa') {
      g.strokeStyle = '#2b1b3d'; g.lineWidth = u * 0.07; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x - u * 0.05, y - u * 0.3); g.lineTo(x - u * 0.08 + run * u * 0.05, y - u * 0.02); g.stroke();
      g.beginPath(); g.moveTo(x + u * 0.05, y - u * 0.3); g.lineTo(x + u * 0.08 - run * u * 0.05, y - u * 0.02); g.stroke();
      g.fillStyle = '#d9941f'; g.beginPath(); g.ellipse(x, y - u * 0.42, u * 0.13, u * 0.17, 0, 0, 7); g.fill();
      g.strokeStyle = '#7b4a2d'; g.lineWidth = u * 0.05;
      g.beginPath(); g.moveTo(x - u * 0.12, y - u * 0.5); g.lineTo(x - u * 0.2, y - u * 0.36 - run * u * 0.06); g.stroke();
      g.beginPath(); g.moveTo(x + u * 0.12, y - u * 0.5); g.lineTo(x + u * 0.2, y - u * 0.36 + run * u * 0.06); g.stroke();
      g.fillStyle = '#1c1210'; g.beginPath(); g.arc(x, y - u * 0.65, u * 0.1, 0, 7); g.fill();
      for (let k = -2; k <= 2; k++) { g.fillRect(x + k * u * 0.035 - u * 0.012, y - u * 0.65, u * 0.025, u * 0.17); }
      g.fillStyle = '#f2b33d'; g.beginPath(); g.arc(x - u * 0.07, y - u * 0.48, u * 0.015, 0, 7); g.arc(x + u * 0.07, y - u * 0.48, u * 0.015, 0, 7); g.fill();
    } else if (T.player === 'pirogue') {
      g.fillStyle = '#5a3a24'; g.beginPath(); g.moveTo(x - u * 0.16, y - u * 0.05); g.quadraticCurveTo(x, y + u * 0.06, x + u * 0.16, y - u * 0.05);
      g.lineTo(x + u * 0.12, y - u * 0.75); g.quadraticCurveTo(x, y - u * 0.9, x - u * 0.12, y - u * 0.75); g.fill();
      g.strokeStyle = '#c8553d'; g.lineWidth = u * 0.03; g.stroke();
      const person = (py, col, hair) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, py, u * 0.08, u * 0.09, 0, 0, 7); g.fill(); g.fillStyle = hair; g.beginPath(); g.arc(x, py - u * 0.11, u * 0.06, 0, 7); g.fill(); };
      person(y - u * 0.55, '#5b3a1f', '#18100d'); person(y - u * 0.25, '#d9941f', '#1c1210');
      g.strokeStyle = '#8a5a2a'; g.lineWidth = u * 0.025; g.beginPath(); g.moveTo(x - u * 0.3, y - u * 0.2 + run * u * 0.06); g.lineTo(x + u * 0.3, y - u * 0.3 - run * u * 0.06); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - u * 0.2, y); g.lineTo(x - u * 0.34, y + u * 0.08); g.moveTo(x + u * 0.2, y); g.lineTo(x + u * 0.34, y + u * 0.08); g.stroke();
    } else {
      g.fillStyle = '#18181c'; g.fillRect(x - u * 0.035, y - u * 0.18, u * 0.07, u * 0.18);
      g.fillStyle = '#c22d23'; g.beginPath(); g.ellipse(x, y - u * 0.3, u * 0.12, u * 0.08, 0, 0, 7); g.fill();
      g.fillStyle = '#ff3a2a'; g.fillRect(x - u * 0.05, y - u * 0.26, u * 0.1, u * 0.03);
      g.fillStyle = '#e2589a'; g.beginPath(); g.ellipse(x, y - u * 0.5, u * 0.14, u * 0.16, 0, 0, 7); g.fill();
      g.fillStyle = '#f4ecd8'; g.beginPath(); g.ellipse(x, y - u * 0.72, u * 0.16, u * 0.035, 0, 0, 7); g.fill(); g.fillRect(x - u * 0.08, y - u * 0.82, u * 0.16, u * 0.1);
      g.fillStyle = '#d9941f'; g.beginPath(); g.ellipse(x, y - u * 0.36, u * 0.12, u * 0.1, 0, 0, 7); g.fill();
      g.fillStyle = '#1c1210'; g.beginPath(); g.arc(x - u * 0.13, y - u * 0.4, u * 0.05, 0, 7); g.fill();
    }
  };
  const draw = () => {
    const hz = horizon();
    let gr = g.createLinearGradient(0, 0, 0, hz);
    gr.addColorStop(0, T.sky[0]); gr.addColorStop(1, T.sky[1]);
    g.fillStyle = gr; g.fillRect(0, 0, W, hz + 2);
    if (T.night) { g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 40; i++) g.fillRect(((i * 7919) % 1000) / 1000 * W, ((i * 104729) % 997) / 997 * hz * 0.85, 1.5, 1.5); }
    else { g.fillStyle = '#fff6cf'; g.beginPath(); g.arc(W * 0.78, hz * 0.4, 18, 0, 7); g.fill(); }
    // silhouette lointaine sur l'horizon
    g.fillStyle = T.water ? 'rgba(60,110,80,.55)' : 'rgba(0,0,0,.35)';
    for (let i = 0; i < 26; i++) {
      const bw = W / 26, h = T.water ? 6 + ((i * 37) % 11) : 8 + ((i * 53) % 29);
      if (T.water) { g.beginPath(); g.arc(i * bw + bw / 2, hz, bw * 0.9, Math.PI, 0); g.fill(); }
      else g.fillRect(i * bw, hz - h, bw + 1, h);
    }
    // sol
    g.fillStyle = T.side[0]; g.fillRect(0, hz, W, H - hz);
    g.fillStyle = T.ground;
    g.beginPath(); g.moveTo(sx(-1.6, 60), hz); g.lineTo(sx(1.6, 60), hz); g.lineTo(sx(1.6, -0.6), H); g.lineTo(sx(-1.6, -0.6), H); g.fill();
    // lignes de couloir défilantes
    g.strokeStyle = T.line; g.lineWidth = 2;
    for (const l of [-0.5, 0.5]) { g.beginPath(); g.moveTo(sx(l, 60), hz); g.lineTo(sx(l, -0.6), H); g.stroke(); }
    const off = (dist % 4);
    for (let z = 4 - off; z < 60; z += 4) {
      g.fillStyle = T.water ? 'rgba(255,255,255,.12)' : T.line;
      const y1 = sy(z), y2 = sy(z + 1.2);
      for (const l of [-0.5, 0.5]) { const x1 = sx(l, z); g.fillRect(x1 - 2 * sc(z), y2, 4 * sc(z) + 1, y1 - y2); }
    }
    // façades / rives
    for (const d of deco) {
      const z = d.z, s = sc(z), y = sy(z), x = sx(d.side * 2.1, z), u = laneW() * s;
      if (T.water) {
        g.fillStyle = d.v > 0.5 ? '#3d7a4a' : '#5a8a3a';
        g.beginPath(); g.arc(x, y - u * 0.3, u * 0.5, Math.PI, 0); g.fill();
        if (d.v > 0.7) { g.fillStyle = '#4a3424'; g.fillRect(x - u * 0.04, y - u * 1.2, u * 0.08, u * 0.9); g.fillStyle = '#2f6a3a'; g.beginPath(); g.arc(x, y - u * 1.2, u * 0.4, 0, 7); g.fill(); }
      } else {
        const h = u * (1.6 + d.v * 1.4), w = u * 1.1;
        g.fillStyle = d.v > 0.5 ? T.side[0] : T.side[1];
        g.fillRect(x - w / 2, y - h, w, h);
        g.fillStyle = T.win;
        for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 2; wx++) if ((d.v * 10 + wx + wy) % 3 > 1) g.fillRect(x - w * 0.3 + wx * w * 0.4, y - h + h * 0.15 + wy * h * 0.25, w * 0.16, h * 0.12);
      }
    }
    // objets du plus loin au plus proche
    objs.sort((a, b) => b.z - a.z);
    for (const o of objs) if (o.z > PZ) drawObj(o);
    drawPlayer();
    for (const o of objs) if (o.z <= PZ) drawObj(o);
    // poursuivants
    if (gap < 55) {
      const a = (1 - gap / 55) * (0.5 + 0.2 * Math.sin(t * 10));
      gr = g.createLinearGradient(0, H, 0, H * 0.72);
      gr.addColorStop(0, `rgba(255,40,40,${a})`); gr.addColorStop(1, 'rgba(255,40,40,0)');
      g.fillStyle = gr; g.fillRect(0, H * 0.72, W, H * 0.28);
    }
  };

  let lastBeat = 0;
  ctl.loop(dt => {
    if (over) { draw(); return; }
    t += dt;
    const v = T.speed * (1 + t / cfg.time * 0.45);
    dist += v * dt;
    laneX += (lane - laneX) * Math.min(1, dt * 14);
    if (jump > 0) { vy -= 22 * dt; jump += vy * dt * 0.35; if (jump <= 0) { jump = 0; vy = 0; } }
    inv = Math.max(0, inv - dt);
    for (const d of deco) { d.z -= v * dt; if (d.z < -1) { d.z += 64; d.v = Math.random(); } }
    nextSpawn -= v * dt;
    if (nextSpawn <= 0 && t < cfg.time - 2) { spawn(); nextSpawn = rnd(15, 22) - t / cfg.time * 5; }
    for (const o of objs) {
      const before = o.z;
      o.z -= v * dt;
      if (o.done || !(before >= HZ && o.z < HZ)) continue;
      if (Math.abs(o.l - laneX) > 0.45) continue;
      o.done = true;
      if (o.pick) {
        o.z = -10;
        if (o.kind === 'frag') { frag = true; Sfx.play('key'); UI.toast('✦ Fragment de mémoire !'); Haptic.mid(); }
        else { cauris++; Sfx.play('coin'); }
        continue;
      }
      if (o.low && jump > 0.12) continue;
      if (inv > 0) continue;
      hits++; gap -= 30; inv = 1.1;
      Sfx.play('hit'); Haptic.hard(); UI.flash(true); UI.shake(wrap);
    }
    objs = objs.filter(o => o.z > -2);
    gap = Math.min(100, gap + dt * 4);
    if (gap < 40 && t - lastBeat > 0.55) { Sfx.play('heart', { vol: 0.6 }); lastBeat = t; }
    pB.style.transform = `scaleX(${Math.min(1, t / cfg.time)})`;
    gB.style.transform = `scaleX(${Math.max(0, gap / 100)})`;
    gBar.classList.toggle('low', gap < 40);
    draw();
    if (gap <= 0) { over = true; setTimeout(() => res({ win: false, title: 'Rattrapée !', text: 'Les hommes gris t\'ont coincée. Change de couloir plus tôt, et saute les obstacles bas.' }), 700); }
    else if (t >= cfg.time) { over = true; setTimeout(() => res({ win: true, stars: hits === 0 ? 3 : hits === 1 ? 2 : 1, cauris: Math.floor(cauris / 2), frag, title: 'Semés !', text: `${cauris} cauris ramassés en route.` }), 300); }
  });
});

/* ======================================================================
   CADENAS : combinaison de symboles (déduction)
   ====================================================================== */
const SYMBOLS = {
  bogolan: [
    ['Le fleuve', '<path d="M4 14q6-6 12 0t12 0 12 0M4 24q6-6 12 0t12 0 12 0M4 34q6-6 12 0t12 0 12 0" stroke="#2a1a10" stroke-width="3.2" fill="none" stroke-linecap="round"/>'],
    ['La pierre', '<circle cx="22" cy="22" r="13" fill="none" stroke="#2a1a10" stroke-width="3.2"/><circle cx="22" cy="22" r="5" fill="#2a1a10"/>'],
    ['Les dents du caïman', '<path d="M4 30L10 14L16 30L22 14L28 30L34 14L40 30" stroke="#2a1a10" stroke-width="3.2" fill="none" stroke-linejoin="round"/>'],
    ['Le carrefour', '<path d="M22 4V40M4 22H40" stroke="#2a1a10" stroke-width="3.6"/><circle cx="10" cy="10" r="3" fill="#2a1a10"/><circle cx="34" cy="10" r="3" fill="#2a1a10"/><circle cx="10" cy="34" r="3" fill="#2a1a10"/><circle cx="34" cy="34" r="3" fill="#2a1a10"/>'],
    ['Le peigne', '<path d="M6 12H38M10 12V36M17 12V36M24 12V36M31 12V36" stroke="#2a1a10" stroke-width="3.2" stroke-linecap="round"/>'],
    ['Le losange', '<path d="M22 4L38 22L22 40L6 22Z" fill="none" stroke="#2a1a10" stroke-width="3.2"/><path d="M22 14L30 22L22 30L14 22Z" fill="#2a1a10"/>'],
  ],
  hiero: [
    ['Le soleil', '<circle cx="22" cy="22" r="14" fill="none" stroke="#2a1a10" stroke-width="3.4"/><circle cx="22" cy="22" r="4" fill="#2a1a10"/>'],
    ['L\'œil', '<path d="M4 20Q22 6 40 20Q22 30 4 20Z" fill="none" stroke="#2a1a10" stroke-width="3"/><circle cx="22" cy="19" r="5" fill="#2a1a10"/><path d="M18 26L14 38M24 27Q30 34 34 32" stroke="#2a1a10" stroke-width="2.6" fill="none"/>'],
    ['L\'ânkh', '<ellipse cx="22" cy="12" rx="7" ry="8" fill="none" stroke="#2a1a10" stroke-width="3.2"/><path d="M22 20V42M10 24H34" stroke="#2a1a10" stroke-width="3.6"/>'],
    ['La plume', '<path d="M22 4Q32 14 26 40L22 42Q14 20 22 4Z" fill="#2a1a10"/><path d="M22 8V40" stroke="#e8d6b5" stroke-width="1.4"/>'],
    ['L\'eau', '<path d="M4 16l5-5 5 5 5-5 5 5 5-5 5 5 5-5M4 26l5-5 5 5 5-5 5 5 5-5 5 5 5-5M4 36l5-5 5 5 5-5 5 5 5-5 5 5 5-5" stroke="#2a1a10" stroke-width="2.6" fill="none"/>'],
    ['Le scarabée', '<ellipse cx="22" cy="26" rx="9" ry="12" fill="#2a1a10"/><circle cx="22" cy="11" r="5" fill="#2a1a10"/><path d="M13 20L4 14M31 20L40 14M13 30L4 36M31 30L40 36M22 16V38" stroke="#2a1a10" stroke-width="2.6"/><path d="M22 16V38" stroke="#e8d6b5" stroke-width="1.2"/>'],
  ],
};
const symSvg = (set, i) => `<svg viewBox="0 0 44 44">${SYMBOLS[set][i][1]}</svg>`;

GAME_TYPES.cadenas = (stage, cfg, ctl) => new Promise(res => {
  const S = SYMBOLS[cfg.set], maxTries = 6;
  const mid = shuffle([0, 1, 2, 3, 4, 5].filter(i => i !== cfg.first && i !== cfg.last)).slice(0, 2);
  const code = [cfg.first, mid[0], mid[1], cfg.last];
  const rows = [];
  let cur = [null, null, null, null], locked = [false, false, false, false], over = false;
  stage.innerHTML = `<div class="g-sub" style="font-style:italic;color:var(--gold-hi);margin-bottom:6px">${cfg.riddle}</div>
    <div class="mm"><div class="mm-rows"></div>
    <div class="mm-legend"><span><i class="peg g"></i>bien placé</span><span><i class="peg w"></i>mal placé</span><span id="mm-left"></span></div>
    <div class="mm-pal">${S.map((s, i) => `<button class="mm-sym" data-s="${i}" aria-label="${s[0]}">${symSvg(cfg.set, i)}</button>`).join('')}</div>
    <div class="g-sub" id="mm-name" style="min-height:20px">Touche un signe pour le placer.</div></div>
    <div class="g-foot"><button class="btn" id="mm-ok" disabled>Essayer</button></div>`;
  const rowsEl = $('.mm-rows', stage), okB = $('#mm-ok');
  $('.g-foot', stage).append(hintButton(15, 'Révéler', () => {
    const k = [1, 2].find(p => !locked[p]);
    if (k == null) return false;
    locked[k] = true; cur[k] = code[k]; render();
  }));
  const fb = (g) => {
    let gold = 0, white = 0;
    g.forEach((s, i) => { if (s === code[i]) gold++; else if (code.includes(s)) white++; });
    return [gold, white];
  };
  const render = () => {
    const rowHtml = (r, n, isCur) => `<div class="mm-row ${isCur ? 'cur' : ''}"><span class="mm-n">${n}</span>
      ${r.g.map((s, i) => `<span class="mm-slot ${s != null ? 'f' : ''} ${isCur && locked[i] ? 'sel' : ''}" data-p="${isCur ? i : ''}">${s != null ? symSvg(cfg.set, s) : ''}</span>`).join('')}
      <span class="mm-pegs">${r.f ? [...Array(r.f[0]).fill('g'), ...Array(r.f[1]).fill('w'), ...Array(4 - r.f[0] - r.f[1]).fill('')].map(c => `<i class="peg ${c}"></i>`).join('') : '<i class="peg"></i>'.repeat(4)}</span></div>`;
    rowsEl.innerHTML = rows.map((r, i) => rowHtml(r, i + 1, false)).join('') + (over ? '' : rowHtml({ g: cur }, rows.length + 1, true));
    rowsEl.scrollTop = rowsEl.scrollHeight;
    okB.disabled = cur.some(s => s == null);
    $('#mm-left').textContent = `Essais : ${maxTries - rows.length}`;
    $$('.mm-sym', stage).forEach(b => b.classList.toggle('used', cur.includes(+b.dataset.s)));
  };
  ctl.listen(stage, 'click', e => {
    if (over || ctl.paused) return;
    const sym = e.target.closest('.mm-sym'), slot = e.target.closest('.mm-slot[data-p]');
    if (sym) {
      const s = +sym.dataset.s;
      $('#mm-name').textContent = S[s][0];
      if (cur.includes(s)) { Sfx.play('bad'); UI.toast('Chaque signe n\'apparaît qu\'une fois.'); return; }
      const p = cur.findIndex(x => x == null);
      if (p < 0) return;
      cur[p] = s; Sfx.play('tap'); Haptic.tap(); render();
    } else if (slot && slot.dataset.p !== '') {
      const p = +slot.dataset.p;
      if (locked[p] || cur[p] == null) return;
      $('#mm-name').textContent = S[cur[p]][0];
      cur[p] = null; Sfx.play('tap'); render();
    }
  });
  okB.onclick = async () => {
    if (over || cur.some(s => s == null)) return;
    const f = fb(cur);
    rows.push({ g: [...cur], f });
    Sfx.play(f[0] === 4 ? 'ok' : 'step'); Haptic.mid();
    if (f[0] === 4) {
      over = true; render();
      await ctl.sleep(500);
      res({ win: true, stars: rows.length <= 2 ? 3 : rows.length <= 4 ? 2 : 1, title: 'Le cadenas s\'ouvre !', text: `Trouvé en ${rows.length} essai${rows.length > 1 ? 's' : ''}.` });
      return;
    }
    if (rows.length >= maxTries) {
      over = true; render();
      await ctl.sleep(500);
      res({ win: false, title: 'Le mécanisme se bloque', text: 'Le cadenas change sa combinaison. Observe bien les points après chaque essai.' });
      return;
    }
    cur = cur.map((s, i) => (locked[i] ? s : null));
    render();
  };
  render();
});
