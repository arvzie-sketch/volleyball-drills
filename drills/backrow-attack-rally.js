'use strict'

/*
 * Backrow attack rally — a continuous, two-sided control drill.
 *
 * Both halves of the court are live. Each side has a setter at the net (between
 * zones 2/3) and three backrow attackers stationed behind the 3 m line, plus a
 * pair of substitutes waiting behind the baseline.
 *
 * The point is NOT to kill the ball but to *control* it: every attack is
 * contacted BEHIND the 3 m line and aimed at an opposing attacker so it can be
 * comfortably dug. That side digs to its setter, the setter randomly picks a
 * hitter, and the ball comes back the same way. The attacker who hits rotates
 * off to the back of the sub queue and the next sub steps in.
 *
 * It is a CONTINUOUS rally — the ball never rests. A hitter's substitution is
 * deliberately deferred so it animates in the SAME draw as the opponent digging
 * that attack (see ctx.pending / applyPendingSub): while one side receives, the
 * side that just hit rotates a player off and on. No dedicated "substitution"
 * beat, so nothing ever stops.
 *
 * One rep = one full circuit of the ball (Side A receives → sets → hits, then
 * Side B does the same and feeds Side A again), so it loops seamlessly. The two
 * teams are told apart by court half; only the setters are tinted. The chosen
 * hitter flashes green via highlight() (rewind-safe — the attackers keep the
 * default fill, so un-highlight restores it correctly).
 *
 * Coordinate reminder (VBRotations full court):
 *   net (centre line) = y 0 | near baseline = y 900 | far baseline = y -900
 *   left sideline = x 0 | right sideline = x 900 | attack (3 m) lines = y +/-300
 * netSign points "toward the net" for a side (near: -y, far: +y).
 */

