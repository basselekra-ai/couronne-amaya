'use strict';
/* Portraits des personnages, en SVG généré. Chaque personnage a une fiche (peau, coiffure, tenue,
   accessoires) et chaque réplique choisit une expression : neutre, sourire, inquiet, colere,
   surpris, triste, determine, malin, peur. */

let _uid = 0;
const uid = p => p + (++_uid);

const CAST = {
  awa:     { name: 'Awa', skin: '#7b4a2d', shade: '#5f3620', lip: '#5a2a1e', hair: { type: 'locs', c: '#1c1210', beads: '#f2b33d' }, outfit: 'jacket', acc: ['hoops'], fem: true },
  seydou:  { name: 'Papi Seydou', skin: '#5b3823', shade: '#442816', lip: '#3e1f14', hair: { type: 'kufi', c: '#e9e4dc' }, beard: 'white', outfit: 'boubou', old: true },
  ibrahima:{ name: 'Tonton Ibrahima', skin: '#6a4129', shade: '#52301c', lip: '#45231a', hair: { type: 'fade', c: '#7d7873' }, beard: 'goatee', outfit: 'suit', acc: ['glasses'], old: true },
  fanta:   { name: 'Fanta', skin: '#8a5634', shade: '#6d4126', lip: '#5e2c22', hair: { type: 'braids', c: '#18100d' }, outfit: 'bogolan', acc: ['cowries'], fem: true },
  akissi:  { name: 'Akissi', skin: '#6e4127', shade: '#552f1a', lip: '#572a20', hair: { type: 'gele', c: '#1a110d' }, outfit: 'wax', acc: ['studs'], fem: true },
  nanan:   { name: 'Nanan Kouamé', skin: '#4f311f', shade: '#3a2214', lip: '#36190f', hair: { type: 'bald', c: '#cfc9c0' }, beard: 'whiteShort', outfit: 'pagne', old: true },
  kofi:    { name: 'Kofi', skin: '#4b2c1a', shade: '#371e10', lip: '#3a1b11', hair: { type: 'hightop', c: '#120b08' }, outfit: 'hoodie', acc: ['headphones'] },
  didi:    { name: 'Ya Didi', skin: '#5a3521', shade: '#432616', lip: '#3f1e14', hair: { type: 'hat', c: '#15100d' }, outfit: 'sape', acc: ['shades'], beard: 'mustache' },
  lukusa:  { name: 'Papa Lukusa', skin: '#4a2d1c', shade: '#352012', lip: '#331a10', hair: { type: 'shortgrey', c: '#a9a29a' }, outfit: 'shirt', beard: 'whiteShort', old: true },
  makeda:  { name: 'Dr Makeda', skin: '#8c5a3a', shade: '#6e4228', lip: '#5c2d22', hair: { type: 'afro', c: '#1b1310' }, outfit: 'habesha', acc: ['glassesRound'], fem: true },
  nour:    { name: 'Nour', skin: '#b07a52', shade: '#92603d', lip: '#7a3b30', hair: { type: 'hijab', c: '#1f7a7a' }, outfit: 'blouse', fem: true },
  wanjiru: { name: 'Wanjiru', skin: '#4f2f1c', shade: '#3a2112', lip: '#3e1c14', hair: { type: 'short', c: '#120a06' }, outfit: 'ranger', acc: ['studs'], fem: true },
  ange:    { name: 'Ange', skin: '#6a4027', shade: '#512f1b', lip: '#55271e', hair: { type: 'braids', c: '#140c08' }, outfit: 'cycliste', fem: true },
  hery:    { name: 'Hery', skin: '#8f5f3e', shade: '#734a2d', lip: '#5e2f24', hair: { type: 'hat', c: '#1a120c', hat: '#e3c27a', band: '#c84b2a' }, outfit: 'lamba' },
  nzinga:  { name: 'Nzinga', skin: '#5b3822', shade: '#452815', lip: '#4a2219', hair: { type: 'afro', c: '#120a07' }, outfit: 'wax', wax: ['#c22d23', '#111', '#f2b33d', '#f4ecd8'], acc: ['hoops'], fem: true },
  ngono:   { name: 'Mama Ngono', skin: '#4f301c', shade: '#3a2112', lip: '#3b1b12', hair: { type: 'gele', c: '#120a07' }, outfit: 'wax', wax: ['#2f9e62', '#c22d23', '#ffd23f', '#1d4b9b'], acc: ['studs'], fem: true, old: true },
  bekolo:  { name: 'M. Bekolo', skin: '#6a4129', shade: '#52301c', lip: '#45231a', hair: { type: 'fade', c: '#1a120c' }, beard: 'mustache', outfit: 'suit', suit: ['#6a4a2e', '#55391f', '#e0b84a'] },
  tunde:   { name: 'Tunde', skin: '#4e2e1b', shade: '#3a2012', lip: '#3a1b11', hair: { type: 'fila', c: '#8a1f2e' }, outfit: 'agbada', acc: ['glassesRound'], beard: 'mustache' },
  aminata: { name: 'Aminata', skin: '#5e3923', shade: '#472915', lip: '#4c241a', hair: { type: 'headband', c: '#140c08' }, outfit: 'dandani', acc: ['hoops'], fem: true },
  salma:   { name: 'Inspectrice Salma', skin: '#b98a62', shade: '#9a6d48', lip: '#7e3e33', hair: { type: 'bun', c: '#2a1a12' }, outfit: 'uniform', fem: true },
  agent:   { name: 'Homme gris', skin: '#5a3a26', shade: '#432a1a', lip: '#3a1d12', hair: { type: 'cap', c: '#2b2c33' }, outfit: 'agent', acc: ['gaiter'] },
  masque:  { name: 'Le Collectionneur', skin: '#4a3a30', shade: '#2f241d', lip: '#2a1a12', hair: { type: 'hood', c: '#17141c' }, outfit: 'cloak', acc: ['mask'] },
};

