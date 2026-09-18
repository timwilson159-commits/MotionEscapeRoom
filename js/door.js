/* The airlock: two Newton's-law safety checks guarding a pigpen cypher. */
(function () {
  const { el, sfx } = ER;
  const ANSWER = 'NEWTONISAG';

  // Scenario bank. Wrong answers redraw from here, so the pool has to be big.
  const SCENARIOS = [
    { t: 'A book lies still on a bench and stays there until someone pushes it.', law: 1 },
    { t: 'Passengers lurch forwards when a bus brakes hard.', law: 1 },
    { t: 'A spacecraft coasts across deep space at a steady speed with its engines switched off.', law: 1 },
    { t: 'A tablecloth is whipped out from under the plates and the plates stay put.', law: 1 },
    { t: 'Dust flies off a rug when the rug is beaten.', law: 1 },
    { t: 'A hockey puck slides across smooth ice at almost constant velocity.', law: 1 },
    { t: 'A seatbelt has to pull you back because your body keeps moving forwards when the car stops.', law: 1 },
    { t: 'Coins resting on a card drop into a glass when the card is flicked sideways.', law: 1 },
    { t: 'A car turns a corner and the shopping slides across the back seat.', law: 1 },
    { t: 'A satellite keeps orbiting for years without using any fuel.', law: 1 },
    { t: 'Sauce keeps moving out of the bottle after you stop moving the bottle downwards.', law: 1 },

    { t: 'The same push makes an empty trolley speed up more than a full one.', law: 2 },
    { t: 'Pressing the accelerator harder makes the car speed up faster.', law: 2 },
    { t: 'A 2 kg ball pushed with 10 N accelerates at 5 m/s².', law: 2 },
    { t: 'A loaded truck needs a much bigger braking force than a car to stop in the same time.', law: 2 },
    { t: 'Doubling the net force on a cart doubles its acceleration.', law: 2 },
    { t: 'A rocket accelerates faster and faster as it burns fuel and gets lighter.', law: 2 },
    { t: 'A golf ball hit harder leaves the tee at a higher speed.', law: 2 },
    { t: 'Two identical engines: the lighter go-kart out-accelerates the heavier one.', law: 2 },
    { t: 'A trolley on a ramp speeds up more when extra masses are removed from it.', law: 2 },
    { t: 'The bigger the unbalanced force on a sled, the greater its acceleration.', law: 2 },
    { t: 'A 1200 kg car needs 3600 N of net force to accelerate at 3 m/s².', law: 2 },

    { t: 'A swimmer pushes the water backwards and is pushed forwards.', law: 3 },
    { t: 'A rocket pushes exhaust gas downwards and the gas pushes the rocket upwards.', law: 3 },
    { t: 'You push on a wall and feel the wall pushing back on your hands.', law: 3 },
    { t: 'A balloon lets air rush out backwards and shoots forwards.', law: 3 },
    { t: 'A rifle recoils into the shoulder as the bullet leaves the barrel.', law: 3 },
    { t: 'A squid squirts water out one way and jets off the other way.', law: 3 },
    { t: 'Your feet push back on the ground and the ground pushes you forwards as you walk.', law: 3 },
    { t: 'A skater pushes off the wall of the rink and glides away from it.', law: 3 },
    { t: 'An astronaut throws a spanner one way and drifts the other way.', law: 3 },
    { t: 'The Earth pulls on the Moon, and the Moon pulls back on the Earth with an equal force.', law: 3 },
    { t: 'A helicopter blade pushes air downwards and the air pushes the helicopter upwards.', law: 3 },
    { t: 'A cannon rolls backwards as the cannonball flies forwards.', law: 3 },
  ];

  // exposed so the build can be tested end to end
  ER._scenarioLaw = (text) => { const s = SCENARIOS.find((x) => x.t === text); return s ? s.law : null; };

  let used = new Set();
  function drawScenarios(n) {
    let pool = SCENARIOS.map((s, i) => i).filter((i) => !used.has(i));
    if (pool.length < n) { used = new Set(); pool = SCENARIOS.map((s, i) => i); }
    const picked = [];
    // one of each law where possible, then fill at random
    [1, 2, 3].forEach((law) => {
      const options = pool.filter((i) => SCENARIOS[i].law === law && !picked.includes(i));
      if (options.length && picked.length < n) picked.push(options[Math.floor(Math.random() * options.length)]);
    });
    while (picked.length < n) {
      const i = pool[Math.floor(Math.random() * pool.length)];
      if (!picked.includes(i)) picked.push(i);
    }
    picked.forEach((i) => used.add(i));
    return ER.shuffle(picked).map((i) => SCENARIOS[i]);
  }

  function makeGate({ title, intro, buttonText, onPass }) {
    const list = el('div');
    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const btn = el('button', { class: 'btn btn-aqua btn-big' }, buttonText);
    let picks = [], scenarios = [];

    function render() {
      scenarios = drawScenarios(3);
      picks = [null, null, null];
      list.innerHTML = '';
      scenarios.forEach((s, i) => {
        const picksEl = el('div', { class: 'law-picks' });
        [1, 2, 3].forEach((n) => {
          const b = el('button', {
            class: 'law-pick', type: 'button',
            onclick: () => {
              picks[i] = n;
              [...picksEl.children].forEach((c, j) => c.classList.toggle('on', j === n - 1));
              sfx.tap();
            },
          }, ['1st law', '2nd law', '3rd law'][n - 1]);
          picksEl.append(b);
        });
        list.append(el('div', { class: 'scenario' }, el('span', { class: 's-num' }, String(i + 1)), el('span', {}, s.t), picksEl));
      });
    }

    btn.addEventListener('click', () => {
      if (picks.some((p) => !p)) { sfx.bad(); ER.say(fb, 'Choose a law for all three scenarios.', 'bad'); return; }
      const right = picks.filter((p, i) => p === scenarios[i].law).length;
      if (right === 3) {
        sfx.good();
        ER.say(fb, '✅ Safety check passed.', 'good');
        btn.disabled = true;
        list.classList.add('locked-panel');
        onPass();
      } else {
        sfx.bad();
        ER.say(fb, `${right} of 3 correct. The computer has wiped the panel and loaded three NEW scenarios.`, 'bad');
        render();
      }
    });

    render();
    return el('div', { class: 'card gate-card' }, el('h4', {}, title), el('p', {}, intro), list, el('div', { class: 'row-center' }, btn), fb);
  }

  ER.door = {
    id: 'door',
    title: 'Airlock',
    icon: '🚪',
    kind: 'door',
    tagline: 'Pass the safety checks, then crack the symbol code',
    printable: true,
    hints: [
      'Each symbol is the SHAPE OF THE BOX a letter sat in. Find the letter in the key whose box is exactly that shape, and check whether it has a dot: a dot means it came from the second grid (J to R) or the second X (W to Z).',
      'The password is 10 letters with no spaces. It is a slightly cheeky compliment about the scientist this station is named after: the first six letters are his surname.',
    ],
    build(body, api) {
      if (!api.allDone) return buildLocked(body, api);
      return buildAirlock(body, api);
    },
  };

  function buildLocked(body, api) {
    const have = api.codes().length;
    body.append(
      el('div', { class: 'card door-locked' },
        el('div', { class: 'big-lock' }, '🔒'),
        el('h3', {}, `The airlock computer needs all ${ER.puzzles.length} symbols. You have ${have}.`),
        el('div', { class: 'lock-lights' }, ...Array.from({ length: ER.puzzles.length }, (_, i) => el('span', { class: i < have ? 'on' : '' }))),
        el('p', {}, 'Stations still to solve:'),
        el('ul', { class: 'missing-list' }, api.missing().map((d) => el('li', {}, el('span', {}, d.icon), ' ', d.title))),
        el('p', { class: 'muted' }, 'Solve every station, then come back. The airlock will test you on Newton\'s three laws before it shows you the decoder.')));
    return null;
  }

  function buildAirlock(body, api) {
    const codes = api.codes().map((d) => d.code).sort((a, b) => a.number - b.number);

    body.append(el('div', { class: 'card door-intro' },
      el('div', { class: 'door-intro-icon' }, '🔐'),
      el('div', {},
        el('h3', {}, 'Airlock release procedure'),
        el('p', {}, 'The station computer will not open the airlock for anyone who does not understand its namesake\'s laws. There are ',
          el('b', {}, 'two safety checks'), ', and a coded password made from your 10 symbols.'),
        el('p', { class: 'muted small' }, 'Get a safety check wrong and the computer wipes the panel and loads three brand new scenarios, so guess carefully.'))));

    // ---- decoder panel (locked until check 1 passes) ----
    const decodeBoxes = ER.letterBoxes(ANSWER.length, { label: 'Password letter' });
    const symbolRow = el('div', { class: 'symbol-row' },
      codes.map((c, i) => el('div', { class: 'symbol-slot' },
        el('small', {}, '#' + c.number),
        el('span', { class: 'sym-tile', html: ER.pigpen(c.letter) }),
        decodeBoxes.inputs[i])));

    const submitFb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const submitBtn = el('button', { class: 'btn btn-sun btn-big' }, '🚀 Open the airlock');
    submitBtn.disabled = true;
    submitBtn.addEventListener('click', () => {
      if (!decodeBoxes.full()) { sfx.bad(); ER.say(submitFb, 'Fill in all 10 letters first.', 'bad'); return; }
      const v = ER.norm(decodeBoxes.value());
      if (v === ANSWER) {
        decodeBoxes.lock();
        submitBtn.disabled = true;
        sfx.solve();
        ER.say(submitFb, '🔓 PASSWORD ACCEPTED. Airlock cycling...', 'good');
        setTimeout(() => api.escape(), 1400);
      } else {
        sfx.bad();
        const right = [...v].filter((ch, i) => ch === ANSWER[i]).length;
        ER.say(submitFb, `${right} of 10 letters are correct. Check those symbols against the key again.`, 'bad');
      }
    });

    const decodePanel = el('div', { class: 'card locked-panel' },
      el('h4', {}, '🔣 Step 2: decode the password'),
      el('p', {}, 'Your symbols are shown in number order. Work out each letter from the key below and type it underneath.'),
      symbolRow,
      el('div', { class: 'row-center' }, submitBtn),
      submitFb);

    const keyPanel = el('div', { class: 'card printable locked-panel' },
      el('h4', {}, '🗝️ Pigpen key'),
      el('p', { class: 'muted small' }, 'Each letter sits in a box. The symbol is just the shape of that box, plus a dot for the second grid and the second X.'),
      ER.pigpenKey());

    const gate2Host = el('div');

    const gate1 = makeGate({
      title: '🛡️ Safety check 1: unlock the decoder',
      intro: 'Match each scenario to the law that explains it best.',
      buttonText: '🔓 Submit safety check 1',
      onPass: () => {
        decodePanel.classList.remove('locked-panel');
        keyPanel.classList.remove('locked-panel');
        gate2Host.append(makeGate({
          title: '🛡️ Safety check 2: arm the keypad',
          intro: 'One more set of scenarios and the airlock keypad will accept your password.',
          buttonText: '🔓 Submit safety check 2',
          onPass: () => {
            submitBtn.disabled = false;
            submitBtn.classList.add('armed');
            sfx.good();
            decodeBoxes.focus();
          },
        }));
        setTimeout(() => keyPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      },
    });

    body.append(gate1, keyPanel, decodePanel, gate2Host);
    return null;
  }
})();
