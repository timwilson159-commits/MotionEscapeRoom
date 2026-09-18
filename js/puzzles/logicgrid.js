/* Station: Motion Logic Grid - five vehicles, their top speed, acceleration and graph. */
ER.register({
  id: 'logicgrid',
  title: 'Motion Logic Grid',
  icon: '🧩',
  kind: 'paper',
  tagline: 'Five vehicles, three clues each, one answer',
  code: { letter: 'N', number: 6 },
  printable: true,
  fact: 'Time to reach top speed = top speed ÷ acceleration. Rearranging a formula three ways (v = a × t, a = v ÷ t, t = v ÷ a) is one of the most useful skills in physics.',
  hints: [
    'Several clues give a TIME. Time to reach top speed = top speed ÷ acceleration, so a clue about time links a speed and an acceleration together. Test the options: which speed ÷ which acceleration gives that time?',
    'Start with the rocket sled: top speed 100 m/s reached in 4 s means a = 100 ÷ 4 = 25 m/s². Then the tram: 40 s at the smallest acceleration. Which speed ÷ which acceleration equals 40?',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const VEHICLES = [
      { id: 'sled', name: 'Rocket sled', art: ER.art.rocketSled },
      { id: 'car', name: 'Electric car', art: ER.art.electricCar },
      { id: 'cyclist', name: 'Cyclist', art: ER.art.cyclist },
      { id: 'tram', name: 'Tram', art: ER.art.tram },
      { id: 'drone', name: 'Drone', art: ER.art.drone },
    ];
    const CATS = [
      { id: 'speed', title: '🏁 Top speed', opts: ['5 m/s', '12 m/s', '20 m/s', '40 m/s', '100 m/s'] },
      { id: 'accel', title: '📈 Average acceleration', opts: ['0.5 m/s²', '1.5 m/s²', '2 m/s²', '5 m/s²', '25 m/s²'] },
      { id: 'graph', title: '📊 Velocity-time graph', opts: ['A: line up, then flat', 'B: flat, then down to zero', 'C: zig-zag up, down, up', 'D: curve that gets less steep', 'E: flat line the whole time'] },
    ];
    const SOLUTION = {
      sled: { speed: '100 m/s', accel: '25 m/s²', graph: 'A: line up, then flat' },
      car: { speed: '40 m/s', accel: '5 m/s²', graph: 'D: curve that gets less steep' },
      cyclist: { speed: '12 m/s', accel: '1.5 m/s²', graph: 'C: zig-zag up, down, up' },
      tram: { speed: '20 m/s', accel: '0.5 m/s²', graph: 'B: flat, then down to zero' },
      drone: { speed: '5 m/s', accel: '2 m/s²', graph: 'E: flat line the whole time' },
    };
    // Verified by brute force: these clues give exactly one solution.
    const CLUES = [
      'The rocket sled has the highest top speed of the five, and it reaches that top speed in just 4 seconds.',
      'The tram takes 40 seconds to reach its top speed: longer than any other vehicle here.',
      'The cyclist takes 8 seconds to reach top speed.',
      'The drone has the lowest top speed, and its graph is a flat line the whole time.',
      'The electric car has an average acceleration of 5 m/s².',
      'The vehicle with the zig-zag graph has a top speed of 12 m/s.',
      'The tram\'s graph shows it cruising and then braking evenly to a stop.',
      'The vehicle whose graph is a curve that gets less steep has a top speed of 40 m/s.',
    ];

    body.append(el('div', { class: 'card intro-card printable' },
      el('h3', { class: 'print-only' }, '🧩 Motion Logic Grid'),
      el('p', {}, '🧩 Five vehicles were tested on the station track. Each has one top speed, one average acceleration and one velocity-time graph. Use the clues to work out which is which.'),
      el('p', { class: 'muted small' }, 'Remember: time to reach top speed = top speed ÷ acceleration.'),
      el('div', { class: 'animal-row' }, VEHICLES.map((v) => el('div', { class: 'animal-chip' }, el('span', { html: v.art }), v.name)))));

    body.append(el('div', { class: 'card printable' },
      el('h4', {}, '📋 Clues'),
      el('ol', { class: 'clue-list' }, CLUES.map((c) => el('li', {}, c)))));

    const grids = el('div', { class: 'logic-grids' });
    CATS.forEach((cat) => {
      const tbl = el('table', { class: 'lgrid' });
      tbl.append(el('tr', {}, el('th', { class: 'lcorner' }, cat.title), cat.opts.map((o) => el('th', { class: 'lhead' }, el('span', {}, o)))));
      VEHICLES.forEach((v) => {
        tbl.append(el('tr', {}, el('th', { class: 'lrow' }, v.name),
          cat.opts.map(() => {
            const td = el('td', { class: 'lcell', tabindex: '0', role: 'button', 'aria-label': 'blank' });
            const cycle = () => {
              const s = td.dataset.s === 'x' ? 'y' : td.dataset.s === 'y' ? '' : 'x';
              td.dataset.s = s;
              td.textContent = s === 'x' ? '✗' : s === 'y' ? '✓' : '';
              td.setAttribute('aria-label', s === 'x' ? 'no' : s === 'y' ? 'yes' : 'blank');
              sfx.tap();
            };
            td.addEventListener('click', cycle);
            td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(); } });
            return td;
          })));
      });
      grids.append(el('div', { class: 'lgrid-wrap' }, tbl));
    });
    body.append(el('div', { class: 'card printable' }, el('h4', {}, '✏️ Working grids'), grids));

    const selects = {};
    const ans = el('table', { class: 'answer-table' });
    ans.append(el('tr', {}, el('th', {}, 'Vehicle'), CATS.map((c) => el('th', {}, c.title))));
    VEHICLES.forEach((v) => {
      selects[v.id] = {};
      ans.append(el('tr', {},
        el('th', {}, el('span', { class: 'mini-art', html: v.art }), v.name),
        CATS.map((c) => {
          const s = el('select', { 'aria-label': `${v.name} ${c.id}` },
            el('option', { value: '' }, 'choose...'),
            c.opts.map((o) => el('option', { value: o }, o)));
          selects[v.id][c.id] = s;
          return el('td', {}, s);
        })));
    });

    const TOTAL = VEHICLES.length * CATS.length;
    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const checkBtn = el('button', { class: 'btn btn-aqua btn-big no-print' }, '✔ Check my answers');
    checkBtn.addEventListener('click', () => {
      let right = 0, blank = 0;
      VEHICLES.forEach((v) => CATS.forEach((c) => {
        const s = selects[v.id][c.id];
        if (!s.value) blank++;
        if (s.value === SOLUTION[v.id][c.id]) right++;
      }));
      if (blank) { sfx.bad(); ER.say(fb, `Fill in all ${TOTAL} answers first (${blank} still blank).`, 'bad'); return; }
      if (right === TOTAL) {
        VEHICLES.forEach((v) => CATS.forEach((c) => { selects[v.id][c.id].disabled = true; }));
        checkBtn.disabled = true;
        sfx.good();
        ER.say(fb, `🎉 All ${TOTAL} correct. The track log is rebuilt.`, 'good');
        api.solve();
      } else {
        sfx.bad();
        ER.say(fb, `${right} of ${TOTAL} correct. Go back to the clues and your grids, then check again.`, 'bad');
      }
    });

    body.append(el('div', { class: 'card printable' }, el('h4', {}, '🏁 Final answers'), el('div', { class: 'table-scroll' }, ans), el('div', { class: 'row-center' }, checkBtn), fb));
    return null;
  },
});
