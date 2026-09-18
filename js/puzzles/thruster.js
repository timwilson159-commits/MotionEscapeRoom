/* Station: Thruster Run (arcade) - inertia, F = ma, and negative acceleration. */
ER.register({
  id: 'thruster',
  title: 'Thruster Run',
  icon: '🚀',
  kind: 'game',
  tagline: 'Fly the probe by Newton\'s rules: nothing slows you down out here',
  code: { letter: 'O', number: 5 },
  printable: false,
  fact: 'In space there is no friction and no air resistance, so a probe only changes velocity while a thruster is firing. To stop, you must fire the opposite way for just as long: that is negative acceleration.',
  hints: [
    'Thrusters do not control your SPEED, they control your ACCELERATION. Fire forwards to gain velocity, fire backwards to lose it, fire nothing and you keep the velocity you already have.',
    'To dock, start braking early: whatever velocity you built up, you need the same amount of retro thrust time to cancel it. With the cargo attached the mass doubles, so the same thruster gives half the acceleration and you need twice as long to stop.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const W = 800, H = 420, PPM = 1.5, SHIP_X = 220, THRUST = 4000, TIME = 200;

    const canvas = el('canvas', { width: W, height: H, class: 'game-canvas' });
    const overlay = el('div', { class: 'game-overlay' });
    const orderCard = el('div', { class: 'card intro-card' });
    const readout = el('div', { class: 'readout' });
    body.append(
      el('div', { class: 'card intro-card' },
        el('p', {}, '🚀 You are flying a survey probe on a tether-free run. ', el('b', {}, 'Right arrow / D'), ' (or click the right half) fires the ',
          el('b', {}, 'forward thruster'), '. ', el('b', {}, 'Left arrow / A'), ' (or click the left half) fires the ', el('b', {}, 'retro thruster'), '.'),
        el('p', { class: 'muted small' }, 'There is no friction out here. Complete all three flight orders before the mission clock runs out.')),
      orderCard,
      el('div', { class: 'game-wrap' }, canvas, overlay),
      readout);

    const ctx = canvas.getContext('2d');
    const keys = ER.keys();
    let g, raf = 0, last = 0;

    const TASKS = [
      { type: 'hold', target: 20, tol: 1, hold: 3, mass: 1000,
        text: 'Flight order 1: build up to a steady 20 m/s and hold it (within ±1 m/s) for 3 seconds.' },
      { type: 'dock', zone: [380, 420], mass: 1000,
        text: 'Flight order 2: dock at the beacon. Come to a complete stop (0 m/s) inside the green zone at 400 m.' },
      { type: 'dock', zone: [880, 920], mass: 2000,
        text: 'Flight order 3: a 1000 kg cargo pod is attached, so the probe now has a mass of 2000 kg. Same thrusters. Dock in the green zone at 900 m.' },
    ];

    function reset() {
      g = { x: 0, v: 0, a: 0, m: TASKS[0].mass, t: 0, task: 0, hold: 0, time: TIME, running: false, pointer: null, trace: [], traceT: 0, msg: '', msgT: 0 };
      showOrder();
    }

    function showOrder() {
      const task = TASKS[g.task];
      orderCard.innerHTML = '';
      orderCard.append(
        el('h4', {}, `📋 ${g.task + 1} of 3`),
        el('p', {}, task.text),
        task.mass === 2000 ? el('p', { class: 'muted small' }, 'Same force, double the mass: a = F ÷ m means half the acceleration.') : null);
    }

    function showOverlay(kind) {
      overlay.innerHTML = '';
      overlay.hidden = false;
      if (kind === 'start') {
        overlay.append(el('div', { class: 'overlay-card' },
          el('div', { class: 'overlay-emoji' }, '🚀'),
          el('h3', {}, 'Thruster Run'),
          el('p', {}, 'Forward thruster: → or D. Retro thruster: ← or A.'),
          el('p', {}, 'Three flight orders. Remember: no friction in space.'),
          el('button', { class: 'btn btn-sun btn-big', onclick: start }, '▶ Launch')));
      } else if (kind === 'lose') {
        overlay.append(el('div', { class: 'overlay-card' },
          el('div', { class: 'overlay-emoji' }, '⏱️'),
          el('h3', {}, 'Mission clock expired'),
          el('p', {}, 'Tip: fire the retro thruster for about as long as you fired the forward one.'),
          el('button', { class: 'btn btn-sun btn-big', onclick: start }, '🔁 Try again')));
      } else if (kind === 'win') {
        overlay.append(el('div', { class: 'overlay-card win' },
          el('div', { class: 'overlay-emoji' }, '🛰️'),
          el('h3', {}, 'All three orders complete!'),
          el('p', {}, 'Answer the two flight-log questions below to unlock your symbol.'),
          el('button', { class: 'btn btn-sun', onclick: () => log && log.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, '📝 Flight log')));
      }
    }

    let log = null;
    function showLog() {
      if (log) return;
      log = el('div', { class: 'card report-card' },
        el('h3', {}, '📝 Flight log'),
        ER.quizSeq([
          { q: 'With the cargo pod attached the mass doubled, but the thruster force stayed the same. What happened to the acceleration?',
            opts: ['It halved', 'It doubled', 'It stayed the same', 'It dropped to zero'], a: 'It halved',
            why: 'a = F ÷ m. If m doubles and F stays the same, a must halve.' },
          { q: 'While you were coasting with both thrusters off, what was happening to the probe?',
            opts: ['It kept moving at a constant velocity', 'It slowly came to a stop', 'It kept speeding up', 'It fell downwards'],
            a: 'It kept moving at a constant velocity',
            why: 'No net force means no acceleration: Newton\'s first law. There is no friction in space to slow it down.' },
        ], () => api.solve(), '🧠 Log question'));
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

    function say(msg) { g.msg = msg; g.msgT = 2.4; }

    canvas.tabIndex = 0;
    const onDown = (e) => { const p = ER.canvasPoint(canvas, e); g.pointer = p.x < W / 2 ? 'rev' : 'fwd'; };
    const onUp = () => { if (g) g.pointer = null; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);

    function update(dt) {
      const task = TASKS[g.task];
      let thrust = 0;
      if (keys.down('arrowright', 'd') || g.pointer === 'fwd') thrust = 1;
      else if (keys.down('arrowleft', 'a') || g.pointer === 'rev') thrust = -1;
      g.a = (thrust * THRUST) / g.m;
      g.v += g.a * dt;
      g.x += g.v * dt;
      if (g.x < 0) { g.x = 0; if (g.v < 0) g.v = 0; }
      g.t += dt;
      g.time -= dt;
      g.msgT = Math.max(0, g.msgT - dt);
      g.traceT += dt;
      if (g.traceT > 0.1) { g.traceT = 0; g.trace.push({ t: g.t, v: g.v }); if (g.trace.length > 220) g.trace.shift(); }

      if (task.type === 'hold') {
        if (Math.abs(g.v - task.target) <= task.tol) g.hold += dt;
        else g.hold = 0;
        if (g.hold >= task.hold) nextTask();
      } else {
        const inZone = g.x >= task.zone[0] && g.x <= task.zone[1];
        if (inZone && Math.abs(g.v) < 0.4) nextTask();
        else if (g.x > task.zone[1] + 80 && g.v > 0) say('Overshooting! Fire the retro thruster.');
      }
      if (g.time <= 0) { g.running = false; sfx.hurt(); showOverlay('lose'); }
    }

    function nextTask() {
      sfx.good();
      g.task++;
      g.hold = 0;
      if (g.task >= TASKS.length) {
        g.running = false;
        showOverlay('win');
        showLog();
        return;
      }
      g.m = TASKS[g.task].mass;
      say(g.task === 2 ? 'Cargo attached: mass 2000 kg' : 'Order complete!');
      showOrder();
    }

    function draw(t) {
      ctx.fillStyle = '#02060f';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) {
        const sx = (i * 137.5 - g.x * PPM * 0.25) % (W + 40);
        const x = (sx + W + 40) % (W + 40) - 20;
        const y = (i * 61) % H;
        ctx.fillStyle = i % 4 ? 'rgba(255,255,255,0.55)' : 'rgba(150,220,255,0.8)';
        ctx.fillRect(x, y, i % 7 ? 1.5 : 2.5, i % 7 ? 1.5 : 2.5);
      }
      const camX = g.x - SHIP_X / PPM;
      const toScreen = (m) => (m - camX) * PPM;
      // distance ruler
      ctx.strokeStyle = 'rgba(34,211,238,0.35)';
      ctx.fillStyle = '#7fd8ff';
      ctx.font = '12px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      const startM = Math.floor(camX / 50) * 50;
      for (let m = startM; m < camX + W / PPM + 50; m += 50) {
        const x = toScreen(m);
        ctx.beginPath(); ctx.moveTo(x, H - 40); ctx.lineTo(x, H - 28); ctx.stroke();
        ctx.fillText(m + ' m', x, H - 12);
      }
      ctx.strokeStyle = 'rgba(34,211,238,0.5)';
      ctx.beginPath(); ctx.moveTo(0, H - 40); ctx.lineTo(W, H - 40); ctx.stroke();

      const task = TASKS[g.task] || TASKS[TASKS.length - 1];
      if (task.type === 'dock') {
        const x0 = toScreen(task.zone[0]), x1 = toScreen(task.zone[1]);
        ctx.fillStyle = 'rgba(34,197,94,0.22)';
        ctx.fillRect(x0, 60, x1 - x0, H - 110);
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(x0, 60, x1 - x0, H - 110);
        ctx.setLineDash([]);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 15px Fredoka, sans-serif';
        ctx.fillText('DOCKING ZONE', (x0 + x1) / 2, 52);
        ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ffc233' : '#8a6a1a';
        ctx.beginPath(); ctx.arc((x0 + x1) / 2, 78, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#ffc233';
        ctx.font = 'bold 16px Fredoka, sans-serif';
        ctx.fillText('TARGET: 20 m/s', W / 2, 48);
        ctx.fillStyle = '#0d2242';
        ctx.fillRect(W / 2 - 110, 58, 220, 16);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(W / 2 - 110, 58, 220 * Math.min(1, g.hold / task.hold), 16);
        ctx.strokeStyle = '#7fd8ff'; ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - 110, 58, 220, 16);
        ctx.fillStyle = '#e8f6ff';
        ctx.font = '12px Fredoka, sans-serif';
        ctx.fillText('hold steady', W / 2, 88);
      }

      const fwd = keys.down('arrowright', 'd') || g.pointer === 'fwd';
      const rev = keys.down('arrowleft', 'a') || g.pointer === 'rev';
      ER.drawProbe(ctx, SHIP_X, H / 2 - 20, 1.25, fwd && g.running, rev && g.running);

      // velocity and acceleration vectors
      const vArrow = Math.max(-150, Math.min(150, g.v * 4));
      arrow(SHIP_X, H / 2 - 70, SHIP_X + vArrow, H / 2 - 70, '#22d3ee', 'v = ' + g.v.toFixed(1) + ' m/s');
      if (g.a !== 0) arrow(SHIP_X, H / 2 + 34, SHIP_X + g.a * 26, H / 2 + 34, '#ff6b4a', 'a = ' + g.a.toFixed(1) + ' m/s²');

      // live velocity-time trace
      const bx = 14, by = H - 150, bw = 210, bh = 100;
      ctx.fillStyle = 'rgba(4,14,30,0.85)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#2a4d7d'; ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.strokeStyle = '#44557a';
      ctx.beginPath(); ctx.moveTo(bx + 24, by + 8); ctx.lineTo(bx + 24, by + bh - 18); ctx.lineTo(bx + bw - 8, by + bh - 18); ctx.stroke();
      ctx.fillStyle = '#7fd8ff';
      ctx.font = '11px Fredoka, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('v', bx + 8, by + 16);
      ctx.fillText('t', bx + bw - 16, by + bh - 6);
      if (g.trace.length > 1) {
        const t0 = g.trace[0].t, t1 = Math.max(g.trace[g.trace.length - 1].t, t0 + 1);
        const maxV = Math.max(25, ...g.trace.map((p) => Math.abs(p.v)));
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
        ctx.beginPath();
        g.trace.forEach((p, i) => {
          const x = bx + 24 + ((p.t - t0) / (t1 - t0)) * (bw - 34);
          const y = by + bh - 18 - (p.v / maxV) * (bh - 30);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke();
      }

      // HUD
      ctx.fillStyle = 'rgba(4,14,30,0.85)';
      ctx.fillRect(W - 210, 12, 198, 96);
      ctx.strokeStyle = '#2a4d7d'; ctx.strokeRect(W - 210, 12, 198, 96);
      ctx.fillStyle = '#e8f6ff';
      ctx.font = 'bold 15px Fredoka, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`velocity  ${g.v.toFixed(1)} m/s`, W - 198, 36);
      ctx.fillText(`accel     ${g.a.toFixed(1)} m/s²`, W - 198, 58);
      ctx.fillText(`mass      ${g.m} kg`, W - 198, 80);
      ctx.fillText(`position  ${g.x.toFixed(0)} m`, W - 198, 102);
      ctx.fillStyle = g.time < 30 ? '#ff6b4a' : '#ffc233';
      ctx.font = 'bold 18px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏱ ' + Math.max(0, Math.ceil(g.time)) + ' s', 110, 34);

      if (g.msgT > 0) {
        ctx.globalAlpha = Math.min(1, g.msgT);
        ctx.fillStyle = '#ffc233';
        ctx.strokeStyle = '#02060f'; ctx.lineWidth = 5;
        ctx.font = 'bold 24px Fredoka, sans-serif';
        ctx.strokeText(g.msg, W / 2, H / 2 + 110);
        ctx.fillText(g.msg, W / 2, H / 2 + 110);
        ctx.globalAlpha = 1;
      }
    }

    function arrow(x0, y0, x1, y1, col, label) {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const dir = x1 >= x0 ? 1 : -1;
      if (Math.abs(x1 - x0) > 4) {
        ctx.beginPath();
        ctx.moveTo(x1 + dir * 10, y1); ctx.lineTo(x1, y1 - 7); ctx.lineTo(x1, y1 + 7);
        ctx.closePath(); ctx.fill();
      }
      ctx.font = 'bold 13px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x0 + (x1 - x0) / 2, y0 - 12);
    }

    function updateReadout() {
      readout.innerHTML = '';
      readout.append(
        el('span', {}, 'v = ', el('b', {}, g.v.toFixed(1) + ' m/s')),
        el('span', {}, 'a = ', el('b', {}, g.a.toFixed(1) + ' m/s²')),
        el('span', {}, 'm = ', el('b', {}, g.m + ' kg')),
        el('span', {}, 'x = ', el('b', {}, g.x.toFixed(0) + ' m')));
    }

    let readoutT = 0;
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (g.running) update(dt);
      draw(now / 1000);
      readoutT += dt;
      if (readoutT > 0.15) { readoutT = 0; updateReadout(); }
      raf = requestAnimationFrame(loop);
    }

    if (ER._debug) ER._debug.thrusterLog = showLog;
    reset();
    showOverlay('start');
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); keys.dispose(); };
  },
});
