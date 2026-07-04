'use strict'

/*
 * Pair pass & set warmup — classic two-player ball-control ladder.
 * Three forearm-pass stages, then three overhead-set stages, one minute each.
 * A warmup is a timed cue sheet (pure data), not an animated drill — see
 * WARMUP-AUTHORING.md.
 */

registerWarmup({
  id: 'pair-pass-set-warmup',
  category: 'Ball control',
  name: 'Pair pass & set warmup',
  summary: 'Classic pair ball-control ladder: three passing stages, then three ' +
           'setting stages, one minute each. Each stage adds a touch or a turn.',
  setupNote: 'Split into pairs, one ball per pair, about 3–4 m apart.',
  exercises: [
    { name: 'Pass to each other', duration: 60,
      cues: ['Platform ready before the ball arrives',
             'Power from the legs, not a swing of the arms'] },
    { name: 'Pass to yourself, then pass to your partner', duration: 60,
      cues: ['First touch above head height',
             'Feet set before the second touch'] },
    { name: 'Pass to yourself, quarter-turn to a side, then pass to your partner', duration: 60,
      cues: ['Alternate turning left and right',
             'Square the platform back to your partner before the pass'] },
    { name: 'Set to each other', duration: 60,
      cues: ['Take the ball above your forehead',
             'Finish with arms extended toward the target'] },
    { name: 'Set to yourself, then set to your partner', duration: 60,
      cues: ['First touch straight up, about a metre',
             'Move your feet under the ball before the second touch'] },
    { name: 'Set to yourself, then back-set to your partner', duration: 60,
      cues: ['Turn during the self-set so your back faces your partner',
             'Push the hips forward and release the ball up and behind you'] }
  ]
})