/* Sourcils : décalage (coin intérieur, coin extérieur) par rapport aux yeux */
const BROWS = {
  neutre: [-15, -16], sourire: [-17, -16], inquiet: [-21, -13], colere: [-9, -18], surpris: [-23, -22],
  triste: [-20, -12], determine: [-11, -16], malin: [-12, -15], peur: [-23, -14],
};

function portrait(id, mood = 'neutre', look = 0) {
  const c = CAST[id];
  if (!c) return '';
  const k = uid('p');
  const H = c.hair || {};
  const ey = 108, exL = 80, exR = 120;
  const W = c.wax || ['#e9761d', '#1d4b9b', '#ffd23f', '#2c8a4a'];
  let back = '', body = '', front = '', face = '', extra = '', defs = '';

  /* ----- motifs de tissu ----- */
  defs += `
  <pattern id="${k}bg" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#5b3a1f"/>
    <path d="M3 4l5 5M8 4l-5 5" stroke="#efe0c2" stroke-width="2"/><circle cx="19" cy="7" r="2.2" fill="#efe0c2"/>
    <path d="M0 18l4-4 4 4 4-4 4 4 4-4 4 4 2-2" fill="none" stroke="#efe0c2" stroke-width="1.8"/></pattern>
  <pattern id="${k}wx" width="34" height="34" patternUnits="userSpaceOnUse"><rect width="34" height="34" fill="${W[0]}"/>
    <circle cx="10" cy="10" r="7.5" fill="${W[1]}"/><circle cx="10" cy="10" r="3.5" fill="${W[2]}"/>
    <circle cx="27" cy="27" r="6" fill="none" stroke="${W[1]}" stroke-width="3"/><path d="M24 6c4 2 6 6 5 10-4-1-6-5-5-10z" fill="${W[3]}"/></pattern>
  <pattern id="${k}fd" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#f4ecd8"/>
    <rect width="4" height="18" fill="#1d4b9b"/><rect x="7" width="2" height="18" fill="#c22d23"/><rect x="12" width="4" height="18" fill="#1a1410"/><rect y="8" width="18" height="2" fill="#c22d23" opacity=".5"/></pattern>
  <pattern id="${k}kt" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#f2b33d"/>
    <rect width="16" height="4" fill="#1d7a3e"/><rect y="8" width="8" height="4" fill="#c22d23"/><rect x="8" y="8" width="8" height="4" fill="#111"/><rect x="6" width="4" height="16" fill="#1d7a3e" opacity=".55"/></pattern>
  <pattern id="${k}pg" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#e8dcc3"/>
    <rect width="22" height="5" fill="#1f3f7a"/><rect y="11" width="22" height="2.5" fill="#c84b2a"/><path d="M11 5v6" stroke="#1f3f7a" stroke-width="2.5"/></pattern>
  <clipPath id="${k}fc"><path d="${facePath(c)}"/></clipPath>
  <linearGradient id="${k}mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9d6de"/><stop offset=".6" stop-color="#8e8a97"/><stop offset="1" stop-color="#5a5663"/></linearGradient>`;

  /* ----- cheveux arrière ----- */
  switch (H.type) {
    case 'locs': {
      for (let i = -6; i <= 6; i++) {
        const x0 = 100 + i * 8.5, x1 = 100 + i * 12.5 + (i % 2 ? 3 : -2), y1 = 196 + Math.abs(i) * 2 - (i % 3) * 5;
        back += `<path d="M${x0} 62 C${x0 + i} 120 ${x1 - i * 2} 160 ${x1} ${y1}" stroke="${H.c}" stroke-width="9.5" stroke-linecap="round" fill="none"/>`;
        if (i % 2 === 0) back += `<circle cx="${x1}" cy="${y1 - 8}" r="4" fill="${H.beads}"/>`;
      }
      break;
    }
    case 'braids':
      for (let i = -5; i <= 5; i++) {
        const x0 = 100 + i * 9, x1 = 100 + i * 12, y1 = 214 + (i % 2) * 6;
        back += `<path d="M${x0} 66 C${x0} 130 ${x1} 160 ${x1} ${y1}" stroke="${H.c}" stroke-width="6.5" stroke-linecap="round" fill="none"/>`;
        back += `<path d="M${x0} 66 C${x0} 130 ${x1} 160 ${x1} ${y1}" stroke="#3a2a22" stroke-width="1.4" stroke-dasharray="3 5" fill="none"/>`;
        if (i % 2) back += `<ellipse cx="${x1}" cy="${y1}" rx="3" ry="4.2" fill="#f4ecd8"/>`;
      }
      break;
    case 'afro': back += `<circle cx="100" cy="86" r="62" fill="${H.c}"/>`; break;
    case 'hijab': back += `<path d="M24 240C26 186 40 160 52 132C42 66 68 30 100 30C132 30 158 66 148 132C160 160 174 186 176 240Z" fill="${H.c}"/>
      <path d="M52 132C60 170 80 186 100 188C120 186 140 170 148 132" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="3"/>`; break;
    case 'hood': back += `<path d="M14 240C16 170 30 120 44 92C52 40 76 18 100 18C124 18 148 40 156 92C170 120 184 170 186 240Z" fill="${H.c}"/>
      <path d="M48 120C50 70 72 40 100 40C128 40 150 70 152 120C150 150 130 168 100 170C70 168 50 150 48 120Z" fill="#050407"/>`; break;
  }

  /* ----- tenue ----- */
  const shoulders = 'M14 240C16 204 44 186 78 180L122 180C156 186 184 204 186 240Z';
  switch (c.outfit) {
    case 'jacket':
      body = `<path d="${shoulders}" fill="#d9941f"/><path d="M14 240C16 210 34 194 60 186L70 240Z" fill="#b8770f" opacity=".6"/>
        <path d="M80 180L100 222L120 180Z" fill="#2b1b3d"/><path d="M78 180L92 200L82 214L66 186Z" fill="#f0b24a"/><path d="M122 180L108 200L118 214L134 186Z" fill="#f0b24a"/>
        <path d="M100 222V240" stroke="#8a5a0c" stroke-width="2.5"/><path d="M86 184Q100 198 114 184" fill="none" stroke="#f4ecd8" stroke-width="2"/><ellipse cx="100" cy="196" rx="3.5" ry="5" fill="#f4ecd8"/>`;
      break;
    case 'boubou':
      body = `<path d="${shoulders}" fill="#28396f"/><path d="M78 180Q100 214 122 180" fill="#1d2b58"/>
        <path d="M76 182Q100 222 124 182" fill="none" stroke="#f2b33d" stroke-width="3"/><path d="M80 188Q100 226 120 188" fill="none" stroke="#f2b33d" stroke-width="1.6" stroke-dasharray="3 3"/>
        <path d="M100 214V240" stroke="#f2b33d" stroke-width="2.4" stroke-dasharray="5 4"/>`;
      break;
    case 'suit':
      body = `<path d="${shoulders}" fill="${c.suit?.[0] || '#33333c'}"/><path d="M82 180L100 230L118 180Z" fill="#f4f1ea"/>
        <path d="M95 186L105 186L108 236L100 240L92 236Z" fill="${c.suit ? c.suit[2] : `url(#${k}kt)`}"/><path d="M94 180L106 180L104 190L96 190Z" fill="${c.suit?.[2] || '#c22d23'}"/>
        <path d="M80 180L98 232L86 240L64 190Z" fill="${c.suit?.[1] || '#26262e'}"/><path d="M120 180L102 232L114 240L136 190Z" fill="${c.suit?.[1] || '#26262e'}"/>
        <path d="M138 206L152 202L154 210L140 213Z" fill="#f2b33d"/>`;
      break;
    case 'bogolan':
      body = `<path d="${shoulders}" fill="url(#${k}bg)"/><path d="M80 180Q100 204 120 180" fill="${c.skin}"/><path d="M80 180Q100 204 120 180" fill="none" stroke="#efe0c2" stroke-width="3"/>`;
      break;
    case 'wax':
      body = `<path d="${shoulders}" fill="url(#${k}wx)"/><path d="M82 180Q100 206 118 180" fill="${c.skin}"/><path d="M82 180Q100 206 118 180" fill="none" stroke="#1d4b9b" stroke-width="3"/>`;
      break;
    case 'pagne':
      body = `<path d="${shoulders}" fill="url(#${k}pg)"/><path d="M14 240C16 204 44 186 78 180L132 240Z" fill="url(#${k}kt)" opacity=".9"/>`;
      break;
    case 'hoodie':
      body = `<path d="M60 186C50 172 66 160 100 160C134 160 150 172 140 186Z" fill="#256b42"/><path d="${shoulders}" fill="#2f8452"/>
        <path d="M86 182L84 214M114 182L116 214" stroke="#f4ecd8" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="40" y="222" width="120" height="10" fill="url(#${k}kt)"/>`;
      break;
    case 'sape':
      body = `<path d="${shoulders}" fill="#e2589a"/><path d="M84 180L100 226L116 180Z" fill="#fff"/>
        <path d="M88 186L100 192L112 186L112 198L100 192L88 198Z" fill="#6b2fa0"/>
        <path d="M82 180L98 228L84 240L62 190Z" fill="#c43c80"/><path d="M118 180L102 228L116 240L138 190Z" fill="#c43c80"/>
        <circle cx="134" cy="204" r="6" fill="#ffd23f"/><circle cx="134" cy="204" r="2.5" fill="#e2589a"/>
        <path d="M60 228Q80 236 96 226" fill="none" stroke="#f2b33d" stroke-width="2.2"/>`;
      break;
    case 'shirt':
      body = `<path d="${shoulders}" fill="#7a4fa0"/><path d="M84 180L100 204L116 180Z" fill="${c.skin}"/>
        <path d="M84 180L94 210L100 204ZM116 180L106 210L100 204Z" fill="#9b72bf"/><path d="M30 214Q100 196 170 214" fill="none" stroke="#f2b33d" stroke-width="2" stroke-dasharray="2 5"/>`;
      break;
    case 'habesha':
      body = `<path d="${shoulders}" fill="#f6f2e8"/><path d="M80 180Q100 210 120 180" fill="${c.skin}"/>
        <path d="M80 180Q100 210 120 180" fill="none" stroke="#2a8f4b" stroke-width="3"/><path d="M83 184Q100 214 117 184" fill="none" stroke="#f2b33d" stroke-width="2.4"/>
        <path d="M86 188Q100 218 114 188" fill="none" stroke="#c22d23" stroke-width="2"/><path d="M100 212V240" stroke="#2a8f4b" stroke-width="3"/>
        <path d="M14 240C18 200 40 186 66 182L58 240Z" fill="#fffdf6" opacity=".95"/><path d="M66 182L58 240" stroke="#2a8f4b" stroke-width="3"/>`;
      break;
    case 'ranger':
      body = `<path d="${shoulders}" fill="#7a7a4a"/><path d="M82 180L100 206L118 180L112 172L100 190L88 172Z" fill="#8e8e5a"/>
        <rect x="46" y="204" width="28" height="22" rx="3" fill="#6a6a3e"/><rect x="126" y="204" width="28" height="22" rx="3" fill="#6a6a3e"/>
        <path d="M100 206V240" stroke="#5a5a34" stroke-width="2"/><circle cx="140" cy="198" r="5" fill="#c9a24a"/>`;
      break;
    case 'cycliste':
      body = `<path d="${shoulders}" fill="#2a8fd0"/><path d="M14 240C16 216 26 204 40 196L160 196C174 204 184 216 186 240Z" fill="#ffd23f"/>
        <path d="M14 240C16 226 22 218 30 212L170 212C178 218 184 226 186 240Z" fill="#2f9e62"/><path d="M86 180Q100 196 114 180" fill="${c.skin}"/><path d="M86 180Q100 196 114 180" fill="none" stroke="#fff" stroke-width="3"/>`;
      break;
    case 'lamba':
      body = `<path d="${shoulders}" fill="#e9e2d0"/><path d="M84 180L100 202L116 180Z" fill="${c.skin}"/>
        <path d="M30 210C50 190 80 186 100 200C120 186 150 190 170 210L176 240H140C130 214 70 214 60 240H24Z" fill="#fbf7ee"/>
        <path d="M34 214C54 196 80 192 100 206C120 192 146 196 166 214" stroke="#c84b2a" stroke-width="2.5" fill="none"/>`;
      break;
    case 'agbada':
      body = `<path d="M6 240C10 196 40 178 100 176C160 178 190 196 194 240Z" fill="#7fb3d5"/><path d="M76 180Q100 216 124 180" fill="#5f93b5"/>
        <path d="M74 182Q100 226 126 182M80 196Q100 232 120 196" fill="none" stroke="#f4ecd8" stroke-width="2.5"/><path d="M100 220v20" stroke="#f4ecd8" stroke-width="2.5" stroke-dasharray="3 3"/>`;
      break;
    case 'dandani':
      body = `<path d="${shoulders}" fill="url(#${k}fd)"/><path d="M84 180Q100 200 116 180" fill="${c.skin}"/><path d="M84 180Q100 200 116 180" fill="none" stroke="#1a1410" stroke-width="3"/>`;
      break;
    case 'uniform':
      body = `<path d="${shoulders}" fill="#1f2a4a"/><path d="M82 180L100 204L118 180L112 172L100 192L88 172Z" fill="#2c3a62"/>
        <path d="M128 200l8-4 8 4v8l-8 6-8-6z" fill="#c9a24a"/><path d="M50 196L76 190M150 196L124 190" stroke="#c9a24a" stroke-width="3"/>`;
      break;
    case 'blouse':
      body = `<path d="${shoulders}" fill="#e8d7b9"/>`;
      break;
    case 'agent':
      body = `<path d="${shoulders}" fill="#2c2d34"/><path d="M76 180L100 196L124 180L118 172L82 172Z" fill="#3a3b44"/><path d="M100 196V240" stroke="#1a1b20" stroke-width="2"/>`;
      break;
    case 'cloak':
      body = `<path d="M8 240C12 196 40 176 100 176C160 176 188 196 192 240Z" fill="#100e14"/>
        <circle cx="100" cy="200" r="9" fill="url(#${k}mk)"/><path d="M96 204v-8M99 203v-10M102 203v-9M105 204v-7" stroke="#2a2730" stroke-width="1.8" stroke-linecap="round"/>`;
      break;
  }

  /* ----- cou, oreilles, visage ----- */
  const neck = H.type === 'hijab' ? '' : `<path d="M82 140L82 186Q100 196 118 186L118 140Z" fill="${c.skin}"/><path d="M82 160Q100 178 118 160L118 172Q100 186 82 172Z" fill="${c.shade}" opacity=".7"/>`;
  const ears = (H.type === 'hijab' || H.type === 'hood') ? '' :
    `<ellipse cx="53" cy="112" rx="8" ry="12.5" fill="${c.skin}"/><ellipse cx="147" cy="112" rx="8" ry="12.5" fill="${c.skin}"/>
     <path d="M51 106q4 6 0 12M149 106q-4 6 0 12" stroke="${c.shade}" stroke-width="2" fill="none"/>`;
  face += `<path d="${facePath(c)}" fill="${c.skin}"/>`;
  face += `<g clip-path="url(#${k}fc)"><ellipse cx="146" cy="118" rx="26" ry="62" fill="${c.shade}" opacity=".45"/>
    <ellipse cx="100" cy="176" rx="50" ry="14" fill="${c.shade}" opacity=".5"/>
</g>`;
  if (!c.acc?.includes('mask')) {
    face += eyes(c, mood, exL, exR, ey, look, k);
    face += brows(c, mood, exL, exR, ey);
    face += `<path d="M95 115Q93 125 92 129" stroke="${c.shade}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M89 128Q92 135 100 134Q108 135 111 128" stroke="${c.shade}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="94" cy="131" rx="2.4" ry="1.6" fill="${c.shade}"/><ellipse cx="106" cy="131" rx="2.4" ry="1.6" fill="${c.shade}"/>`;
    if (c.fem) face += `<ellipse cx="72" cy="128" rx="9" ry="5" fill="#d0603f" opacity=".16"/><ellipse cx="128" cy="128" rx="9" ry="5" fill="#d0603f" opacity=".16"/>`;
    if (c.old) face += `<path d="M84 80q16-4 32 0M88 86q12-3 24 0" stroke="${c.shade}" stroke-width="1.6" fill="none" opacity=".7"/>
      <path d="M84 134q-4 8 0 16M116 134q4 8 0 16" stroke="${c.shade}" stroke-width="1.8" fill="none" opacity=".6"/>`;
  }

  /* ----- barbe ----- */
  let beard = '';
  switch (c.beard) {
    case 'white': beard = `<path d="M54 116C56 156 76 192 100 196C124 192 144 156 146 116C140 136 128 144 118 142C110 138 90 138 82 142C72 144 60 136 54 116Z" fill="#ece8e1"/>
      <path d="M84 140Q100 132 116 140Q108 146 100 145Q92 146 84 140Z" fill="#f7f4ef"/><path d="M80 160q4 10 2 18M120 160q-4 10-2 18M100 168v20" stroke="#cfc9c0" stroke-width="1.5" fill="none"/>`; break;
    case 'whiteShort': beard = `<path d="M62 132C66 160 82 172 100 173C118 172 134 160 138 132C130 146 118 150 100 150C82 150 70 146 62 132Z" fill="#d9d4cc"/>
      <path d="M86 140Q100 134 114 140Q106 145 100 144Q94 145 86 140Z" fill="#e8e4dd"/>`; break;
    case 'goatee': beard = `<path d="M86 140Q100 134 114 140Q106 144 100 143Q94 144 86 140Z" fill="#8f8a85"/>
      <path d="M90 156Q100 170 110 156Q106 164 100 165Q94 164 90 156Z" fill="#8f8a85"/>`; break;
    case 'mustache': beard = `<path d="M86 140Q100 134 114 140Q107 143 100 142Q93 143 86 140Z" fill="#17100c"/>`; break;
  }
  if (!c.acc?.includes('mask') && !c.acc?.includes('gaiter')) beard += mouth(c, mood);

  /* ----- cheveux avant / couvre-chefs ----- */
  switch (H.type) {
    case 'locs':
      front = `<path d="M50 112C44 60 70 34 100 34C130 34 156 60 150 112C146 82 126 64 100 64C74 64 54 82 50 112Z" fill="${H.c}"/>
        <path d="M60 70C70 54 88 48 100 48M140 70C130 54 112 48 100 48" stroke="#3a2a22" stroke-width="2" fill="none"/>
        <path d="M54 80C50 110 52 140 58 170" stroke="${H.c}" stroke-width="10" stroke-linecap="round" fill="none"/>
        <path d="M146 80C150 110 148 140 142 172" stroke="${H.c}" stroke-width="10" stroke-linecap="round" fill="none"/>
        <circle cx="58" cy="160" r="4" fill="${H.beads}"/><circle cx="143" cy="164" r="4" fill="${H.beads}"/>`;
      break;
    case 'braids':
      front = `<path d="M52 108C48 62 72 38 100 38C128 38 152 62 148 108C142 80 124 66 100 66C76 66 58 80 52 108Z" fill="${H.c}"/>
        <path d="M70 70Q76 50 92 42M84 66Q90 48 100 40M116 66Q110 48 100 40M130 70Q124 50 108 42" stroke="#3b2a20" stroke-width="2" fill="none"/>`;
      break;
    case 'afro':
      front = `<path d="M52 104C50 62 70 46 100 46C130 46 150 62 148 104C142 82 124 72 100 72C76 72 58 82 52 104Z" fill="${H.c}"/>`;
      break;
    case 'hightop':
      front = `<path d="M54 100C52 72 54 34 62 24L138 24C146 34 148 72 146 100C140 78 122 70 100 70C78 70 60 78 54 100Z" fill="${H.c}"/>
        <path d="M62 24L138 24" stroke="#2c201a" stroke-width="2"/><path d="M58 92L64 72M142 92L136 72" stroke="${c.skin}" stroke-width="1.5" opacity=".5"/>`;
      break;
    case 'fade':
      front = `<path d="M52 102C50 62 72 44 100 44C128 44 150 62 148 102C142 76 124 64 100 64C76 64 58 76 52 102Z" fill="${H.c}"/>
        <path d="M60 80Q100 56 140 80" stroke="#9c9690" stroke-width="2" fill="none" stroke-dasharray="2 3"/>`;
      break;
    case 'shortgrey':
    case 'short':
      front = `<path d="M52 104C50 64 72 46 100 46C128 46 150 64 148 104C142 78 124 66 100 66C76 66 58 78 52 104Z" fill="${H.c}"/>`;
      break;
    case 'kufi':
      front = `<path d="M54 104C52 88 56 80 60 78L60 92ZM146 104C148 88 144 80 140 78L140 92Z" fill="${H.c}"/>
        <path d="M58 82C58 52 78 38 100 38C122 38 142 52 142 82Z" fill="#f4efe6"/>
        <path d="M58 82L142 82" stroke="#c9b48a" stroke-width="3"/><path d="M64 70Q100 60 136 70M70 58Q100 48 130 58" stroke="#c9b48a" stroke-width="2" fill="none" stroke-dasharray="4 3"/>`;
      break;
    case 'bald':
      front = `<ellipse cx="84" cy="66" rx="14" ry="6" fill="#fff" opacity=".12"/><path d="M53 104q2-14 6-20M147 104q-2-14-6-20" stroke="${H.c}" stroke-width="5" stroke-linecap="round"/>`;
      break;
    case 'gele':
      front = `<path d="M48 100C40 62 62 30 100 28C138 30 160 62 152 100C134 82 66 82 48 100Z" fill="url(#${k}wx)"/>
        <path d="M36 66C24 26 74 2 100 18C126 2 176 26 164 66C144 44 56 44 36 66Z" fill="url(#${k}wx)"/>
        <path d="M36 66C56 44 144 44 164 66M60 50Q72 22 100 18M140 50Q128 22 100 18M100 18V40" stroke="rgba(0,0,0,.25)" stroke-width="2.5" fill="none"/>`;
      break;
    case 'hijab':
      front = `<path d="M50 124C44 62 70 34 100 34C130 34 156 62 150 124C148 92 134 62 100 60C66 62 52 92 50 124Z" fill="${H.c}"/>
        <path d="M62 70Q100 50 138 70" stroke="rgba(255,255,255,.2)" stroke-width="2.5" fill="none"/>`;
      break;
    case 'hat':
      front = `<path d="M52 104C50 70 70 58 100 58C130 58 150 70 148 104C142 84 124 76 100 76C76 76 58 84 52 104Z" fill="${H.c}"/>
        <path d="M66 62C64 40 72 22 100 22C128 22 136 40 134 62Z" fill="${H.hat || '#f4ecd8'}"/><rect x="65" y="50" width="70" height="10" fill="${H.band || '#6b2fa0'}"/>
        <ellipse cx="100" cy="64" rx="64" ry="11" fill="${H.hat || '#f4ecd8'}"/><ellipse cx="100" cy="62" rx="50" ry="6" fill="rgba(0,0,0,.08)"/>`;
      break;
    case 'fila':
      front = `<path d="M52 104C50 74 66 64 100 64C134 64 150 74 148 104C142 86 124 80 100 80C76 80 58 86 52 104Z" fill="#140c08"/>
        <path d="M58 76C56 40 84 30 110 32C138 34 150 50 146 70C140 64 120 60 100 62C80 62 66 68 58 76Z" fill="${H.c}"/>
        <path d="M110 32C130 26 152 36 150 58" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="3"/><path d="M62 72Q100 60 142 68" stroke="#f2b33d" stroke-width="2" fill="none" stroke-dasharray="3 3"/>`;
      break;
    case 'bun':
      front = `<circle cx="100" cy="34" r="17" fill="${H.c}"/><path d="M52 108C48 64 72 44 100 44C128 44 152 64 148 108C142 80 124 64 100 64C76 64 58 80 52 108Z" fill="${H.c}"/>
        <path d="M70 58Q100 46 130 58" stroke="rgba(255,255,255,.15)" stroke-width="2" fill="none"/>`;
      break;
    case 'headband':
      front = `<path d="M52 104C48 60 72 40 100 40C128 40 152 60 148 104C142 80 124 68 100 68C76 68 58 80 52 104Z" fill="${H.c}"/>
        <path d="M54 82Q100 58 146 82L146 92Q100 68 54 92Z" fill="url(#${k}fd)"/>`;
      break;
    case 'cap':
      front = `<path d="M52 92C52 58 74 42 100 42C126 42 148 58 148 92Z" fill="${H.c}"/><path d="M52 92C70 84 130 84 148 92C140 96 60 96 52 92Z" fill="#1a1b20"/>
        <path d="M100 42V92" stroke="#3b3c44" stroke-width="2"/>`;
      break;
  }

  /* ----- accessoires ----- */
  const acc = c.acc || [];
  if (acc.includes('hoops')) extra += `<circle cx="52" cy="132" r="7" fill="none" stroke="#f2b33d" stroke-width="2.5"/><circle cx="148" cy="132" r="7" fill="none" stroke="#f2b33d" stroke-width="2.5"/>`;
  if (acc.includes('cowries')) extra += `<ellipse cx="52" cy="130" rx="3.2" ry="5" fill="#f4ecd8"/><ellipse cx="148" cy="130" rx="3.2" ry="5" fill="#f4ecd8"/>`;
  if (acc.includes('studs')) extra += `<circle cx="52" cy="124" r="3" fill="#f2b33d"/><circle cx="148" cy="124" r="3" fill="#f2b33d"/>`;
  if (acc.includes('glasses')) extra += `<g fill="rgba(200,220,255,.12)" stroke="#c9a24a" stroke-width="2.2"><rect x="66" y="99" width="28" height="18" rx="6"/><rect x="106" y="99" width="28" height="18" rx="6"/></g>
      <path d="M94 106Q100 102 106 106M66 104L54 101M134 104L146 101" stroke="#c9a24a" stroke-width="2.2" fill="none"/>`;
  if (acc.includes('glassesRound')) extra += `<g fill="rgba(200,220,255,.1)" stroke="#2b1b14" stroke-width="2.6"><circle cx="80" cy="108" r="13"/><circle cx="120" cy="108" r="13"/></g>
      <path d="M93 106Q100 102 107 106M67 105L55 102M133 105L145 102" stroke="#2b1b14" stroke-width="2.6" fill="none"/>`;
  if (acc.includes('shades') && !['surpris', 'peur', 'triste'].includes(mood)) extra += `<path d="M64 100H136L132 116Q122 124 110 116L104 106H96L90 116Q78 124 68 116Z" fill="#14121a"/>
      <path d="M70 104L84 104" stroke="#fff" stroke-width="2" opacity=".4"/>`;
  if (acc.includes('headphones')) extra += `<path d="M58 178Q100 210 142 178" fill="none" stroke="#18181c" stroke-width="7"/><rect x="48" y="166" width="16" height="22" rx="6" fill="#e04a3a"/><rect x="136" y="166" width="16" height="22" rx="6" fill="#e04a3a"/>`;
  if (acc.includes('gaiter')) extra += `<path d="M52 124C60 130 80 132 100 132C120 132 140 130 148 124L146 160C134 182 66 182 54 160Z" fill="#3a3b44"/><path d="M60 140Q100 150 140 140M58 154Q100 166 142 154" stroke="#2c2d34" stroke-width="2" fill="none"/>`;
  if (acc.includes('mask')) {
    const glow = mood === 'colere' ? '#ff5a3a' : '#f2b33d';
    extra += `<path d="M56 96C56 58 144 58 144 96L140 132C132 162 68 162 60 132Z" fill="url(#${k}mk)"/>
      <path d="M68 106Q80 98 92 106Q80 112 68 106ZM108 106Q120 98 132 106Q120 112 108 106Z" fill="#0b0a0e"/>
      <circle cx="${80 + look}" cy="106" r="2.6" fill="${glow}"/><circle cx="${120 + look}" cy="106" r="2.6" fill="${glow}"/>
      <path d="M100 76v14M93 79v10M107 79v10M88 84v6M112 84v6" stroke="#4a4652" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M88 142Q100 146 112 142" stroke="#4a4652" stroke-width="2.4" fill="none"/>`;
  }

  return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${back}${body}${neck}${ears}${face}${beard}${front}${extra}</svg>`;
}

function facePath(c) {
  return c.fem
    ? 'M100 52C138 52 150 80 149 106C148 138 130 164 100 168C70 164 52 138 51 106C50 80 62 52 100 52Z'
    : 'M100 50C140 50 151 80 150 106C149 140 134 166 100 170C66 166 51 140 50 106C49 80 60 50 100 50Z';
}

function eyes(c, mood, xl, xr, y, look, k) {
  const wide = mood === 'surpris' || mood === 'peur';
  const ry = wide ? 7.5 : mood === 'colere' || mood === 'determine' ? 5 : mood === 'malin' ? 4.6 : 6;
  const rx = c.fem ? 10.5 : 10;
  const one = (x, side) => {
    const lx = look * 1.6;
    let s = `<path d="M${x - rx} ${y}Q${x} ${y - ry * 1.25} ${x + rx} ${y}Q${x} ${y + ry * 1.05} ${x - rx} ${y}Z" fill="#fbf6ee"/>
      <circle cx="${x + lx}" cy="${y + (mood === 'triste' ? 1.5 : 0)}" r="${wide ? 4.2 : 4.8}" fill="#3a2214"/>
      <circle cx="${x + lx}" cy="${y + (mood === 'triste' ? 1.5 : 0)}" r="2.3" fill="#0c0705"/>
      <circle cx="${x + lx + 1.6}" cy="${y - 1.8}" r="1.4" fill="#fff"/>
      <path d="M${x - rx - 1} ${y + 0.5}Q${x} ${y - ry * 1.3} ${x + rx + 1} ${y + 0.5}" stroke="#1a0f0a" stroke-width="${c.fem ? 3 : 2.2}" fill="none" stroke-linecap="round"/>`;
    if (c.fem) s += `<path d="M${side < 0 ? x - rx : x + rx} ${y}l${side * 3.5} -3" stroke="#1a0f0a" stroke-width="2" stroke-linecap="round"/>`;
    if (mood === 'triste' || mood === 'inquiet') s += `<path d="M${x - rx} ${y - 2}Q${x} ${y - ry - 2} ${x + rx} ${y - 2}L${x + rx} ${y - ry - 4}L${x - rx} ${y - ry - 4}Z" fill="${c.skin}" opacity=".0"/>`;
    return s;
  };
  return `<g>${one(xl, -1)}${one(xr, 1)}</g>`;
}

function brows(c, mood, xl, xr, y) {
  const [bi, bo] = BROWS[mood] || BROWS.neutre;
  const col = c.hair?.type === 'kufi' || c.hair?.type === 'bald' || c.old ? '#cfc9c0' : '#140c08';
  const w = c.fem ? 3.6 : 4.8;
  let l = [bi, bo], r = [bi, bo];
  if (mood === 'malin') r = [-20, -21];
  const p = (x, side, [i, o]) => `<path d="M${x - side * 3} ${y + i}Q${x + side * 5} ${y + Math.min(i, o) - 3} ${x + side * 13} ${y + o}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  // side : +1 vers l'extérieur droit pour l'œil droit ; l'œil gauche part de l'intérieur (côté nez) vers la gauche
  return p(xl + 3, -1, l) + p(xr - 3, 1, r);
}

function mouth(c, mood) {
  const L = c.lip, y = 148;
  switch (mood) {
    case 'sourire': return `<path d="M85 ${y - 4}Q100 ${y + 12} 115 ${y - 4}Q100 ${y + 2} 85 ${y - 4}Z" fill="#3a120c"/><path d="M88 ${y - 2.5}Q100 ${y + 3} 112 ${y - 2.5}L111 ${y - 1}Q100 ${y + 4.5} 89 ${y - 1}Z" fill="#fff"/>
      <path d="M85 ${y - 4}Q100 ${y + 12} 115 ${y - 4}" stroke="${L}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'surpris': return `<ellipse cx="100" cy="${y + 2}" rx="6.5" ry="8.5" fill="#3a120c" stroke="${L}" stroke-width="2.4"/>`;
    case 'peur': return `<path d="M88 ${y + 2}Q100 ${y - 6} 112 ${y + 2}Q100 ${y + 8} 88 ${y + 2}Z" fill="#3a120c" stroke="${L}" stroke-width="2.4"/>`;
    case 'triste': return `<path d="M89 ${y + 4}Q100 ${y - 4} 111 ${y + 4}" stroke="${L}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    case 'inquiet': return `<path d="M89 ${y + 1}Q94 ${y - 2} 100 ${y}Q106 ${y + 2} 111 ${y - 1}" stroke="${L}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    case 'colere': return `<path d="M87 ${y + 3}Q100 ${y - 5} 113 ${y + 3}L111 ${y + 5}Q100 ${y - 1} 89 ${y + 5}Z" fill="#fff" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>`;
    case 'determine': return `<path d="M88 ${y}L112 ${y}" stroke="${L}" stroke-width="3.6" stroke-linecap="round"/>`;
    case 'malin': return `<path d="M87 ${y}Q101 ${y + 4} 114 ${y - 6}" stroke="${L}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    default: return `<path d="M88 ${y}Q100 ${y + 3} 112 ${y}" stroke="${L}" stroke-width="3.2" fill="none" stroke-linecap="round"/>` +
      (c.fem ? `<ellipse cx="100" cy="${y + 4}" rx="6" ry="2" fill="${L}" opacity=".45"/>` : '');
  }
}

/* Avatar rond pour le téléphone */
function avatar(id) {
  if (id === 'hibou') return `<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#2b2436"/><path d="M10 30V16l4-6 6 4 6-4 4 6v14q-10 6-20 0z" fill="#8a6a4a"/>
    <circle cx="15" cy="19" r="4.5" fill="#f2b33d"/><circle cx="25" cy="19" r="4.5" fill="#f2b33d"/><circle cx="15" cy="19" r="2" fill="#111"/><circle cx="25" cy="19" r="2" fill="#111"/><path d="M18.5 24l1.5 3 1.5-3z" fill="#e0952a"/></svg>`;
  if (id === 'gris') return `<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#1a1820"/><path d="M14 31v-11M18 30V13M22 30V12M26 30V15M14 24q-4-2-4 2l4 6h12q4-4 4-10" stroke="#9a96a0" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
  if (id === 'mecene') return `<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#1a1410"/><ellipse cx="20" cy="23" rx="7" ry="9" fill="#c9a24a"/><circle cx="20" cy="12" r="4" fill="#c9a24a"/><path d="M13 20l-6-4M27 20l6-4M13 28l-6 4M27 28l3 2" stroke="#c9a24a" stroke-width="2.4" stroke-linecap="round"/><path d="M20 15v17" stroke="#1a1410" stroke-width="1.4"/></svg>`;
  if (id === 'inconnu') return `<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#3a3346"/><circle cx="20" cy="16" r="7" fill="#7d7490"/><path d="M8 36q12-16 24 0" fill="#7d7490"/></svg>`;
  return portrait(id, 'neutre').replace('viewBox="0 0 200 240"', 'viewBox="30 30 140 140"');
}
