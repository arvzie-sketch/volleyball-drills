'use strict'

/*
 * Movement & footwork warmup — the no-ball, general warmup that should
 * come first in a session: raises heart rate and rehearses the low,
 * reactive movement patterns volleyball uses, without requiring any
 * ball skill. Good leveler across mixed ages/abilities. A warmup is a
 * timed cue sheet (pure data), not an animated drill — see
 * WARMUP-AUTHORING.md.
 */

registerWarmup({
  id: 'movement-footwork-warmup',
  category: 'Movement',
  skills: ['movement'],
  name: 'Movement & footwork warmup',
  summary: 'No-ball general warmup: jog, dynamic movement, then reactive footwork in ' +
           'pairs. Run this first, before any ball-control warmup.',
  setupNote: 'Whole group spread across the court, then pair up for the mirror shuffle.',
  exercises: [
    { name: 'Light jog with arm circles', duration: 60,
      cues: ['Relaxed pace — this is a pulse-raiser, not a sprint'] },
    { name: 'High knees, then butt kicks, across the court', duration: 45,
      cues: ['Drive the knees up rather than leaning back',
             'Quick ground contact, stay on the balls of your feet'] },
    { name: 'Lateral shuffle in a low, athletic stance', duration: 45,
      cues: ['Stay low — knees bent, chest over knees',
             'Feet stay wider than shoulders, don’t let them click together'] },
    { name: 'Partner mirror shuffle: one leads, one mirrors every move', duration: 60,
      cues: ['Leader changes direction often to challenge the follower',
             'Follower stays low and reacts — don’t anticipate'] },
    { name: 'Switch roles: same mirror shuffle', duration: 60,
      cues: ['Same low stance', 'Quick, precise steps rather than big lunges'] },
    { name: 'Carioca cross-step across the court, both directions', duration: 45,
      cues: ['Rotate the hips to let the trail leg cross over, then behind',
             'Keep it light and quick, not a big bound'] }
  ]
})
