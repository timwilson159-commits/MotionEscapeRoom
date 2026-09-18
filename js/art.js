/* Drawings for the physics room: pigpen symbols, mini motion graphs, vehicle icons,
   and canvas sprites for the two arcade games. */
(function () {
  const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /*
   * Pigpen cypher.
   *   A-I  : 3x3 grid cells (no dot)      J-R : same grid, with a dot
   *   S-V  : wedges of an X (no dot)      W-Z : same wedges, with a dot
   * Wedge order for S-V and W-Z: top, left, right, bottom.
   */
  ER.pigpenPaths = function (letter) {
    const i = AZ.indexOf(String(letter).toUpperCase());
    if (i < 0) return { paths: [], dot: null };
    const paths = [];
    let dot = null;
    if (i < 18) {
      const grid = Math.floor(i / 9), k = i % 9, r = Math.floor(k / 3), c = k % 3;
      const x0 = 8, y0 = 8, x1 = 40, y1 = 40;
      if (c < 2) paths.push(`M${x1},${y0} L${x1},${y1}`);
      if (c > 0) paths.push(`M${x0},${y0} L${x0},${y1}`);
      if (r < 2) paths.push(`M${x0},${y1} L${x1},${y1}`);
      if (r > 0) paths.push(`M${x0},${y0} L${x1},${y0}`);
      if (grid === 1) dot = [24, 24];
    } else {
      const k = i - 18, group = Math.floor(k / 4), pos = k % 4;
      const cx = 24, cy = 24, s = 17;
      const seg = (a, b) => `M${a[0]},${a[1]} L${cx},${cy} L${b[0]},${b[1]}`;
      const ul = [cx - s, cy - s], ur = [cx + s, cy - s], dl = [cx - s, cy + s], dr = [cx + s, cy + s];
      if (pos === 0) { paths.push(seg(ul, ur)); if (group === 1) dot = [cx, cy - 10]; }
      if (pos === 1) { paths.push(seg(ul, dl)); if (group === 1) dot = [cx - 10, cy]; }
      if (pos === 2) { paths.push(seg(ur, dr)); if (group === 1) dot = [cx + 10, cy]; }
      if (pos === 3) { paths.push(seg(dl, dr)); if (group === 1) dot = [cx, cy + 10]; }
    }
    return { paths, dot };
  };

  ER.pigpen = function (letter, opts = {}) {
    const { paths, dot } = ER.pigpenPaths(letter);
    const col = opts.color || 'currentColor';
    const w = opts.width || 5;
    return `<svg class="pigpen ${opts.class || ''}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="coded symbol">
      <g stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>
      ${dot ? `<circle cx="${dot[0]}" cy="${dot[1]}" r="4" fill="${col}"/>` : ''}
    </svg>`;
  };

  // The full key, drawn from the same code so it always matches.
  ER.pigpenKey = function () {
    const el = ER.el;
    const group = (title, letters) => el('div', { class: 'key-block' },
      el('h5', {}, title),
      el('div', { class: 'key-grid' }, letters.split('').map((L) =>
        el('div', { class: 'key-cell' }, el('span', { class: 'key-sym', html: ER.pigpen(L, { color: '#0b1a33' }) }), el('b', {}, L)))));
    return el('div', { class: 'pigpen-key printable' },
      group('Grid 1 (no dot): A–I', 'ABCDEFGHI'),
      group('Grid 2 (with a dot): J–R', 'JKLMNOPQR'),
      group('X shapes (no dot): S–V', 'STUV'),
      group('X shapes (with a dot): W–Z', 'WXYZ'));
  };

  /*
   * A small motion graph. type 'dt' (distance-time) or 'vt' (velocity-time).
   * points: [[x, y], ...] in 0..10 space; drawn with axes and no numbers by default.
   */
  ER.miniGraph = function (points, opts = {}) {
    const W = 200, H = 150, L = 34, B = 28, T = 10, R = 12;
    const px = (x) => L + (x / 10) * (W - L - R);
    const py = (y) => H - B - (y / 10) * (H - B - T);
    const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ');
    const curve = opts.curve
      ? `<path d="${opts.curve.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ')}" fill="none" stroke="${opts.color || '#22d3ee'}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`
      : '';
    const grid = [2, 4, 6, 8].map((g) => `<line x1="${px(g)}" x2="${px(g)}" y1="${py(0)}" y2="${py(10)}" stroke="#d3e2f5"/><line x1="${px(0)}" x2="${px(10)}" y1="${py(g)}" y2="${py(g)}" stroke="#d3e2f5"/>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="mini-graph" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.label || 'motion graph'}">
      <rect width="${W}" height="${H}" rx="10" fill="#ffffff"/>
      ${grid}
      <line x1="${px(0)}" y1="${py(0)}" x2="${px(10)}" y2="${py(0)}" stroke="#0b1a33" stroke-width="2.5"/>
      <line x1="${px(0)}" y1="${py(0)}" x2="${px(0)}" y2="${py(10)}" stroke="#0b1a33" stroke-width="2.5"/>
      ${opts.curve ? curve : `<path d="${line}" fill="none" stroke="${opts.color || '#22d3ee'}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`}
      <text x="${W / 2 + 6}" y="${H - 6}" text-anchor="middle" font-size="13" font-family="Fredoka, sans-serif" fill="#44557a">time</text>
      <text x="12" y="${T + 52}" font-size="13" font-family="Fredoka, sans-serif" fill="#44557a" transform="rotate(-90 12 ${T + 52})" text-anchor="middle">${opts.type === 'dt' ? 'distance' : 'velocity'}</text>
      ${opts.tag ? `<text x="${W - R}" y="${T + 14}" text-anchor="end" font-size="14" font-weight="700" font-family="Fredoka, sans-serif" fill="#0b1a33">${opts.tag}</text>` : ''}
    </svg>`;
  };

  const svg = (inner, vb = '0 0 100 50') => `<svg class="icon-svg" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  ER.art = {
    rocketSled: svg(`
      <path d="M12,30 L70,30 L86,22 L86,34 L12,38 Z" fill="#c3d0e8"/>
      <path d="M20,22 L60,22 L72,30 L20,30 Z" fill="#7f93bb"/>
      <path d="M12,30 L2,22 L2,40 L12,38 Z" fill="#ff6b4a"/>
      <circle cx="26" cy="41" r="5" fill="#2b3752"/><circle cx="62" cy="41" r="5" fill="#2b3752"/>
      <path d="M2,31 L-10,26 M2,34 L-12,34 M2,37 L-10,42" stroke="#ffc233" stroke-width="3"/>`),
    electricCar: svg(`
      <path d="M14,34 L20,22 L64,22 L78,34 Z" fill="#3ddcff"/>
      <path d="M24,24 L40,24 L40,33 L18,33 Z" fill="#dff6ff"/><path d="M44,24 L60,24 L70,33 L44,33 Z" fill="#dff6ff"/>
      <rect x="8" y="33" width="78" height="9" rx="4" fill="#1b8fb0"/>
      <circle cx="26" cy="43" r="6" fill="#2b3752"/><circle cx="68" cy="43" r="6" fill="#2b3752"/>
      <path d="M88,30 l-6,6 h5 l-4,7" stroke="#ffc233" stroke-width="3" fill="none"/>`),
    cyclist: svg(`
      <circle cx="26" cy="36" r="10" fill="none" stroke="#2b3752" stroke-width="3"/>
      <circle cx="72" cy="36" r="10" fill="none" stroke="#2b3752" stroke-width="3"/>
      <path d="M26,36 L44,36 L56,20 L72,36 M44,36 L52,24 L62,24" stroke="#22d3ee" stroke-width="3" fill="none"/>
      <circle cx="58" cy="14" r="6" fill="#ffc233"/>
      <path d="M56,20 L66,28" stroke="#ff6b4a" stroke-width="3"/>`),
    tram: svg(`
      <rect x="10" y="12" width="76" height="28" rx="6" fill="#7c5cff"/>
      <rect x="16" y="17" width="18" height="12" rx="3" fill="#e4dcff"/><rect x="40" y="17" width="18" height="12" rx="3" fill="#e4dcff"/><rect x="64" y="17" width="16" height="12" rx="3" fill="#e4dcff"/>
      <rect x="6" y="40" width="84" height="4" rx="2" fill="#44557a"/>
      <circle cx="26" cy="44" r="4" fill="#2b3752"/><circle cx="70" cy="44" r="4" fill="#2b3752"/>
      <path d="M48,12 L48,2 L64,2" stroke="#44557a" stroke-width="2.5" fill="none"/>`),
    drone: svg(`
      <rect x="38" y="22" width="24" height="12" rx="4" fill="#2b3752"/>
      <path d="M38,24 L16,14 M62,24 L84,14 M38,32 L16,40 M62,32 L84,40" stroke="#44557a" stroke-width="3"/>
      <ellipse cx="14" cy="13" rx="12" ry="3" fill="#22d3ee"/><ellipse cx="86" cy="13" rx="12" ry="3" fill="#22d3ee"/>
      <ellipse cx="14" cy="41" rx="12" ry="3" fill="#22d3ee"/><ellipse cx="86" cy="41" rx="12" ry="3" fill="#22d3ee"/>
      <circle cx="50" cy="28" r="3" fill="#ff6b4a"/>`),
    probe: svg(`
      <path d="M20,25 L52,16 L74,25 L52,34 Z" fill="#c3d0e8"/>
      <rect x="30" y="20" width="30" height="10" rx="4" fill="#8fa6cc"/>
      <path d="M20,25 L6,18 L6,32 Z" fill="#ff6b4a"/>
      <rect x="60" y="8" width="26" height="6" rx="2" fill="#22d3ee"/><rect x="60" y="36" width="26" height="6" rx="2" fill="#22d3ee"/>
      <path d="M60,14 L66,22 M60,36 L66,28" stroke="#8fa6cc" stroke-width="2"/>`),
    astronaut: svg(`
      <circle cx="50" cy="22" r="14" fill="#eef4ff"/>
      <path d="M40,20 a10,9 0 0 1 20,0 a10,9 0 0 1 -20,0" fill="#1b2a4a"/>
      <path d="M43,18 a6,5 0 0 1 8,-3" stroke="#7fd8ff" stroke-width="2" fill="none"/>
      <rect x="38" y="34" width="24" height="14" rx="6" fill="#eef4ff"/>
      <rect x="30" y="36" width="10" height="6" rx="3" fill="#dfe8f7"/><rect x="60" y="36" width="10" height="6" rx="3" fill="#dfe8f7"/>
      <rect x="44" y="36" width="12" height="5" rx="2" fill="#ff6b4a"/>`),
  };

  // Canvas sprites -----------------------------------------------------------
  ER.drawProbe = function (ctx, x, y, s, thrust, retro) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (thrust) {
      ctx.fillStyle = 'rgba(255,196,60,0.95)';
      ctx.beginPath();
      ctx.moveTo(-26, -7); ctx.lineTo(-44 - Math.random() * 12, 0); ctx.lineTo(-26, 7); ctx.closePath();
      ctx.fill();
    }
    if (retro) {
      ctx.fillStyle = 'rgba(125,225,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(30, -6); ctx.lineTo(46 + Math.random() * 10, 0); ctx.lineTo(30, 6); ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#c3d0e8';
    ctx.beginPath();
    ctx.moveTo(-26, -11); ctx.lineTo(18, -11); ctx.lineTo(34, 0); ctx.lineTo(18, 11); ctx.lineTo(-26, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7f93bb';
    ctx.fillRect(-18, -7, 26, 14);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(-14, -26, 22, 6);
    ctx.fillRect(-14, 20, 22, 6);
    ctx.strokeStyle = '#8fa6cc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(-4, -11); ctx.moveTo(-4, 20); ctx.lineTo(-4, 11); ctx.stroke();
    ctx.fillStyle = '#0b1a33';
    ctx.beginPath(); ctx.arc(14, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7fd8ff';
    ctx.beginPath(); ctx.arc(15, -1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  ER.drawAstronaut = function (ctx, x, y, s, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(s, s);
    ctx.fillStyle = '#dfe8f7';
    ctx.beginPath(); ctx.ellipse(0, 14, 13, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c7d4ea';
    ctx.fillRect(-20, 4, 9, 16);
    ctx.fillRect(11, 4, 9, 16);
    ctx.fillRect(-9, 26, 8, 14);
    ctx.fillRect(1, 26, 8, 14);
    ctx.fillStyle = '#eef4ff';
    ctx.beginPath(); ctx.arc(0, -8, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#12233f';
    ctx.beginPath(); ctx.ellipse(0, -9, 10, 8.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7fd8ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-3, -11, 5, Math.PI, Math.PI * 1.6); ctx.stroke();
    ctx.fillStyle = '#ff6b4a';
    ctx.fillRect(-6, 8, 12, 5);
    ctx.restore();
  };
})();
