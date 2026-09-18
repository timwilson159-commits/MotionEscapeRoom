/* Station: Crash Lab - inertia, stopping time and the force it takes to stop. */
ER.register({
  id: 'crashlab',
  title: 'Crash Lab',
  icon: '🚗',
  kind: 'digital',
  tagline: 'Why car safety is really just Newton',
  code: { letter: 'I', number: 7 },
  printable: false,
  fact: 'Safety features work by making the change in motion take LONGER. The change in velocity is the same either way, so a longer time means a smaller acceleration, and F = ma means a smaller force on the body.',
  hints: [
    'Every safety feature does one of two jobs: it provides the force that stops YOU when the car stops (first law), or it stretches out the stopping time so the force is smaller (second law).',
    'For the calculation, use F = m × a with the numbers exactly as given. For the last question, think about what happens to a in F = ma when the stopping time gets longer.',
  ],
  build(body, api) {
    const { el } = ER;
    const quizHost = el('div');

    const task = ER.matchTask({
      layout: 'wide',
      checkText: '✔ Check my explanations',
      slots: [
        { label: '🔒 Seatbelt', accept: 'belt' },
        { label: '🎈 Airbag', accept: 'airbag' },
        { label: '🚙 Crumple zone', accept: 'crumple' },
        { label: '💺 Head rest', accept: 'head' },
      ],
      cards: [
        { id: 'belt', content: 'Your body has inertia and keeps moving forward when the car stops (first law). The belt supplies the backwards force that stops you with the car.' },
        { id: 'airbag', content: 'It increases the time your head takes to stop, so the acceleration is smaller and F = ma gives a smaller force on your skull.' },
        { id: 'crumple', content: 'The front of the car folds up instead of stopping dead. That makes the whole crash last longer, which lowers the force felt by everyone inside.' },
        { id: 'head', content: 'In a rear-end crash the seat pushes your body forwards. Without this, your head would stay behind and your neck would take the strain.' },
      ],
      onSolved: () => {
        quizHost.append(ER.quizSeq([
          { q: '🚚 A truck and a car travel at the same speed. Which needs a bigger force to stop in the same time, and why?',
            opts: ['The truck, because it has more mass', 'The car, because it is smaller', 'They need the same force', 'Neither: force does not depend on mass'],
            a: 'The truck, because it has more mass',
            why: 'F = ma. Same change in velocity in the same time means the same a, so more mass needs more force.' },
          { q: '💥 In a crash test, a 60 kg dummy decelerates at 200 m/s². What force acts on it?',
            opts: ['12 000 N', '3600 N', '260 N', '200 N'], a: '12 000 N',
            why: 'F = m × a = 60 × 200.' },
          { q: '⏱️ Why does making the stop take longer reduce the force on a passenger?',
            opts: ['The acceleration is smaller, and F = ma', 'The mass gets smaller', 'The velocity change gets smaller', 'Friction disappears'],
            a: 'The acceleration is smaller, and F = ma',
            why: 'The velocity still changes by the same amount, but spread over more time, so the acceleration (and therefore the force) is smaller.' },
        ], () => api.solve()));
        setTimeout(() => quizHost.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      },
    });

    body.append(
      el('div', { class: 'card intro-card' },
        el('p', {}, '🚗 Station Newton runs crash tests for the vehicles docked here. Match each safety feature to the physics that makes it work.'),
        el('p', { class: 'muted small' }, 'Every explanation mentions a law or a formula. Read them carefully: two of them sound similar.')),
      el('div', { class: 'card' }, task),
      quizHost);
    return null;
  },
});
