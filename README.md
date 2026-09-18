# 🚀 Motion Escape: Station Newton

A physics escape room about **motion and Newton's laws**, built for capable Year 9/10 students who have not met the laws before.

Students walk a scientist around an orbital lab. There are **10 puzzle stations**, solvable in any order. Each one gives a **coded pigpen symbol and a number**, logged automatically. At the airlock they must match scenarios to Newton's three laws (twice), then decode the 10 symbols into the password.

## Topics covered

- Speed, velocity and acceleration calculations, including negative acceleration
- Reading and building motion graphs (distance-time and velocity-time, gradient and area)
- Newton's three laws applied to scenarios, action-reaction pairs and F = ma
- Vectors vs scalars, distance vs displacement
- Projectile motion (the firing range): the two motions of a projectile combined

## Teaching design

- **Two reference popups** (Newton's three laws, and vectors vs scalars) open at the start, from the console in the middle of the lab, and from a 📘 / ➡️ button on every screen. They are free and unlimited: the room is designed to teach the laws, not assume them.
- **Hints cost 5 minutes** each on the on-screen mission clock, and students are asked to confirm before taking one.
- **Feedback is count-only**: students are told how many answers are right, never which ones.
- **Clean numbers** throughout: no calculator needed.

## Play

Open `index.html` in a browser, or host it on GitHub Pages (below). No install, no build step.

- **Move:** WASD / arrow keys, or click the floor
- **Open a station:** walk up and press **E** / Space, or click it
- Students need **pencil and paper**
- Progress lasts only while the tab is open (the page warns before leaving)

## The stations

| Station | Type | Focus |
|---|---|---|
| 🚀 Thruster Run | Arcade game | Inertia, F = ma, braking as negative acceleration |
| 🎯 Firing Range | Arcade game | Projectile motion: arrows or W/S aim (hold to sweep), hold space to charge power, 14 shells, destructible ground |
| 📈 Graph Match | Drag & drop | Matching journeys to d-t and v-t graphs |
| 📐 Graph Builder | Drag & drop + calculation | Building a v-t graph, gradient and area under the graph |
| ➡️ Vector Bay | Drag & drop + calculation | Vector/scalar sort, distance vs displacement |
| ⚖️ Law Sorter | Drag & drop | 12 scenarios to the three laws, then action-reaction pairs |
| 🧮 Speed Lab | Calculation | v = d/t, a = Δv/t (one negative), F = ma |
| 🔢 Crossnumber | Pure puzzle | A numeric crossword where every clue is a calculation |
| 🚗 Crash Lab | Drag & drop | Seatbelts, airbags and crumple zones explained by the laws |
| 🧩 Motion Logic Grid | Pure logic | 5 vehicles × speed, acceleration and graph shape |
| 🚪 Airlock | Cypher | Two Newton's-law gates, then a pigpen cypher |

The airlock draws its scenarios from a bank of 34. A wrong answer wipes the panel and loads three new ones, so guessing and retrying does not work.

## Publish with GitHub Pages

1. On GitHub, open the repo and go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Pick branch **main** and folder **/ (root)**, then **Save**.
4. After a minute the game is live at `https://<your-username>.github.io/MotionEscapeRoom/`.

## Files

```
index.html          page shell
css/style.css       all styling (and print styles)
js/core.js          shared helpers (DOM, drag & drop, match tasks, number locks, quizzes)
js/audio.js         generated sound effects (Web Audio, no files)
js/extras.js        sorting task
js/art.js           pigpen generator, mini motion graphs, vehicle icons, canvas sprites
js/reference.js     the two reference popups
js/main.js          the room, movement, symbol log, timer with hint penalties
js/door.js          the airlock: Newton's-law gates plus the pigpen cypher
js/puzzles/*.js     one file per station
```

Plain HTML/CSS/JavaScript. The only external resource is Google Fonts, and the page falls back to system fonts if that is blocked.
