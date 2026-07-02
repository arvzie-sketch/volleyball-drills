'use strict'

/*
 * "Wash" serve-receive / transition-attack drill.
 *
 * Coordinate reminder (VBRotations full court):
 *   net (centre line) = y 0 | near-side baseline = y 900 | far-side baseline = y -900
 *   left sideline = x 0 | right sideline = x 900 | attack lines = y +/-300
 *
 * The receiving team is on the NEAR side (positive y). One server sits on the far
 * side. Every rep the serve target (R5 or R6) and the chosen hitter are random.
 */

const P = {
  // near-side front-row net slots, zones 4 / 3 / 2 (left -> right)
  front:    [ { x: 150, y: 80 }, { x: 450, y: 80 }, { x: 760, y: 80 } ],
  // approach-start positions, pulled off the net behind/around the attack line
  approach: [ { x: 110, y: 360 }, { x: 450, y: 330 }, { x: 800, y: 360 } ],
  // at-the-net attack contact points
  contact:  [ { x: 150, y: 70 }, { x: 450, y: 70 }, { x: 760, y: 70 } ],

  setterHome:   { x: 780, y: 560 },   // zone 1, receive position (back right)
  setterTarget: { x: 600, y: 130 },   // between zones 2/3 at the net

  receivers: { r5: { x: 200, y: 640 }, r6: { x: 450, y: 700 } },

  server:   { x: 450, y: -600 },       // far side, middle of the court
  ballHome: { x: 470, y: -560 },       // in the server's hands

  // waiting line of substitutes, along the right sideline
  subSlots: [ { x: 940, y: 380 }, { x: 940, y: 500 }, { x: 940, y: 620 } ],

  attackOut: () => ({ x: 150 + Math.random() * 600, y: -520 }) // where the kill lands
}

