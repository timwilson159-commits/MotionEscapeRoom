/* Station Newton: the room, movement, symbol log, timer with hint penalties, scenes and modals. */
(function () {
  const { el, sfx } = ER;
  const W = 320, H = 224, S = 3;
  const HINT_PENALTY = 300; // seconds added per hint

  const canvas = document.getElementById('room');
  const ctx = canvas.getContext('2d');
  const roomView = document.getElementById('room-view');
  const puzzleView = document.getElementById('puzzle-view');
  const promptEl = document.getElementById('prompt');
  const notesList = document.getElementById('notes-list');
  const hudCodes = document.getElementById('hud-codes');
  const hudTime = document.getElementById('hud-time');
  const hudTimer = document.getElementById('hud-timer');

  const state = {
    solved: [],
    timerOn: false,
    startTime: 0,
    elapsed: 0,
    penalty: 0,
    hintsUsed: 0,
    escaped: false,
    current: null,
    cleanup: null,
  };

  // ---------- Modals ----------
  ER.modal = function ({ title, content, buttons = [], className = '', dismissable = true }) {
    const root = document.getElementById('modal-root');
    const box = el('div', { class: 'modal ' + className, role: 'dialog', 'aria-modal': 'true' });
    const overlay = el('div', { class: 'overlay' }, box);
    const onKey = (e) => { if (e.key === 'Escape' && dismissable) close(); };
    const close = () => {
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 180);
    };
    if (title) box.append(el('h2', { class: 'modal-title' }, title));
    if (content) box.append(content.nodeType ? content : el('div', { html: content }));
    const row = el('div', { class: 'modal-buttons' });
    buttons.forEach((b) =>
      row.append(el('button', {
        class: 'btn ' + (b.class || ''),
        onclick: () => { if (b.close !== false) close(); if (b.onClick) b.onClick(); },
      }, b.label))
    );
    if (buttons.length) box.append(row);
    if (dismissable) overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    root.append(overlay);
    setTimeout(() => { const b = row.querySelector('button'); if (b) b.focus(); }, 60);
    return { close, box };
  };
  const modalOpen = () => !!document.querySelector('#modal-root .overlay:not(.closing)');

  // ---------- Layout of the lab ----------
  const STATIONS = {
    graphmatch: { x: 48, y: 34, front: [64, 78] },
    graphbuild: { x: 96, y: 34, front: [112, 78] },
    vectors: { x: 208, y: 34, front: [224, 78] },
    laws: { x: 256, y: 34, front: [272, 78] },
    thruster: { x: 18, y: 76, front: [62, 94] },
    recoil: { x: 18, y: 140, front: [62, 158] },
    speedlab: { x: 270, y: 76, front: [258, 94] },
    crossnumber: { x: 270, y: 140, front: [258, 158] },
    crashlab: { x: 88, y: 172, front: [104, 166] },
    logicgrid: { x: 200, y: 172, front: [216, 166] },
  };
  const DOOR = { x: 136, y: 2, w: 48, h: 30, front: [160, 46] };
  const CONSOLE = { x: 140, y: 96, w: 40, h: 30, front: [160, 140] };
  const DECOR = [
    { type: 'crate', x: 20, y: 184, w: 26, h: 22 },
    { type: 'locker', x: 278, y: 180, w: 24, h: 26 },
    { type: 'lamp', x: 122, y: 36, w: 12, h: 14 },
    { type: 'lamp', x: 186, y: 36, w: 12, h: 14 },
  ];
  const SOLIDS = [
    ...Object.values(STATIONS).map((s) => ({ x: s.x, y: s.y, w: 32, h: 32 })),
    { x: CONSOLE.x, y: CONSOLE.y, w: CONSOLE.w, h: CONSOLE.h },
    ...DECOR,
  ];

  const player = { x: 160, y: 160, dir: 'down', moving: false, anim: 0, target: null, pendingOpen: null, stepT: 0 };

  function blocked(x, y) {
    const l = x - 5, r = x + 5, t = y - 6, b = y;
    if (l < 16 || r > 304 || t < 34 || b > 206) return true;
    for (const s of SOLIDS) {
      if (r > s.x && l < s.x + s.w && b > s.y && t < s.y + s.h) return true;
    }
    return false;
  }

  function rectDist(px, py, s, w = 32, h = 32) {
    const cx = Math.max(s.x, Math.min(px, s.x + w));
    const cy = Math.max(s.y, Math.min(py, s.y + h));
    return Math.hypot(px - cx, py - cy);
  }

  function nearest() {
    let best = null, bd = 1e9;
    for (const id in STATIONS) {
      const d = rectDist(player.x, player.y - 3, STATIONS[id]);
      if (d < 14 && d < bd) { bd = d; best = id; }
    }
    const dc = rectDist(player.x, player.y - 3, CONSOLE, CONSOLE.w, CONSOLE.h);
    if (dc < 14 && dc < bd) { bd = dc; best = 'console'; }
    const dd = Math.hypot(player.x - DOOR.front[0], player.y - DOOR.front[1]);
    if (dd < 18 && dd < bd) best = 'door';
    return best;
  }

  // ---------- Sprites ----------
  const PAL = { k: '#0b1020', h: '#6b4a2a', o: '#ff6b4a', m: '#8ff0ff', w: '#ffffff', s: '#f6c7a1', y: '#e8eefc', Y: '#b9c7e6', b: '#1f3a6b', g: '#9aa7bd', c: '#22d3ee' };
  const TOP_DOWN = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.kommmmmmok.', '.kmwmmmmwmk.', '.kssssssssk.', '..kssoossk..', '..kyyyyyyk..', '.kyycyycyyk.', 'kyyyyyyyyyyk', 'ksyyyYYyyysk', '.kkyyyyyykk.'];
  const TOP_UP = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.kohhhhhhok.', '.khhhhhhhhk.', '.khhhhhhhhk.', '..kkhhhhkk..', '..kyggggyk..', '.kyyggggyyk.', 'kyyyggggyyyk', 'ksyyggggyysk', '.kkyyyyyykk.'];
  const TOP_SIDE = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.khhoommmmk.', '.khhhsmwmmk.', '.khhssssssk.', '..khsssssok.', '..kkyyyyyk..', '..gkyycyyk..', '..gkyyysyk..', '..gkyyysyk..', '...kyyyyyk..'];
  const LEGS_A = ['..kbbkkbbk..', '..kbbkkbbk..', '.kbbbkkbbbk.', '.kkkkkkkkkk.'];
  const LEGS_B = ['..kbbkkbbk..', '..kbbkkbbk..', '.kbbbk.kbbk.', '.kkkkk.kkk..'];
  const SIDE_A = ['...kbbbbk...', '...kbbbbk...', '...kbbbbk...', '...kkkkkkk..'];
  const SIDE_B = ['...kbbbbk...', '..kbbkkbbk..', '.kbbk..kbbk.', '.kkk....kkk.'];
  const mirror = (rows) => rows.map((r) => r.split('').reverse().join(''));

  function makeSprite(rows) {
    const c = document.createElement('canvas');
    c.width = 12; c.height = 16;
    const x = c.getContext('2d');
    rows.forEach((r, j) => {
      for (let i = 0; i < 12; i++) {
        const ch = r[i];
        if (ch && ch !== '.') { x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1); }
      }
    });
    return c;
  }
  const SPR = {
    down: [makeSprite([...TOP_DOWN, ...LEGS_A]), makeSprite([...TOP_DOWN, ...LEGS_B]), makeSprite([...TOP_DOWN, ...LEGS_A]), makeSprite([...TOP_DOWN, ...mirror(LEGS_B)])],
    up: [makeSprite([...TOP_UP, ...LEGS_A]), makeSprite([...TOP_UP, ...LEGS_B]), makeSprite([...TOP_UP, ...LEGS_A]), makeSprite([...TOP_UP, ...mirror(LEGS_B)])],
    right: [makeSprite([...TOP_SIDE, ...SIDE_A]), makeSprite([...TOP_SIDE, ...SIDE_B])],
    left: [makeSprite(mirror([...TOP_SIDE, ...SIDE_A])), makeSprite(mirror([...TOP_SIDE, ...SIDE_B]))],
  };

  // ---------- Drawing ----------
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const circle = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

  function drawFloor(t) {
    px(16, 32, 288, 176, '#101d35');
    for (let ty = 2; ty < 13; ty++) {
      for (let tx = 1; tx < 19; tx++) {
        px(tx * 16, ty * 16, 15, 15, (tx + ty) % 2 ? '#152541' : '#122038');
      }
    }
    ctx.strokeStyle = 'rgba(34,211,238,0.18)';
    ctx.lineWidth = 0.5;
    for (let tx = 1; tx <= 19; tx++) { ctx.beginPath(); ctx.moveTo(tx * 16, 32); ctx.lineTo(tx * 16, 208); ctx.stroke(); }
    for (let ty = 2; ty <= 13; ty++) { ctx.beginPath(); ctx.moveTo(16, ty * 16); ctx.lineTo(304, ty * 16); ctx.stroke(); }
    // glowing walkway to the airlock
    for (let i = 0; i < 7; i++) {
      const a = 0.25 + 0.25 * Math.sin(t * 3 - i * 0.6);
      px(154, 40 + i * 8, 12, 3, `rgba(34,211,238,${a})`);
    }
    [[40, 116], [268, 118], [150, 196]].forEach(([x, y]) => {
      px(x, y, 18, 9, '#0d1729');
      for (let i = 0; i < 4; i++) px(x + 2 + i * 4, y + 2, 2, 5, '#1d3352');
    });
  }

  function drawWalls(t) {
    px(0, 0, W, 32, '#0a1224');
    px(0, 26, W, 6, '#060c18');
    for (let x = 0; x < W; x += 32) { px(x, 0, 1, 26, '#16223d'); circle(x + 4, 4, 1, '#2a3c63'); circle(x + 28, 4, 1, '#2a3c63'); }
    px(0, 32, 16, 176, '#0c1527');
    px(304, 32, 16, 176, '#0c1527');
    px(0, 208, W, 16, '#060c18');
    px(6, 32, 4, 176, '#22d3ee');
    px(310, 32, 4, 176, '#ff6b4a');
    for (let y = 48; y < 208; y += 40) { px(4, y, 8, 3, '#0e7f9b'); px(308, y, 8, 3, '#b8452a'); }
    for (let x = 0; x < W; x += 16) px(x, 212, 8, 3, '#1d3352');

    // viewports: stars and a slow-turning Earth
    [[64, 14, 0], [256, 14, 40]].forEach(([cx, cy, off]) => {
      circle(cx, cy, 11, '#22354f');
      circle(cx, cy, 9, '#01040c');
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.clip();
      for (let i = 0; i < 9; i++) {
        const sx = cx - 8 + ((i * 7 + off) % 17), sy = cy - 8 + ((i * 5 + off) % 17);
        circle(sx, sy, 0.6, i % 3 ? 'rgba(255,255,255,0.8)' : 'rgba(150,220,255,0.9)');
      }
      const ex = cx - 4 + ((t * 2 + off) % 24) - 4;
      circle(ex, cy + 5, 7, '#1d5fb0');
      circle(ex - 2, cy + 4, 2.5, '#2fa05a');
      circle(ex + 2, cy + 7, 2, '#2fa05a');
      ctx.restore();
      circle(cx - 3, cy - 4, 2, 'rgba(255,255,255,0.35)');
    });

    // airlock
    px(DOOR.x, DOOR.y, DOOR.w, DOOR.h, '#ffc233');
    for (let i = 0; i < 12; i += 2) { px(DOOR.x + i * 4, DOOR.y, 4, 3, '#0b1020'); px(DOOR.x + i * 4 + 4, DOOR.y + DOOR.h - 3, 4, 3, '#0b1020'); }
    px(DOOR.x + 4, DOOR.y + 4, DOOR.w - 8, DOOR.h - 7, '#26344f');
    const all = state.solved.length === ER.puzzles.length;
    const pulse = all ? 0.5 + 0.5 * Math.sin(t * 5) : 0;
    circle(160, 18, 11, all ? `rgb(${60 + pulse * 60},${200 + pulse * 55},${220 + pulse * 35})` : '#7c8aa8');
    circle(160, 18, 8, '#44557a');
    ctx.save();
    ctx.translate(160, 18);
    ctx.rotate(all ? t * 1.5 : 0);
    ctx.strokeStyle = '#cfe3ff'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke(); }
    ctx.restore();
    circle(160, 18, 2.5, all ? '#22d3ee' : '#ff4d6d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 5px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AIRLOCK', 160, 31.5);

    const lx = [94, 102, 110, 118, 126, 194, 202, 210, 218, 226];
    lx.forEach((x, i) => {
      const on = i < state.solved.length;
      if (on) circle(x, 12, 4, 'rgba(34,211,238,0.35)');
      circle(x, 12, 2.6, on ? '#22d3ee' : '#3b4a6b');
      circle(x - 0.8, 11.2, 0.8, 'rgba(255,255,255,0.7)');
    });
  }

  function drawConsole(t) {
    const { x, y, w, h } = CONSOLE;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + 2, y + h - 3, w - 4, 5);
    px(x, y + 8, w, h - 8, '#16263f');
    px(x, y + 8, w, 2, '#22405f');
    px(x + 3, y + 12, w - 6, h - 16, '#0a1526');
    // holographic globe of Newton's laws
    const cx = x + w / 2, cy = y + 6;
    ctx.strokeStyle = `rgba(34,211,238,${0.5 + 0.2 * Math.sin(t * 2)})`;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 10 - i * 2, 4 + i, t * 0.6 + i, 0, Math.PI * 2);
      ctx.stroke();
    }
    circle(cx, cy, 2.5, '#7fe7ff');
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 5px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REFERENCE', cx, y + h - 4);
    px(x + 5, y + h - 12, 6, 3, '#ff6b4a');
    px(x + w - 11, y + h - 12, 6, 3, '#ffc233');
  }

  function drawDecor(d, t) {
    if (d.type === 'crate') {
      px(d.x, d.y + 6, d.w, d.h - 6, '#1d3352');
      px(d.x, d.y + 6, d.w, 2, '#2a4d7d');
      px(d.x + 2, d.y + 10, d.w - 4, 1, '#0f1c33');
      px(d.x + 4, d.y, 14, 8, '#22d3ee');
      px(d.x + 6, d.y + 2, 10, 4, '#0a1526');
    } else if (d.type === 'locker') {
      px(d.x, d.y, d.w, d.h, '#1a2a44');
      px(d.x + d.w / 2, d.y, 1, d.h, '#0d1729');
      for (let i = 0; i < 3; i++) { px(d.x + 3, d.y + 4 + i * 3, 7, 1, '#2a4d7d'); px(d.x + 14, d.y + 4 + i * 3, 7, 1, '#2a4d7d'); }
      px(d.x + 9, d.y + 15, 2, 3, '#22d3ee');
      px(d.x + 14, d.y + 15, 2, 3, '#22d3ee');
    } else if (d.type === 'lamp') {
      px(d.x + 4, d.y, 4, 10, '#22354f');
      px(d.x + 1, d.y + 9, 10, 4, '#0d1729');
      const glow = 0.35 + 0.2 * Math.sin(t * 2 + d.x);
      ctx.fillStyle = `rgba(34,211,238,${glow})`;
      ctx.beginPath(); ctx.moveTo(d.x + 1, d.y + 13); ctx.lineTo(d.x + 11, d.y + 13); ctx.lineTo(d.x + 15, d.y + 26); ctx.lineTo(d.x - 3, d.y + 26); ctx.fill();
      px(d.x + 2, d.y + 11, 8, 2, '#7fe7ff');
    }
  }

  const screen = (x, y, w, h, bg) => { px(x, y, w, h, '#0b1020'); px(x + 1, y + 1, w - 2, h - 2, bg || '#07213a'); };

  const STATION_ART = {
    thruster(x, y, t) {
      px(x + 2, y + 12, 28, 20, '#1b2a44'); px(x + 2, y + 12, 28, 2, '#2a4d7d');
      px(x + 6, y + 2, 20, 10, '#22354f');
      screen(x + 8, y + 4, 16, 7, '#03263a');
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let i = 0; i < 14; i++) ctx.lineTo(x + 9 + i, y + 9 - Math.min(5, i * 0.6 + Math.sin(t * 3 + i) * 0.4));
      ctx.stroke();
      // thruster nozzle with flame
      px(x + 20, y + 18, 8, 6, '#c3d0e8');
      const f = 3 + Math.sin(t * 20) * 1.5;
      ctx.fillStyle = '#ffc233';
      ctx.beginPath(); ctx.moveTo(x + 20, y + 19); ctx.lineTo(x + 20 - f, y + 21); ctx.lineTo(x + 20, y + 23); ctx.fill();
      px(x + 5, y + 18, 3, 3, '#ff6b4a'); px(x + 5, y + 24, 3, 3, '#22d3ee');
    },
    recoil(x, y, t) {
      px(x + 2, y + 2, 28, 28, '#16263f');
      circle(x + 16, y + 15, 10, '#0a1526');
      circle(x + 16, y + 15, 8, '#02060f');
      ctx.save(); ctx.beginPath(); ctx.arc(x + 16, y + 15, 8, 0, Math.PI * 2); ctx.clip();
      for (let i = 0; i < 6; i++) circle(x + 10 + ((i * 5 + t * 3) % 13), y + 9 + ((i * 3) % 12), 0.6, 'rgba(255,255,255,0.8)');
      ctx.restore();
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x + 16, y + 15, 10, 0, Math.PI * 2); ctx.stroke();
      px(x + 14, y + 25, 4, 5, '#c3d0e8');
      px(x + 4, y + 6, 4, 8, '#ff6b4a'); px(x + 24, y + 6, 4, 8, '#ffc233');
    },
    graphmatch(x, y, t) {
      px(x + 1, y + 4, 30, 22, '#1b2a44');
      screen(x + 3, y + 6, 26, 16, '#041d33');
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x + 6, y + 19); ctx.lineTo(x + 26, y + 9); ctx.stroke();
      ctx.strokeStyle = '#ffc233';
      ctx.beginPath(); ctx.moveTo(x + 6, y + 20); ctx.lineTo(x + 14, y + 16); ctx.lineTo(x + 26, y + 16); ctx.stroke();
      px(x + 5, y + 21, 22, 1, '#44557a'); px(x + 5, y + 8, 1, 14, '#44557a');
      px(x + 6, y + 26, 20, 4, '#22354f');
      if (Math.sin(t * 4) > 0) px(x + 27, y + 7, 2, 2, '#22d3ee');
    },
    graphbuild(x, y, t) {
      px(x + 1, y + 4, 30, 22, '#1b2a44');
      screen(x + 3, y + 6, 26, 16, '#041d33');
      const hs = [3, 6, 9, 9, 6, 3];
      hs.forEach((h, i) => px(x + 6 + i * 3, y + 20 - h, 2, h, i % 2 ? '#22d3ee' : '#7c5cff'));
      px(x + 5, y + 20, 22, 1, '#44557a');
      px(x + 6, y + 26, 20, 4, '#22354f');
      if (Math.sin(t * 3) > 0.4) px(x + 26, y + 8, 2, 2, '#ffc233');
    },
    vectors(x, y, t) {
      px(x + 1, y + 10, 30, 20, '#1b2a44'); px(x + 1, y + 10, 30, 2, '#2a4d7d');
      screen(x + 4, y + 2, 24, 10, '#04263a');
      ctx.strokeStyle = '#ff6b4a'; ctx.lineWidth = 1.2;
      const a = Math.sin(t) * 0.6;
      ctx.beginPath(); ctx.moveTo(x + 16, y + 8); ctx.lineTo(x + 16 + Math.cos(a) * 8, y + 8 + Math.sin(a) * 4); ctx.stroke();
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath(); ctx.moveTo(x + 16, y + 8); ctx.lineTo(x + 16 - 6, y + 8 - 3); ctx.stroke();
      px(x + 6, y + 16, 8, 2, '#22d3ee'); px(x + 6, y + 21, 12, 2, '#ffc233'); px(x + 6, y + 26, 6, 2, '#ff6b4a');
      px(x + 22, y + 16, 6, 12, '#0d1729');
    },
    laws(x, y, t) {
      px(x + 1, y + 3, 30, 24, '#1b2a44');
      ['1', '2', '3'].forEach((n, i) => {
        screen(x + 3 + i * 9, y + 6, 8, 14, i === Math.floor(t % 3) ? '#0b4a66' : '#04263a');
        ctx.fillStyle = i === Math.floor(t % 3) ? '#7fe7ff' : '#2a6d8a';
        ctx.font = 'bold 7px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n, x + 7 + i * 9, y + 16);
      });
      px(x + 6, y + 27, 20, 4, '#22354f');
    },
    speedlab(x, y, t) {
      px(x + 2, y + 10, 28, 20, '#1b2a44');
      screen(x + 5, y + 3, 22, 10, '#220a0a');
      ctx.fillStyle = '#ff6b4a';
      ctx.font = 'bold 7px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(((Math.floor(t * 9) % 90) + 10) + '', x + 16, y + 11);
      px(x + 6, y + 16, 5, 4, '#22d3ee'); px(x + 13, y + 16, 5, 4, '#22d3ee'); px(x + 20, y + 16, 5, 4, '#22d3ee');
      px(x + 6, y + 22, 5, 4, '#44557a'); px(x + 13, y + 22, 5, 4, '#44557a'); px(x + 20, y + 22, 5, 4, '#ffc233');
    },
    crossnumber(x, y) {
      px(x + 2, y + 2, 28, 28, '#e8eefc');
      px(x + 4, y + 4, 24, 24, '#f7faff');
      for (let i = 0; i <= 4; i++) { px(x + 4 + i * 6, y + 4, 1, 24, '#9fb3d9'); px(x + 4, y + 4 + i * 6, 24, 1, '#9fb3d9'); }
      px(x + 10, y + 10, 5, 5, '#0b1020'); px(x + 22, y + 16, 5, 5, '#0b1020');
      ctx.fillStyle = '#0b1020';
      ctx.font = 'bold 5px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('7', x + 7.5, y + 12); ctx.fillText('4', x + 19, y + 24);
    },
    crashlab(x, y, t) {
      px(x + 1, y + 16, 30, 6, '#22354f');
      const cx = x + 6 + ((t * 8) % 18);
      px(cx, y + 8, 14, 8, '#c3d0e8');
      px(cx + 2, y + 5, 8, 4, '#8fa6cc');
      circle(cx + 3, y + 17, 2, '#0b1020'); circle(cx + 11, y + 17, 2, '#0b1020');
      px(x + 26, y + 4, 4, 18, '#ff6b4a');
      for (let i = 0; i < 3; i++) px(x + 2, y + 24 + i * 2, 28, 1, '#1d3352');
    },
    logicgrid(x, y) {
      px(x + 1, y + 11, 30, 19, '#1b2a44'); px(x + 1, y + 11, 30, 3, '#2a4d7d');
      px(x + 5, y + 4, 15, 12, '#f7faff');
      for (let i = 1; i < 4; i++) { px(x + 5 + i * 4, y + 4, 1, 12, '#9fb3d9'); px(x + 5, y + 4 + i * 3, 15, 1, '#9fb3d9'); }
      px(x + 10, y + 8, 2, 2, '#22c55e'); px(x + 14, y + 11, 2, 2, '#ff6b4a');
      ctx.save(); ctx.translate(x + 24, y + 8); ctx.rotate(0.6); px(-1, -6, 2, 10, '#ffc233'); px(-1, 4, 2, 2, '#f6c7a1'); ctx.restore();
    },
  };

  function drawStation(id, s, t, isNear) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(s.x + 2, s.y + 29, 28, 4);
    STATION_ART[id](s.x, s.y, t);
    if (isNear) {
      ctx.strokeStyle = `rgba(34,211,238,${0.6 + 0.4 * Math.sin(t * 8)})`;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(s.x - 1, s.y - 1, 34, 34);
    }
  }

  function drawIcons(t, near) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ER.puzzles.forEach((def, i) => {
      const s = STATIONS[def.id];
      if (!s) return;
      const bob = Math.sin(t * 2.4 + i) * 1.5;
      const cx = s.x + 16, cy = s.y - 5 + bob;
      const solved = state.solved.includes(def.id);
      circle(cx, cy, 6.5, solved ? '#22d3ee' : near === def.id ? '#ffc233' : '#e8eefc');
      ctx.strokeStyle = '#0b1020'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '7px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      ctx.fillStyle = '#000';
      ctx.fillText(solved ? '✅' : def.icon, cx, cy + 0.5);
    });
    // console icon
    const cbob = Math.sin(t * 2) * 1.2;
    const ccx = CONSOLE.x + CONSOLE.w / 2, ccy = CONSOLE.y - 6 + cbob;
    circle(ccx, ccy, 6.5, near === 'console' ? '#ffc233' : '#e8eefc');
    ctx.strokeStyle = '#0b1020'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(ccx, ccy, 6.5, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '7px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.fillStyle = '#000';
    ctx.fillText('📘', ccx, ccy + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  function drawPlayer() {
    const p = player;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
    const frames = SPR[p.dir];
    const f = p.moving ? Math.floor(p.anim * 8) % frames.length : 0;
    ctx.drawImage(frames[f], Math.round(p.x - 6), Math.round(p.y - 16));
  }

  function draw(t) {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const near = nearest();
    drawFloor(t);
    drawWalls(t);
    const ents = [];
    Object.entries(STATIONS).forEach(([id, s]) => ents.push({ y: s.y + 32, fn: () => drawStation(id, s, t, near === id) }));
    DECOR.forEach((d) => ents.push({ y: d.y + d.h, fn: () => drawDecor(d, t) }));
    ents.push({ y: CONSOLE.y + CONSOLE.h, fn: () => drawConsole(t) });
    ents.push({ y: player.y, fn: drawPlayer });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.fn());
    if (near === 'console') {
      ctx.strokeStyle = `rgba(255,194,51,${0.6 + 0.4 * Math.sin(t * 8)})`;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(CONSOLE.x - 1, CONSOLE.y - 1, CONSOLE.w + 2, CONSOLE.h + 2);
    }
    if (near === 'door') {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 8)})`;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(DOOR.x - 1, DOOR.y - 1, DOOR.w + 2, DOOR.h + 2);
    }
    drawIcons(t, near);
    updatePrompt(near);
  }

  // ---------- Prompt ----------
  let lastPrompt = undefined;
  function updatePrompt(near) {
    if (near === lastPrompt) return;
    lastPrompt = near;
    promptEl.innerHTML = '';
    if (!near) { promptEl.hidden = true; return; }
    let icon = '📘', title = 'Reference console';
    if (near !== 'console') {
      const def = near === 'door' ? ER.door : ER.get(near);
      icon = def.icon;
      title = (state.solved.includes(near) ? 'Replay ' : 'Open ') + def.title;
    }
    promptEl.append(
      el('button', { class: 'btn btn-sun prompt-btn', onclick: () => openScene(near) },
        el('span', { class: 'prompt-icon' }, icon),
        el('span', {}, title),
        el('kbd', {}, 'E'))
    );
    promptEl.hidden = false;
  }

  // ---------- Input ----------
  const held = new Set();
  const roomActive = () => !roomView.hidden && !modalOpen();
  const isTyping = (e) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;

  window.addEventListener('keydown', (e) => {
    if (!roomActive() || isTyping(e)) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      held.add(k);
      player.target = null;
      player.pendingOpen = null;
      e.preventDefault();
    } else if (k === 'e' || ((k === ' ' || k === 'enter') && (e.target === document.body || e.target === canvas))) {
      const n = nearest();
      if (n) { e.preventDefault(); openScene(n); }
    }
  });
  window.addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('pointerdown', (e) => {
    if (!roomActive()) return;
    sfx.unlock();
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    for (const id in STATIONS) {
      const s = STATIONS[id];
      if (x >= s.x - 2 && x <= s.x + 34 && y >= s.y - 14 && y <= s.y + 34) {
        if (nearest() === id) { openScene(id); return; }
        player.target = s.front.slice();
        player.pendingOpen = id;
        return;
      }
    }
    if (x >= CONSOLE.x - 2 && x <= CONSOLE.x + CONSOLE.w + 2 && y >= CONSOLE.y - 14 && y <= CONSOLE.y + CONSOLE.h + 2) {
      if (nearest() === 'console') { openScene('console'); return; }
      player.target = CONSOLE.front.slice();
      player.pendingOpen = 'console';
      return;
    }
    if (x >= DOOR.x && x <= DOOR.x + DOOR.w && y <= DOOR.y + DOOR.h + 6) {
      if (nearest() === 'door') { openScene('door'); return; }
      player.target = DOOR.front.slice();
      player.pendingOpen = 'door';
      return;
    }
    player.target = [x, y];
    player.pendingOpen = null;
  });

  // ---------- Update loop ----------
  function update(dt) {
    let vx = 0, vy = 0;
    if (held.has('arrowleft') || held.has('a')) vx -= 1;
    if (held.has('arrowright') || held.has('d')) vx += 1;
    if (held.has('arrowup') || held.has('w')) vy -= 1;
    if (held.has('arrowdown') || held.has('s')) vy += 1;
    const speed = 68;
    let arrived = false;
    if (!vx && !vy && player.target) {
      const dx = player.target[0] - player.x, dy = player.target[1] - player.y;
      const d = Math.hypot(dx, dy);
      if (d < 1.5) { arrived = true; }
      else { vx = dx / d; vy = dy / d; }
      if (d < speed * dt) { vx *= d / (speed * dt); vy *= d / (speed * dt); }
    } else if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }

    let moved = false;
    if (vx || vy) {
      const mx = vx * speed * dt, my = vy * speed * dt;
      if (mx && !blocked(player.x + mx, player.y)) { player.x += mx; moved = true; }
      if (my && !blocked(player.x, player.y + my)) { player.y += my; moved = true; }
      if (Math.abs(vx) > Math.abs(vy)) player.dir = vx > 0 ? 'right' : 'left';
      else player.dir = vy > 0 ? 'down' : 'up';
      if (!moved && player.target) arrived = true;
    }
    player.moving = moved;
    if (moved) {
      player.anim += dt;
      player.stepT += dt;
      if (player.stepT > 0.28) { player.stepT = 0; sfx.step(); }
    }
    if (arrived) {
      const pend = player.pendingOpen;
      player.target = null;
      player.pendingOpen = null;
      if (pend && nearest() === pend) openScene(pend);
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!roomView.hidden) {
      if (!modalOpen()) update(dt);
      draw(now / 1000);
    }
    if (state.timerOn) {
      state.elapsed = (Date.now() - state.startTime) / 1000;
      const txt = fmtTime(state.elapsed + state.penalty);
      if (hudTime.textContent !== txt) hudTime.textContent = txt;
    }
    requestAnimationFrame(frame);
  }

  const fmtTime = (s) => {
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  };

  // ---------- Symbol log ----------
  function symbolTiles(code) {
    return el('span', { class: 'code-tiles' },
      el('span', { class: 'sym-tile', html: ER.pigpen(code.letter) }),
      el('span', { class: 'tile number' }, el('small', {}, 'number'), String(code.number)));
  }
  ER.symbolTiles = symbolTiles;

  function renderNotes(newId) {
    notesList.innerHTML = '';
    ER.puzzles.forEach((def) => {
      const solved = state.solved.includes(def.id);
      notesList.append(el('li', { class: 'note' + (solved ? ' solved' : '') + (def.id === newId ? ' new' : '') },
        el('span', { class: 'note-icon' }, def.icon),
        el('div', { class: 'note-text' },
          el('b', {}, def.title),
          solved ? null : el('span', { class: 'note-missing' }, 'Symbol not found yet')),
        solved ? symbolTiles(def.code) : el('span', { class: 'code-tiles empty' }, el('span', { class: 'tile' }, '?'), el('span', { class: 'tile' }, '?'))));
    });
    hudCodes.textContent = `${state.solved.length} / ${ER.puzzles.length}`;
  }

  // ---------- Scenes ----------
  function openScene(id) {
    if (modalOpen()) return;
    if (id === 'console') {
      sfx.open();
      ER.modal({
        title: '📘 Reference console',
        content: el('div', {},
          el('p', {}, 'Station Newton\'s reference computer. Open either file as often as you like: the physics is not what costs you time here, hints are.'),
          el('div', { class: 'row-center' },
            el('button', { class: 'btn btn-aqua btn-big', onclick: () => ER.reference.laws() }, '📘 Newton\'s three laws'),
            el('button', { class: 'btn btn-sun btn-big', onclick: () => ER.reference.vectors() }, '➡️ Vectors and scalars'))),
        className: 'ref-modal',
        buttons: [{ label: 'Close', class: 'btn-light' }],
      });
      return;
    }
    const def = id === 'door' ? ER.door : ER.get(id);
    if (!def) return;
    sfx.unlock();
    sfx.open();
    held.clear();
    player.target = null;
    player.pendingOpen = null;
    state.current = id;
    roomView.hidden = true;
    puzzleView.hidden = false;
    puzzleView.innerHTML = '';

    const hintBox = el('div', { class: 'hint-box', hidden: true });
    let shown = 0;
    const hints = def.hints || [];
    const hintBtn = el('button', { class: 'btn btn-sun' }, `💡 Hint (+5 min)`);
    hintBtn.addEventListener('click', () => {
      if (shown >= hints.length) return;
      ER.modal({
        title: '⏱️ Hint costs 5 minutes',
        content: el('p', {}, 'Taking a hint adds ', el('b', {}, '5 minutes'), ' to your mission time. Are you sure you want it?'),
        buttons: [
          { label: 'Yes, show the hint', class: 'btn-sun btn-big', onClick: takeHint },
          { label: 'No, I\'ll keep thinking', class: 'btn-light' },
        ],
      });
    });
    function takeHint() {
      sfx.hint();
      state.penalty += HINT_PENALTY;
      state.hintsUsed++;
      hudTimer.classList.remove('penalty');
      void hudTimer.offsetWidth;
      hudTimer.classList.add('penalty');
      const pop = el('div', { class: 'penalty-pop' }, '⏱️ +5:00 hint penalty');
      document.body.append(pop);
      setTimeout(() => pop.remove(), 2600);
      hintBox.hidden = false;
      hintBox.append(el('div', { class: 'hint' }, el('b', {}, shown === 0 ? 'Hint 1: ' : 'Hint 2: '), hints[shown]));
      shown++;
      const left = hints.length - shown;
      hintBtn.textContent = left ? `💡 Another hint (+5 min)` : '💡 No more hints';
      hintBtn.disabled = !left;
    }
    const printBtn = def.printable
      ? el('button', { class: 'btn btn-light', onclick: () => {
          document.body.classList.add('printing');
          setTimeout(() => { window.print(); document.body.classList.remove('printing'); }, 50);
        } }, '🖨️ Print')
      : null;

    const head = el('header', { class: 'scene-head' },
      el('button', { class: 'btn btn-back', onclick: closeScene }, '⬅ Back to lab'),
      el('div', { class: 'scene-title' },
        el('span', { class: 'scene-icon' }, def.icon),
        el('div', {}, el('h2', {}, def.title), el('p', {}, def.tagline))),
      el('div', { class: 'tools' }, ...ER.reference.buttons(), hintBtn, printBtn));

    const banner = state.solved.includes(id) && id !== 'door'
      ? el('div', { class: 'solved-banner' }, el('span', {}, '✅ Already solved! Your symbol is in the log:'), symbolTiles(def.code))
      : null;
    const body = el('div', { class: 'scene-body' });
    const scene = el('div', { class: 'scene kind-' + def.kind }, head, hintBox, banner, body);
    puzzleView.append(scene);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const api = {
      sfx,
      alreadySolved: state.solved.includes(id),
      solve: () => solvePuzzle(def),
      codes: () => state.solved.map((sid) => ER.get(sid)),
      missing: () => ER.puzzles.filter((p) => !state.solved.includes(p.id)),
      allDone: state.solved.length === ER.puzzles.length,
      escape: showEscape,
    };
    try {
      state.cleanup = def.build(body, api) || null;
    } catch (err) {
      console.error(err);
      body.append(el('p', { class: 'feedback bad' }, 'Oops, this station had a problem loading. Go back and try again.'));
    }
  }

  function closeScene() {
    if (state.cleanup) { try { state.cleanup(); } catch (e) { console.error(e); } }
    state.cleanup = null;
    state.current = null;
    puzzleView.hidden = true;
    puzzleView.innerHTML = '';
    roomView.hidden = false;
    lastPrompt = undefined;
    sfx.back();
    canvas.focus();
  }
  ER.closeScene = closeScene;

  function solvePuzzle(def) {
    if (state.solved.includes(def.id)) return;
    state.solved.push(def.id);
    renderNotes(def.id);
    sfx.solve();
    setTimeout(() => {
      const content = el('div', { class: 'reward' },
        el('div', { class: 'reward-burst' }, '🎉'),
        el('p', { class: 'reward-lead' }, 'Station complete. This coded symbol has been added to your Symbol Log.'),
        el('div', { class: 'reward-tiles' }, symbolTiles(def.code)),
        def.fact ? el('div', { class: 'fact-card' }, el('b', {}, '🔭 Physics note: '), def.fact) : null,
        el('p', { class: 'muted small' }, state.solved.length === ER.puzzles.length
          ? '🚪 That is all 10 symbols. Head to the AIRLOCK at the top of the lab.'
          : `${state.solved.length} of ${ER.puzzles.length} symbols found.`));
      ER.modal({
        title: `${def.icon} ${def.title} solved!`,
        content,
        className: 'reward-modal',
        buttons: [
          { label: '⬅ Back to the lab', class: 'btn-aqua btn-big', onClick: closeScene },
          { label: 'Stay here', class: 'btn-light' },
        ],
      });
    }, 650);
  }

  function showEscape() {
    if (state.timerOn) state.elapsed = (Date.now() - state.startTime) / 1000;
    state.escaped = true;
    state.timerOn = false;
    sfx.escape();
    const confetti = el('div', { class: 'confetti', 'aria-hidden': 'true' });
    const colors = ['#22d3ee', '#ffc233', '#ff6b4a', '#7c5cff', '#22c55e', '#ffffff'];
    for (let i = 0; i < 70; i++) {
      confetti.append(el('i', { style: {
        left: Math.random() * 100 + '%',
        background: colors[i % colors.length],
        animationDelay: Math.random() * 2.5 + 's',
        animationDuration: 2.5 + Math.random() * 2 + 's',
        transform: `rotate(${Math.random() * 360}deg)`,
      } }));
    }
    const content = el('div', { class: 'escape-content' },
      confetti,
      el('h2', { class: 'escape-title' }, 'AIRLOCK OPEN!'),
      el('p', { class: 'escape-time' }, `⏱️ Mission time: ${fmtTime(state.elapsed + state.penalty)}`),
      el('p', { class: 'muted small' }, state.hintsUsed
        ? `(${fmtTime(state.elapsed)} of work, plus ${state.hintsUsed} hint${state.hintsUsed === 1 ? '' : 's'} = +${fmtTime(state.penalty)})`
        : 'No hints taken. Outstanding.'),
      el('div', { class: 'answer-word' }, ...'NEWTON'.split('').map((c) => el('span', {}, c))),
      el('div', { class: 'answer-word small-word' }, el('span', {}, 'I'), el('span', {}, 'S'), el('span', { class: 'gap' }, ''), el('span', {}, 'A'), el('span', { class: 'gap' }, ''), el('span', {}, 'G')),
      el('div', { class: 'fact-card' },
        el('b', {}, '🍎 NEWTON IS A G: '),
        'Isaac Newton wrote down three laws that still explain how everything from a dropped pen to a docking spacecraft moves. He also invented a whole branch of maths (calculus) to do it. Legend.'),
      el('p', { class: 'muted' }, 'You cracked a pigpen cypher, proved you know all three laws, and escaped Station Newton. Show your teacher this screen!'));
    ER.modal({
      content,
      className: 'escape-modal',
      dismissable: false,
      buttons: [
        { label: '🚀 Back to the lab', class: 'btn-light', onClick: closeScene },
        { label: '🔁 Play again', class: 'btn-sun btn-big', onClick: () => location.reload() },
      ],
    });
  }

  // ---------- Intro / help ----------
  function showIntro(first) {
    const content = el('div', { class: 'intro' },
      el('p', { class: 'intro-story' },
        'You are aboard ', el('b', {}, 'Station Newton'), ', an orbital physics lab. A debris strike has cut the power and sealed the ',
        el('b', {}, 'airlock'), '. The station computer will only let you out if you can prove you understand ',
        el('b', {}, 'motion'), ': speed, acceleration, motion graphs, vectors and Newton\'s three laws.'),
      el('ul', { class: 'intro-steps' },
        el('li', {}, el('span', {}, '🚶'), el('div', {}, el('b', {}, 'Explore the lab. '), 'Walk with ', el('kbd', {}, 'WASD'), ' or the ', el('kbd', {}, 'arrow keys'), ', or click where you want to go.')),
        el('li', {}, el('span', {}, '🧩'), el('div', {}, el('b', {}, 'Solve 10 stations. '), 'Walk up to a glowing station and press ', el('kbd', {}, 'E'), ' or click it. Any order you like.')),
        el('li', {}, el('span', {}, '🔣'), el('div', {}, el('b', {}, 'Collect coded symbols. '), 'Each station gives one strange symbol and a number. They are logged for you.')),
        el('li', {}, el('span', {}, '📘'), el('div', {}, el('b', {}, 'Use the reference console. '), 'In the middle of the lab, and on the buttons at the top of every screen: Newton\'s three laws, and vectors vs scalars. Free to use, any time.')),
        el('li', {}, el('span', {}, '⏱️'), el('div', {}, el('b', {}, 'Hints cost 5 minutes each. '), 'Your mission time is on screen. Think first, ask second.')),
        el('li', {}, el('span', {}, '🚪'), el('div', {}, el('b', {}, 'Escape. '), 'At the airlock you must match scenarios to Newton\'s laws, then crack the symbol code.'))),
      el('div', { class: 'row-center' },
        el('button', { class: 'btn btn-aqua', onclick: () => ER.reference.laws() }, '📘 Read Newton\'s laws now'),
        el('button', { class: 'btn btn-aqua', onclick: () => ER.reference.vectors() }, '➡️ Read vectors vs scalars')),
      el('p', { class: 'muted small' }, '⚠️ Progress is only kept while this page is open, so don\'t refresh or close the tab.'));
    ER.modal({
      title: first ? '🚀 Welcome aboard Station Newton' : '❓ How to play',
      content,
      className: 'intro-modal',
      dismissable: !first,
      buttons: [{
        label: first ? '🔧 Start the mission' : 'Got it!',
        class: 'btn-sun btn-big',
        onClick: () => {
          sfx.unlock();
          if (!state.timerOn && !state.escaped) { state.timerOn = true; state.startTime = Date.now() - state.elapsed * 1000; }
          canvas.focus();
        },
      }],
    });
  }

  // ---------- Top bar ----------
  const soundBtn = document.getElementById('btn-sound');
  soundBtn.addEventListener('click', () => {
    sfx.setMuted(!sfx.muted);
    soundBtn.textContent = sfx.muted ? '🔇' : '🔊';
    if (!sfx.muted) sfx.tap();
  });
  document.getElementById('btn-help').addEventListener('click', () => showIntro(false));
  document.getElementById('btn-laws').addEventListener('click', () => ER.reference.laws());
  document.getElementById('btn-vectors').addEventListener('click', () => ER.reference.vectors());

  window.addEventListener('beforeunload', (e) => {
    if (state.solved.length && !state.escaped) { e.preventDefault(); e.returnValue = ''; }
  });

  const stars = document.getElementById('bubbles');
  for (let i = 0; i < 40; i++) {
    const size = 1 + Math.random() * 2.5;
    stars.append(el('span', { style: {
      left: Math.random() * 100 + '%',
      width: size + 'px', height: size + 'px',
      opacity: 0.3 + Math.random() * 0.6,
      animationDuration: 18 + Math.random() * 26 + 's',
      animationDelay: -Math.random() * 30 + 's',
    } }));
  }

  canvas.tabIndex = 0;
  renderNotes();
  requestAnimationFrame(frame);
  showIntro(true);

  ER._debug = {
    state,
    solveAll() { ER.puzzles.forEach((p) => { if (!state.solved.includes(p.id)) state.solved.push(p.id); }); renderNotes(); },
    open: openScene,
    player,
    step(seconds) { for (let t = 0; t < seconds; t += 0.02) update(0.02); },
    redraw(t) { draw(t || 1); },
  };
})();
