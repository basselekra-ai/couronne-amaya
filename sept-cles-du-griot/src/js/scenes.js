'use strict';
/* Décors : capitales (jour, soir, nuit), intérieurs, carte de l'Afrique, drapeaux,
   médaillons et icônes d'indices. Tout est vectoriel et généré ici. */

function srand(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const PAL = {
  jour: { s1: '#3d8fd6', s2: '#8ccbef', s3: '#e8f4f2', far: '#9db8c9', mid: '#d9b98f', near: '#b8875a', dark: '#6b4a32', win: '#5d7f99', water1: '#2c7fb0', water2: '#1d5f8a', lit: 0, sun: '#fff6cf', ground: '#d8b27a' },
  soir: { s1: '#2a1b55', s2: '#d4614a', s3: '#ffc76a', far: '#7a4a6a', mid: '#4f2c4a', near: '#3a1f36', dark: '#26132a', win: '#ffcf6a', water1: '#7a3a5a', water2: '#3a1f3e', lit: 0.35, sun: '#ffde8a', ground: '#4a2a3a' },
  nuit: { s1: '#070818', s2: '#141a45', s3: '#2b2c66', far: '#1d2048', mid: '#161634', near: '#0f0e24', dark: '#0a0918', win: '#ffd27a', water1: '#141a3e', water2: '#0a0c24', lit: 0.55, sun: '#f4f1e0', ground: '#14122a' },
};

function skyLayer(P, time, seed) {
  const r = srand(seed), k = uid('sk');
  let s = `<defs><linearGradient id="sky${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.s1}"/><stop offset=".62" stop-color="${P.s2}"/><stop offset="1" stop-color="${P.s3}"/></linearGradient>
    <radialGradient id="sun${k}"><stop offset="0" stop-color="${P.sun}"/><stop offset=".35" stop-color="${P.sun}" stop-opacity=".9"/><stop offset="1" stop-color="${P.sun}" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="700" fill="url(#sky${k})"/>`;
  if (time === 'nuit') {
    for (let i = 0; i < 70; i++) s += `<circle cx="${(r() * 400).toFixed(1)}" cy="${(r() * 360).toFixed(1)}" r="${(r() * 1.3 + 0.3).toFixed(2)}" fill="#fff" opacity="${(r() * 0.7 + 0.2).toFixed(2)}"/>`;
    s += `<circle cx="318" cy="96" r="60" fill="url(#sun${k})" opacity=".35"/><path d="M318 74A22 22 0 1 0 318 118A13 22 0 0 1 318 74Z" fill="#f4f1e0"/>`;
  } else if (time === 'soir') {
    s += `<circle cx="120" cy="380" r="140" fill="url(#sun${k})" opacity=".55"/><circle cx="120" cy="388" r="38" fill="#ffd27a"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${-20 + i * 110} ${250 + i * 22}h${120 + i * 10}" stroke="#ff9a6a" stroke-width="${4 - i * 0.6}" stroke-linecap="round" opacity=".55"/>`;
  } else {
    s += `<circle cx="300" cy="110" r="90" fill="url(#sun${k})" opacity=".7"/><circle cx="300" cy="110" r="26" fill="#fffbe8"/>`;
    for (let i = 0; i < 4; i++) { const x = r() * 360, y = 60 + r() * 220; s += `<g fill="#fff" opacity=".85"><ellipse cx="${x}" cy="${y}" rx="38" ry="11"/><ellipse cx="${x + 18}" cy="${y - 8}" rx="22" ry="12"/><ellipse cx="${x - 16}" cy="${y - 4}" rx="16" ry="9"/></g>`; }
  }
  return s;
}

/** Immeubles avec fenêtres (allumées la nuit). */
function buildings(P, seed, y0, list, color) {
  const r = srand(seed);
  let s = '';
  for (const [x, w, h, roof] of list) {
    const top = y0 - h;
    s += `<rect x="${x}" y="${top}" width="${w}" height="${h + 300}" fill="${color}"/>`;
    if (roof === 'tri') s += `<path d="M${x - 2} ${top}L${x + w / 2} ${top - 14}L${x + w + 2} ${top}Z" fill="${color}"/>`;
    if (roof === 'ant') s += `<path d="M${x + w / 2} ${top}v-22" stroke="${color}" stroke-width="2"/>`;
    for (let wy = top + 8; wy < y0 - 6; wy += 11) for (let wx = x + 5; wx < x + w - 6; wx += 9) {
      const lit = r() < P.lit;
      if (P.lit === 0 && r() < 0.5) continue;
      s += `<rect x="${wx}" y="${wy}" width="4" height="6" fill="${lit ? P.win : P.lit ? 'rgba(0,0,0,.25)' : P.win}" opacity="${lit ? 0.95 : P.lit ? 1 : 0.35}"/>`;
    }
  }
  return s;
}
function palm(x, y, h, c, lean = 0) {
  const tx = x + lean, ty = y - h;
  let s = `<path d="M${x} ${y}Q${x + lean * 0.3} ${y - h * 0.5} ${tx} ${ty}" stroke="${c}" stroke-width="${Math.max(3, h / 18)}" fill="none" stroke-linecap="round"/>`;
  for (const a of [-160, -125, -90, -55, -20, 15, 200]) {
    const rad = a * Math.PI / 180, L = h * 0.42;
    const ex = tx + Math.cos(rad) * L, ey = ty + Math.sin(rad) * L * 0.6 + L * 0.25;
    s += `<path d="M${tx} ${ty}Q${(tx + ex) / 2} ${ty + Math.sin(rad) * L * 0.6 - 10} ${ex} ${ey}" stroke="${c}" stroke-width="${h / 16}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}
function baobab(x, y, s, c) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><path d="M-14 0C-12-30-18-50-16-70L16-70C18-50 12-30 14 0Z"/>
    <path d="M-16-66C-30-80-46-84-58-96M-10-70C-14-90-8-104-14-118M2-70C4-92 14-100 12-120M14-66C30-78 44-80 58-94" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <ellipse cx="-58" cy="-100" rx="16" ry="9"/><ellipse cx="-14" cy="-122" rx="14" ry="8"/><ellipse cx="12" cy="-124" rx="14" ry="8"/><ellipse cx="58" cy="-98" rx="16" ry="9"/></g>`;
}
function pirogue(x, y, s, c1, c2, flag) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 0Q-30 14 0 14Q30 14 64 -4L58 6Q30 22 0 22Q-34 22-66 4Z" fill="${c1}"/>
    <path d="M-62 2Q-30 16 0 16Q30 16 62 -2" stroke="${c2}" stroke-width="4" fill="none"/><path d="M-20 12h40" stroke="#fff" stroke-width="2" stroke-dasharray="5 4"/>
    ${flag ? `<path d="M40 0V-34" stroke="#3a2a1a" stroke-width="2"/><path d="M40-34h16l-4 6 4 6H40Z" fill="${flag}"/>` : ''}</g>`;
}
function water(P, y, seed, h = 300) {
  const r = srand(seed);
  let s = `<rect x="0" y="${y}" width="400" height="${h}" fill="${P.water1}"/><rect x="0" y="${y + 40}" width="400" height="${h}" fill="${P.water2}" opacity=".6"/>`;
  for (let i = 0; i < 24; i++) { const x = r() * 400, yy = y + 6 + r() * 120; s += `<path d="M${x} ${yy}h${10 + r() * 30}" stroke="#fff" stroke-width="1.5" opacity="${0.08 + r() * 0.18}" stroke-linecap="round"/>`; }
  return s;
}

/* ---------------- capitales ---------------- */
const CITY_ART = {
  dakar(P, t) {
    const bronze = t === 'nuit' ? '#2a2030' : t === 'soir' ? '#3a2232' : '#7a5232';
    let s = skyLayer(P, t, 11);
    s += water(P, 440, 3);
    // les deux Mamelles
    s += `<path d="M30 470C70 380 130 340 170 336C220 340 250 380 280 420C300 400 320 384 340 384C370 386 400 420 420 470Z" fill="${P.mid}"/>`;
    // phare des Mamelles
    s += `<g transform="translate(340 384)"><rect x="-8" y="-46" width="16" height="46" fill="${t === 'nuit' ? '#c9c4d6' : '#f4f1ea'}"/><rect x="-10" y="-54" width="20" height="10" fill="${P.dark}"/>
      <path d="M-6-54L0-62L6-54Z" fill="${P.dark}"/><circle cx="0" cy="-49" r="3" fill="#ffe08a"/>
      ${t === 'nuit' ? '<path d="M0-49L-160-90L-160-70Z" fill="#ffe08a" opacity=".18"/><path d="M0-49L160-80L160-62Z" fill="#ffe08a" opacity=".1"/>' : ''}</g>`;
    // Monument de la Renaissance africaine
    s += `<g transform="translate(168 338) scale(1.05)" fill="${bronze}"><rect x="-34" y="-6" width="68" height="10" rx="2"/>
      <path d="M-34-4C-40-24-34-52-24-70C-20-78-14-80-10-76C-12-60-16-40-12-4Z"/>
      <circle cx="-17" cy="-84" r="7.5"/><path d="M-24-70L-48-58L-46-54L-22-62Z"/>
      <path d="M-14-4L-20-40L-16-82L16-82L14-40L22-4L10-4L6-36L-2-36L-4-4Z"/>
      <circle cx="2" cy="-92" r="9"/><path d="M12-80L26-116L32-114L20-78Z"/>
      <ellipse cx="32" cy="-124" rx="7" ry="10" transform="rotate(20 32 -124)"/><circle cx="35" cy="-138" r="5.5"/><path d="M36-128L52-140L54-136L38-124Z"/></g>`;
    s += `<path d="M168 336v-4" stroke="${bronze}"/>`;
    // ville au premier plan
    s += buildings(P, 7, 500, [[210, 40, 54], [252, 30, 80, 'ant'], [284, 46, 46], [332, 36, 70], [370, 40, 50]], P.near);
    s += `<rect x="0" y="498" width="400" height="220" fill="${P.near}"/>`;
    s += pirogue(70, 470, 0.9, '#1f6fb5', '#f2b33d', '#2a9e5a') + pirogue(150, 492, 0.7, '#e0412f', '#f4ecd8', '#f2b33d');
    s += baobab(30, 520, 0.7, P.dark);
    return s;
  },
  bamako(P, t) {
    let s = skyLayer(P, t, 21);
    s += `<path d="M-10 420L20 360H170L196 380H300L330 350H420V430H-10Z" fill="${P.far}"/>`;
    // tour de la BCEAO
    const tc = t === 'jour' ? '#c98a5a' : P.mid;
    s += `<g transform="translate(272 448)"><path d="M-22 0V-150L-14-176L-8-168L0-206L8-168L14-176L22-150V0Z" fill="${tc}"/>
      ${[-16, -8, 0, 8, 16].map(x => `<path d="M${x} -6V-146" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`).join('')}
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="-18" y="${-140 + i * 17}" width="36" height="3" fill="${t === 'nuit' ? P.win : 'rgba(0,0,0,.12)'}" opacity="${t === 'nuit' ? 0.7 : 1}"/>`).join('')}</g>`;
    // maisons soudano-sahéliennes
    const adobe = t === 'jour' ? '#b9774a' : P.near;
    const house = (x, w, h) => `<g fill="${adobe}"><rect x="${x}" y="${448 - h}" width="${w}" height="${h}"/>${[0, 1, 2, 3].map(i => `<path d="M${x + 2 + i * (w - 8) / 3} ${448 - h}l3-12 3 12Z"/>`).join('')}</g>
      ${[1, 2].map(i => `<path d="M${x - 4} ${448 - h + i * 14}h${w + 8}" stroke="${P.dark}" stroke-width="2" stroke-dasharray="1 7"/>`).join('')}
      <rect x="${x + w / 2 - 4}" y="${448 - 16}" width="8" height="16" fill="${P.dark}" opacity=".7"/>`;
    s += house(30, 60, 50) + house(96, 46, 36) + house(150, 70, 58) + house(320, 60, 44);
    s += buildings(P, 4, 448, [[226, 22, 40]], P.near);
    s += water(P, 448, 8);
    // pont
    s += `<path d="M-10 486H410" stroke="${P.dark}" stroke-width="7"/>${[20, 80, 140, 200, 260, 320, 380].map(x => `<rect x="${x - 3}" y="486" width="6" height="26" fill="${P.dark}"/>`).join('')}
      ${t === 'nuit' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<circle cx="${i * 44 + 10}" cy="480" r="2.2" fill="${P.win}"/>`).join('') : ''}`;
    s += pirogue(110, 560, 0.8, '#3a2a1e', '#c8553d') + pirogue(300, 600, 1, '#4a3424', '#2f9e62');
    s += `<rect x="0" y="640" width="400" height="80" fill="${P.ground}"/>` + baobab(350, 650, 0.75, P.dark);
    return s;
  },
  yamoussoukro(P, t) {
    let s = skyLayer(P, t, 31);
    const stone = t === 'jour' ? '#e9e2d4' : t === 'soir' ? '#b48aa0' : '#3b3a5c';
    const dome = t === 'jour' ? '#9fb7c9' : t === 'soir' ? '#6f6a9a' : '#2a2c52';
    s += `<path d="M-10 452Q100 430 200 440Q300 430 410 450V700H-10Z" fill="${P.far}"/>`;
    // colonnades
    s += `<path d="M40 452Q120 400 158 404V452Z" fill="${stone}"/><path d="M360 452Q280 400 242 404V452Z" fill="${stone}"/>`;
    for (let i = 0; i < 10; i++) { const x1 = 46 + i * 11.5, x2 = 354 - i * 11.5; s += `<rect x="${x1}" y="${452 - 12 - i * 4}" width="4" height="${12 + i * 4}" fill="${P.dark}" opacity=".35"/><rect x="${x2 - 4}" y="${452 - 12 - i * 4}" width="4" height="${12 + i * 4}" fill="${P.dark}" opacity=".35"/>`; }
    // basilique
    s += `<g transform="translate(200 452)"><rect x="-62" y="-60" width="124" height="60" fill="${stone}"/>
      ${[-52, -36, -20, -4, 12, 28, 44].map(x => `<rect x="${x}" y="-56" width="7" height="56" fill="${P.dark}" opacity=".28"/>`).join('')}
      <rect x="-56" y="-80" width="112" height="22" fill="${stone}"/>
      <path d="M-56-80C-56-170 56-170 56-80Z" fill="${dome}"/>
      ${[-36, -18, 0, 18, 36].map(x => `<path d="M${x}-80Q${x * 0.6}-130 0-158" stroke="${stone}" stroke-width="2" fill="none" opacity=".7"/>`).join('')}
      <rect x="-12" y="-176" width="24" height="20" fill="${stone}"/><path d="M-12-176C-12-192 12-192 12-176Z" fill="${dome}"/>
      <path d="M0-188V-214M-8-204H8" stroke="${t === 'nuit' ? '#e8d48a' : '#c9a24a'}" stroke-width="3"/>
      ${t === 'nuit' ? '<circle cx="0" cy="-120" r="70" fill="#ffe8a8" opacity=".08"/>' : ''}</g>`;
    s += palm(30, 470, 110, P.dark, -12) + palm(372, 470, 120, P.dark, 14) + palm(330, 476, 80, P.dark, 6);
    s += water(P, 470, 9);
    // reflet
    s += `<path d="M150 476h100M164 490h72M178 504h44" stroke="${stone}" stroke-width="3" opacity=".25"/>`;
    // crocodiles
    const croc = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})" fill="${t === 'jour' ? '#3d5a34' : '#0a0c18'}"><path d="M-40 0Q-20-8 0-6Q20-10 40-4Q50 0 40 2Q20 4 0 4Q-20 6-40 0Z"/><path d="M-6-6l3-5 3 5M6-7l3-5 3 5M18-8l3-4 3 4" /></g>
      ${t === 'nuit' ? `<circle cx="${x + 30 * sc}" cy="${y - 7 * sc}" r="${2 * sc}" fill="#ffd23f"/><circle cx="${x + 36 * sc}" cy="${y - 7 * sc}" r="${2 * sc}" fill="#ffd23f"/>` : ''}`;
    s += croc(90, 560, 1.2) + croc(290, 610, 1.6) + croc(330, 530, 0.8);
    s += `<path d="M0 650Q100 630 200 648Q300 666 400 640V720H0Z" fill="${P.near}"/>`;
    return s;
  },
  accra(P, t) {
    let s = skyLayer(P, t, 41);
    s += water(P, 456, 12);
    const white = t === 'jour' ? '#f1ece2' : t === 'soir' ? '#b993a6' : '#3a3a5e';
    s += buildings(P, 41, 456, [[10, 34, 40], [48, 28, 62, 'ant'], [300, 40, 50], [346, 34, 72]], P.mid);
    // Black Star Gate
    s += `<g transform="translate(180 456)"><rect x="-90" y="-78" width="180" height="78" fill="${white}"/>
      ${[-70, -30, 10, 50].map(x => `<path d="M${x} 0V-44C${x}-58 ${x + 20}-58 ${x + 20}-44V0Z" fill="${P.dark}" opacity=".85"/>`).join('')}
      <rect x="-94" y="-84" width="188" height="8" fill="${white}"/><rect x="-26" y="-100" width="52" height="18" fill="${white}"/>
      <path d="M0-148L9-122L37-122L14-106L23-80L0-96L-23-80L-14-106L-37-122L-9-122Z" transform="translate(0 -14) scale(.62)" fill="#111"/>
      <text x="0" y="-66" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="9" fill="${P.dark}" opacity=".7">FREEDOM AND JUSTICE</text></g>`;
    // phare de Jamestown
    s += `<g transform="translate(330 470)"><path d="M-10 0L-7-110H7L10 0Z" fill="#f4f1ea"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${-9.5 + i * 0.6} ${-12 - i * 22}L${9.5 - i * 0.6} ${-12 - i * 22}L${9.2 - i * 0.6} ${-24 - i * 22}L${-9.2 + i * 0.6} ${-24 - i * 22}Z" fill="#d0352a"/>`).join('')}
      <rect x="-10" y="-124" width="20" height="14" fill="${P.dark}"/><circle cx="0" cy="-117" r="4" fill="#ffe08a"/>
      ${t === 'nuit' ? '<path d="M0-117L-180-160L-180-136Z" fill="#ffe08a" opacity=".16"/>' : ''}</g>`;
    s += `<path d="M0 560Q120 540 240 556Q330 566 400 550V720H0Z" fill="${P.ground}"/>`;
    s += pirogue(90, 540, 1.1, '#1d8a4a', '#f2b33d', '#d0352a') + pirogue(250, 528, 0.8, '#f2b33d', '#d0352a', '#1d8a4a') + pirogue(170, 580, 1.2, '#d0352a', '#111', '#f2b33d');
    s += palm(370, 600, 140, P.dark, -18) + palm(24, 620, 110, P.dark, 10);
    return s;
  },
  kinshasa(P, t) {
    let s = skyLayer(P, t, 51);
    // Brazzaville sur l'autre rive
    s += buildings(P, 51, 420, [[20, 20, 30], [44, 14, 70, 'ant'], [62, 26, 36], [100, 22, 26], [128, 30, 34]], P.far);
    s += water(P, 420, 13);
    if (t === 'nuit') for (let i = 0; i < 18; i++) s += `<path d="M${10 + i * 22} ${430 + (i % 5) * 9}v${20 + (i % 4) * 8}" stroke="${P.win}" stroke-width="2" opacity=".25"/>`;
    // Kinshasa
    s += buildings(P, 52, 520, [[0, 40, 60], [44, 34, 96], [84, 28, 70, 'ant'], [118, 46, 120], [168, 30, 84], [204, 40, 66], [330, 40, 90], [372, 34, 56]], P.mid);
    // Tour de l'Échangeur (Limete)
    const tw = t === 'jour' ? '#c9c2b4' : P.near;
    s += `<g transform="translate(276 520)"><path d="M-7 0L-5-200H5L7 0Z" fill="${tw}"/><path d="M-5-200L-18-226L18-226L5-200Z" fill="${tw}"/><path d="M-18-226H18L14-232H-14Z" fill="${tw}"/>
      <path d="M0-232V-252" stroke="${tw}" stroke-width="2"/>${t !== 'jour' ? '<circle cx="0" cy="-252" r="3" fill="#ff4a3d"/>' : ''}</g>`;
    s += `<rect x="0" y="520" width="400" height="200" fill="${P.near}"/>`;
    s += `<path d="M0 560H400" stroke="${t === 'nuit' ? '#ffd27a' : P.dark}" stroke-width="2" stroke-dasharray="14 10" opacity=".5"/>`;
    s += palm(30, 600, 120, P.dark, 10) + palm(380, 620, 130, P.dark, -14);
    return s;
  },
  addis(P, t) {
    let s = skyLayer(P, t, 61);
    const m1 = t === 'jour' ? '#6f9a8a' : P.far, m2 = t === 'jour' ? '#4f7a5f' : P.mid;
    s += `<path d="M-10 380Q60 300 130 340Q200 260 280 330Q340 290 410 340V500H-10Z" fill="${m1}"/>`;
    s += `<path d="M-10 420Q80 370 160 400Q250 360 320 396Q370 380 410 400V520H-10Z" fill="${m2}"/>`;
    // siège de l'Union africaine
    const gl = t === 'jour' ? '#8fb4cf' : t === 'soir' ? '#6a6aa0' : '#2a3060';
    s += `<g transform="translate(236 500)"><rect x="-17" y="-190" width="34" height="190" fill="${gl}"/><path d="M-17-190Q0-206 17-190Z" fill="${gl}"/>
      ${Array.from({ length: 16 }, (_, i) => `<path d="M-17 ${-180 + i * 11}H17" stroke="${t === 'nuit' ? P.win : 'rgba(255,255,255,.35)'}" stroke-width="1.6" opacity="${t === 'nuit' && i % 3 ? 0.2 : 0.7}"/>`).join('')}
      <path d="M-80 0V-34Q-30-60 30-50Q70-44 90-30V0Z" fill="${gl}" opacity=".9"/></g>`;
    s += buildings(P, 62, 520, [[10, 38, 60], [52, 30, 82], [90, 44, 50], [140, 30, 70], [290, 40, 64], [336, 34, 46], [372, 30, 74]], P.near);
    s += `<rect x="0" y="518" width="400" height="200" fill="${P.near}"/>`;
    // jacarandas
    const jac = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M0 0V-50M0-30L-16-50M0-36L14-54" stroke="${P.dark}" stroke-width="5" fill="none"/>
      <g fill="${t === 'nuit' ? '#4a3a7a' : '#9b6bd0'}"><circle cx="-18" cy="-58" r="18"/><circle cx="4" cy="-70" r="22"/><circle cx="22" cy="-56" r="17"/><circle cx="-2" cy="-48" r="16"/></g>
      <g fill="${t === 'nuit' ? '#5b4a8f' : '#b88ce6'}"><circle cx="-10" cy="-66" r="8"/><circle cx="14" cy="-74" r="9"/></g></g>`;
    s += jac(46, 640, 1.3) + jac(350, 660, 1.5) + jac(150, 690, 0.9);
    return s;
  },
  caire(P, t) {
    let s = skyLayer(P, t, 71);
    const sand = t === 'jour' ? '#e3c28a' : t === 'soir' ? '#b07a6a' : '#3a3254';
    const sandD = t === 'jour' ? '#c9a46a' : t === 'soir' ? '#8a5a5a' : '#2a2444';
    // pyramides de Gizeh
    s += `<path d="M-10 452Q200 436 410 452V700H-10Z" fill="${sand}"/>`;
    const pyr = (x, w, h) => `<path d="M${x - w / 2} 452L${x} ${452 - h}L${x + w / 2} 452Z" fill="${sand}"/><path d="M${x} ${452 - h}L${x + w / 2} 452L${x + w * 0.08} 452Z" fill="${sandD}"/>`;
    s += pyr(60, 170, 120) + pyr(175, 190, 138) + pyr(265, 90, 60);
    s += `<path d="M175 314L163 330H187Z" fill="${t === 'jour' ? '#efe2c4' : sand}"/>`;
    // tour du Caire et citadelle à l'horizon droit
    const cc = P.mid;
    s += `<g transform="translate(350 452)" fill="${cc}"><path d="M-4 0L-3-140H3L4 0Z"/><path d="M-10-140Q-12-152 -6-158H6Q12-152 10-140Z"/><path d="M0-158V-172" stroke="${cc}" stroke-width="2"/>
      ${t === 'nuit' ? '<circle cx="0" cy="-150" r="4" fill="#ffd27a"/>' : ''}</g>`;
    s += `<g fill="${cc}" transform="translate(300 452)"><path d="M-30 0V-24H30V0Z"/><path d="M-18-24Q-18-46 0-46Q18-46 18-24Z"/><path d="M-30-24Q-30-34-22-34Q-14-34-14-24ZM14-24Q14-34 22-34Q30-34 30-24Z"/>
      <path d="M-34 0V-70L-32-80L-30-70V0ZM30 0V-70L32-80L34-70V0Z"/></g>`;
    // Nil et felouques
    s += water(P, 520, 14);
    const felucca = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M-30 0H30L22 8H-22Z" fill="${P.dark}"/><path d="M0 0V-64" stroke="${P.dark}" stroke-width="2"/>
      <path d="M2-62L34-6H2Z" fill="${t === 'nuit' ? '#c8c4d8' : '#fbf6ea'}"/><path d="M-2-50L-24-8H-2Z" fill="${t === 'nuit' ? '#a8a4b8' : '#efe6d2'}"/></g>`;
    s += felucca(110, 580, 1.2) + felucca(300, 620, 1.5);
    s += `<path d="M0 660Q200 640 400 662V720H0Z" fill="${P.near}"/>` + palm(30, 670, 130, P.dark, 10) + palm(380, 680, 110, P.dark, -10);
    return s;
  },
};

/* ---------------- intérieurs ---------------- */
const ROOM_ART = {
  chambre() {
    return `<rect width="400" height="700" fill="#2a2246"/><rect y="470" width="400" height="230" fill="#3d2a24"/>
      <path d="M0 470H400" stroke="#1a1220" stroke-width="6"/>
      <rect x="230" y="90" width="130" height="170" rx="6" fill="#0d1236"/><circle cx="320" cy="140" r="16" fill="#f4f1e0"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<circle cx="${240 + (i * 37) % 110}" cy="${100 + (i * 53) % 140}" r="1.2" fill="#fff"/>`).join('')}
      <path d="M230 175H360M295 90V260" stroke="#4a3a2a" stroke-width="6"/><rect x="222" y="82" width="146" height="186" rx="8" fill="none" stroke="#4a3a2a" stroke-width="8"/>
      <path d="M210 74Q240 200 216 290L226 290Q250 200 220 74Z" fill="#8a2f3a"/><path d="M380 74Q350 200 374 290L364 290Q340 200 370 74Z" fill="#8a2f3a"/>
      <rect x="20" y="130" width="160" height="10" fill="#5a3a24"/><rect x="20" y="230" width="160" height="10" fill="#5a3a24"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<rect x="${26 + i * 15}" y="${180 + (i % 3) * 6}" width="12" height="${50 - (i % 3) * 6}" fill="${['#c8553d', '#2f6f9e', '#f2b33d', '#3d7a4a', '#7a3a6a'][i % 5]}"/>`).join('')}
      <rect x="0" y="560" width="400" height="140" fill="#4a3226" opacity=".6"/>
      <ellipse cx="200" cy="610" rx="170" ry="48" fill="#8a2f2a"/><ellipse cx="200" cy="610" rx="140" ry="36" fill="none" stroke="#f2b33d" stroke-width="4" stroke-dasharray="10 8"/>`;
  },
  musee() {
    const k = uid('bg');
    return `<rect width="400" height="700" fill="#5a3826"/><rect y="500" width="400" height="200" fill="#3a2418"/>
      ${[0, 1, 2, 3].map(i => `<path d="M${50 + i * 100} 0L${20 + i * 100} 500H${80 + i * 100}Z" fill="#ffe8b0" opacity=".07"/>`).join('')}
      ${[60, 200, 340].map(x => `<rect x="${x - 40}" y="300" width="80" height="200" fill="#2a1a12"/><rect x="${x - 34}" y="200" width="68" height="100" fill="#cfe6f0" opacity=".12" stroke="#c9a24a" stroke-width="2"/>`).join('')}
      <g transform="translate(60 290)"><path d="M-14 0Q-18-40-10-70Q0-84 10-70Q18-40 14 0Z" fill="#2a1a10"/><path d="M-8-60h16M-6-48h12" stroke="#c9a24a" stroke-width="2"/></g>
      <g transform="translate(200 290)"><ellipse cx="0" cy="-34" rx="22" ry="32" fill="#7a4a24"/><path d="M-10-40h6M4-40h6M-4-20h8" stroke="#2a1a10" stroke-width="3"/><path d="M-22-60L-30-80M22-60L30-80" stroke="#7a4a24" stroke-width="5"/></g>
      <g transform="translate(340 290)"><rect x="-26" y="-60" width="52" height="60" fill="url(#${k})"/></g>
      <defs><pattern id="${k}" width="13" height="13" patternUnits="userSpaceOnUse"><rect width="13" height="13" fill="#5b3a1f"/><path d="M2 2l4 4M6 2l-4 4" stroke="#efe0c2" stroke-width="1.5"/><circle cx="10" cy="10" r="1.6" fill="#efe0c2"/></pattern></defs>`;
  },
  atelier() {
    const k = uid('kt');
    return `<rect width="400" height="700" fill="#c98a4a"/><rect y="480" width="400" height="220" fill="#7a4a2a"/>
      <rect x="40" y="70" width="140" height="160" fill="#8fd0f0"/><path d="M40 150H180M110 70V230" stroke="#5a3a20" stroke-width="6"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${220 + i * 28}" y="40" width="20" height="${260 + (i % 2) * 40}" fill="url(#${k})"/>`).join('')}
      <defs><pattern id="${k}" width="20" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="40" fill="#f2b33d"/><rect width="20" height="8" fill="#1d7a3e"/><rect y="16" width="20" height="6" fill="#c22d23"/><rect y="28" width="10" height="6" fill="#111"/><rect x="8" width="4" height="40" fill="#1d7a3e" opacity=".5"/></pattern></defs>`;
  },
  club() {
    let s = `<rect width="400" height="700" fill="#140a22"/>`;
    const cols = ['#e2589a', '#3ad0ff', '#ffd23f', '#7a5aff'];
    cols.forEach((c, i) => s += `<path d="M${40 + i * 107} 0L${-20 + i * 107} 520H${110 + i * 107}Z" fill="${c}" opacity=".13"/><circle cx="${40 + i * 107}" cy="10" r="10" fill="${c}"/>`);
    s += `<rect y="430" width="400" height="40" fill="#2a1a3a"/><rect y="470" width="400" height="230" fill="#0a0612"/>`;
    for (let i = 0; i < 16; i++) s += `<circle cx="${i * 27 + 8}" cy="${520 + (i % 3) * 10}" r="16" fill="#05030a"/><rect x="${i * 27 - 8}" y="${530 + (i % 3) * 10}" width="32" height="80" rx="12" fill="#05030a"/>`;
    s += `<rect x="60" y="370" width="12" height="60" fill="#333"/><rect x="50" y="350" width="32" height="28" rx="4" fill="#222"/><rect x="328" y="370" width="12" height="60" fill="#333"/><rect x="318" y="350" width="32" height="28" rx="4" fill="#222"/>`;
    return s;
  },
  labo() {
    return `<rect width="400" height="700" fill="#dfe6e8"/><rect y="470" width="400" height="230" fill="#9aa7ab"/>
      <rect x="30" y="80" width="200" height="300" rx="8" fill="#20313a"/><rect x="40" y="90" width="180" height="280" fill="#2c4552"/>
      <g stroke="#e9e2d0" stroke-width="5" stroke-linecap="round" fill="none" transform="translate(130 120)">
        <circle cx="0" cy="0" r="12"/><path d="M0 14V110M-30 40H30M-26 56H26M-22 70H22M0 110L-20 120M0 110L20 120M-20 122L-24 200M20 122L26 200M-30 40L-46 100M30 40L44 98"/></g>
      <text x="130" y="360" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="15" fill="#e9e2d0">LUCY · DINKNESH</text>
      <rect x="260" y="120" width="110" height="140" fill="#2f9e62" opacity=".25"/><rect x="250" y="400" width="140" height="70" fill="#7a8a90"/>`;
  },
  bibliotheque() {
    const k = uid('lb');
    let s = `<rect width="400" height="700" fill="#2a1a0e"/><radialGradient id="${k}"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>`;
    for (let row = 0; row < 6; row++) for (let i = 0; i < 2; i++) {
      const x = i ? 290 : 0;
      s += `<rect x="${x}" y="${60 + row * 70}" width="110" height="8" fill="#5a3a1e"/>`;
      for (let b = 0; b < 8; b++) s += `<rect x="${x + 4 + b * 13}" y="${60 + row * 70 - 40 + (b % 3) * 4}" width="10" height="${40 - (b % 3) * 4}" rx="2" fill="${['#8a5a2a', '#c9a24a', '#6a3a1a', '#a87a3a'][(b + row) % 4]}"/>`;
    }
    s += `<circle cx="200" cy="300" r="190" fill="url(#${k})"/><circle cx="200" cy="300" r="110" fill="#3a2a14" stroke="#c9a24a" stroke-width="8"/>
      <circle cx="200" cy="300" r="86" fill="none" stroke="#c9a24a" stroke-width="3" stroke-dasharray="6 6"/>`;
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 7; s += `<circle cx="${200 + Math.cos(a) * 64}" cy="${300 + Math.sin(a) * 64}" r="15" fill="#1a1008" stroke="#c9a24a" stroke-width="2"/>`; }
    s += `<rect y="520" width="400" height="180" fill="#3a2614"/>`;
    return s;
  },
  souk() {
    let s = `<rect width="400" height="700" fill="#1a1022"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${i * 110 - 20} 520V200Q${i * 110 + 35} 120 ${i * 110 + 90} 200V520" fill="none" stroke="#3a2a3a" stroke-width="22"/>`;
    for (let i = 0; i < 9; i++) { const x = 20 + i * 45, y = 160 + (i % 3) * 40; s += `<path d="M${x} 0V${y - 16}" stroke="#5a4a3a"/><path d="M${x - 9} ${y - 16}H${x + 9}L${x + 12} ${y}L${x} ${y + 14}L${x - 12} ${y}Z" fill="${['#ffb347', '#e2589a', '#3ad0a0'][i % 3]}" opacity=".9"/><circle cx="${x}" cy="${y}" r="26" fill="#ffd27a" opacity=".12"/>`; }
    s += `<rect y="520" width="400" height="180" fill="#2a1a24"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${i * 70}" y="470" width="58" height="50" fill="#4a2a2a"/><path d="M${i * 70} 470h58l-6-14h-46z" fill="${['#c8553d', '#2f6f9e', '#f2b33d'][i % 3]}"/>`;
    return s;
  },
  avion() {
    const k = uid('av');
    return `<rect width="400" height="700" fill="#cfd6de"/><rect x="60" y="120" width="280" height="380" rx="120" fill="#9aa4b0"/>
      <defs><linearGradient id="${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a5aa8"/><stop offset=".6" stop-color="#f09a6a"/><stop offset="1" stop-color="#ffd8a0"/></linearGradient></defs>
      <rect x="84" y="146" width="232" height="328" rx="104" fill="url(#${k})"/>
      <g fill="#fff" opacity=".85"><ellipse cx="150" cy="380" rx="70" ry="16"/><ellipse cx="260" cy="410" rx="60" ry="14"/><ellipse cx="200" cy="440" rx="90" ry="18"/></g>
      <path d="M90 360Q200 330 310 360" stroke="#7a5a8a" stroke-width="2" fill="none" opacity=".5"/>
      <rect x="84" y="146" width="232" height="328" rx="104" fill="none" stroke="#eef2f6" stroke-width="10"/>`;
  },
  route() {
    let s = skyLayer(PAL.nuit, 'nuit', 81);
    s += `<path d="M-10 460Q120 430 250 450Q340 462 410 440V700H-10Z" fill="#14122a"/>` + palm(60, 470, 120, '#0a0918', 8) + palm(340, 462, 100, '#0a0918', -6);
    s += `<path d="M200 470L-60 700H460Z" fill="#1d1b30"/><path d="M200 480L196 700M200 480L204 700" stroke="#ffd27a" stroke-width="3" stroke-dasharray="18 22" opacity=".7"/>`;
    s += `<path d="M120 700L190 480M280 700L210 480" stroke="#ffe8a8" stroke-width="40" opacity=".05"/>`;
    return s;
  },
};

