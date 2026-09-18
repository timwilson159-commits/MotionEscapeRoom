/* Station: Law Sorter - which of Newton's laws explains each scenario, plus action-reaction pairs. */
ER.register({
  id: 'laws',
  title: 'Law Sorter',
  icon: '⚖️',
  kind: 'digital',
  tagline: 'Twelve scenarios, three laws, no excuses',
  code: { letter: 'E', number: 2 },
  printable: false,
  fact: 'A quick test: if nothing is changing its motion, think first law. If a force is making something speed up or slow down, think second law. If you can name TWO objects pushing on each other, think third law.',
  hints: [
    'First law: the motion is NOT changing (or only changes because a force finally acts). Second law: a force causes a change in speed, and mass matters. Third law: two objects push on each other, in opposite directions.',
    'For the pairs: the reaction force always acts on the OTHER object, and it is the same type of force. If the action is "the hands push the water backwards", the reaction must be "the water pushes the hands forwards".',
  ],
  build(body, api) {
    const { el } = ER;
    const SCENARIOS = [
      [1, 'A cyclist stops pedalling and only slows down because of friction and air resistance.'],
      [1, 'A ball thrown in deep space keeps going at the same speed forever.'],
      [1, 'Your head snaps backwards when a car accelerates away from the lights.'],
      [1, 'A stack of blocks stays standing when the bottom block is whacked out sideways.'],
      [2, 'A shopping trolley is much harder to get moving when it is full.'],
      [2, 'A 5 kg brick pushed with a net force of 20 N accelerates at 4 m/s².'],
      [2, 'A train needs an enormous force to change its speed even a little.'],
      [2, 'The same engine makes a small boat accelerate faster than a big one.'],
      [3, 'A jet engine pushes air backwards and the plane is pushed forwards.'],
      [3, 'Someone steps off a small boat onto a jetty, and the boat drifts backwards.'],
      [3, 'A fire hose pushes water out and the firefighter feels a push back.'],
      [3, 'A bird\'s wings push air downwards and the air pushes the bird upwards.'],
    ];

    const pairHost = el('div');
    const sort = ER.sortTask({
      bins: [
        { id: '1', title: '1️⃣ First law', desc: 'Inertia: motion only changes when a net force acts.' },
        { id: '2', title: '2️⃣ Second law', desc: 'F = ma: force, mass and acceleration.' },
        { id: '3', title: '3️⃣ Third law', desc: 'Action and reaction on two different objects.' },
      ],
      cards: SCENARIOS.map(([law, text]) => ({ cat: String(law), content: text })),
      trayTitle: 'Scenario cards',
      onSolved: () => {
        pairHost.append(el('div', { class: 'card' },
          el('h4', {}, '🔗 Now the pairs'),
          el('p', {}, 'Every action force has an equal and opposite reaction force on the other object. Match each action to its reaction.'),
          ER.matchTask({
            layout: 'wide',
            checkText: '✔ Check the pairs',
            slots: [
              { label: 'A swimmer\'s hands push the water backwards', accept: 'swim' },
              { label: 'A rocket pushes exhaust gases downwards', accept: 'rocket' },
              { label: 'A tennis racquet pushes on the ball', accept: 'tennis' },
              { label: 'The Earth pulls down on you (your weight)', accept: 'earth' },
            ],
            cards: [
              { id: 'swim', content: 'The water pushes the swimmer forwards' },
              { id: 'rocket', content: 'The gases push the rocket upwards' },
              { id: 'tennis', content: 'The ball pushes back on the racquet' },
              { id: 'earth', content: 'You pull up on the Earth with an equal force' },
            ],
            onSolved: () => api.solve(),
          })));
        setTimeout(() => pairHost.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      },
    });

    body.append(
      el('div', { class: 'card intro-card' },
        el('p', {}, '⚖️ The station\'s teaching computer has jumbled its example cards. Sort all 12 scenarios under the law that explains them best, then match the action-reaction pairs.'),
        el('p', { class: 'muted small' }, 'The 📘 button at the top of this screen opens the laws any time, for free.')),
      el('div', { class: 'card' }, sort),
      pairHost);
    return null;
  },
});
