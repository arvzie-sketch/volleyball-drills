'use strict'

/*
 * Trio throw & toss warmup — same arm-and-shoulder ladder as the pair
 * version, adapted for groups of three with a continuous shuttle
 * rotation: two players queue on one side, one stands alone on the
 * other. The front of the queue throws to the lone player, then jogs
 * across to join the back of the queue forming behind them — so the
 * lone side flips every rep. A warmup is a timed cue sheet (pure
 * data), not an animated drill — see WARMUP-AUTHORING.md.
 */

registerWarmup({
  id: 'trio-throw-toss-warmup',
  category: 'Ball control',
  skills: ['attack', 'ball-control'],  // the ladder builds the overhand hitting motion
  name: 'Trio throw & toss warmup',
  summary: 'Three-player version of the throw & toss ladder: two queue on one side, ' +
           'one stands alone on the other. Throw, then jog across to the back of the ' +
           'new queue — the lone side flips every rep.',
  setupNote: 'Groups of three: two players on one side, one alone on the other, about ' +
             '4–5 m apart. Whoever throws jogs across straight after releasing the ball.',
  exercises: [
    { name: 'Throw and catch with both hands to the lone player, then jog across', duration: 60,
      cues: ['Catch soft — give with the elbows on contact',
             'Jog the moment the ball leaves your hands, don’t wait and watch'] },
    { name: 'One-arm throw to the lone player, then jog across — alternate arms each turn', duration: 60,
      cues: ['Elbow up before you throw',
             'Follow through toward the catcher before you set off'] },
    { name: 'Sidearm throw across your body to the lone player, then jog across', duration: 60,
      cues: ['Turn your trunk into the throw',
             'Point your free hand at the catcher as you release'] },
    { name: 'Bounce the throw once with one arm, then jog across — alternate arms', duration: 60,
      cues: ['Throw down at a steep angle so it bounces up to chest height',
             'Soft hands on the catch after the bounce'] },
    { name: 'Bounce the throw once with both hands, then jog across', duration: 60,
      cues: ['Release out in front of you, not overhead',
             'Let the bounce rise before you catch it'] },
    { name: 'Toss the ball to yourself, hit it down to the lone player, then jog across', duration: 75,
      cues: ['Control before power — start soft',
             'Contact the ball at the top of your reach, wrist snapping over the top'] },
    { name: 'Same hit down to the lone player, adding a little more power each turn', duration: 75,
      cues: ['Build up stage by stage, don’t jump straight to full speed',
             'Reset your feet the moment you arrive in the new queue'] }
  ]
})