/** Décor complet ; name = ville ou intérieur, time = jour | soir | nuit */
function backdrop(name, time = 'jour') {
  let inner;
  if (CITY_ART[name]) inner = CITY_ART[name](PAL[time] || PAL.jour, time);
  else if (ROOM_ART[name]) inner = ROOM_ART[name]();
  else inner = `<rect width="400" height="700" fill="#140c1f"/>`;
  return `<svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

/* ---------------- drapeaux ---------------- */
function star5(cx, cy, r, fill) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.4 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(2) + ' ' + (cy + Math.sin(a) * rr).toFixed(2); }
  return `<path d="${d}Z" fill="${fill}"/>`;
}
const FLAGS = {
  sn: () => `<rect width="30" height="20" fill="#00853f"/><rect x="10" width="10" height="20" fill="#fdef42"/><rect x="20" width="10" height="20" fill="#e31b23"/>${star5(15, 10, 3.6, '#00853f')}`,
  ml: () => `<rect width="30" height="20" fill="#14b53a"/><rect x="10" width="10" height="20" fill="#fcd116"/><rect x="20" width="10" height="20" fill="#ce1126"/>`,
  ci: () => `<rect width="30" height="20" fill="#f77f00"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#009e60"/>`,
  gh: () => `<rect width="30" height="20" fill="#ce1126"/><rect y="6.67" width="30" height="6.67" fill="#fcd116"/><rect y="13.33" width="30" height="6.67" fill="#006b3f"/>${star5(15, 10, 3.4, '#000')}`,
  cd: () => `<rect width="30" height="20" fill="#007fff"/><path d="M0 17L26 0H30V3L4 20H0Z" fill="#f7d618"/><path d="M0 18.6L28.2 0H30V1.4L1.8 20H0Z" fill="#ce1021"/>${star5(6, 5, 3.2, '#f7d618')}`,
  et: () => `<rect width="30" height="20" fill="#078930"/><rect y="6.67" width="30" height="6.67" fill="#fcdd09"/><rect y="13.33" width="30" height="6.67" fill="#da121a"/><circle cx="15" cy="10" r="4.6" fill="#0f47af"/>${star5(15, 10, 3.2, 'none').replace('fill="none"', 'fill="none" stroke="#fcdd09" stroke-width=".6"')}`,
  eg: () => `<rect width="30" height="20" fill="#000"/><rect width="30" height="13.33" fill="#fff"/><rect width="30" height="6.67" fill="#ce1126"/><path d="M13.6 8.2h2.8l.5 1.6-1.9 1.6-1.9-1.6z" fill="#c09300"/>`,
};
const flag = c => `<svg viewBox="0 0 30 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${FLAGS[c] ? FLAGS[c]() : ''}</svg>`;

