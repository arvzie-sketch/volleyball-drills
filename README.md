# Volleyball Drills

Animated volleyball drills rendered on top of the
[VBRotations](https://github.com/monkeysppp/VBRotations) engine (Apache-2.0).

Try out
[Volleyball Drills](https://arvzie-sketch.github.io/volleyball-drills/#wash-attack-block) here

## Run it

Just open `index.html` in a browser — everything is plain `<script>` tags, so it
works straight from the filesystem (`file://`), no server or build step needed.

The viewer is a dark, mobile-first single screen with a court stage and a
transport bar overlaid on the bottom of the court:

- **▶ / ⏸ Play / Pause** — run the drill continuously
- **⏭ / ⏮ Step** — jump forward or back **one phase** at a time (⏮ animates the
  rewind; the engine snapshots every position at each phase boundary)
- **↺ Reset** — snap everyone back to the starting layout
- **Speed** — `.5× / 1× / 2×` scales the whole animation
- **Phase stepper + on-court ticker** — highlight the phase currently playing
- **⚙ Display settings** — accent colour, court style (Midnight / Classic sand),
  and a phase-ticker toggle, all saved on the device

Pick a drill from the left rail (desktop) or the drill button that opens a
bottom sheet (mobile); both lists are searchable and grouped by category.

## What's here

```
index.html                     viewer shell — layout, picker, transport, settings (data-driven)
engine.js                      DrillPlayer + DrillContext: playback, phase stepping, snapshots, registry
drills/wash-attack-block.js    Attack drill
drills/block-close-pin.js      Block drill
drills/butterfly-serve-pass.js Serve & Pass drill
vendor/vbCourts.js             VBRotations court renderer (patched: rAF tween replaces Snap.animate)
vendor/snap.svg-min.js         Snap.svg (unmodified)
DRILL-AUTHORING.md             the drill contract — read before writing a new drill
```

## Adding a drill (this is how the attack / block libraries grow)

A drill is **one file** that registers itself with `registerDrill(...)`, plus
**one `<script>` tag** in `index.html`. No layout, CSS, or engine changes — the
whole UI is data-driven from the drill descriptor. The `category` groups it in
the picker; the `id` is its shareable URL hash (`.../#my-drill`).

The full contract — file template, the `ctx.phase()` / `isRunning()` rules, the
colour palette, and timing guidance — lives in
**[DRILL-AUTHORING.md](DRILL-AUTHORING.md)**. Read it before writing drill code.
In short:

```js
'use strict'

registerDrill({
  id: 'cross-court-block-read',   // URL hash: .../#cross-court-block-read
  category: 'Block',              // picker group (Attack, Block, Serve & Pass, …)
  name: 'Cross-court block read',
  summary: 'One line shown in the info panel.',
  legend: [ { c: '#efa581', t: 'Blocker' }, { c: '#3b5bdb', t: 'Attacker' } ],
  phases: ['Set — …', 'Block — …'],   // drives the stepper + ticker

  setup (ctx) {                        // add players first, ball LAST
    ctx.player('blocker', 760, 80, 'B')
    ctx.ball('ball', 200, -560)
  },
  afterSetup (ctx) { ctx.tint(ctx.o.blocker, '#3b5bdb') },  // optional tints

  async rep (ctx, isRunning) {         // ONE repetition
    ctx.phase(0)                       // <- phase boundary (powers stepping)
    ctx.move(ctx.o.ball, 750, 250)
    await ctx.draw(600); if (!isRunning()) return   // animate, then let Pause act
    ctx.phase(1)
    ctx.highlight(ctx.o.blocker, true)
    ctx.move(ctx.o.blocker, 720, 100)
    await ctx.draw(500); if (!isRunning()) return
  },
  async reset (ctx) { /* move objects home, ctx.clearHighlights(), await ctx.draw(400) */ }
})
```

Then add one line to `index.html` — a `<script src="drills/your-file.js">` tag
after the other drill scripts (order = picker order). It shows up in the picker
under its category and gets its own shareable `#id` link. No new pages, no
duplicated layout.

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

Each drill also gets a shareable deep link, e.g.
`https://arvzie-sketch.github.io/volleyball-drills/#block-close-pin`.

## Notes & limits

- It's a **top-down 2-D view** — there's no jump height. Attacks/blocks read as the
  ball crossing the net and players at the net; tempo is conveyed by timing.
- Movement is straight-line between points; add intermediate `ctx.move` + `ctx.draw`
  steps for curved paths (approach swings, ball arcs).
