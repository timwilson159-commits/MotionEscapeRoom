/* Station: Vector Sort and Grid Walk - vectors vs scalars, distance vs displacement. */
ER.register({
  id: 'vectors',
  title: 'Vector Bay',
  icon: '➡️',
  kind: 'digital',
  tagline: 'Size only, or size and direction?',
  code: { letter: 'T', number: 4 },
  printable: true,
  fact: 'Distance and displacement are different quantities. Run a full lap of a track and your distance is a whole lap, but your displacement is zero, because you finished where you started.',
  hints: [
    'Ask yourself: would this measurement be incomplete without a direction? "5 m/s north" needs the north. "5 kg" does not.',
    'Distance is the whole path you travelled. Displacement is the straight line from start to finish, with a direction. For the rover, sketch the path on paper: 8 m across and 6 m up makes a right-angled triangle, and 6-8-10 is a Pythagoras triple.',
  ],
  build(body, api) {
    const { el } = ER;

    const QUANTITIES = [
      ['scalar', 'Distance'], ['vector', 'Displacement'], ['scalar', 'Speed'], ['vector', 'Velocity'],
      ['vector', 'Acceleration'], ['scalar', 'Time'], ['scalar', 'Mass'], ['vector', 'Force'],
      ['scalar', 'Temperature'], ['scalar', 'Energy'], ['vector', 'Weight'], ['vector', 'Momentum'],
    ];

    const pathA = `
      <svg viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rover path: 8 metres east then 6 metres north">
        <rect width="280" height="200" rx="12" fill="#ffffff"/>
        <g stroke="#dbe7f7">${Array.from({ length: 9 }, (_, i) => `<line x1="${20 + i * 30}" y1="14" x2="${20 + i * 30}" y2="176"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<line x1="20" y1="${16 + i * 32}" x2="260" y2="${16 + i * 32}"/>`).join('')}</g>
        <path d="M20,176 L260,176" stroke="#ff6b4a" stroke-width="6" marker-end="url(#va)"/>
        <path d="M260,176 L260,16" stroke="#ff6b4a" stroke-width="6" marker-end="url(#va)"/>
        <path d="M20,176 L260,16" stroke="#22d3ee" stroke-width="6" stroke-dasharray="10 7" marker-end="url(#vb)"/>
        <defs>
          <marker id="va" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ff6b4a"/></marker>
          <marker id="vb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#22d3ee"/></marker>
        </defs>
        <text x="140" y="196" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="15" fill="#c2410c">8 m east</text>
        <text x="266" y="100" font-family="Fredoka, sans-serif" font-size="15" fill="#c2410c" text-anchor="end" transform="rotate(-90 266 100)">6 m north</text>
        <text x="40" y="60" font-family="Fredoka, sans-serif" font-size="15" fill="#0e7f9b">start ➜ finish</text>
      </svg>`;
    const pathB = `
      <svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Drone path: 12 metres east then 4 metres west">
        <rect width="280" height="140" rx="12" fill="#ffffff"/>
        <line x1="20" y1="100" x2="260" y2="100" stroke="#dbe7f7" stroke-width="2"/>
        <path d="M20,72 L260,72" stroke="#ff6b4a" stroke-width="6" marker-end="url(#vc)"/>
        <path d="M260,104 L180,104" stroke="#7c5cff" stroke-width="6" marker-end="url(#vd)"/>
        <defs>
          <marker id="vc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ff6b4a"/></marker>
          <marker id="vd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#7c5cff"/></marker>
        </defs>
        <text x="140" y="60" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="15" fill="#c2410c">12 m east</text>
        <text x="220" y="128" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="15" fill="#5b3fd4">4 m west</text>
        <circle cx="20" cy="88" r="5" fill="#0b1a33"/><text x="20" y="128" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="13" fill="#44557a">start</text>
      </svg>`;

    const lockHost = el('div');
    const quizHost = el('div');

    const lock = ER.numberLock({
      title: '🧭 Rover and drone tracks',
      note: '✏️ Sketch each path on paper first. Displacement is the straight line from start to finish.',
      items: [
        { q: 'Rover: total distance travelled', unit: 'm', a: 14 },
        { q: 'Rover: size of the displacement', unit: 'm', a: 10 },
        { q: 'Drone: total distance travelled', unit: 'm', a: 16 },
        { q: 'Drone: size of the displacement', unit: 'm', a: 8 },
      ],
      onSolved: () => {
        quizHost.append(ER.quizSeq([
          { q: '🏁 A test car drives exactly 3 laps of a 400 m circuit and stops where it started. What are its distance and displacement?',
            opts: ['Distance 1200 m, displacement 0 m', 'Distance 1200 m, displacement 1200 m', 'Distance 0 m, displacement 1200 m', 'Distance 400 m, displacement 0 m'],
            a: 'Distance 1200 m, displacement 0 m',
            why: 'Distance adds up the whole path (3 × 400 m). Displacement is start to finish, and it finished where it started.' },
          { q: '🧭 Why is velocity a vector but speed only a scalar?',
            opts: ['Velocity includes the direction of travel', 'Velocity is always bigger', 'Velocity is measured in m/s and speed is not', 'Velocity only applies to vehicles'],
            a: 'Velocity includes the direction of travel',
            why: 'Vectors need a size AND a direction. "12 m/s" is a speed; "12 m/s east" is a velocity.' },
        ], () => api.solve()));
        setTimeout(() => quizHost.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      },
    });

    const sort = ER.sortTask({
      bins: [
        { id: 'vector', title: '➡️ Vector', desc: 'Needs a size AND a direction.' },
        { id: 'scalar', title: '📏 Scalar', desc: 'Size only.' },
      ],
      cards: QUANTITIES.map(([cat, name]) => ({ cat, content: name })),
      trayTitle: 'Quantities',
      onSolved: () => {
        lockHost.append(lock.node);
        setTimeout(() => lock.node.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      },
    });

    body.append(
      el('div', { class: 'card intro-card' },
        el('p', {}, '➡️ The navigation computer has scrambled its quantities. Sort all 12 into vectors and scalars, then work out the two tracks below.')),
      el('div', { class: 'card' }, sort),
      el('div', { class: 'card printable' },
        el('h4', {}, '🛰️ Track logs'),
        el('div', { class: 'ref-split' },
          el('div', { html: pathA }),
          el('div', {}, el('p', {}, el('b', {}, 'Rover: '), 'drives 8 m east, then turns and drives 6 m north.'),
            el('p', { class: 'muted small' }, 'Hint for the displacement: it is the dashed line. 6, 8 and 10 make a right-angled triangle.'))),
        el('div', { class: 'ref-split' },
          el('div', { html: pathB }),
          el('div', {}, el('p', {}, el('b', {}, 'Drone: '), 'flies 12 m east, then flies 4 m back west.')))),
      lockHost, quizHost);
    return null;
  },
});
