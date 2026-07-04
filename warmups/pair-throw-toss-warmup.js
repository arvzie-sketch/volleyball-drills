'use strict'

/*
 * Pair throw & toss warmup — arm-and-shoulder ladder that ends in a
 * controlled spike. Each stage swaps one two-handed action for a
 * one-armed one, building toward the overhand hitting motion, then
 * layers in a bounce before finishing on a self-toss hit down to
 * the partner. A warmup is a timed cue sheet (pure data), not an
 * animated drill — see WARMUP-AUTHORING.md.
 */

registerWarmup({
  id: 'pair-throw-toss-warmup',
  category: 'Ball control',
  name: 'Pair throw & toss warmup',
  summary: 'Partner arm-warmup ladder: two-hand throws build to one-arm throws, ' +
           'a bounce, and finally a controlled hit down to your partner.',
  setupNote: 'Split into pairs, one ball per pair, about 4–5 m apart.',
  exercises: [
    { name: 'Throw and catch with both hands', duration: 45,
      cues: ['Catch soft — give with the elbows on contact',
             'Step into the throw to add power'] },
    { name: 'Throw with one arm, catch with both — alternate arms each throw', duration: 45,
      cues: ['Elbow up before you throw',
             'Follow through toward your partner'] },
    { name: 'Throw sidearm across your body, alternating arms', duration: 45,
      cues: ['Turn your trunk into the throw',
             'Point your free hand at your partner as you release'] },
    { name: 'Bounce the throw once with one arm — alternate arms', duration: 45,
      cues: ['Throw down at a steep angle so it bounces up to chest height',
             'Soft hands on the catch after the bounce'] },
    { name: 'Bounce the throw once with both hands', duration: 45,
      cues: ['Release out in front of you, not overhead',
             'Let the bounce rise before you catch it'] },
    { name: 'Toss the ball to yourself, then hit it down to your partner', duration: 60,
      cues: ['Control before power — start soft',
             'Contact the ball at the top of your reach, wrist snapping over the top'] },
    { name: 'Same hit down to your partner, adding a little more power each turn', duration: 60,
      cues: ['Build up stage by stage, don’t jump straight to full speed',
             'Reset your feet before every hit'] }
  ]
})