/* ---------------- carte de l'Afrique ---------------- */
const AFRICA = [[-5.8, 35.8], [-2, 35.1], [3, 36.8], [10.2, 37.2], [11, 36.9], [10.1, 34.5], [10.9, 33.6], [13.2, 32.9], [15.4, 31.6], [19, 30.3], [20, 31.2], [20.1, 32.1], [23, 32.6], [25, 31.6], [29.9, 31.2], [32.3, 31.3],
  [32.6, 29.9], [33.6, 28], [35.2, 24.2], [37.2, 19.6], [38.6, 17.8], [39.5, 15.6], [42.7, 13], [43.4, 12], [44.5, 10.4], [47, 11.1], [51.3, 11.8], [51.1, 10.4], [49.9, 6.9], [47.9, 4.4], [45.3, 2], [42.5, -0.4],
  [40.9, -2.1], [39.7, -4], [39.3, -6.8], [39.5, -9.5], [40.5, -10.5], [40.7, -15], [37, -17.9], [34.8, -19.8], [35.5, -23.9], [32.6, -26], [31.3, -29.4], [27.9, -33], [25.6, -34], [20, -34.8], [18.4, -34.2],
  [17.9, -32.1], [15.2, -26.6], [14.5, -22.9], [11.9, -17.2], [12.1, -15.2], [13.5, -12.3], [13.2, -8.8], [12.3, -6], [11.8, -4.8], [9.4, 0.4], [9.7, 4], [8.3, 4.6], [6, 4.3], [3.4, 6.4], [1.2, 6.1], [-0.2, 5.5], [-2, 4.7],
  [-4, 5.3], [-7.6, 4.4], [-10.8, 6.3], [-13.2, 8.5], [-13.7, 9.5], [-15.6, 11.9], [-16.8, 13.3], [-17.5, 14.7], [-16.5, 16.1], [-16, 18.1], [-17, 20.9], [-15, 23.5], [-12.9, 27.9], [-9.6, 30.4], [-9.8, 31.5], [-7.6, 33.6], [-6.8, 34]];
