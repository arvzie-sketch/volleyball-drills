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
  blockPtLeft:  { x: 175, y: 10 },         // where the ball is stopped, at the net
  blockPtRight: { x: 735, y: 10 },

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
    'Approach — the far-side hitter arrives at the pin to meet the ball',
    'Close — the middle blocker shuffles to the pin and seals the block at the net',
    'Stuff — the block stops the ball and it drops on the attacker’s side',
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

    // 1) SET to the pin; the hitter approaches to meet it (same draw = converge)
    ctx.move(ball, pin.x, pin.y - 10)
    ctx.move(o.atk, pin.x, pin.y)
    await ctx.draw(900); if (!isRunning()) return

    // 2) CLOSE — blocker seals the pin as the ball reaches the net (same draw)
    ctx.highlight(o.blocker, true)
    ctx.move(o.blocker, close.x, close.y)
    ctx.move(ball, blockPt.x, blockPt.y)
    await ctx.draw(600); if (!isRunning()) return

    // 3) STUFF — ball deflects back down to the attacker's side
    const s = BP.stuff(side)
    ctx.move(ball, s.x, s.y)
    await ctx.draw(500); if (!isRunning()) return

    // 4) RESET
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
