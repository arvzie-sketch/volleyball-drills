# Backlog

Ideas agreed but deliberately not built yet.

## Warmup timer (routines v2)

The warmup card currently shows durations as static chips; running the clock
is a coach's phone timer for now. When this gets built:

- Per-stage countdown using the `duration` already in every descriptor,
  with auto-advance to the next stage at 0:00 and a "done" state after the
  last stage.
- Transport mapping: play/pause = run/hold the timer (the buttons already
  exist for drills; warmups would stop hiding them).
- Audible chime on stage change (WebAudio oscillator — no sound assets, works
  on the Pages site).
- Screen wake-lock while a timer runs (`navigator.wakeLock`, https-only —
  silently skipped on `file://`).

## Other

- Optional tiny looping court animation per warmup exercise (reuse the drill
  engine with a two-player setup) — garnish, only if it ever feels needed.
- `butterfly-serve-pass`: `phases[4]` ("Repeat — the next server steps up…")
  is never passed to `ctx.phase()`, so the stepper never highlights it (the
  verifier warns). Either fold the line into the rotate beat or drop it.