const MADA = [[49.3, -12], [50.4, -15.5], [49.5, -17.5], [47.1, -24.9], [45.2, -25.5], [43.7, -23.5], [44, -20], [44.4, -16.2], [46.3, -15.7], [48, -13.5]];
const proj = ([lon, lat]) => [((lon + 20) * 5.2).toFixed(1), ((39 - lat) * 5.2).toFixed(1)];
const polyPath = pts => 'M' + pts.map(p => proj(p).join(' ')).join('L') + 'Z';

/* ---------------- médaillons et icônes ---------------- */
const KEY_GLYPHS = [
  // 1 Dakar : baobab
  '<path d="M-5 16C-4 6-6 0-5-6H5C6 0 4 6 5 16Z"/><path d="M-5-4C-12-9-16-10-20-15M0-6C-1-12 1-16 0-20M5-4C12-9 16-10 20-15" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="-20" cy="-16" r="4"/><circle cx="0" cy="-21" r="4"/><circle cx="20" cy="-16" r="4"/>',
  // 2 Bamako : caïman
  '<path d="M-22 2Q-10-6 6-4Q16-8 24-2Q16 2 8 3Q-6 8-22 2Z"/><path d="M-12-3l2-5 2 5M-2-4l2-5 2 5M8-5l2-4 2 4"/><path d="M-8 5l-4 7M6 4l2 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  // 3 Yamoussoukro : éléphant
  '<path d="M-18 12V-2Q-18-14-4-14Q8-14 12-6Q18-4 18 4L22 14H17L13 6V12H8V4H-8V12H-13V4Z"/><path d="M14-4Q22-2 22 8" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="6" cy="-8" r="1.6" fill="#7a4a1a"/>',
  // 4 Accra : étoile
  star5(0, 0, 20, 'currentColor'),
  // 5 Kinshasa : léopard (tête)
  '<path d="M-16-8Q-16-18-6-18L0-14L6-18Q16-18 16-8Q18 8 0 18Q-18 8-16-8Z"/><g fill="#7a4a1a"><circle cx="-6" cy="-4" r="2"/><circle cx="6" cy="-4" r="2"/><path d="M-3 6h6l-3 4z"/><circle cx="-10" cy="6" r="1.4"/><circle cx="10" cy="6" r="1.4"/><circle cx="-2" cy="-12" r="1.4"/><circle cx="4" cy="-12" r="1.4"/></g>',
  // 6 Addis-Abeba : branche de caféier
  '<path d="M-16 18Q0 0 14-18" stroke="currentColor" stroke-width="3" fill="none"/><ellipse cx="-6" cy="2" rx="6" ry="9" transform="rotate(-40 -6 2)"/><ellipse cx="6" cy="-10" rx="6" ry="9" transform="rotate(-40 6 -10)"/><circle cx="-12" cy="-6" r="4"/><circle cx="10" cy="4" r="4"/><circle cx="2" cy="12" r="3.6"/>',
  // 7 Le Caire : pyramide et soleil
  '<path d="M-20 16L0-14L20 16Z"/><path d="M0-14L20 16H6Z" fill="#7a4a1a" opacity=".35"/><circle cx="12" cy="-16" r="5"/>',
];
function medallion(n, size = 120, lit = true) {
  const k = uid('m');
  return `<svg viewBox="-60 -60 120 120" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs>
    <radialGradient id="${k}" cx=".35" cy=".3"><stop offset="0" stop-color="${lit ? '#ffe7a0' : '#6a6070'}"/><stop offset=".55" stop-color="${lit ? '#c8862a' : '#4a4252'}"/><stop offset="1" stop-color="${lit ? '#7a4a14' : '#2a2430'}"/></radialGradient></defs>
    <circle r="54" fill="url(#${k})"/><circle r="46" fill="none" stroke="${lit ? '#7a4a14' : '#1e1a24'}" stroke-width="3"/>
    ${Array.from({ length: 28 }, (_, i) => { const a = i * Math.PI / 14; return `<circle cx="${(Math.cos(a) * 50).toFixed(1)}" cy="${(Math.sin(a) * 50).toFixed(1)}" r="1.6" fill="${lit ? '#ffe7a0' : '#5a5260'}"/>`; }).join('')}
    <g transform="scale(1.35)" fill="${lit ? '#5a3208' : '#2a2430'}" color="${lit ? '#5a3208' : '#2a2430'}">${KEY_GLYPHS[n - 1] || ''}</g>
    <text y="44" text-anchor="middle" font-family="Lilita One,sans-serif" font-size="11" fill="${lit ? '#5a3208' : '#2a2430'}">${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n - 1]}</text></svg>`;
}

