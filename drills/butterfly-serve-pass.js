'use strict'

/*
 * Butterfly — a classic continuous serve / pass / rotate drill.
 *
 * A server on the far side serves to a passer in the near back court, who
 * passes to a target at the net. Then everyone "follows their ball":
 *   server -> back of the passing line   (crosses the net)
 *   passer -> the target at the net
 *   target -> back of the serving line   (crosses the net, shagging the ball)
 * The two crossing paths trace the butterfly's wings. Original choreography.
 *
 * Coordinate reminder: net y=0, near baseline y=900, far baseline y=-900,
 * attack lines y=+/-300, sidelines x=0/900, centre x=450.
 */

const FLY = {
  serveSlots: [ { x: 250, y: -790 }, { x: 160, y: -845 } ], // far-side serving line
  passSlots:  [ { x: 250, y: 640 }, { x: 160, y: 720 } ],   // near-side passing line
  targetPos:  { x: 600, y: 130 },                            // target at the net (setter spot)
  ballHome:   { x: 285, y: -785 }                            // ball in the server's hands
}

const butterflyDrill = {
  id: 'butterfly-serve-pass',
  category: 'Serve & Pass',
  name: 'Butterfly: serve, pass, rotate',
  legend: [
    { c: '#efa581', t: 'Player (rotates)' },
    { c: '#66dd66', t: 'Serving this rep' }
  ],
  summary: 'Serve to the passer, who passes to the target at the net. Then follow ' +
           'your ball: the server crosses to the passing line, the passer becomes ' +
           'the target, and the target shags to the serving line. Continuous.',
  phases: [
    'Serve — far-side server serves to the passer in the near back court',
    'Pass — the passer delivers the ball to the target at the net',
    'Rotate — everyone follows their ball around the butterfly:',
    '   • server → passing line   • passer → target   • target → serving line',
    'Repeat — the next server steps up and the loop continues'
  ],

  setup (ctx) {
    ctx.serveSlots = FLY.serveSlots
    ctx.passSlots = FLY.passSlots
    ctx.targetPos = FLY.targetPos

    const s0 = ctx.player('s0', FLY.serveSlots[0].x, FLY.serveSlots[0].y, 'P')
    const s1 = ctx.player('s1', FLY.serveSlots[1].x, FLY.serveSlots[1].y, 'P')
    const p0 = ctx.player('p0', FLY.passSlots[0].x, FLY.passSlots[0].y, 'P')
    const p1 = ctx.player('p1', FLY.passSlots[1].x, FLY.passSlots[1].y, 'P')
    const t = ctx.player('t', FLY.targetPos.x, FLY.targetPos.y, 'P')

    ctx.serveLine = [s0, s1]   // index 0 = the one serving; rest waiting
    ctx.passLine = [p0, p1]    // index 0 = the one passing; rest waiting
    ctx.target = t

    ctx.ball('ball', FLY.ballHome.x, FLY.ballHome.y) // ball last -> renders on top
  },

  async rep (ctx, isRunning) {
    const ball = ctx.o.ball
    const server = ctx.serveLine[0]
    const passer = ctx.passLine[0]
    const target = ctx.target

    // 1) SERVE — over the net to the passer
    ctx.phase(0)
    ctx.highlight(server, true)
    ctx.move(ball, ctx.passSlots[0].x, ctx.passSlots[0].y - 30)
    await ctx.draw(1450); if (!isRunning()) return

    // 2) PASS — to the target at the net
    ctx.phase(1)
    ctx.move(ball, ctx.targetPos.x, ctx.targetPos.y + 10)
    await ctx.draw(1200); if (!isRunning()) return

    // 3) ROTATE — everyone follows their ball (the butterfly)
    ctx.phase(2, 3)
    ctx.highlight(server, false)
    const nextServer = ctx.serveLine[1]
    const nextPasser = ctx.passLine[1]
    ctx.move(server, ctx.passSlots[1].x, ctx.passSlots[1].y)       // server -> back of pass line
    ctx.move(passer, ctx.targetPos.x, ctx.targetPos.y)            // passer -> target
    ctx.move(target, ctx.serveSlots[1].x, ctx.serveSlots[1].y)    // target -> back of serve line
    ctx.move(nextServer, ctx.serveSlots[0].x, ctx.serveSlots[0].y) // next up to serve
    ctx.move(nextPasser, ctx.passSlots[0].x, ctx.passSlots[0].y)   // next up to pass
    ctx.move(ball, ctx.serveSlots[0].x + 35, ctx.serveSlots[0].y)  // ball shagged to next server
    await ctx.draw(1750); if (!isRunning()) return

    // commit the rotation
    ctx.serveLine = [nextServer, target]
    ctx.passLine = [nextPasser, server]
    ctx.target = passer
  },

  async reset (ctx) {
    ctx.clearHighlights()
    ctx.serveLine.forEach((p, i) => ctx.move(p, ctx.serveSlots[i].x, ctx.serveSlots[i].y))
    ctx.passLine.forEach((p, i) => ctx.move(p, ctx.passSlots[i].x, ctx.passSlots[i].y))
    ctx.move(ctx.target, ctx.targetPos.x, ctx.targetPos.y)
    ctx.move(ctx.o.ball, ctx.serveSlots[0].x + 35, ctx.serveSlots[0].y)
    await ctx.draw(400)
  }
}

registerDrill(butterflyDrill)
