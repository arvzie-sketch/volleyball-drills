'use strict'

/*
 * Pepper warmup — the classic continuous pass-set-hit-dig cycle between
 * two players. Unlike the pair pass & set ladder (which isolates one
 * touch at a time), pepper never stops: every contact feeds the next
 * one. Build control at half speed before asking for full pace or
 * movement. A warmup is a timed cue sheet (pure data), not an animated
 * drill — see WARMUP-AUTHORING.md.
 */

registerWarmup({
  id: 'pepper-warmup',
  category: 'Ball control',
  skills: ['pass', 'set', 'attack', 'dig', 'ball-control'],
  name: 'Pepper warmup',
  summary: 'Continuous pass-set-hit-dig rally between two players — the most common ' +
           'self-run warmup in the game. Build from half speed to full speed and movement.',
  setupNote: 'Split into pairs, one ball per pair, about 6–8 m apart.',
  exercises: [
    { name: 'Half-speed pepper: pass, set, hit softly, dig — repeat continuously', duration: 60,
      cues: ['Control every contact before adding pace',
             'Call "mine" so you never both go for the ball'] },
    { name: 'Full-speed pepper: same cycle, more pace on the hit', duration: 60,
      cues: ['Track the ball off your partner’s hit into ready position',
             'Keep the hit controlled — down, not away'] },
    { name: 'Pepper on the move: shift position after every hit so it never sits still', duration: 60,
      cues: ['Reset your feet under the ball before each contact',
             'Talk to each other — call which shot you’re about to play'] }
  ]
})
