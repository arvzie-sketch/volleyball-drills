'use strict'

/*
 * Target serve & pass warmup — pairs warm up serving and passing
 * together, building from short range up to full serving distance,
 * then adding a called target zone so the pass has a purpose beyond
 * just control. A warmup is a timed cue sheet (pure data), not an
 * animated drill — see WARMUP-AUTHORING.md.
 */

registerWarmup({
  id: 'target-serve-pass-warmup',
  category: 'Serve & Pass',
  skills: ['serve', 'pass'],
  name: 'Target serve & pass warmup',
  summary: 'Pairs build serving distance and accuracy while warming up the pass, ' +
           'then add called target zones for both the serve and the pass.',
  setupNote: 'Split into pairs across the net, one ball per pair, starting about ' +
             '5–6 m apart on each side.',
  exercises: [
    { name: 'Serve short-range to your partner, who catches it', duration: 45,
      cues: ['Same toss and swing you’ll use at full distance, just closer',
             'Feet square to your target before you serve'] },
    { name: 'Step back toward the end line, serving and passing each rep', duration: 60,
      cues: ['Pass with a stable base, platform angled to the target',
             'Serve every rep from the new distance before stepping back again'] },
    { name: 'Full-distance serve, partner passes it to a called target zone', duration: 60,
      cues: ['Caller names the zone before the serve goes up: line, cross, or middle',
             'Passer adjusts the platform angle, not just their feet, to the zone'] },
    { name: 'Swap roles: same full-distance serve to a called target zone', duration: 60,
      cues: ['Server aims for the returner’s zone, not just in-bounds',
             'Passer calls the serve — "in", "out", or "mine" — before playing it'] }
  ]
})
