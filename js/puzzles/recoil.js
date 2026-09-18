/* Station: Recoil Escape (arcade) - Newton's third law in action. */
ER.register({
  id: 'recoil',
  title: 'Recoil Escape',
  icon: '🧑‍🚀',
  kind: 'game',
  tagline: 'Stranded on a spacewalk with no jetpack. Only Newton can save you',
  code: { letter: 'A', number: 9 },
  printable: false,
  fact: 'Every force comes in a pair. Throw a tool away from you and the tool pushes back on you with an equal and opposite force, so you drift the other way. The heavier the tool, and the faster you throw it, the bigger your push.',
  hints: [
    'You move in the OPPOSITE direction to the tool you throw. To go right, throw a tool to the left. Aim by clicking the direction you want the tool to go.',
    'Heavy tools give a big push, light tools a small one, and you only have a few. Line yourself up with the airlock using a light tool, then use a heavier one to cross the gap. You must be travelling slower than 3 m/s when you arrive or you will bounce off.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const W = 800, H = 460;
    const TOOLS = [
      { key: 'Wrench', mass: 1, push: 0.9, count: 5, col: '#c3d0e8' },
      { key: 'Toolbox', mass: 4, push: 2.4, count: 3, col: '#ffc233' },
      { key: 'Gas tank', mass: 10, push: 5.2, count: 1, col: '#ff6b4a' },
    ];

    const canvas = el('canvas', { width: W, height: H, class: 'game-canvas' });
    const overlay = el('div', { class: 'game-overlay' });
    const trayEl = el('div', { class: 'readout' });
    body.append(
      el('div', { class: 'card intro-card' },
        el('p', {}, '🧑‍🚀 Your tether snapped. The airlock is on the right and you have no jetpack, only a bag of tools. ',
          el('b', {}, 'Click'), ' in the direction you want to THROW a tool. Pick the tool with ', el('kbd', {}, '1'), ' ', el('kbd', {}, '2'), ' ', el('kbd', {}, '3'), ' or the buttons below.'),
        el('p', { class: 'muted small' }, 'Dock inside the airlock at less than 3 m/s. Bumping debris costs you a tool.')),
      el('div', { class: 'game-wrap' }, canvas, overlay),
      trayEl);

    const ctx = canvas.getContext('2d');
    const keys = ER.keys();
    let g, raf = 0, last = 0;
    const AIRLOCK = { x: 716, y: 230, r: 52 };

    function reset() {
      g = {
        a: { x: 90, y: 230, vx: 0, vy: 0, ang: 0, spin: 0.2 },
        tools: TOOLS.map((t) => ({ ...t })),
        sel: 0, thrown: [], running: false, msg: '', msgT: 0, docked: false,
        debris: [
          { x: 330, y: 140, vx: 22, vy: 14, r: 26, s: 0.4 },
          { x: 470, y: 330, vx: -18, vy: -12, r: 30, s: -0.3 },
          { x: 590, y: 120, vx: 12, vy: 20, r: 22, s: 0.5 },
          { x: 250, y: 350, vx: 16, vy: -18, r: 24, s: -0.45 },
        ],
      };
      renderTray();
    }

    function renderTray() {
      trayEl.innerHTML = '';
      g.tools.forEach((t, i) => {
        const b = el('button', {
          class: 'btn ' + (i === g.sel ? 'btn-aqua' : 'btn-light'),
          onclick: () => { g.sel = i; sfx.tap(); renderTray(); },
        }, `${i + 1}. ${t.key} (${t.mass} kg) × ${t.count}`);
        trayEl.append(b);
      });
      trayEl.append(el('span', {}, 'speed = ', el('b', {}, Math.hypot(g.a.vx, g.a.vy).toFixed(1) + ' m/s')));
    }

    function showOverlay(kind) {
      overlay.innerHTML = '';
      overlay.hidden = false;
      const card = (emoji, title, lines, btn) => overlay.append(el('div', { class: 'overlay-card' + (kind === 'win' ? ' win' : '') },
        el('div', { class: 'overlay-emoji' }, emoji), el('h3', {}, title), ...lines.map((l) => el('p', {}, l)), btn));
      if (kind === 'start') card('🧑‍🚀', 'Recoil Escape', ['Click the direction to THROW a tool.', 'You move the opposite way.', 'Dock in the airlock below 3 m/s.'],
        el('button', { class: 'btn btn-sun btn-big', onclick: start }, '▶ Begin spacewalk'));
      else if (kind === 'lose') card('🛠️', 'Out of tools', ['Nothing left to throw, and nothing to push against.', 'Plan your throws: aim first, then use the heavy tools for the long gap.'],
        el('button', { class: 'btn btn-sun btn-big', onclick: start }, '🔁 Try again'));
      else if (kind === 'win') card('🚪', 'Docked!', ['You used Newton\'s third law to get home.', 'Answer the debrief below to unlock your symbol.'],
        el('button', { class: 'btn btn-sun', onclick: () => log && log.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, '📝 Debrief'));
    }

    let log = null;
    function showLog() {
      if (log) return;
      log = el('div', { class: 'card report-card' },
        el('h3', {}, '📝 Spacewalk debrief'),
        ER.quizSeq([
          { q: 'You throw a 10 kg gas tank instead of a 1 kg wrench, at the same speed. What happens to the push you get?',
            opts: ['It is much bigger', 'It is much smaller', 'It is exactly the same', 'You get no push at all'], a: 'It is much bigger',
            why: 'The bigger the mass you throw (at the same speed), the bigger the force pair, so the bigger your own change in velocity.' },
          { q: 'Which pair of forces is the action-reaction pair when you throw a tool?',
            opts: ['You push the tool forwards; the tool pushes you backwards', 'Your weight and the station\'s pull', 'The tool speeds up; you slow down', 'Gravity pulls the tool; you push the tool'],
            a: 'You push the tool forwards; the tool pushes you backwards',
            why: 'An action-reaction pair is two forces of the same size, opposite in direction, acting on two DIFFERENT objects.' },
          { q: 'After the throw, why do you keep drifting at a steady speed?',
            opts: ['There is no friction or air resistance to slow you', 'The tool keeps pushing you', 'Gravity pulls you along', 'Your suit has small engines'],
            a: 'There is no friction or air resistance to slow you',
            why: 'Newton\'s first law: with no net force you keep the velocity you have.' },
        ], () => api.solve(), '🧠 Debrief question'));
      body.append(log);
      setTimeout(() => log.scrollIntoView({ behavior: 'smooth', block: 'center' }), 900);
    }

    function start() {
      sfx.unlock();
      reset();
      g.running = true;
      overlay.hidden = true;
      canvas.focus();
    }

    function say(m) { g.msg = m; g.msgT = 2.2; }

    canvas.tabIndex = 0;
    const onDown = (e) => {
      if (!g.running) return;
      const p = ER.canvasPoint(canvas, e);
      throwTool(p.x, p.y);
    };
    const onKey = (e) => {
      if (['1', '2', '3'].includes(e.key)) { g.sel = Number(e.key) - 1; sfx.tap(); renderTray(); }
    };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    function throwTool(tx, ty) {
      const tool = g.tools[g.sel];
      if (!tool || tool.count <= 0) { sfx.bad(); say('No ' + (tool ? tool.key.toLowerCase() : 'tools') + ' left!'); return; }
      const dx = tx - g.a.x, dy = ty - g.a.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;
      tool.count--;
      g.thrown.push({ x: g.a.x + ux * 24, y: g.a.y + uy * 24, vx: ux * 170, vy: uy * 170, col: tool.col, m: tool.mass, life: 6 });
      // equal and opposite: the astronaut recoils the other way
      g.a.vx -= ux * tool.push * 12;
      g.a.vy -= uy * tool.push * 12;
      g.a.spin += (Math.random() - 0.5) * 0.6;
      sfx.bubble();
      renderTray();
    }

    function hurt(msg) {
      const withTools = g.tools.filter((t) => t.count > 0);
      if (withTools.length) {
        const t = withTools[withTools.length - 1];
        t.count--;
        say(msg + ' Lost a ' + t.key.toLowerCase() + '!');
      } else say(msg);
      sfx.hurt();
      renderTray();
    }

    function update(dt) {
      const a = g.a;
      a.x += a.vx * dt * 12;
      a.y += a.vy * dt * 12;
      a.ang += a.spin * dt;
      if (a.x < 24) { a.x = 24; a.vx = Math.abs(a.vx) * 0.6; }
      if (a.x > W - 24) { a.x = W - 24; a.vx = -Math.abs(a.vx) * 0.6; }
      if (a.y < 24) { a.y = 24; a.vy = Math.abs(a.vy) * 0.6; }
      if (a.y > H - 24) { a.y = H - 24; a.vy = -Math.abs(a.vy) * 0.6; }

      g.thrown.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
      g.thrown = g.thrown.filter((p) => p.life > 0);

      g.debris.forEach((d) => {
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.x < d.r || d.x > W - d.r) d.vx *= -1;
        if (d.y < d.r || d.y > H - d.r) d.vy *= -1;
        const dist = Math.hypot(d.x - a.x, d.y - a.y);
        if (dist < d.r + 18) {
          const nx = (a.x - d.x) / (dist || 1), ny = (a.y - d.y) / (dist || 1);
          a.x = d.x + nx * (d.r + 19);
          a.y = d.y + ny * (d.r + 19);
          a.vx = nx * 1.6; a.vy = ny * 1.6;
          hurt('Debris!');
        }
      });

      g.msgT = Math.max(0, g.msgT - dt);
      const speed = Math.hypot(a.vx, a.vy);
      const dd = Math.hypot(a.x - AIRLOCK.x, a.y - AIRLOCK.y);
      if (dd < AIRLOCK.r - 8) {
        if (speed <= 3) {
          g.running = false;
          g.docked = true;
          sfx.solve();
          showOverlay('win');
          showLog();
        } else {
          const nx = (a.x - AIRLOCK.x) / (dd || 1), ny = (a.y - AIRLOCK.y) / (dd || 1);
          a.x = AIRLOCK.x + nx * (AIRLOCK.r + 4);
          a.y = AIRLOCK.y + ny * (AIRLOCK.r + 4);
          a.vx = nx * speed * 0.5; a.vy = ny * speed * 0.5;
          say('Too fast! Slow down before docking.');
          sfx.bad();
        }
      }
      if (g.running && g.tools.every((t) => t.count <= 0) && speed < 0.25) {
        g.running = false;
        showOverlay('lose');
      }
    }

    function draw(t) {
      ctx.fillStyle = '#02060f';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 80; i++) {
        const x = (i * 97) % W, y = (i * 53) % H;
        ctx.fillStyle = i % 5 ? 'rgba(255,255,255,0.5)' : 'rgba(150,220,255,0.85)';
        ctx.fillRect(x, y, 1.6, 1.6);
      }
      // station hull and airlock
      ctx.fillStyle = '#16263f';
      ctx.fillRect(W - 120, 0, 120, H);
      ctx.fillStyle = '#0d1729';
      ctx.fillRect(W - 120, 0, 8, H);
      for (let y = 20; y < H; y += 60) { ctx.fillStyle = '#22d3ee'; ctx.fillRect(W - 40, y, 22, 8); }
      ctx.fillStyle = '#0a1526';
      ctx.beginPath(); ctx.arc(AIRLOCK.x, AIRLOCK.y, AIRLOCK.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = g.docked ? '#22c55e' : '#22d3ee';
      ctx.lineWidth = 5;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -t * 20;
      ctx.beginPath(); ctx.arc(AIRLOCK.x, AIRLOCK.y, AIRLOCK.r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#7fd8ff';
      ctx.font = 'bold 15px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AIRLOCK', AIRLOCK.x, AIRLOCK.y - AIRLOCK.r - 12);
      ctx.font = '12px Fredoka, sans-serif';
      ctx.fillText('dock below 3 m/s', AIRLOCK.x, AIRLOCK.y + AIRLOCK.r + 22);

      g.debris.forEach((d) => {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(t * d.s);
        ctx.fillStyle = '#44557a';
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
          const ang = (i / 7) * Math.PI * 2;
          const rr = d.r * (0.75 + ((i * 37) % 10) / 28);
          i ? ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr) : ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2b3752';
        ctx.beginPath(); ctx.arc(-d.r * 0.2, -d.r * 0.2, d.r * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      g.thrown.forEach((p) => {
        ctx.fillStyle = p.col;
        ctx.fillRect(p.x - 6, p.y - 3, 12, 6);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.08, p.y - p.vy * 0.08); ctx.stroke();
      });

      ER.drawAstronaut(ctx, g.a.x, g.a.y, 0.95, g.a.ang);
      const sp = Math.hypot(g.a.vx, g.a.vy);
      if (sp > 0.1) {
        ctx.strokeStyle = '#22d3ee'; ctx.fillStyle = '#22d3ee'; ctx.lineWidth = 4;
        const ex = g.a.x + g.a.vx * 10, ey = g.a.y + g.a.vy * 10;
        ctx.beginPath(); ctx.moveTo(g.a.x, g.a.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
        ctx.font = 'bold 13px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sp.toFixed(1) + ' m/s', ex, ey - 12);
      }

      ctx.fillStyle = 'rgba(4,14,30,0.85)';
      ctx.fillRect(12, 12, 210, 30 + g.tools.length * 22);
      ctx.strokeStyle = '#2a4d7d'; ctx.lineWidth = 1.5;
      ctx.strokeRect(12, 12, 210, 30 + g.tools.length * 22);
      ctx.fillStyle = '#e8f6ff';
      ctx.font = 'bold 14px Fredoka, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TOOL BAG', 24, 32);
      g.tools.forEach((tool, i) => {
        ctx.fillStyle = i === g.sel ? '#ffc233' : tool.count ? '#e8f6ff' : '#44557a';
        ctx.fillText(`${i + 1}. ${tool.key} (${tool.mass} kg) × ${tool.count}`, 24, 54 + i * 22);
      });

      if (g.msgT > 0) {
        ctx.globalAlpha = Math.min(1, g.msgT);
        ctx.fillStyle = '#ffc233'; ctx.strokeStyle = '#02060f'; ctx.lineWidth = 5;
        ctx.font = 'bold 22px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(g.msg, W / 2, 60);
        ctx.fillText(g.msg, W / 2, 60);
        ctx.globalAlpha = 1;
      }
    }

    let trayT = 0;
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (g.running) update(dt);
      draw(now / 1000);
      trayT += dt;
      if (trayT > 0.25) { trayT = 0; renderTray(); }
      raf = requestAnimationFrame(loop);
    }

    if (ER._debug) ER._debug.recoilLog = showLog;
    reset();
    showOverlay('start');
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); keys.dispose(); window.removeEventListener('keydown', onKey); };
  },
});
