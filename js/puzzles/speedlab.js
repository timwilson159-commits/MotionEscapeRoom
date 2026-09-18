/* Station: Speed & Acceleration Lab - v = d/t, a = Δv/t (including negative), F = ma. */
ER.register({
  id: 'speedlab',
  title: 'Speed Lab',
  icon: '🧮',
  kind: 'paper',
  tagline: 'Six readings from the test track. Get them all, open the lock',
  code: { letter: 'G', number: 10 },
  printable: true,
  fact: 'Acceleration is the change in velocity each second, so its unit is m/s per second, written m/s². A negative acceleration simply means the velocity is dropping: the object is slowing down.',
  hints: [
    'Pick the formula from what the question gives you. Distance and time → v = d ÷ t. Two velocities and a time → a = (v_final − v_start) ÷ t. Mass and force → a = F ÷ m.',
    'Question 4 slows down, so v_final is smaller than v_start and the answer must be NEGATIVE. Question 5: starting from rest means v_start = 0, so v_final = a × t.',
  ],
  build(body, api) {
    const { el } = ER;
    const lock = ER.numberLock({
      title: '🔐 Data lock',
      note: '✏️ Work each one out on paper. Type numbers only: the units are already written for you. One answer is negative.',
      items: [
        { q: '1. A rover travels 120 m in 8 s. What is its average speed?', unit: 'm/s', a: 15 },
        { q: '2. A probe travels at a steady 25 m/s for 12 s. How far does it go?', unit: 'm', a: 300 },
        { q: '3. A sled speeds up from 4 m/s to 28 m/s in 6 s. What is its acceleration?', unit: 'm/s²', a: 4 },
        { q: '4. A capsule slows from 30 m/s to 6 m/s in 8 s. What is its acceleration?', unit: 'm/s²', a: -3 },
        { q: '5. A cart starts from rest and accelerates at 3 m/s² for 9 s. What velocity does it reach?', unit: 'm/s', a: 27 },
        { q: '6. A 4 kg trolley is pushed with a net force of 18 N. What is its acceleration?', unit: 'm/s²', a: 4.5 },
      ],
      onSolved: () => api.solve(),
    });

    body.append(
      el('div', { class: 'card intro-card printable' },
        el('h3', { class: 'print-only' }, '🧮 Speed Lab'),
        el('p', {}, '🧮 Six readings came off the test track before the power failed. Recalculate them all to open the data lock.'),
        el('div', { class: 'formula-strip' },
          el('span', {}, el('b', {}, 'v = d ÷ t')),
          el('span', {}, el('b', {}, 'a = Δv ÷ t')),
          el('span', {}, el('b', {}, 'F = m × a')),
          el('span', { class: 'units' }, 'Δv means (final velocity − starting velocity)'))),
      lock.node);
    return null;
  },
});
