# Drill authoring contract

The layout, picker, phase stepper, transport bar, legend, and mobile behaviour
are **fixed by the viewer** and fully data-driven. A new drill is ONE file that
calls `registerDrill({...})` plus ONE `<script src>` tag. Nothing else changes.
Give this file to any model/author: they only think about the drill.

**Reference drill: [`drills/backrow-attack-rally.js`](drills/backrow-attack-rally.js).**
Read it alongside this file — it exercises every pattern below (IIFE scoping,
carried state across reps, deferred follow-ups, `netSign` mirroring,
highlight-vs-tint discipline). This file plus that one are **sufficient** to
write a drill; don't read `engine.js` or the other drills. If you find
yourself needing to, the contract has a gap — fix THIS file in the same
commit.

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
4. **Don't mix `ctx.tint` and `ctx.highlight` on the same object.**
   `toggleHighlight()` (in `vendor/vbCourts.js`) always resets fill to the
   player's *default* colour on un-highlight — it knows nothing about a
   custom tint, so the tint gets silently wiped the first time that object
   is un-highlighted. If a tinted role (e.g. a team-colour player) also
   needs a temporary "active" flash, toggle it with two `ctx.tint()` calls
   (tint colour ↔ flash colour) instead of `ctx.highlight()`.
5. **Ball last in setup**, so it paints above players.
6. Randomness is fine (`ctx.pick`, `ctx.pickIndex`) — vary targets per rep.
7. Timings: 600–1500 ms for a ball flight or player run; ≤250 ms for contacts
   at the net. The user can scale speed; don't hard-code delays outside draw().
8. Legend colours — stay in this palette so drills look consistent:
   `#efa581` (neutral player), `#e23b2b` (red team role), `#3b5bdb` (blue team
   role), `#5b7fb5` (secondary blue), `#66dd66` (highlighted/active player).
9. **No dead beats.** The animation must read as continuous — the ball never
   sits still while something else happens. Simultaneous real-world actions
   (a substitution during a dig, a setter releasing during a pass) share one
   `ctx.draw()` instead of playing as sequential pauses; see "Patterns for
   continuous / multi-touch drills" below.

## Terminology (phase names must use it correctly)

The name of the FIRST contact depends on where the ball came FROM, not on how
hard the ball is:

- **Pass / reception** — first contact off a **serve**; the player is a
  "passer". Technique is a forearm pass ("bump").
- **Dig** — first contact off an **attack** (a hit ball, even a controlled
  one). Rule of thumb: *you cannot dig a serve nor receive an attack.*
- **Free-ball pass** — first contact off an easy ball sent over with no
  attacking swing.

Canonical rally sequence: **serve → pass → set → hit → dig → set → hit → dig …**
A ball a player sends to the setter just to start a rep is a "toss" or "feed".
Blocking vocabulary: *read the setter, follow/track the ball, close the block,
stuff* (a block that rebounds straight down for a point).
When a term or a drill's mechanics are uncertain, research an authoritative
source and report back — never guess.

## Verify before committing

```
node tools/verify-drill.mjs drills/<id>.js    # no args = verify all drills
```

The harness runs the drill headlessly in Node (no browser): it executes
`setup → rep × 25 → reset` with a stubbed `ctx`, then replays the rep with
`isRunning()` flipping false after every draw. It asserts the rules above —
phase indices valid and called before each phase's moves, an honoured
`isRunning()` guard after every draw, every position inside the renderable
area, ball added last, legend palette, no tint+highlight mixing on one
object, unique kebab-case id, cross-file top-level name collisions, and the
`<script>` tag present in `index.html`. Fix every failure; justify any
warning you leave.

## Wiring it in

Add one line next to the other drills in `index.html` (order = picker order):

```html
<script src="drills/my-drill-id.js"></script>
```

## Engine facts worth knowing (learned the hard way)

- **Visible area.** The court draws in a 1140×2040 design box with the net at
  the centre; a player is a 54-unit circle. In drill coordinates that means a
  player only renders *fully* within about `x ∈ 0..900` and `|y| ≤ 960`. Push
  off-court queues, coaches, or subs past ~±960 in `y` (or outside x) and they
  clip at the SVG edge. Subs behind a baseline live around `y = ±945`.
- **Rewind snapshots capture positions + the highlight set only — never fill.**
  The engine snapshots every object's position and which objects are highlighted
  at each `ctx.phase()`, and restores exactly those on step-back/step-forward.
  It knows nothing about `ctx.tint()` colours. So flash the *active* object with
  `ctx.highlight()` (rewind-safe) and keep that object at the default fill
  `#efa581`, so un-highlight restores it (highlight green is `#66dd66`). A flash
  built from swapping `ctx.tint()` colours will desync when you step back.
- **Drill files share one global scope.** Two files that both declare
  `const P = …` at top level collide. If your drill needs private
  constants/helpers, wrap the whole file in an IIFE: `;(function () { … })()`
  (call `registerDrill` inside it — it's a global).

## Patterns for continuous / multi-touch drills

- **Seam the loop with carried state.** End each `rep()` with the ball exactly
  where the next rep expects it, and stash any needed index on `ctx`
  (e.g. `ctx.recvA`). The rep then reads like the middle of a rally, not a
  cold start.
- **Defer a follow-up to kill a dead beat.** If an action (a substitution, a
  cover) should overlap the *next* beat rather than pause the ball, stash it
  (e.g. `ctx.pending = {…}`) and apply its `ctx.move`s at the start of the draw
  it should ride along with. Nothing ever stops.
- **`netSign` for mirrored two-sided drills.** Give each half a sign
  (near `-1`, far `+1`) and write movement as `y + netSign * offset`, so one
  code path drives both sides ("toward the net" is `+netSign`).
- **Verify headlessly** with `node tools/verify-drill.mjs drills/<id>.js`
  (see "Verify before committing" above) — it catches choreography and
  contract bugs without opening a browser. For seam/choreography assertions
  beyond the contract (e.g. "the ball ends the rep on the receiver"), extend
  the drill-specific checks by hand the same way: stub `ctx`, run
  `setup → rep × N → reset`, assert positions.
