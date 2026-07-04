'use strict'

/*
 * Block read — track the setter, not the ball.
 *
 * Zone 6 feeds the setter. The setter delivers to the left or right pin
 * (random each rep). The blocking front row, in standard zones 4/3/2 on
 * the other side of the net, reads the set the instant it leaves the
 * setter's hands and shifts together as a line to close that pin.
 *
 * Coordinate reminder: net y=0, near baseline y=900, far baseline y=-900,
 * attack lines y=+/-300, sidelines x=0/900, centre x=450.
 * Setting team is on the NEAR side (positive y); the reading blockers are
 * the opposing team on the FAR side (negative y), directly across the net.
 */

const BR = {
  zone6Home:  { x: 450, y: 760 },   // deep back row, setting team
  setterHome: { x: 560, y: 130 },   // near the net, between zones 2/3
  ballHome:   { x: 470, y: 740 },   // in zone 6's hands

  pin4: { x: 150, y: 70 },          // setting team's zone 4 target
  pin2: { x: 750, y: 70 },          // setting team's zone 2 target

  // blockers' standard net positions, zones 4 / 3 / 2 (mirrors pin4 / mid / pin2)
  blockerHomes: [ { x: 150, y: -70 }, { x: 450, y: -70 }, { x: 750, y: -70 } ],

  // the block line shifted and closed on the left pin
  closedLeft:  [ { x: 80, y: -65 }, { x: 165, y: -60 }, { x: 260, y: -65 } ],
  // the block line shifted and closed on the right pin
  closedRight: [ { x: 640, y: -65 }, { x: 735, y: -60 }, { x: 820, y: -65 } ]
}

const blockReadSetterDrill = {
  id: 'block-read-setter',
  category: 'Block',
  skills: ['block'],
  name: 'Block read: track the setter',
  legend: [
    { c: '#efa581', t: 'Setting team' },
    { c: '#3b5bdb', t: 'Blockers (reading)' },
    { c: '#66dd66', t: 'Shifting to close' }
  ],
  summary: 'Zone 6 feeds the setter, who delivers to the left or right pin at ' +
           'random. The block line reads the set the instant it leaves the ' +
           'setter’s hands and shifts together to close that pin.',
  phases: [
    'Toss — the back-row player (zone 6) passes up to the setter',
    'Read — the setter begins the release; blockers key in on the hands',
    'Set + shift — the setter delivers to a pin as the block line slides to close it',
    'Reset — everyone returns to base position, repeat to the other pin'
  ],

  setup (ctx) {
    ctx.player('zone6', BR.zone6Home.x, BR.zone6Home.y, '6')
    ctx.player('setter', BR.setterHome.x, BR.setterHome.y, 'S')

    const blockers = BR.blockerHomes.map((p, i) => ctx.player('b' + i, p.x, p.y, 'B'))
    ctx.blockers = blockers
    ctx.blockerHomes = BR.blockerHomes.slice()

    ctx.ball('ball', BR.ballHome.x, BR.ballHome.y) // ball last -> renders on top
  },

  afterSetup (ctx) {
    ctx.blockers.forEach((b) => ctx.tint(b, '#3b5bdb'))
  },

  async rep (ctx, isRunning) {
    const ball = ctx.o.ball
    const side = ctx.pick(['left', 'right'])
    const pin = side === 'left' ? BR.pin4 : BR.pin2
    const cluster = side === 'left' ? BR.closedLeft : BR.closedRight

    // 1) TOSS — zone 6 passes up to the setter
    ctx.phase(0)
    ctx.move(ball, BR.setterHome.x, BR.setterHome.y - 10)
    await ctx.draw(700); if (!isRunning()) return

    // 2) READ — the setter begins the release; blockers key in early
    // (tint, not highlight: toggleHighlight() always resets fill to the
    // player's default colour on un-highlight, which would permanently wipe
    // the blue "opposing team" tint applied in afterSetup)
    ctx.phase(1)
    ctx.blockers.forEach((b) => ctx.tint(b, '#66dd66'))
    ctx.move(ball, (BR.setterHome.x + pin.x) / 2, (BR.setterHome.y + pin.y) / 2)
    await ctx.draw(180); if (!isRunning()) return

    // 3) SET + SHIFT — ball finishes to the pin while the block line closes it
    ctx.phase(2)
    ctx.move(ball, pin.x, pin.y)
    ctx.blockers.forEach((b, i) => ctx.move(b, cluster[i].x, cluster[i].y))
    await ctx.draw(620); if (!isRunning()) return

    // 4) RESET
    ctx.phase(3)
    ctx.blockers.forEach((b) => ctx.tint(b, '#3b5bdb'))
    ctx.blockers.forEach((b, i) => ctx.move(b, ctx.blockerHomes[i].x, ctx.blockerHomes[i].y))
    ctx.move(ball, BR.ballHome.x, BR.ballHome.y)
    await ctx.draw(600); if (!isRunning()) return
  },

  async reset (ctx) {
    ctx.blockers.forEach((b) => ctx.tint(b, '#3b5bdb'))
    ctx.blockers.forEach((b, i) => ctx.move(b, ctx.blockerHomes[i].x, ctx.blockerHomes[i].y))
    ctx.move(ctx.o.setter, BR.setterHome.x, BR.setterHome.y)
    ctx.move(ctx.o.zone6, BR.zone6Home.x, BR.zone6Home.y)
    ctx.move(ctx.o.ball, BR.ballHome.x, BR.ballHome.y)
    await ctx.draw(400)
  }
}

registerDrill(blockReadSetterDrill)