const washAttackBlockDrill = {
  id: 'wash-attack-block',        // stable, used in the URL hash (#wash-attack-block)
  category: 'Attack',             // which library it appears under in the picker
  name: 'Wash: serve-receive → transition → attack',
  legend: [
    { c: '#efa581', t: 'Attacker / Setter' },
    { c: '#e23b2b', t: 'Receiver' },
    { c: '#3b5bdb', t: 'Server' },
    { c: '#66dd66', t: 'Chosen hitter' }
  ],
  summary: 'Server feeds an attack-like serve; the front row fake-blocks, ' +
           'transitions off the net, the setter runs to target, and one random ' +
           'attacker finishes. Hitter rotates to the sub line. Repeat.',
  phases: [
    'Serve — server sends an accurate, attack-speed serve at R5 or R6 (random)',
    'Fake block — the three front-row attackers pretend to block at the net',
    'Transition — attackers peel off the net to their approach start',
    'Setter release — S runs from zone 1 to the target between zones 2/3',
    'Pass — the targeted receiver passes to the setter target',
    'Set + attack — S picks a random attacker, who approaches and hits over',
    'Substitution — the hitter rotates to the sideline queue, a fresh player fills in'
  ],

  setup (ctx) {
    // Attackers (front row) — added first
    const a = []
    for (let i = 0; i < 3; i++) a.push(ctx.player('a' + i, P.front[i].x, P.front[i].y, 'A'))
    ctx.attackers = a
    ctx.frontZones = P.front.slice()
    ctx.approach = P.approach.slice()
    ctx.contact = P.contact.slice()

    // Setter, receivers, server
    ctx.player('setter', P.setterHome.x, P.setterHome.y, 'S')
    ctx.player('r5', P.receivers.r5.x, P.receivers.r5.y, 'R')
    ctx.player('r6', P.receivers.r6.x, P.receivers.r6.y, 'R')
    ctx.player('server', P.server.x, P.server.y, 'Sv')

    // Substitutes waiting on the sideline
    const subs = []
    for (let i = 0; i < 3; i++) subs.push(ctx.player('sub' + i, P.subSlots[i].x, P.subSlots[i].y, 'A'))
    ctx.subQueue = subs
    ctx.subSlots = P.subSlots.slice()

    // Ball LAST so it paints on top of the players
    ctx.ball('ball', P.ballHome.x, P.ballHome.y)
  },

  afterSetup (ctx) {
    ctx.tint(ctx.o.r5, '#e23b2b')
    ctx.tint(ctx.o.r6, '#e23b2b')
    ctx.tint(ctx.o.server, '#3b5bdb')
  },

  async rep (ctx, isRunning) {
    const o = ctx.o
    const ball = o.ball
    const targetKey = ctx.pick(['r5', 'r6'])
    const target = o[targetKey]
    const hitIndex = ctx.pickIndex(3)

    // 1) SERVE (ball toward the receiver) + fake block (small hop to the net)
    ctx.phase(0, 1)
    ctx.move(ball, target._home.x, target._home.y - 40)
    ctx.attackers.forEach((p, i) => ctx.move(p, ctx.frontZones[i].x, ctx.frontZones[i].y - 28))
    await ctx.draw(950); if (!isRunning()) return

    // 2) PASS to the setter, run AT THE SAME TIME as the block coming down, the
    //    attackers transitioning off the net, and the setter releasing to target.
    //    The ball keeps moving the instant it reaches the receiver (a slower,
    //    floaty pass) so the receiver never holds it, and the setter arrives at
    //    the target just as the pass does.
    ctx.phase(2, 3, 4)
    ctx.move(ball, P.setterTarget.x + 15, P.setterTarget.y + 20)
    ctx.attackers.forEach((p, i) => ctx.move(p, ctx.approach[i].x, ctx.approach[i].y))
    ctx.move(o.setter, P.setterTarget.x, P.setterTarget.y)
    await ctx.draw(1400); if (!isRunning()) return

    // 4) SET to the chosen attacker's zone (position 4 / 3 / 2) AND start the
    //    approach in the SAME draw, so the attacker arrives at the hitting spot
    //    exactly as the ball gets there (both animate over the same 750ms).
    ctx.phase(5)
    const hitter = ctx.attackers[hitIndex]
    const hit = ctx.contact[hitIndex]           // at-the-net hitting point for that zone
    ctx.highlight(hitter, true)
    ctx.move(ball, hit.x, hit.y - 15)            // ball set to the hitting position
    ctx.move(hitter, hit.x, hit.y)               // approach timed to meet the ball there
    await ctx.draw(1150); if (!isRunning()) return

    // 5) ATTACK — contact made, ball driven over the net
    const out = P.attackOut()
    ctx.move(ball, out.x, out.y)
    await ctx.draw(600); if (!isRunning()) return

    // 6) SUBSTITUTION — hitter rotates to the back of the queue, next sub fills in
    ctx.phase(6)
    ctx.highlight(hitter, false)
    const newcomer = ctx.subQueue.shift()
    ctx.attackers[hitIndex] = newcomer
    ctx.subQueue.push(hitter)

    // relayout: attackers back to net zones, subs back to the waiting line, everyone home
    ctx.attackers.forEach((p, i) => ctx.move(p, ctx.frontZones[i].x, ctx.frontZones[i].y))
    ctx.subQueue.forEach((p, i) => ctx.move(p, ctx.subSlots[i].x, ctx.subSlots[i].y))
    ctx.move(o.setter, P.setterHome.x, P.setterHome.y)
    ctx.move(ball, P.ballHome.x, P.ballHome.y)
    await ctx.draw(900); if (!isRunning()) return
  },

  async reset (ctx) {
    ctx.clearHighlights()
    ctx.attackers.forEach((p, i) => ctx.move(p, ctx.frontZones[i].x, ctx.frontZones[i].y))
    ctx.subQueue.forEach((p, i) => ctx.move(p, ctx.subSlots[i].x, ctx.subSlots[i].y))
    ctx.move(ctx.o.setter, P.setterHome.x, P.setterHome.y)
    ctx.move(ctx.o.r5, P.receivers.r5.x, P.receivers.r5.y)
    ctx.move(ctx.o.r6, P.receivers.r6.x, P.receivers.r6.y)
    ctx.move(ctx.o.server, P.server.x, P.server.y)
    ctx.move(ctx.o.ball, P.ballHome.x, P.ballHome.y)
    await ctx.draw(400)
  }
}

registerDrill(washAttackBlockDrill)
