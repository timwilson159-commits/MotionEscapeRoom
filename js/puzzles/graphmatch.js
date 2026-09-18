/* Station: Graph Match - reading distance-time and velocity-time graphs. */
ER.register({
  id: 'graphmatch',
  title: 'Graph Match',
  icon: '📈',
  kind: 'digital',
  tagline: 'Six journeys, six graphs. Watch the axes',
  code: { letter: 'N', number: 1 },
  printable: false,
  fact: 'On a distance-time graph the GRADIENT is the speed, so a steeper line means faster and a flat line means stopped. On a velocity-time graph the gradient is the acceleration, and a flat line means constant velocity.',
  hints: [
    'Check the y-axis label on every graph first. Three of them are distance-time and three are velocity-time, and they look very similar.',
    'A flat line on a distance-time graph means the distance is not changing, so the object is stopped. A flat line on a velocity-time graph means the velocity is not changing, so it is cruising at a steady speed.',
  ],
  build(body, api) {
    const { el } = ER;
    const GRAPHS = {
      dtFlat: { type: 'dt', tag: 'd-t', pts: [[0, 5], [10, 5]] },
      dtLine: { type: 'dt', tag: 'd-t', pts: [[0, 0], [10, 9]] },
      dtCurve: { type: 'dt', tag: 'd-t', curve: [[0, 0], [2, 0.5], [4, 1.8], [6, 3.8], [8, 6.5], [10, 10]] },
      vtFlat: { type: 'vt', tag: 'v-t', pts: [[0, 6], [10, 6]] },
      vtRise: { type: 'vt', tag: 'v-t', pts: [[0, 0], [10, 9]] },
      vtFall: { type: 'vt', tag: 'v-t', pts: [[0, 9], [10, 0]] },
    };
    const SLOTS = [
      { label: '🅐 Parked in the bay, not moving at all. (distance-time)', accept: 'dtFlat' },
      { label: '🅑 Driving away from the bay at a steady speed. (distance-time)', accept: 'dtLine' },
      { label: '🅒 Starting from rest and speeding up the whole time. (distance-time)', accept: 'dtCurve' },
      { label: '🅓 Cruising at a constant velocity. (velocity-time)', accept: 'vtFlat' },
      { label: '🅔 Accelerating steadily from rest. (velocity-time)', accept: 'vtRise' },
      { label: '🅕 Braking evenly until it stops. (velocity-time)', accept: 'vtFall' },
    ];

    const quizHost = el('div');
    const task = ER.matchTask({
      layout: 'wide',
      checkText: '✔ Check my matches',
      slots: SLOTS,
      cards: Object.entries(GRAPHS).map(([id, gph]) => ({
        id,
        content: el('span', { class: 'graph-card', html: ER.miniGraph(gph.pts || [], { type: gph.type, tag: gph.tag, curve: gph.curve, color: gph.type === 'dt' ? '#7c5cff' : '#22d3ee' }) }),
      })),
      onSolved: () => {
        quizHost.append(ER.quizSeq([
          { q: '📈 On a DISTANCE-TIME graph, what does a steeper line mean?',
            opts: ['The object is moving faster', 'The object is accelerating harder', 'The object is further away', 'The object has stopped'],
            a: 'The object is moving faster',
            why: 'The gradient of a distance-time graph is the speed: more distance in the same time means faster.' },
          { q: '📉 On a VELOCITY-TIME graph, what does a horizontal line above zero mean?',
            opts: ['Constant velocity, zero acceleration', 'The object is stopped', 'Steady acceleration', 'The object is slowing down'],
            a: 'Constant velocity, zero acceleration',
            why: 'The velocity is not changing, so there is no acceleration. It is still moving.' },
          { q: '⬇️ On a velocity-time graph, a straight line sloping DOWN towards zero means...',
            opts: ['Slowing down: negative acceleration', 'Going backwards', 'Speeding up', 'Standing still'],
            a: 'Slowing down: negative acceleration',
            why: 'The velocity is getting smaller each second, so the acceleration is negative.' },
        ], () => api.solve()));
        setTimeout(() => quizHost.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      },
    });

    body.append(
      el('div', { class: 'card intro-card' },
        el('p', {}, '📈 The station recorder has lost the labels on six motion graphs. Drag each graph next to the journey it shows.'),
        el('p', { class: 'muted small' }, 'Careful: a distance-time graph and a velocity-time graph can look identical. Read the axis label on the left of each graph.')),
      el('div', { class: 'card' }, task),
      quizHost);
    return null;
  },
});
