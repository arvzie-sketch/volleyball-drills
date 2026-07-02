'use strict'

/*
 * Blocking footwork drill: the middle blocker reads the set and closes the
 * block to whichever pin the opponent sets (random each rep), arriving at the
 * net just as the ball does. Opponent (attacker + setter) is on the far side.
 *
 * Coordinate reminder: net y=0, near baseline y=900, far baseline y=-900,
 * attack lines y=+/-300, sidelines x=0/900, centre x=450.
 */

const BP = {
  blockerHome: { x: 450, y: 60 },          // middle blocker, zone 3 at the net
  closeLeft:   { x: 175, y: 55 },          // closed block position, left pin
  closeRight:  { x: 735, y: 55 },          // closed block position, right pin
  blockPtLeft:  { x: 175, y: -5 },         // ball stopped just over the net by the block
  blockPtRight: { x: 735, y: -5 },

  setter:       { x: 560, y: -120 },       // far-side setter
  ballHome:     { x: 590, y: -120 },       // ball in the setter's hands
  attackerWait: { x: 450, y: -430 },       // far-side hitter waiting behind the 3m line
  pinLeft:      { x: 180, y: -110 },        // far-side left-pin attack
  pinRight:     { x: 740, y: -110 },        // far-side right-pin attack

  stuff: (side) => ({                       // where the stuffed ball drops on the far side
    x: (side === 'left' ? 150 : 520) + Math.random() * 160,
    y: -260 - Math.random() * 240
  })
}

const blockClosePinDrill = {
  id: 'block-close-pin',
  category: 'Block',
  name: 'Blocking: close the block to the pin',
  legend: [
    { c: '#efa581', t: 'Blocker' },
    { c: '#3b5bdb', t: 'Attacker' },
    { c: '#5b7fb5', t: 'Setter' },
    { c: '#66dd66', t: 'Block (active)' }
  ],
  summary: 'The opponent sets a random pin. The middle blocker reads it, closes ' +
           'the block along the net, and arrives at the pin just as the ball does. ' +
           'Ball is stuffed back; reset and repeat to the other side.',
  phases: [
    'Set — the far-side setter delivers to the left or right pin (random)',
    'Follow — the blocker tracks the ball across the net with little delay',
    'Block — the block is up as the hitter contacts; near-instant at the net',
    'Stuff — the ball rebounds straight back down on the attacker’s side',
    'Reset — blocker returns to the middle, repeat to the other pin'
  ],

  setup (ctx) {
    ctx.player('blocker', BP.blockerHome.x, BP.blockerHome.y, 'B')
    ctx.player('setter', BP.setter.x, BP.setter.y, 'S')
    ctx.player('atk', BP.attackerWait.x, BP.attackerWait.y, 'A')
    ctx.ball('ball', BP.ballHome.x, BP.ballHome.y) // ball last, renders on top
  },

  afterSetup (ctx) {
    // opponent side tinted so it reads as the other team
    ctx.tint(ctx.o.atk, '#3b5bdb')
    ctx.tint(ctx.o.setter, '#5b7fb5')
  },

  async rep (ctx, isRunning) {
    const o = ctx.o
    const ball = o.ball
    const side = ctx.pick(['left', 'right'])
    const pin = side === 'left' ? BP.pinLeft : BP.pinRight
    const close = side === 'left' ? BP.closeLeft : BP.closeRight
    const blockPt = side === 'left' ? BP.blockPtLeft : BP.blockPtRight

    // 1a) READ — the setter releases toward the pin; the blocker reads the set
    ctx.phase(0)
    ctx.highlight(o.blocker, true)
    ctx.move(ball, (BP.ballHome.x + pin.x) / 2, (BP.ballHome.y + pin.y) / 2)
    await ctx.draw(170); if (!isRunning()) return

    // 1b) FOLLOW — ball finishes to the pin while the blocker follows it across
    //     the net with little delay and the hitter arrives, so the block is up
    //     the instant the hitter contacts the ball
    ctx.phase(1)
    ctx.move(ball, pin.x, pin.y)
    ctx.move(o.atk, pin.x, pin.y + 8)
    ctx.move(o.blocker, close.x, close.y)
    await ctx.draw(560); if (!isRunning()) return

    // 2) HIT into the block — near-instant, everything is right at the net
    ctx.phase(2)
    ctx.move(ball, blockPt.x, blockPt.y)
    await ctx.draw(140); if (!isRunning()) return

    // 3) STUFF — the block rebounds the ball straight back down, near-instant
    ctx.phase(3)
    const s = BP.stuff(side)
    ctx.move(ball, s.x, s.y)
    await ctx.draw(230); if (!isRunning()) return

    // 4) RESET
    ctx.phase(4)
    ctx.highlight(o.blocker, false)
    ctx.move(o.blocker, BP.blockerHome.x, BP.blockerHome.y)
    ctx.move(o.atk, BP.attackerWait.x, BP.attackerWait.y)
    ctx.move(ball, BP.ballHome.x, BP.ballHome.y)
    await ctx.draw(600); if (!isRunning()) return
  },

  async reset (ctx) {
    ctx.clearHighlights()
    ctx.move(ctx.o.blocker, BP.blockerHome.x, BP.blockerHome.y)
    ctx.move(ctx.o.setter, BP.setter.x, BP.setter.y)
    ctx.move(ctx.o.atk, BP.attackerWait.x, BP.attackerWait.y)
    ctx.move(ctx.o.ball, BP.ballHome.x, BP.ballHome.y)
    await ctx.draw(400)
  }
}

registerDrill(blockClosePinDrill)
