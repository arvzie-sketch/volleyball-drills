# Warmup authoring contract

A **warmup** (internally `kind: 'routine'`) is a timed cue sheet, not an
animated drill: an ordered list of exercises with durations and coaching cues.
No court, no coordinates, no playback code — pure data. The viewer renders it
as a card (current exercise, cues, stage navigation) with the exercise list in
the info panel.

Like drills, a warmup is ONE file plus ONE `<script src>` tag. Nothing else
changes.

## File template

```js
'use strict'

registerWarmup({
  id: 'my-warmup-id',           // stable, URL/kebab-case, unique across drills AND warmups
  category: 'Ball control',     // groups inside the picker's Warmups section
  skills: ['pass', 'set', 'ball-control'],  // filter-chip facets (DRILL-AUTHORING.md rule 10)
  name: 'Readable warmup name',
  summary: '1–2 sentences shown under the title.',
  setupNote: 'Split into pairs, one ball per pair, about 3–4 m apart.', // optional
  exercises: [
    { name: 'Pass to each other',            // what the players do — shown big
      duration: 60,                          // seconds (displayed; timer is on the backlog)
      cues: ['Platform ready before the ball arrives',   // 1–3 short coaching points
             'Power from the legs, not a swing of the arms'] }
    // … one entry per stage, in order
  ]
})
```

## Rules

1. **Correct terminology** — same bar as drills: see the Terminology section
   in [DRILL-AUTHORING.md](DRILL-AUTHORING.md) (pass vs dig vs set vs toss).
   Research a named warmup rather than guessing its mechanics.
2. **Exercise names are instructions**, readable at arm's length on a phone:
   "Pass to yourself, then pass to your partner" — not abbreviations.
3. **Cues are short imperatives** (1–3 per stage) — the technique focus, not a
   description of the exercise again. `cues: []` is fine for self-evident
   stages.
4. **duration is in seconds** and required (shown as "1 min" chips; a real
   countdown timer is on [backlog.md](backlog.md)).
5. Progressions should build: each stage adds one touch, turn, or constraint
   to the previous one.
6. **`skills[]`** — same fixed vocabulary and same "tag what is trained" bar
   as drills (see rule 10 in [DRILL-AUTHORING.md](DRILL-AUTHORING.md)); the
   picker's filter chips search warmups and drills together.

## Wiring it in

Add one line to `index.html` next to the other warmup script tags:

```html
<script src="warmups/my-warmup-id.js"></script>
```

## Verify before committing

```
node tools/verify-drill.mjs warmups/my-warmup-id.js   # no args = all drills + warmups
```

The verifier checks the descriptor shape, kebab-case id, id uniqueness across
the whole library, the `skills[]` vocabulary, positive durations, cue types,
global-scope name collisions, and the `<script>` tag in `index.html`.
