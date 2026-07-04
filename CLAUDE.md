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
tools/verify-drill.mjs  headless contract verifier (Node, no browser)
DRILL-AUTHORING.md    the drill contract — read it before writing any drill code
.claude/skills/       project workflow skills (e.g. /new-drill)
```

## Adding a new drill

Follow the workflow in [.claude/skills/new-drill/SKILL.md](.claude/skills/new-drill/SKILL.md)
(the `/new-drill` skill):

1. Research the drill if it's a named one — never guess mechanics or terms.
2. Propose roster + numbered phases + motion plan and **wait for the user's
   sign-off before writing any code**.
3. Build to the contract. Sources: [DRILL-AUTHORING.md](DRILL-AUTHORING.md) plus
   the reference drill `drills/backrow-attack-rally.js` — those two are
   sufficient; do NOT explore `engine.js` or the other drills. Needing to
   means the contract has a gap: fix DRILL-AUTHORING.md in the same commit.
4. Verify: `node tools/verify-drill.mjs drills/<drill-id>.js` must pass.

A new drill NEVER requires layout, CSS, or engine changes. It is exactly:

1. One new file: `drills/<drill-id>.js`, written to the contract in
   [DRILL-AUTHORING.md](DRILL-AUTHORING.md).
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
