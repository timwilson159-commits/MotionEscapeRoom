/* Station: Physics Crossnumber - a numeric crossword where every clue is a calculation. */
ER.register({
  id: 'crossnumber',
  title: 'Crossnumber',
  icon: '🔢',
  kind: 'paper',
  tagline: 'A crossword made of physics answers. Digits must agree',
  code: { letter: 'W', number: 3 },
  printable: true,
  fact: 'Checking your answer against another answer is exactly how scientists work. If two methods disagree, at least one of them is wrong.',
  hints: [
    'Start with the entries you find easiest: 3 across and 6 down are only two digits long. Every shared square must hold the same digit in both directions, which tells you whether you are on the right track.',
    'Speed questions divide (v = d ÷ t), force questions multiply (F = m × a), and the acceleration question divides the change in velocity by the time.',
  ],
  build(body, api) {
    const { el, sfx } = ER;
    const BLOCKS = new Set(['0,3', '1,1', '3,0']);
    const NUMBERS = { '0,0': 1, '0,2': 2, '1,2': 3, '1,3': 4, '2,0': 5, '2,1': 6, '3,1': 7 };
    const ENTRIES = [
      { dir: 'across', num: 1, r: 0, c: 0, len: 3, ans: '245', clue: 'A probe covers 1225 m in 5 s. Average speed, in m/s.' },
      { dir: 'across', num: 3, r: 1, c: 2, len: 2, ans: '64', clue: 'The net force on an 8 kg drone accelerating at 8 m/s², in N.' },
      { dir: 'across', num: 5, r: 2, c: 0, len: 4, ans: '6300', clue: 'The net force on a 900 kg pod accelerating at 7 m/s², in N.' },
      { dir: 'across', num: 7, r: 3, c: 1, len: 3, ans: '805', clue: 'A rover drives at 115 m/s for 7 s. Distance travelled, in m.' },
      { dir: 'down', num: 1, r: 0, c: 0, len: 3, ans: '216', clue: 'A cart covers 648 m in 3 s. Average speed, in m/s.' },
      { dir: 'down', num: 2, r: 0, c: 2, len: 4, ans: '5600', clue: 'The net force on a 700 kg buggy accelerating at 8 m/s², in N.' },
      { dir: 'down', num: 4, r: 1, c: 3, len: 3, ans: '405', clue: 'A shuttle covers 2025 m in 5 s. Average speed, in m/s.' },
      { dir: 'down', num: 6, r: 2, c: 1, len: 2, ans: '38', clue: 'A sled speeds up from rest to 76 m/s in 2 s. Acceleration, in m/s².' },
    ];

    const cells = {};
    const grid = el('div', { class: 'cn-grid' });
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const key = r + ',' + c;
        if (BLOCKS.has(key)) { grid.append(el('div', { class: 'cn-cell block' })); continue; }
        const inp = el('input', { maxlength: '1', inputmode: 'numeric', autocomplete: 'off', 'aria-label': `row ${r + 1} column ${c + 1}` });
        inp.addEventListener('input', () => {
          inp.value = inp.value.replace(/[^0-9]/g, '').slice(-1);
          if (inp.value) {
            const next = cells[r + ',' + (c + 1)] || cells[(r + 1) + ',0'];
            if (next) next.focus();
          }
        });
        cells[key] = inp;
        grid.append(el('div', { class: 'cn-cell' }, NUMBERS[key] ? el('span', { class: 'cn-num' }, String(NUMBERS[key])) : null, inp));
      }
    }

    const entryCells = (e) => Array.from({ length: e.len }, (_, i) => cells[e.dir === 'across' ? `${e.r},${e.c + i}` : `${e.r + i},${e.c}`]);
    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const btn = el('button', { class: 'btn btn-aqua btn-big no-print' }, '✔ Check the grid');
    let done = false;
    btn.addEventListener('click', () => {
      if (done) return;
      const right = ENTRIES.filter((e) => entryCells(e).map((i) => i.value).join('') === e.ans).length;
      if (right === ENTRIES.length) {
        done = true;
        sfx.good();
        Object.values(cells).forEach((i) => (i.disabled = true));
        btn.disabled = true;
        ER.say(fb, '✅ Every entry checks out. Grid complete!', 'good');
        api.solve();
      } else {
        sfx.bad();
        ER.shake(grid);
        ER.say(fb, `${right} of ${ENTRIES.length} entries are correct. Remember every shared square has to work both ways.`, 'bad');
      }
    });

    const clueList = (dir) => el('div', {},
      el('h4', {}, dir === 'across' ? '➡️ Across' : '⬇️ Down'),
      el('ol', {}, ENTRIES.filter((e) => e.dir === dir).map((e) => el('li', { value: String(e.num) }, `${e.clue} (${e.len} digits)`))));

    body.append(
      el('div', { class: 'card intro-card printable' },
        el('h3', { class: 'print-only' }, '🔢 Crossnumber'),
        el('p', {}, '🔢 A crossword made of numbers. Work out each clue and write one digit per square. Squares shared by an across and a down answer must agree.')),
      el('div', { class: 'card printable' },
        el('div', { class: 'cn-wrap' },
          grid,
          el('div', { class: 'cn-clues' }, clueList('across'), clueList('down'))),
        el('div', { class: 'row-center' }, btn),
        fb));
    return null;
  },
});