;(function () {
  // Side A — near half (positive y)
  const A = {
    netSign: -1,
    setter:  { x: 600, y: 120 },                                     // between zones 2/3 at the net
    base:    [ { x: 170, y: 560 }, { x: 450, y: 640 }, { x: 730, y: 560 } ], // backrow: left / mid / right
    contact: [ { x: 210, y: 360 }, { x: 450, y: 360 }, { x: 690, y: 360 } ], // hit contact, BEHIND the 3 m line
    subSlots:[ { x: 300, y: 945 }, { x: 600, y: 945 } ]              // two subs waiting behind the baseline
  }
  // Side B — far half (negative y), mirrored across the net
  const B = {
    netSign: 1,
    setter:  { x: 300, y: -120 },
    base:    [ { x: 730, y: -560 }, { x: 450, y: -640 }, { x: 170, y: -560 } ],
    contact: [ { x: 690, y: -360 }, { x: 450, y: -360 }, { x: 210, y: -360 } ],
    subSlots:[ { x: 300, y: -945 }, { x: 600, y: -945 } ]
  }

  function buildSide (ctx, cfg, pfx) {
    const att = cfg.base.map((p, i) => ctx.player(pfx + 'a' + i, p.x, p.y, 'A'))
    const setter = ctx.player(pfx + 's', cfg.setter.x, cfg.setter.y, 'S')
    const sub = cfg.subSlots.map((p, i) => ctx.player(pfx + 'sub' + i, p.x, p.y, 'A'))
    return { cfg: cfg, att: att, sub: sub, setter: setter }
  }

  // Apply the substitution owed by the last hit — queued here so it rides along
  // in the receive draw (the rally never stops for it). The hitter that just
  // finished rotates off to the back of the queue; the front sub takes its spot.
  function applyPendingSub (ctx) {
    const ps = ctx.pending
    if (!ps) return
    const S = ps.side, s = S.cfg
    ctx.highlight(ps.hitter, false)                 // stop the flash as it leaves the court
    const incoming = S.sub.shift()
    S.att[ps.hitI] = incoming
    S.sub.push(ps.hitter)
    ctx.move(incoming, s.base[ps.hitI].x, s.base[ps.hitI].y)  // sub takes the vacated spot
    S.sub.forEach((p, i) => ctx.move(p, s.subSlots[i].x, s.subSlots[i].y)) // queue shuffles forward
    ctx.pending = null
  }

  // Run one side's Receive → Set → Backrow attack.
  //   S = the acting side, O = the other side (where the attack lands).
  //   recv = index (0..2) of S's attacker the ball is currently sitting on.
  //   base = phase index offset (0 for Side A, 3 for Side B).
  // Returns the index of O's attacker that will receive next (null if stopped).
  async function playSide (ctx, isRunning, S, O, base, recv) {
    const ball = ctx.o.ball
    const s = S.cfg

    // Receive — dig to the setter. The previous hitter's substitution animates
    // in this SAME draw, so the receive and the rotation happen together.
    ctx.phase(base + 0)
    applyPendingSub(ctx)
    ctx.move(ball, s.setter.x, s.setter.y - s.netSign * 30) // arrives court-side of the setter
    await ctx.draw(1000); if (!isRunning()) return null

    // Set — the setter randomly picks a hitter, who approaches to behind the line.
    ctx.phase(base + 1)
    const hitI = ctx.pickIndex(3)
    const hitter = S.att[hitI]
    const c = s.contact[hitI]
    ctx.highlight(hitter, true)
    ctx.move(hitter, c.x, c.y)                       // approach up to the contact point
    ctx.move(ball, c.x, c.y + s.netSign * 18)        // set delivered just in front of the hitter
    await ctx.draw(1000); if (!isRunning()) return null

    // Backrow attack — a CONTROLLED ball (not a kill) to a random opposing attacker.
    // Defer this hitter's substitution to overlap the opponent's receive.
    ctx.phase(base + 2)
    const tgt = ctx.pickIndex(3)
    const land = O.cfg.base[tgt]
    ctx.move(ball, land.x, land.y + O.cfg.netSign * 35) // drops just in front of the receiver
    ctx.pending = { side: S, hitI: hitI, hitter: hitter }
    await ctx.draw(1050); if (!isRunning()) return null

    return tgt
  }

  registerDrill({
    id: 'backrow-attack-rally',
    category: 'Attack',
    name: 'Backrow attack rally (both sides)',
    legend: [
      { c: '#efa581', t: 'Backrow attacker / sub' },
      { c: '#3b5bdb', t: 'Setter' },
      { c: '#66dd66', t: 'Chosen hitter' }
    ],
    summary: 'A continuous two-sided rally, controlled not killed. Every backrow ' +
             'attack is contacted behind the 3 m line and aimed at the other side ' +
             'to be dug, set to a random attacker, and returned the same way. The ' +
             'hitter rotates out to the endline queue as the other side digs.',
    phases: [
      'Dig — Side A digs the backrow attack up to its setter (zone 2/3); meanwhile Side B’s hitter rotates off and a sub steps in',
      'Set — Side A setter randomly chooses one of its three backrow attackers',
      'Backrow attack — the chosen hitter contacts behind the 3 m line, a controlled ball to Side B',
      'Dig — Side B digs the attack up to its setter; meanwhile Side A’s hitter rotates off and a sub steps in',
      'Set — Side B setter randomly chooses one of its three backrow attackers',
      'Backrow attack — the chosen hitter drives a controlled ball behind the line to Side A'
    ],

    setup (ctx) {
      ctx.sideA = buildSide(ctx, A, 'a')
      ctx.sideB = buildSide(ctx, B, 'b')
      ctx.recvA = 1                                   // Side A's mid attacker holds the ball to start
      ctx.pending = null                              // no substitution owed at the cold start
      // Ball LAST so it paints on top — sitting in front of the first receiver.
      ctx.ballHome = { x: A.base[1].x, y: A.base[1].y + A.netSign * 35 }
      ctx.ball('ball', ctx.ballHome.x, ctx.ballHome.y)
    },

    afterSetup (ctx) {
      ctx.tint(ctx.sideA.setter, '#3b5bdb')
      ctx.tint(ctx.sideB.setter, '#3b5bdb')
    },

    async rep (ctx, isRunning) {
      // Side A controls and attacks; the ball lands on the Side B attacker it returns.
      const recvB = await playSide(ctx, isRunning, ctx.sideA, ctx.sideB, 0, ctx.recvA)
      if (recvB == null) return
      // Side B does the same, feeding Side A again — that attacker starts the next rep.
      const recvA = await playSide(ctx, isRunning, ctx.sideB, ctx.sideA, 3, recvB)
      if (recvA == null) return
      ctx.recvA = recvA
      // ctx.pending (Side B's last hitter) carries over and rotates off during the
      // next rep's opening receive — keeping the rally continuous across the loop.
    },

    async reset (ctx) {
      ctx.clearHighlights()
      ctx.pending = null
      ;[ctx.sideA, ctx.sideB].forEach((S) => {
        S.att.forEach((p, i) => ctx.move(p, S.cfg.base[i].x, S.cfg.base[i].y))
        S.sub.forEach((p, i) => ctx.move(p, S.cfg.subSlots[i].x, S.cfg.subSlots[i].y))
        ctx.move(S.setter, S.cfg.setter.x, S.cfg.setter.y)
      })
      ctx.recvA = 1
      ctx.move(ctx.o.ball, ctx.ballHome.x, ctx.ballHome.y)
      await ctx.draw(400)
    }
  })
})()
