/* Station: Graph Builder - build a v-t graph, then find acceleration and displacement. */
ER.register({
  id: 'graphbuild',
  title: 'Graph Builder',
  icon: '📐',
  kind: 'digital',
  tagline: 'Build the velocity-time graph, then read the physics out of it',
  code: { letter: 'S', number: 8 },
  printable: true,
  fact: 'The area under a velocity-time graph is the displacement. Split the shape into triangles and rectangles, work out each area, then add them up.',
  hints: [
    'Take the journey one phase at a time. "From rest to 10 m/s" starts at zero and rises. "Stays at 10 m/s" is flat. "Brakes to rest" comes back down to zero.',
    'Acceleration is the gradient: change in velocity ÷ time taken. Displacement is the area: the triangle at the start is ½ × base × height, the middle is a rectangle, and the last triangle is ½ × base × height again.',
  ],
  build(body, api) {
    const { el } = ER;

    const seg = (pts, label, dashed) => `
      <svg viewBox="0 0 130 100" xmlns="http://www.w3.org/2000/svg" aria-label="${label}">
        <rect width="130" height="100" rx="8" fill="#ffffff"/>
        <line x1="18" y1="82" x2="122" y2="82" stroke="#0b1a33" stroke-width="2"/>
        <line x1="18" y1="82" x2="18" y2="10" stroke="#0b1a33" stroke-width="2"/>
        <path d="${pts}" fill="none" stroke="#22d3ee" stroke-width="5" stroke-linecap="round" ${dashed ? 'stroke-dasharray="6 5"' : ''}/>
      </svg>`;

    const CARDS = [
      { id: 'up', content: el('span', { class: 'graph-card', html: seg('M18,82 L122,20', 'rising line from zero') }) },
      { id: 'flat', content: el('span', { class: 'graph-card', html: seg('M18,24 L122,24', 'flat line at the top') }) },
      { id: 'down', content: el('span', { class: 'graph-card', html: seg('M18,20 L122,82', 'falling line to zero') }) },
      { id: 'zero', content: el('span', { class: 'graph-card', html: seg('M18,82 L122,82', 'flat line at zero') }) },
      { id: 'vee', content: el('span', { class: 'graph-card', html: seg('M18,20 L70,82 L122,20', 'down then up') }) },
      { id: 'steep', content: el('span', { class: 'graph-card', html: seg('M18,82 L60,14 L122,14', 'steep rise then flat') }) },
    ];

    const lockHost = el('div');
    const task = ER.matchTask({
      layout: 'wide',
      checkText: '✔ Check my graph',
      slots: [
        { label: 'Phase 1 (0 s to 5 s): starts at rest and speeds up evenly to 10 m/s', accept: 'up' },
        { label: 'Phase 2 (5 s to 15 s): travels at a steady 10 m/s', accept: 'flat' },
        { label: 'Phase 3 (15 s to 20 s): brakes evenly until it stops', accept: 'down' },
      ],
      cards: CARDS,
      onSolved: () => {
        lockHost.append(lock.node);
        setTimeout(() => lock.node.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      },
    });

    const lock = ER.numberLock({
      title: '🔢 Read the graph',
      note: '✏️ Work these out on paper. Acceleration is the gradient. Displacement is the area underneath.',
      items: [
        { q: 'Acceleration during phase 1', unit: 'm/s²', a: 2, ph: 'a =' },
        { q: 'Acceleration during phase 3 (mind the sign)', unit: 'm/s²', a: -2, ph: 'a =' },
        { q: 'Distance travelled during phase 2', unit: 'm', a: 100, ph: 'd =' },
        { q: 'Total displacement for the whole 20 s journey', unit: 'm', a: 150, ph: 's =' },
      ],
      onSolved: () => api.solve(),
    });

    body.append(
      el('div', { class: 'card intro-card printable' },
        el('h3', { class: 'print-only' }, '📐 Graph Builder'),
        el('p', {}, '📐 A lab trolley is sent down the test track. The log says:'),
        el('blockquote', { class: 'journey' }, '"Starts at rest. Speeds up evenly to 10 m/s in 5 seconds. Travels at 10 m/s for the next 10 seconds. Brakes evenly and stops 5 seconds after that."'),
        el('p', {}, 'Drag the right piece of velocity-time graph into each phase, then answer the questions that appear.')),
      el('div', { class: 'card' }, task),
      lockHost);
    return null;
  },
});
