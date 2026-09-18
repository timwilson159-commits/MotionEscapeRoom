/* Station: Firing Range (arcade) - projectile motion, constant horizontal velocity,
   constant downward acceleration, and a destructible surface.
   Controls: arrow keys aim, hold SPACE (or hold the fire button) to charge power. */
ER.register({
  id: 'artillery',
  title: 'Firing Range',
  icon: '🎯',
  kind: 'game',
  tagline: 'Aim with the arrows, hold space for power. 14 shells, 5 targets',
  code: { letter: 'A', number: 9 },
  printable: false,
  fact: 'A projectile has two motions at once. Sideways, nothing pushes it, so its horizontal velocity stays constant (first law). Downwards, its weight pulls it with a constant acceleration (second law). Those two together make the curved path.',
  hints: [
    'Change ONE thing at a time, like a real experiment. Fire, watch where it lands, then adjust the angle a little and fire again. The dotted lines show your last two shots.',
    'On flat ground 45° gives the longest range, so use bigger angles to lob over the hills and smaller angles for flat, direct shots. The buried target needs several hits in the SAME spot to dig a crater down to it, so leave yourself enough shells.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const W = 900, H = 480, GRAV = 180, CANNON_X = 62, BLAST = 34;
    const SHELLS = 14, CHARGE_RATE = 26, MIN_POWER = 20, MAX_POWER = 100;

    const canvas = el('canvas', { width: W, height: H, class: 'game-canvas' });
    const overlay = el('div', { class: 'game-overlay' });
    const fireBtn = el('button', { class: 'btn btn-sun btn-big hold-btn' }, '💥 HOLD TO CHARGE');
    const readout = el('div', { class: 'readout' });

    body.append(
      el('div', { class: 'card intro-card' },
        el('p', {}, '🎯 The station\'s gunnery range sits on the airless moon below, so there is ', el('b', {}, 'no air resistance'),
          '. Destroy all ', el('b', {}, '5 targets'), ' with ', el('b', {}, '14 shells'), '.'),
        el('div', { class: 'control-help' },
          el('span', {}, el('kbd', {}, '↑'), el('kbd', {}, '↓'), ' or ', el('kbd', {}, 'W'), el('kbd', {}, 'S'), ' angle (hold to sweep)'),
          el('span', {}, el('kbd', {}, '←'), el('kbd', {}, '→'), ' or ', el('kbd', {}, 'A'), el('kbd', {}, 'D'), ' angle by 5°'),
          el('span', {}, el('b', {}, 'Hold '), el('kbd', {}, 'Space'), ' to build power, ', el('b', {}, 'release'), ' to fire')),
        el('p', { class: 'muted small' }, 'Each shell explodes and blows a crater in the ground. One target is buried: you will have to dig it out. Run out of shells and the range resets.')),
      el('div', { class: 'game-wrap' }, canvas, overlay),
      el('div', { class: 'row-center' }, fireBtn),
      readout);

    const ctx = canvas.getContext('2d');
    let g, raf = 0, last = 0, readoutDirty = false, readoutT = 0;
    const held = new Set(), holdT = {};
    // arrows or W/S for a 1 degree nudge, arrows or A/D for 5 degrees; holding sweeps
    const dirFor = (k) => {
      const key = String(k).toLowerCase();
      if (key === 'arrowup' || key === 'w') return { dir: 1, fine: true };
      if (key === 'arrowdown' || key === 's') return { dir: -1, fine: true };
      if (key === 'arrowright' || key === 'd') return { dir: 1, fine: false };
      if (key === 'arrowleft' || key === 'a') return { dir: -1, fine: false };
      return null;
    };

    const hill = (x, cx, w, amp) => { const d = (x - cx) / w; return Math.exp(-d * d) * amp; };
    function buildTerrain() {
      const h = new Float32Array(W + 1);
      for (let x = 0; x <= W; x++) {
        let y = 352 + Math.sin(x * 0.011) * 18 + Math.sin(x * 0.0042 + 1.3) * 26;
        y -= hill(x, 300, 70, 55);
        y -= hill(x, 470, 85, 120);
        y -= hill(x, 700, 80, 78);
        if (x < 120) y = 352;
        h[x] = Math.max(110, Math.min(H - 8, y));
      }
      return h;
    }

    function reset() {
      const h = buildTerrain();
      const surface = (x) => h[Math.max(0, Math.min(W, Math.round(x)))];
      g = {
        h,
        angle: 45,
        power: MIN_POWER,
        charging: false,
        shot: null, shots: 0, trails: [], blasts: [], running: false, msg: '', msgT: 0,
        targets: [
          { x: 215, y: surface(215) - 11, r: 11, hit: false, label: 'small' },
          { x: 355, y: surface(355) - 13, r: 13, hit: false, label: 'small' },
          { x: 470, y: surface(470) + 58, r: 15, hit: false, buried: true, label: 'buried' },
          { x: 645, y: surface(645) - 21, r: 21, hit: false, label: 'far' },
          { x: 820, y: surface(820) - 27, r: 27, hit: false, label: 'far' },
        ],
      };
    }

    function showOverlay(kind) {
      overlay.innerHTML = '';
      overlay.hidden = false;
      if (kind === 'start') {
        overlay.append(el('div', { class: 'overlay-card' },
          el('div', { class: 'overlay-emoji' }, '🎯'),
          el('h3', {}, 'Firing Range'),
          el('p', {}, 'Arrow keys or W/S set the angle (hold them to sweep). Hold Space to build power, release to fire.'),
          el('p', {}, el('b', {}, '14 shells. 5 targets.'), ' The middle one is buried under a hill.'),
          el('button', { class: 'btn btn-sun btn-big', onclick: start }, '▶ Take the controls')));
      } else if (kind === 'fail') {
        const left = g.targets.filter((t) => !t.hit).length;
        overlay.append(el('div', { class: 'overlay-card' },
          el('div', { class: 'overlay-emoji' }, '🚫'),
          el('h3', {}, 'Out of shells'),
          el('p', {}, `All 14 fired, with ${left} target${left === 1 ? '' : 's'} still standing.`),
          el('p', {}, 'Tip: note the angle and power that worked, and do not waste shells on wild guesses.'),
          el('button', { class: 'btn btn-sun btn-big', onclick: start }, '🔁 Restart the range')));
      } else if (kind === 'win') {
        overlay.append(el('div', { class: 'overlay-card win' },
          el('div', { class: 'overlay-emoji' }, '🏆'),
          el('h3', {}, 'Range clear!'),
          el('p', {}, `All 5 targets destroyed with ${g.shots} of ${SHELLS} shells.`),
          el('p', {}, 'Answer the gunnery report below to unlock your symbol.'),
          el('button', { class: 'btn btn-sun', onclick: () => log && log.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, '📝 Gunnery report')));
      }
    }

    let log = null;
    function showLog() {
      if (log) return;
      log = el('div', { class: 'card report-card' },
        el('h3', {}, '📝 Gunnery report'),
        ER.quizSeq([
          { q: '➡️ While the shell is in the air (no air resistance), what happens to its HORIZONTAL velocity?',
            opts: ['It stays constant', 'It steadily decreases', 'It steadily increases', 'It drops to zero at the top'],
            a: 'It stays constant',
            why: 'Nothing pushes it sideways, so by Newton\'s first law the sideways velocity does not change. Only the downward motion changes.' },
          { q: '⬇️ What makes the path curve downwards?',
            opts: ['A constant downward acceleration caused by its weight', 'The shell running out of force', 'Air resistance pushing it down', 'The shell getting heavier as it flies'],
            a: 'A constant downward acceleration caused by its weight',
            why: 'Weight is a force, and F = ma means a constant downward force gives a constant downward acceleration. A shell does not "run out of force": force is not something it carries.' },
          { q: '💥 The gun jumps backwards every time it fires. Which law explains that?',
            opts: ['Third law', 'First law', 'Second law', 'None of them'],
            a: 'Third law',
            why: 'The gun pushes the shell forwards, so the shell pushes the gun backwards with an equal and opposite force.' },
          { q: '📐 On flat ground, which angle sends a shell the furthest?',
            opts: ['45°', '10°', '75°', '85°'], a: '45°',
            why: 'Too flat and it hits the ground early; too steep and it goes up rather than along. 45° splits the difference.' },
        ], () => api.solve(), '🧠 Report question'));
      body.append(log);
      setTimeout(() => log.scrollIntoView({ behavior: 'smooth', block: 'center' }), 900);
    }

    function start() {
      sfx.unlock();
      reset();
      g.running = true;
      held.clear();
      overlay.hidden = true;
      canvas.focus();
      updateReadout();
    }

    function say(m) { g.msg = m; g.msgT = 2.2; }

    function barrelTip() {
      const rad = (g.angle * Math.PI) / 180;
      const base = { x: CANNON_X, y: g.h[CANNON_X] - 18 };
      return { x: base.x + Math.cos(rad) * 46, y: base.y - Math.sin(rad) * 46, base };
    }

    const canFire = () => g.running && !g.shot && g.shots < SHELLS;

    function startCharge() {
      if (!canFire() || g.charging) return;
      g.charging = true;
      g.power = MIN_POWER;
      sfx.tap();
    }

    function releaseCharge() {
      if (!g.charging) return;
      g.charging = false;
      if (!canFire()) return;
      const rad = (g.angle * Math.PI) / 180;
      const speed = g.power * 4.4;
      const tip = barrelTip();
      g.shot = { x: tip.x, y: tip.y, vx: Math.cos(rad) * speed, vy: -Math.sin(rad) * speed, t: 0, path: [] };
      g.shots++;
      sfx.ping();
      updateReadout();
    }

    function aim(delta) {
      if (!g.running) return;
      g.angle = Math.max(5, Math.min(85, g.angle + delta));
      readoutDirty = true;
    }

    const onKeyDown = (e) => {
      if (!g || !g.running) return;
      if (e.target instanceof HTMLInputElement) return;
      const m = dirFor(e.key);
      if (m) {
        e.preventDefault();
        const id = String(e.key).toLowerCase();
        if (!held.has(id)) { held.add(id); holdT[id] = 0; aim(m.dir * (m.fine ? 1 : 5)); }
        return;
      }
      if (e.key === ' ') { e.preventDefault(); startCharge(); }
    };
    const onKeyUp = (e) => {
      const id = String(e.key).toLowerCase();
      if (held.has(id)) { held.delete(id); return; }
      if (e.key === ' ') { e.preventDefault(); releaseCharge(); }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    canvas.tabIndex = 0;
    const onPointerDown = (e) => { e.preventDefault(); startCharge(); };
    canvas.addEventListener('pointerdown', onPointerDown);
    fireBtn.addEventListener('pointerdown', onPointerDown);
    const onPointerUp = () => releaseCharge();
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    function explode(x, y) {
      sfx.hurt();
      g.blasts.push({ x, y, r: 6, life: 0.5 });
      for (let i = -BLAST; i <= BLAST; i++) {
        const cx = Math.round(x + i);
        if (cx < 0 || cx > W) continue;
        const dy = Math.sqrt(Math.max(0, BLAST * BLAST - i * i));
        const top = y - dy, bottom = y + dy;
        if (g.h[cx] >= top && g.h[cx] <= bottom) g.h[cx] = Math.min(H - 4, bottom);
      }
      let got = 0;
      g.targets.forEach((t) => {
        if (!t.hit && Math.hypot(t.x - x, t.y - y) < BLAST + t.r) { t.hit = true; got++; }
      });
      if (got) {
        sfx.solve();
        say(got > 1 ? `${got} targets destroyed!` : 'Target destroyed!');
      }
      const left = g.targets.filter((t) => !t.hit).length;
      if (!left) {
        g.running = false;
        setTimeout(() => { showOverlay('win'); showLog(); }, 500);
      } else if (g.shots >= SHELLS) {
        g.running = false;
        g.charging = false;
        setTimeout(() => showOverlay('fail'), 600);
      } else if (SHELLS - g.shots <= 3) {
        say(`${SHELLS - g.shots} shell${SHELLS - g.shots === 1 ? '' : 's'} left!`);
      }
      updateReadout();
    }

    function update(dt) {
      g.msgT = Math.max(0, g.msgT - dt);
      held.forEach((id) => {
        const m = dirFor(id);
        if (!m) return;
        holdT[id] += dt;
        if (holdT[id] > 0.2) aim(m.dir * (m.fine ? 34 : 64) * dt);
      });
      if (g.charging) g.power = Math.min(MAX_POWER, g.power + CHARGE_RATE * dt);
      g.blasts.forEach((b) => { b.r += 150 * dt; b.life -= dt; });
      g.blasts = g.blasts.filter((b) => b.life > 0);
      const s = g.shot;
      if (!s) return;
      const steps = 4;
      for (let i = 0; i < steps; i++) {
        const h = dt / steps;
        s.vy += GRAV * h;
        s.x += s.vx * h;
        s.y += s.vy * h;
        s.t += h;
        if (s.t > 0.05) s.path.push({ x: s.x, y: s.y });
        const hitTarget = g.targets.find((t) => !t.hit && Math.hypot(t.x - s.x, t.y - s.y) < t.r + 3);
        const ground = s.x >= 0 && s.x <= W && s.y >= g.h[Math.round(s.x)];
        if (hitTarget || ground) {
          g.trails.push(s.path);
          if (g.trails.length > 2) g.trails.shift();
          const ix = s.x, iy = hitTarget ? s.y : g.h[Math.round(Math.max(0, Math.min(W, s.x)))];
          g.shot = null;
          explode(ix, iy);
          return;
        }
        if (s.y > H + 200 || s.x < -60 || s.x > W + 200 || s.t > 14) {
          g.trails.push(s.path);
          if (g.trails.length > 2) g.trails.shift();
          g.shot = null;
          say('Off the range! That shell is wasted.');
          if (g.shots >= SHELLS && g.targets.some((t) => !t.hit)) {
            g.running = false;
            setTimeout(() => showOverlay('fail'), 600);
          }
          updateReadout();
          return;
        }
      }
    }

    function draw(t) {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#040a18');
      sky.addColorStop(1, '#0d1b33');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) {
        const x = (i * 121) % W, y = (i * 67) % 260;
        ctx.fillStyle = i % 5 ? 'rgba(255,255,255,0.45)' : 'rgba(150,220,255,0.8)';
        ctx.fillRect(x, y, 1.6, 1.6);
      }
      ctx.fillStyle = '#16263f';
      ctx.fillRect(660, 40, 120, 22);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(676, 46, 12, 10); ctx.fillRect(700, 46, 12, 10); ctx.fillRect(724, 46, 12, 10);
      ctx.fillStyle = '#44557a';
      ctx.fillRect(700, 62, 8, 16);

      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x++) ctx.lineTo(x, g.h[x]);
      ctx.lineTo(W, H);
      ctx.closePath();
      const rock = ctx.createLinearGradient(0, 200, 0, H);
      rock.addColorStop(0, '#5b6478');
      rock.addColorStop(1, '#2a3244');
      ctx.fillStyle = rock;
      ctx.fill();
      ctx.strokeStyle = '#8fa1bd';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x <= W; x++) x ? ctx.lineTo(x, g.h[x]) : ctx.moveTo(x, g.h[x]);
      ctx.stroke();

      g.targets.forEach((tg) => {
        if (tg.hit) return;
        const buriedNow = tg.y - tg.r > g.h[Math.round(tg.x)];
        if (tg.buried && buriedNow) {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(255,194,51,0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r + 3, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,194,51,0.75)';
          ctx.font = '12px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('buried target', tg.x, g.h[Math.round(tg.x)] - 8);
          return;
        }
        ctx.fillStyle = '#ff6b4a';
        ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * 0.62, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff6b4a';
        ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0b1a33'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, 0, Math.PI * 2); ctx.stroke();
      });

      ctx.setLineDash([4, 7]);
      g.trails.forEach((path, i) => {
        ctx.strokeStyle = i === g.trails.length - 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        path.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
      });
      ctx.setLineDash([]);

      const tip = barrelTip();
      ctx.strokeStyle = '#c3d0e8';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tip.base.x, tip.base.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
      ctx.fillStyle = '#7f93bb';
      ctx.beginPath(); ctx.arc(tip.base.x, tip.base.y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#44557a';
      ctx.fillRect(tip.base.x - 22, tip.base.y + 6, 44, 16);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(tip.base.x - 10, tip.base.y + 10, 20, 6);

      // aim guide, length shows the charge
      ctx.strokeStyle = g.charging ? 'rgba(255,194,51,0.85)' : 'rgba(34,211,238,0.5)';
      ctx.lineWidth = g.charging ? 3 : 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      const rad = (g.angle * Math.PI) / 180;
      const guide = 30 + (g.charging ? g.power : MIN_POWER);
      ctx.lineTo(tip.x + Math.cos(rad) * guide, tip.y - Math.sin(rad) * guide);
      ctx.stroke();
      ctx.setLineDash([]);

      if (g.shot) {
        ctx.fillStyle = '#ffc233';
        ctx.beginPath(); ctx.arc(g.shot.x, g.shot.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,194,51,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        g.shot.path.slice(-18).forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
      }

      g.blasts.forEach((b) => {
        ctx.globalAlpha = Math.max(0, b.life * 2);
        ctx.fillStyle = '#ffc233';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = Math.max(0, b.life);
        ctx.fillStyle = '#ff6b4a';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      // HUD
      ctx.fillStyle = 'rgba(4,14,30,0.85)';
      ctx.fillRect(12, 12, 250, 108);
      ctx.strokeStyle = '#2a4d7d'; ctx.lineWidth = 1.5;
      ctx.strokeRect(12, 12, 250, 108);
      ctx.fillStyle = '#e8f6ff';
      ctx.font = 'bold 15px Fredoka, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`angle    ${Math.round(g.angle)}°   (↑ ↓ / W S)`, 24, 36);
      ctx.fillText('power', 24, 60);
      const shellsLeft = SHELLS - g.shots;
      ctx.fillStyle = shellsLeft <= 3 ? '#ff6b4a' : '#e8f6ff';
      ctx.fillText(`shells   ${shellsLeft} of ${SHELLS} left`, 24, 110);
      // power meter
      ctx.fillStyle = '#12233f';
      ctx.fillRect(84, 46, 160, 18);
      const frac = (g.power - MIN_POWER) / (MAX_POWER - MIN_POWER);
      ctx.fillStyle = g.charging ? (g.power >= MAX_POWER ? '#ff6b4a' : '#ffc233') : '#44557a';
      ctx.fillRect(84, 46, 160 * (g.charging ? frac : 0), 18);
      ctx.strokeStyle = '#7fd8ff'; ctx.lineWidth = 1.5;
      ctx.strokeRect(84, 46, 160, 18);
      ctx.fillStyle = '#e8f6ff';
      ctx.font = 'bold 13px Fredoka, sans-serif';
      ctx.fillText(g.charging ? Math.round(g.power) + '%' : 'hold SPACE', 88, 84);

      const left = g.targets.filter((tg) => !tg.hit).length;
      ctx.fillStyle = 'rgba(4,14,30,0.85)';
      ctx.fillRect(W - 190, 12, 178, 40);
      ctx.strokeRect(W - 190, 12, 178, 40);
      ctx.fillStyle = left ? '#ffc233' : '#22c55e';
      ctx.font = 'bold 18px Fredoka, sans-serif';
      ctx.fillText(`🎯 targets left: ${left}`, W - 178, 38);

      if (g.msgT > 0) {
        ctx.globalAlpha = Math.min(1, g.msgT);
        ctx.fillStyle = '#ffc233'; ctx.strokeStyle = '#02060f'; ctx.lineWidth = 5;
        ctx.font = 'bold 24px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(g.msg, W / 2, 140);
        ctx.fillText(g.msg, W / 2, 140);
        ctx.globalAlpha = 1;
      }
    }

    function updateReadout() {
      readout.innerHTML = '';
      readout.append(
        el('span', {}, 'angle = ', el('b', {}, Math.round(g.angle) + '°')),
        el('span', {}, 'shells left = ', el('b', {}, String(SHELLS - g.shots))),
        el('span', {}, 'targets left = ', el('b', {}, String(g.targets.filter((tg) => !tg.hit).length))));
      fireBtn.disabled = !canFire();
    }

    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (g.running) update(dt);
      draw(now / 1000);
      readoutT += dt;
      if (readoutDirty && readoutT > 0.12) { readoutT = 0; readoutDirty = false; updateReadout(); }
      raf = requestAnimationFrame(loop);
    }

    if (ER._debug) {
      ER._debug.artilleryLog = showLog;
      ER._debug.artilleryDraw = (t) => draw(t || 1);
      ER._debug.artilleryState = () => g;
      ER._debug.artilleryFire = (angle, power) => { g.angle = angle; g.power = power; g.charging = true; releaseCharge(); };
      ER._debug.artilleryStep = (seconds) => { for (let t = 0; t < seconds; t += 1 / 60) update(1 / 60); };
    }
    reset();
    updateReadout();
    showOverlay('start');
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  },
});
