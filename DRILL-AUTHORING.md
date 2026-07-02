# Drill authoring contract

The layout, picker, phase stepper, transport bar, legend, and mobile behaviour
are **fixed by the viewer** and fully data-driven. A new drill is ONE file that
calls `registerDrill({...})` plus ONE `<script src>` tag. Nothing else changes.
Give this file to any model/author: they only think about the drill.

## File template

```js
'use strict'

const MY = {
  // Named coordinates for the drill. Court system (VBRotations full court):
  //   net (centre line)  y = 0
  //   near baseline      y = 900     far baseline  y = -900
  //   attack (3m) lines  y = ±300
  //   left sideline      x = 0       right sideline x = 900, centre x = 450
  // Off-court positions (queues, coaches) may go slightly outside 0..900.
}

registerDrill({
  id: 'my-drill-id',            // stable, URL/kebab-case, unique
  category: 'Attack',           // picker group; reuse existing names when apt
  name: 'Readable drill name',
  summary: '1–2 sentences shown under the title.',
  legend: [                     // player colours; ball is added automatically
    { c: '#efa581', t: 'Attacker' },
    { c: '#e23b2b', t: 'Receiver' }
  ],
  phases: [                     // shown as the numbered stepper in the UI
    'Serve — what happens first',
    'Pass — what happens next'
  ],

  setup (ctx) {
    // Add players first, ball LAST (so it renders on top).
    // ctx.player(name, x, y, 'A')  ctx.ball('ball', x, y)
  },

  afterSetup (ctx) {            // optional: per-player tints
    // ctx.tint(ctx.o.someone, '#3b5bdb')
  },

  async rep (ctx, isRunning) {
    // ONE repetition. Pattern per movement beat:
    //   ctx.phase(0)                       <- phase boundary (see below)
    //   ctx.move(ctx.o.ball, x, y)         <- queue absolute moves
    //   await ctx.draw(900)                <- animate them (ms at 1× speed)
    //   if (!isRunning()) return           <- ALWAYS after each await
  },

  async reset (ctx) {
    // Put every object back to its rep-start position, then await ctx.draw(400)
    ctx.clearHighlights()
  }
})
```

## Rules

1. **`ctx.phase(i, j, ...)` before the moves of each phase.** Indices point into
   `phases[]`. Multiple indices = simultaneous phases. This one call powers the
   stepper highlight, the on-court ticker, AND step-forward/step-back (the
   engine snapshots all positions at each boundary). Omitting it still plays,
   but the drill loses phase highlighting and fine-grained stepping.
2. **`if (!isRunning()) return` after every `await ctx.draw(...)`** — this is
   what makes pause/reset/drill-switching safe.
3. **Absolute moves only** (`ctx.move` sets a target position). Never mutate
   the DOM/SVG directly; use `ctx.tint` / `ctx.highlight` for emphasis.
4. **Ball last in setup**, so it paints above players.
5. Randomness is fine (`ctx.pick`, `ctx.pickIndex`) — vary targets per rep.
6. Timings: 600–1500 ms for a ball flight or player run; ≤250 ms for contacts
   at the net. The user can scale speed; don't hard-code delays outside draw().
7. Legend colours — stay in this palette so drills look consistent:
   `#efa581` (neutral player), `#e23b2b` (red team role), `#3b5bdb` (blue team
   role), `#5b7fb5` (secondary blue), `#66dd66` (highlighted/active player).

## Wiring it in

Add one line next to the other drills in `index.html` (order = picker order):

```html
<script src="drills/my-drill-id.js"></script>
```
