# Volleyball Drills

Animated volleyball drills rendered on top of the
[VBRotations](https://github.com/monkeysppp/VBRotations) engine (Apache-2.0).

## Run it

Just open `index.html` in a browser — everything is plain `<script>` tags, so it
works straight from the filesystem (`file://`), no server or build step needed.

- **Play / Pause** — run the drill continuously
- **Step** — play exactly one repetition
- **Reset** — snap everyone back to the starting layout

## What's here

```
index.html                     page + controls + info panel
engine.js                      generic drill runner (DrillPlayer + DrillContext)
drills/wash-attack-block.js    the first drill
vendor/                        VBRotations (snap.svg + vbCourts.js), unmodified
```

## The first drill — "Wash: serve-receive → transition → attack"

Continuous transition drill. Each repetition the **serve target** (R5/R6) and the
**finishing attacker** are random, and the hitter rotates to a sideline queue while a
fresh player fills in.

Phases: serve → fake block → transition off the net → setter release → pass →
random set + attack → substitution → repeat.

## Adding a drill (this is how the attack / block libraries grow)

A drill is one file exposing an object with five hooks. The runner handles the
court, the play/pause/step/reset loop, and the UI.

```js
const myDrill = {
  name: 'Cross-court block read',
  summary: 'One line shown in the info panel.',
  phases: ['Step 1 …', 'Step 2 …'],          // bullet list in the UI

  setup (ctx) {                               // add players first, ball LAST
    ctx.player('blocker', 760, 80, 'B')       // (name, x, y, label)
    ctx.ball('ball', 200, -560)
  },
  afterSetup (ctx) {                          // optional: tints after first draw
    ctx.tint(ctx.o.blocker, '#3b5bdb')
  },
  async rep (ctx, isRunning) {                // ONE repetition
    ctx.move(ctx.o.ball, 750, 250)
    await ctx.draw(600)                        // animate everything, ms
    if (!isRunning()) return                   // lets Pause take effect
    ctx.highlight(ctx.o.blocker, true)
    ctx.move(ctx.o.blocker, 720, 100)
    await ctx.draw(500); if (!isRunning()) return
  },
  async reset (ctx) { /* move objects home, await ctx.draw(400) */ }
}
```

### Coordinate system (full court)

`ctx.move(obj, x, y)` uses VBRotations' per-side units:

| | value |
|---|---|
| net (centre line) | `y = 0` |
| near baseline | `y = 900` |
| far baseline | `y = -900` |
| attack lines | `y = ±300` |
| left / right sideline | `x = 0` / `x = 900` |
| centre of court | `x = 450` |

Put the "home" team on the near side (positive `y`); the far side (negative `y`) is
the opponent. `100 units ≈ 1 metre`.

### Suggested library layout

```
drills/
  attack/   spike-approach, tempo-timing, back-row-attack, ...
  block/    close-the-block, read-block, commit-vs-read, ...
```

Register a drill in `index.html` by pointing the last `<script src>` at its file
(a drill picker / menu is the natural next step).

## Notes & limits

- It's a **top-down 2-D view** — there's no jump height. Attacks/blocks read as the
  ball crossing the net and players at the net; tempo is conveyed by timing.
- Movement is straight-line between points; add intermediate `ctx.move` + `ctx.draw`
  steps for curved paths (approach swings, ball arcs).
