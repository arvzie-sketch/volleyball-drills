'use strict'

/*
 * Tiny generic runner that drives a VBRotations full court from a "drill" object.
 *
 * A drill object looks like:
 *   {
 *     name, summary, phases: [strings for the UI],
 *     setup(ctx)        -> add players/ball (players first, ball LAST so it renders on top)
 *     afterSetup(ctx)   -> optional; runs after the first draw (good for per-player tints)
 *     async rep(ctx, isRunning) -> play ONE repetition; await ctx.draw(ms) between moves,
 *                                  and `if (!isRunning()) return` after each await to allow pausing
 *     async reset(ctx)  -> put everything back to the rep-start layout
 *   }
 *
 * Deterministic drills can be pure data; this one uses a little logic for the
 * random serve target / random chosen hitter / rotating substitution line.
 */

function clearChildren (el) {
  while (el.firstChild) el.removeChild(el.firstChild)
}

class DrillContext {
  constructor (court) {
    this.court = court
    this.o = {}              // named players / ball
    this.attackers = []      // ordered front-row player refs (index = zone slot)
    this.subQueue = []       // waiting player refs (index = waiting slot)
    this.frontZones = []     // fixed net positions [{x,y}, ...]
    this.approach = []       // fixed approach-start positions
    this.contact = []        // fixed at-the-net attack contact points
    this.subSlots = []       // fixed waiting-line positions
    this._highlighted = new Set()
  }

  player (name, x, y, label) {
    const p = this.court.addPlayer(x, y, label)
    p._home = { x, y }
    if (name) this.o[name] = p
    return p
  }

  ball (name, x, y) {
    const b = this.court.addBall(x, y)
    b._home = { x, y }
    if (name) this.o[name] = b
    return b
  }

  move (obj, x, y) { obj.setPosition(x, y); return obj }
  draw (ms) { return this.court.draw(ms) }

  pick (arr) { return arr[Math.floor(Math.random() * arr.length)] }
  pickIndex (n) { return Math.floor(Math.random() * n) }

  highlight (obj, on) {
    const isOn = this._highlighted.has(obj)
    if (on && !isOn) { obj.toggleHighlight(); this._highlighted.add(obj) }
    if (!on && isOn) { obj.toggleHighlight(); this._highlighted.delete(obj) }
  }

  clearHighlights () {
    for (const o of this._highlighted) o.toggleHighlight()
    this._highlighted.clear()
  }

  // reach past the public API to colour an individual circle (library has no per-player colour)
  tint (obj, colour) { if (obj.circle) obj.circle.attr({ fill: colour }) }
}

class DrillPlayer {
  constructor (opts) {
    this.mountEl = opts.mountEl
    this.drill = opts.drill
    this.courtWidth = opts.courtWidth || 460
    this.courtColours = opts.courtColours
    this.onState = opts.onState || (() => {})
    this.running = false
    this.repPromise = Promise.resolve()
    this.ctx = null
  }

  async build () {
    clearChildren(this.mountEl)
    const court = new VBFullCourt({ width: this.courtWidth, colours: this.courtColours })

    // Make the SVG fluid: give it a viewBox matching its drawn size and let CSS
    // control the rendered width, so it scales to any screen (mobile-first).
    const svgEl = court.getSVG()
    svgEl.setAttribute('viewBox', '0 0 ' + court.svg.width + ' ' + court.svg.height)
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svgEl.removeAttribute('width')
    svgEl.removeAttribute('height')
    this.mountEl.appendChild(svgEl)

    this.ctx = new DrillContext(court)
    this.drill.setup(this.ctx)
    await court.draw(0)
    if (this.drill.afterSetup) this.drill.afterSetup(this.ctx)
    this.onState('ready')
  }

  async play () {
    if (this.running) return
    this.running = true
    this.onState('playing')
    while (this.running) {
      this.repPromise = this.drill.rep(this.ctx, () => this.running)
      await this.repPromise
    }
    this.onState('paused')
  }

  pause () { this.running = false }

  async step () {
    if (this.running) return
    this.onState('playing')
    this.repPromise = this.drill.rep(this.ctx, () => true)
    await this.repPromise
    this.onState('paused')
  }

  async reset () {
    this.running = false
    await this.repPromise
    await this.drill.reset(this.ctx)
    this.onState('ready')
  }
}
