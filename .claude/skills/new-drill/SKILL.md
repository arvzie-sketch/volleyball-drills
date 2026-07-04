---
name: new-drill
description: Add a new animated volleyball drill to the library. Use whenever the user asks to add, create, or build a drill (e.g. "/new-drill queen of the court", "add a pepper drill"). Researches the drill, proposes roster + phases for sign-off, then writes, verifies, wires, and commits it.
---

# Adding a new drill

Follow these steps **in order**. Step 2 is a hard gate — never write drill code
before the user approves the plan.

## 1. Understand the drill — research, don't guess

- If the input is a named/known drill (butterfly, queen of the court, pepper…)
  and you don't know its mechanics cold, **web-search authoritative volleyball
  sources** and summarize what the drill trains and how the ball flows. Cite
  what you found.
- Use correct terminology in everything you write — the rules are in the
  **Terminology** section of [DRILL-AUTHORING.md](../../../DRILL-AUTHORING.md)
  (pass = first contact off a serve; dig = first contact off an attack;
  rally = serve → pass → set → hit → dig → set → hit …).

## 2. Propose the plan, then STOP for sign-off

Present, before any code:

- **Roster** — every player on court (and off-court queues/coaches), their
  labels, which legend colour/tint each role gets.
- **Numbered phases** — these become `phases[]` verbatim, so name them with
  correct terminology.
- **Motion plan** — what overlaps what. The animation must be **continuous**:
  the ball never rests, and simultaneous real-world actions (a substitution
  during a dig, a setter releasing during a pass) share one `ctx.draw()`
  instead of playing as sequential pauses. Call out where you'll defer or
  overlap actions to kill dead beats.
- **Randomness** — what varies per rep (targets, chosen hitter, side).

The user will correct or approve. Iterate on the plan until they say
"build" (or equivalent). **Do not start coding before that.**

## 3. Build

- Read [DRILL-AUTHORING.md](../../../DRILL-AUTHORING.md) and the reference
  drill [drills/backrow-attack-rally.js](../../../drills/backrow-attack-rally.js).
  Those two files are **sufficient** — do not read `engine.js`, `index.html`
  internals, or the other drills. If the contract is missing something you
  need, that's a documentation bug: add it to DRILL-AUTHORING.md in the same
  commit.
- Write `drills/<id>.js` (kebab-case `id`, filename = `<id>.js`). Wrap the
  file in an IIFE — top-level names collide across drill files in the browser.
- Wire it: add `<script src="drills/<id>.js"></script>` in `index.html` next
  to the other drill tags (order = picker order).

## 4. Verify

```
node tools/verify-drill.mjs drills/<id>.js
```

The harness runs the drill headlessly and asserts the contract (phase
boundaries, isRunning guards, renderable bounds, ball-last, palette,
tint/highlight mixing, wiring, id uniqueness, global-scope collisions).
Fix every failure. If you leave a warning, say why it's acceptable.

## 5. Commit

Commit straight to `main`. Single imperative subject line matching the style
in `git log` (e.g. "Add continuous two-sided backrow attack rally drill").
**Never add a Co-Authored-By trailer.**
