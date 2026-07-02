# CLAUDE.md

Guidance for Claude Code (and any contributor) working in this repo.

## What this is

A static, no-build web app: an animated library of volleyball drills rendered on
top of the [VBRotations](https://github.com/monkeysppp/VBRotations) court engine.
Everything loads via plain `<script>` tags, so `index.html` runs straight from
the filesystem (`file://`) — no server, no bundler, no dependencies to install.

```
index.html            the viewer shell (layout, picker, transport, settings) — data-driven
engine.js             DrillContext + DrillPlayer (playback, phase stepping, snapshots) + registry
vendor/vbCourts.js    patched VBRotations court renderer  (see "Do not modify")
vendor/snap.svg-min.js  Snap.svg (unmodified upstream)
drills/*.js           one file per drill; each calls registerDrill({...})
DRILL-AUTHORING.md    the drill contract — read it before writing any drill code
```

## Adding a new drill

A new drill NEVER requires layout, CSS, or engine changes. It is exactly:

1. One new file: `drills/<drill-id>.js`, written to the contract in
   [DRILL-AUTHORING.md](DRILL-AUTHORING.md) (read it before writing any drill code).
2. One `<script src="drills/<drill-id>.js"></script>` tag in `index.html`,
   next to the other drill script tags (order = picker order).

The viewer UI (picker, phase stepper, transport with phase step-forward/back,
on-court ticker, legend, mobile layout) is fully data-driven from the
`registerDrill({...})` descriptor: `category`, `name`, `summary`, `legend[]`,
`phases[]`, and `ctx.phase(i)` calls inside `rep()`.

Hard rules (details + coordinate system in DRILL-AUTHORING.md):
- Call `ctx.phase(i, ...)` before each phase's moves — powers the stepper AND
  step-forward/step-back snapshots.
- `if (!isRunning()) return` after EVERY `await ctx.draw(...)`.
- Only move objects via `ctx.move` / emphasize via `ctx.tint`, `ctx.highlight`.
  Never touch the SVG/DOM directly.
- Add the ball last in `setup()`. Stay in the legend colour palette.

## Do not modify

- `engine.js` — playback/stepping engine. Feature requests here are engine
  work, not drill work; flag to the maintainer instead of patching ad hoc.
- `vendor/vbCourts.js` — patched court renderer (a self-contained rAF tween
  replaces `Snap.animate`, which could drop its completion callback when
  animations interleave and freeze the whole app). Do not "upgrade" back to
  upstream without re-applying that patch.
