/* The two reference popups: Newton's three laws, and vectors vs scalars.
   Available from the top bar, the central console, and inside every station. */
(function () {
  const { el } = ER;

  const lawCard = (n, title, statement, plain, example, diagram) =>
    el('div', { class: 'law-card' },
      el('div', { class: 'law-num' }, n),
      el('div', { class: 'law-body' },
        el('h4', {}, title),
        el('p', { class: 'law-statement' }, statement),
        el('p', {}, el('b', {}, 'In plain words: '), plain),
        el('p', { class: 'law-eg' }, el('b', {}, 'Example: '), example)),
      el('div', { class: 'law-art', html: diagram }));

  const puckDiagram = `
    <svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="160" height="90" rx="10" fill="#eaf4ff"/>
      <circle cx="46" cy="58" r="12" fill="#2b3752"/>
      <path d="M62,58 L128,58" stroke="#22d3ee" stroke-width="5" marker-end="url(#ah1)"/>
      <defs><marker id="ah1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#22d3ee"/></marker></defs>
      <text x="80" y="44" font-family="Fredoka, sans-serif" font-size="13" fill="#0b1a33">no force</text>
      <text x="80" y="82" font-family="Fredoka, sans-serif" font-size="13" fill="#44557a">constant velocity</text>
    </svg>`;
  const fmaDiagram = `
    <svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="160" height="90" rx="10" fill="#eaf4ff"/>
      <rect x="30" y="34" width="34" height="34" rx="5" fill="#7f93bb"/>
      <path d="M8,51 L28,51" stroke="#ff6b4a" stroke-width="6" marker-end="url(#ah2)"/>
      <rect x="96" y="26" width="50" height="50" rx="5" fill="#7f93bb"/>
      <path d="M74,51 L94,51" stroke="#ff6b4a" stroke-width="6" marker-end="url(#ah2)"/>
      <defs><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ff6b4a"/></marker></defs>
      <text x="47" y="84" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="12" fill="#0b1a33">small mass</text>
      <text x="121" y="84" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="12" fill="#0b1a33">big mass</text>
      <text x="47" y="24" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="12" fill="#1b8fb0">more a</text>
      <text x="121" y="20" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="12" fill="#1b8fb0">less a</text>
    </svg>`;
  const pairDiagram = `
    <svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="160" height="90" rx="10" fill="#eaf4ff"/>
      <circle cx="58" cy="45" r="16" fill="#eef4ff" stroke="#44557a" stroke-width="2"/>
      <rect x="104" y="18" width="18" height="54" rx="4" fill="#7f93bb"/>
      <path d="M76,38 L100,38" stroke="#ff6b4a" stroke-width="5" marker-end="url(#ah3)"/>
      <path d="M100,56 L76,56" stroke="#22d3ee" stroke-width="5" marker-end="url(#ah4)"/>
      <defs>
        <marker id="ah3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ff6b4a"/></marker>
        <marker id="ah4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#22d3ee"/></marker>
      </defs>
      <text x="88" y="30" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="11" fill="#c2410c">push on wall</text>
      <text x="88" y="76" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="11" fill="#1b8fb0">wall pushes back</text>
    </svg>`;

  function lawsContent() {
    return el('div', { class: 'ref-body' },
      el('p', { class: 'ref-lead' }, 'A ', el('b', {}, 'force'), ' is a push or a pull, measured in newtons (N). The ', el('b', {}, 'net force'),
        ' is what is left over when you combine all the forces on an object. These three laws explain what that net force does.'),
      lawCard('1', 'First law: inertia',
        'An object stays at rest, or keeps moving at a constant velocity in a straight line, unless a net force acts on it.',
        'Things keep doing what they are already doing. You only need a force to CHANGE motion, not to keep it going.',
        'A hockey puck slides across smooth ice at almost constant speed. A passenger keeps moving forward when a bus brakes.',
        puckDiagram),
      lawCard('2', 'Second law: F = ma',
        'The acceleration of an object is proportional to the net force on it, and inversely proportional to its mass.',
        'A bigger force means more acceleration. More mass means less acceleration for the same force.',
        'A 2 kg trolley pushed with 10 N accelerates at 5 m/s² (a = F ÷ m). The same push on a 10 kg trolley gives only 1 m/s².',
        fmaDiagram),
      lawCard('3', 'Third law: action and reaction',
        'For every action force there is an equal and opposite reaction force, acting on a different object.',
        'Forces always come in pairs. The two forces are the same size, point in opposite directions, and act on TWO DIFFERENT objects, which is why they do not cancel each other out.',
        'A swimmer pushes the water backwards; the water pushes the swimmer forwards. A rocket pushes gas out; the gas pushes the rocket up.',
        pairDiagram),
      el('div', { class: 'formula-strip' },
        el('span', {}, el('b', {}, 'F = m × a')),
        el('span', {}, el('b', {}, 'a = F ÷ m')),
        el('span', {}, el('b', {}, 'm = F ÷ a')),
        el('span', { class: 'units' }, 'F in newtons (N) · m in kilograms (kg) · a in m/s²')));
  }

  function vectorContent() {
    const row = (q, type, note) => el('tr', {}, el('td', {}, q), el('td', { class: type === 'Vector' ? 'is-vector' : 'is-scalar' }, type), el('td', { class: 'muted' }, note));
    const walkDiagram = `
      <svg viewBox="0 0 260 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Walking 4 m east then 3 m north">
        <rect width="260" height="150" rx="12" fill="#eaf4ff"/>
        <g stroke="#cfe0f5">${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${30 + i * 40}" y1="10" x2="${30 + i * 40}" y2="130"/>`).join('')}${[0, 1, 2, 3].map((i) => `<line x1="30" y1="${10 + i * 40}" x2="230" y2="${10 + i * 40}"/>`).join('')}</g>
        <path d="M30,130 L190,130" stroke="#ff6b4a" stroke-width="6" marker-end="url(#va1)"/>
        <path d="M190,130 L190,10" stroke="#ff6b4a" stroke-width="6" marker-end="url(#va1)"/>
        <path d="M30,130 L190,10" stroke="#22d3ee" stroke-width="6" stroke-dasharray="10 6" marker-end="url(#va2)"/>
        <defs>
          <marker id="va1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ff6b4a"/></marker>
          <marker id="va2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#22d3ee"/></marker>
        </defs>
        <text x="108" y="146" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="14" fill="#c2410c">4 m east</text>
        <text x="200" y="74" font-family="Fredoka, sans-serif" font-size="14" fill="#c2410c">3 m north</text>
        <text x="86" y="60" font-family="Fredoka, sans-serif" font-size="14" fill="#1b8fb0">displacement 5 m</text>
      </svg>`;
    return el('div', { class: 'ref-body' },
      el('div', { class: 'vs-grid' },
        el('div', { class: 'vs-card scalar' }, el('h4', {}, '📏 Scalar'), el('p', {}, 'Size only (just a number and a unit).'), el('p', { class: 'muted' }, 'distance · speed · time · mass · energy · temperature')),
        el('div', { class: 'vs-card vector' }, el('h4', {}, '➡️ Vector'), el('p', {}, 'Size ', el('b', {}, 'and'), ' direction.'), el('p', { class: 'muted' }, 'displacement · velocity · acceleration · force · weight · momentum'))),
      el('table', { class: 'vs-table' },
        el('tr', {}, el('th', {}, 'Quantity'), el('th', {}, 'Type'), el('th', {}, 'Why')),
        row('Distance: "I walked 7 m"', 'Scalar', 'total path length, no direction'),
        row('Displacement: "5 m north-east"', 'Vector', 'straight line from start to finish, with direction'),
        row('Speed: "30 m/s"', 'Scalar', 'how fast only'),
        row('Velocity: "30 m/s north"', 'Vector', 'how fast AND which way'),
        row('Acceleration: "2 m/s² forwards"', 'Vector', 'change in velocity, so it has direction'),
        row('Force: "10 N to the right"', 'Vector', 'a push or pull in a direction')),
      el('div', { class: 'ref-split' },
        el('div', { html: walkDiagram }),
        el('div', {},
          el('h4', {}, '🚶 Distance vs displacement'),
          el('p', {}, 'Walk 4 m east, then 3 m north.'),
          el('ul', {}, el('li', {}, el('b', {}, 'Distance = 7 m'), ' (4 + 3, the whole path)'), el('li', {}, el('b', {}, 'Displacement = 5 m'), ' north-east (the straight line from start to finish)')),
          el('h4', {}, '➕ Adding vectors in a line'),
          el('p', {}, 'Forces in the same direction add. Forces in opposite directions subtract:'),
          el('p', { class: 'formula-strip' }, el('span', {}, '5 N right + 3 N left = ', el('b', {}, '2 N right'))),
          el('p', { class: 'muted small' }, 'A negative sign just means "the other way": −3 m/s² means slowing down when you are moving forwards.'))));
  }

  ER.reference = {
    laws() {
      ER.sfx.tap();
      ER.modal({ title: '📘 Newton\'s three laws of motion', content: lawsContent(), className: 'ref-modal', buttons: [{ label: 'Back to work', class: 'btn-aqua btn-big' }] });
    },
    vectors() {
      ER.sfx.tap();
      ER.modal({ title: '➡️ Vectors and scalars', content: vectorContent(), className: 'ref-modal', buttons: [{ label: 'Back to work', class: 'btn-aqua btn-big' }] });
    },
    buttons() {
      return [
        el('button', { class: 'btn btn-ref', title: 'Newton\'s three laws', onclick: () => ER.reference.laws() }, '📘 Laws'),
        el('button', { class: 'btn btn-ref', title: 'Vectors and scalars', onclick: () => ER.reference.vectors() }, '➡️ Vectors'),
      ];
    },
  };
})();