/* Icônes des indices (carnet, cartes) — viewBox 64×64 */
const CLUE_ART = {
  photo: '<rect x="8" y="12" width="48" height="40" rx="3" fill="#efe6d2"/><rect x="12" y="16" width="40" height="28" fill="#6a5a4a"/><g fill="#2a1e14"><circle cx="18" cy="28" r="3"/><circle cx="26" cy="27" r="3"/><circle cx="34" cy="28" r="3"/><circle cx="42" cy="27" r="3"/></g><g fill="#2a1e14"><rect x="15" y="31" width="6" height="13"/><rect x="23" y="30" width="6" height="14"/><rect x="31" y="31" width="6" height="13"/><rect x="39" y="30" width="6" height="14"/></g><path d="M46 16L52 16 52 44 44 44Z" fill="#efe6d2"/><path d="M46 16L43 24 48 30 44 44" stroke="#a89a80" fill="none" stroke-width="1.5"/>',
  carnet: '<rect x="14" y="8" width="36" height="48" rx="3" fill="#7a4a24"/><rect x="14" y="8" width="7" height="48" fill="#5a3418"/><path d="M26 20h18M26 27h18M26 34h12" stroke="#f2d6a0" stroke-width="2"/><circle cx="44" cy="46" r="4" fill="#f2b33d"/>',
  cassette: '<rect x="8" y="16" width="48" height="32" rx="4" fill="#2a2a32"/><rect x="14" y="21" width="36" height="14" rx="2" fill="#f4ecd8"/><circle cx="23" cy="28" r="4.5" fill="#2a2a32"/><circle cx="41" cy="28" r="4.5" fill="#2a2a32"/><path d="M20 42h24l-3-5H23Z" fill="#555"/><text x="32" y="25" text-anchor="middle" font-size="5" font-family="sans-serif" font-weight="900" fill="#c8553d">AWA</text>',
  lettre: '<path d="M10 12h40l4 6v34H10Z" fill="#f4ecd8"/><path d="M16 22h28M16 29h30M16 36h22" stroke="#7a6a5a" stroke-width="2"/><text x="42" y="48" font-family="serif" font-style="italic" font-size="10" fill="#3a2a8a">— I.</text>',
  lunettes: '<g fill="rgba(180,210,255,.3)" stroke="#2a1a14" stroke-width="3"><circle cx="20" cy="34" r="10"/><circle cx="44" cy="34" r="10"/></g><path d="M30 33q2-3 4 0M10 32L4 28M54 32l6-4" stroke="#2a1a14" stroke-width="3" fill="none"/><path d="M38 28l10 12" stroke="#fff" stroke-width="1.5"/>',
  billet: '<rect x="6" y="18" width="52" height="28" rx="3" fill="#e8f0f8"/><rect x="6" y="18" width="14" height="28" rx="3" fill="#2f6f9e"/><path d="M26 26h24M26 32h18M26 38h22" stroke="#3a4a5a" stroke-width="2"/><path d="M10 30l6 2-6 2z" fill="#fff"/>',
  telephone: '<rect x="18" y="6" width="28" height="52" rx="5" fill="#1a1a22"/><rect x="21" y="12" width="22" height="38" fill="#3a6a9a"/><circle cx="32" cy="54" r="2" fill="#555"/>',
  puce: '<rect x="16" y="16" width="32" height="32" rx="3" fill="#b0262a"/><g stroke="#c9a24a" stroke-width="2.5">' + [0, 1, 2, 3].map(i => `<path d="M${22 + i * 7} 10v6M${22 + i * 7} 48v6M10 ${22 + i * 7}h6M48 ${22 + i * 7}h6"/>`).join('') + '</g><text x="32" y="36" text-anchor="middle" font-size="9" font-weight="900" font-family="sans-serif" fill="#fff">IS</text>',
  bague: '<ellipse cx="32" cy="40" rx="16" ry="10" fill="none" stroke="#c9a24a" stroke-width="5"/><rect x="22" y="14" width="20" height="20" rx="4" fill="#5a5663"/><path d="M27 30v-9M31 30v-12M35 30v-11M38 30v-7" stroke="#c9c6d0" stroke-width="2" stroke-linecap="round"/>',
  kente: '<rect x="12" y="8" width="40" height="48" fill="#f2b33d"/><rect x="12" y="14" width="40" height="6" fill="#1d7a3e"/><rect x="12" y="30" width="40" height="5" fill="#c22d23"/><rect x="12" y="44" width="40" height="5" fill="#111"/><rect x="28" y="8" width="8" height="48" fill="#1d7a3e" opacity=".5"/>',
  carte: '<path d="M8 14l16-4 16 4 16-4v40l-16 4-16-4-16 4Z" fill="#e8d6a8"/><path d="M24 10v40M40 14v40" stroke="#b89a68" stroke-width="1.5"/><path d="M14 40q10-14 18-6t14-14" stroke="#c8553d" stroke-width="2.5" fill="none" stroke-dasharray="3 3"/><circle cx="46" cy="20" r="3" fill="#c8553d"/>',
  guitare: '<ellipse cx="26" cy="42" rx="14" ry="13" fill="#b5602a"/><ellipse cx="34" cy="32" rx="10" ry="9" fill="#b5602a"/><circle cx="28" cy="38" r="4" fill="#2a1a10"/><path d="M34 32L54 10" stroke="#3a2414" stroke-width="5"/><path d="M50 8l6 4" stroke="#3a2414" stroke-width="6"/>',
  sms: '<rect x="8" y="12" width="48" height="34" rx="8" fill="#4a1520"/><path d="M18 46l-4 10 12-10" fill="#4a1520"/><path d="M18 24h28M18 32h20" stroke="#ff9a9a" stroke-width="3" stroke-linecap="round"/>',
  croquis: '<rect x="10" y="8" width="44" height="48" fill="#f4ecd8"/><path d="M18 18l8 8 8-8 8 8M18 34l8 8 8-8 8 8" stroke="#2a1a14" stroke-width="2" fill="none"/><circle cx="32" cy="30" r="3" fill="#c8553d"/>',
  plume: '<path d="M48 8C30 12 18 30 16 52L20 52C24 36 32 24 48 8Z" fill="#f4ecd8"/><path d="M48 8L18 50" stroke="#a89a80" stroke-width="1.5"/><path d="M14 56l6-6" stroke="#2a1a14" stroke-width="3"/>',
};
function clueArt(kind) { return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${CLUE_ART[kind] || CLUE_ART.carnet}</svg>`; }

/* Photo des gardiens (1987), qui revient dans plusieurs indices. variant: 'dechiree' | 'complete' */
function guardiansPhoto(variant = 'dechiree') {
  const people = [['#5b3823', '#28396f', 'kufi'], ['#8a5634', '#5b3a1f', 'tete'], ['#4f311f', '#c88a2a', 'nu'], ['#6a4129', '#33333c', 'nu'], ['#4b2c1a', '#2f8452', 'tete'], ['#4a2d1c', '#7a4fa0', 'nu'], ['#8c5a3a', '#f6f2e8', 'tete'], ['#b07a52', '#1f7a7a', 'voile']];
  let s = `<rect width="240" height="170" fill="#efe6d2"/><rect x="8" y="8" width="224" height="138" fill="#8a7a62"/><rect x="8" y="8" width="224" height="60" fill="#a8977a"/>
    <path d="M70 68V20Q120-4 170 20V68Z" fill="#6a5a46"/><path d="M96 68V36Q120 22 144 36V68Z" fill="#3a2e22"/>`;
  people.forEach(([sk, cl, hat], i) => {
    const x = 26 + i * 27, y = 92;
    s += `<rect x="${x - 10}" y="${y + 10}" width="20" height="44" rx="6" fill="${cl}"/><circle cx="${x}" cy="${y}" r="9" fill="${sk}"/>`;
    if (hat === 'kufi') s += `<path d="M${x - 8} ${y - 4}Q${x} ${y - 16} ${x + 8} ${y - 4}Z" fill="#f4efe6"/>`;
    if (hat === 'tete') s += `<path d="M${x - 9} ${y - 2}Q${x} ${y - 16} ${x + 9} ${y - 2}Z" fill="#1a110d"/>`;
    if (hat === 'voile') s += `<path d="M${x - 11} ${y + 10}Q${x - 12} ${y - 14} ${x} ${y - 12}Q${x + 12} ${y - 14} ${x + 11} ${y + 10}" fill="#1f7a7a"/><circle cx="${x}" cy="${y}" r="7" fill="${sk}"/>`;
    if (i === 3) s += `<rect x="${x + 6}" y="${y + 30}" width="5" height="5" rx="1" fill="#9a96a0"/>`;
  });
  s += `<text x="120" y="162" text-anchor="middle" font-family="serif" font-style="italic" font-size="11" fill="#5a4a3a">Les Sept — Le Caire, 1987</text>`;
  if (variant === 'dechiree') s += `<path d="M98 0L104 30 94 60 106 92 96 130 102 170H138L132 130 142 92 130 60 140 30 134 0Z" fill="#2a1e2a"/>`;
  else s += `<circle cx="107" cy="124" r="13" fill="none" stroke="#e0412f" stroke-width="2.5"/>`;
  return `<svg viewBox="0 0 240 170" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

/** Photo menaçante envoyée par la Main grise : Papi attaché sur une chaise */
function hostagePhoto() {
  return `<svg viewBox="0 0 240 170" xmlns="http://www.w3.org/2000/svg"><rect width="240" height="170" fill="#1a1620"/><circle cx="120" cy="20" r="70" fill="#ffe8a8" opacity=".12"/>
    <path d="M120 0V30" stroke="#555"/><path d="M110 30h20l-4 8h-12z" fill="#ffd27a"/>
    <rect x="96" y="96" width="48" height="60" fill="#3a2a1e"/><rect x="100" y="80" width="40" height="44" rx="8" fill="#28396f"/>
    <circle cx="120" cy="68" r="15" fill="#5b3823"/><path d="M106 62Q120 46 134 62Z" fill="#f4efe6"/><path d="M108 74Q120 92 132 74Q126 84 120 84Q114 84 108 74Z" fill="#ece8e1"/>
    <path d="M98 100h44M98 110h44" stroke="#c9b48a" stroke-width="3"/>
    <text x="120" y="164" text-anchor="middle" font-family="monospace" font-size="9" fill="#ff6a5a">72:00:00</text></svg>`;
}
