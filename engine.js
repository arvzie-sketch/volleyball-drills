'use strict'

/*
 * Test-branch (1c) drill engine.
 *
 * THE CONTRACT (see DRILL-AUTHORING.md): a drill is ONE file that calls
 * registerDrill({...}) — the UI (layout, picker, stepper, transport, legend)
 * is fully data-driven and never needs to change for a new drill.
 *
 * Engine features on top of the original runner:
 *   - ctx.phase(...indices)  -> marks a phase boundary (drives the stepper UI
 *                               AND phase-level step forward/back). Optional;
 *                               drills without it still play and step per-rep.
 *   - step forward           -> animates to the next phase boundary, then stops
 *   - step back              -> animated rewind to the previous phase boundary
 *                               (engine snapshots all positions at every boundary)
 *   - playback speed multiplier
 */

function clearChildren (el) {
  while (el.firstChild) el.removeChild(el.firstChild)
}

class DrillContext {
  constructor (court, hooks) {
    this.court = court
    this.hooks = hooks || {}
    this.o = {}
    this.attackers = []
    this.subQueue = []
    this.frontZones = []
    this.approach = []
    this.contact = []
    this.subSlots = []
    this._objects = []
    this._highlighted = new Set()
    this._drawChain = Promise.resolve()   // mutex: all court.draw calls serialized
  }

  // Every animation goes through here so two Snap animations can never run
  // on the same elements concurrently (that corrupts Snap's internal state).
  _exclusiveDraw (ms) {
    const run = () => this.court.draw(ms)
    const p = this._drawChain.then(run, run)
    this._drawChain = p.then(() => {}, () => {})
    return p
  }

  // mark a phase boundary: report + let the engine snapshot/gate
  phase () {
    if (this.hooks.onPhaseBoundary) {
      this.hooks.onPhaseBoundary(Array.prototype.slice.call(arguments))
    }
  }

  player (name, x, y, label) {
    const p = this.court.addPlayer(x, y, label)
    p._home = { x, y }
    p._cur = { x, y }
    this._objects.push(p)
    if (name) this.o[name] = p
    return p
  }

  ball (name, x, y) {
    const b = this.court.addBall(x, y)
    b._home = { x, y }
    b._cur = { x, y }
    this._objects.push(b)
    if (name) this.o[name] = b
    return b
  }

  move (obj, x, y) {
    obj.setPosition(x, y)
    obj._cur = { x: x, y: y }
    return obj
  }

  async draw (ms) {
    // gate (step-mode pause) happens OUTSIDE the mutex, so restores can run
    // while a rep is suspended at a phase boundary
    if (this.hooks.beforeDraw) await this.hooks.beforeDraw()
    const s = this.hooks.speed ? this.hooks.speed() : 1
    return this._exclusiveDraw(Math.max(40, ms / s))
  }

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

  tint (obj, colour) { if (obj.circle) obj.circle.attr({ fill: colour }) }

  /* --- engine-internal: position/highlight snapshots for rewind --- */
  snapshot (idx) {
    return {
      idx: idx,
      pos: this._objects.map((o) => ({ o: o, x: o._cur.x, y: o._cur.y })),
      hi: new Set(this._highlighted)
    }
  }

  async restore (snap, ms) {
    snap.pos.forEach((p) => {
      p.o.setPosition(p.x, p.y)
      p.o._cur = { x: p.x, y: p.y }
    })
    for (const o of Array.from(this._highlighted)) {
      if (!snap.hi.has(o)) this.highlight(o, false)
    }
    for (const o of snap.hi) this.highlight(o, true)
    await this._exclusiveDraw(ms)
  }
}

class DrillPlayer {
  constructor (opts) {
    this.mountEl = opts.mountEl
    this.drill = opts.drill
    this.courtWidth = opts.courtWidth || 460
    this.courtColours = opts.courtColours
    this.onState = opts.onState || (() => {})
    this.onPhase = opts.onPhase || (() => {})
    this.onRep = opts.onRep || (() => {})
    this.speed = 1
    this.repCount = 0
    this.mode = 'idle'            // 'idle' | 'playing' | 'step'
    this.history = []             // phase-boundary snapshots (capped)
    this.cursor = -1              // current position in history
    this._gate = null             // resolver while paused at a boundary
    this._armed = false           // one boundary-pass allowance in step mode
    this._pending = false         // a boundary was just crossed
    this._driving = false
    this._restoring = false
    this._restorePromise = Promise.resolve()
    this.repPromise = Promise.resolve()
    this.ctx = null
  }

  get running () { return this.mode === 'playing' }

  _alive () { return this.mode === 'playing' || this.mode === 'step' }
  _reviewing () { return this.cursor >= 0 && this.cursor < this.history.length - 1 }
  _releaseGate () { if (this._gate) { const g = this._gate; this._gate = null; g() } }

  async build () {
    clearChildren(this.mountEl)
    const court = new VBFullCourt({ width: this.courtWidth, colours: this.courtColours })

    const svgEl = court.getSVG()
    svgEl.setAttribute('viewBox', '0 0 ' + court.svg.width + ' ' + court.svg.height)
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svgEl.removeAttribute('width')
    svgEl.removeAttribute('height')
    this.mountEl.appendChild(svgEl)

    this.ctx = new DrillContext(court, {
      onPhaseBoundary: (idx) => this._boundary(idx),
      beforeDraw: () => this._beforeDraw(),
      speed: () => this.speed
    })
    this.drill.setup(this.ctx)
    await court.draw(0)
    if (this.drill.afterSetup) this.drill.afterSetup(this.ctx)
    this.onState('ready')
  }

  _boundary (idx) {
    if (this.history.length >= 60) this.history.shift()
    this.history.push(this.ctx.snapshot(idx))
    this.cursor = this.history.length - 1
    this._pending = true
    this.onPhase(idx)
  }

  async _beforeDraw () {
    if (this.mode === 'step' && this._pending) {
      if (this._armed) {
        this._armed = false
      } else {
        this.onState('paused')
        // remember the rep's intended move targets: review restores may
        // overwrite them while we're suspended here
        const targets = this.ctx._objects.map((o) => ({ o: o, x: o._cur.x, y: o._cur.y }))
        await new Promise((resolve) => { this._gate = resolve })
        targets.forEach((t) => {
          if (t.o._cur.x !== t.x || t.o._cur.y !== t.y) this.ctx.move(t.o, t.x, t.y)
        })
        if (this._alive()) this.onState('playing')
      }
    }
    this._pending = false
  }

  async _runRep () {
    this.repCount++
    this.onRep(this.repCount)
    // never let a failed rep reject upstream awaits or wedge the driver;
    // on failure, rebuild the court (Snap state may be corrupted)
    this.repPromise = Promise.resolve(this.drill.rep(this.ctx, () => this._alive()))
      .catch(async (e) => {
        console.warn('drill rep failed:', e && (e.stack || e.message || e))
        this.mode = 'idle'
        await this._recover()
      })
    await this.repPromise
  }

  async _recover () {
    try {
      this.history = []
      this.cursor = -1
      this._pending = false
      this._armed = false
      this.onPhase([])
      await this.build()
    } catch (e) {
      console.warn('court rebuild failed:', e)
    }
  }

  // serialized, crash-safe snapshot restore
  _restore (snap, ms) {
    this._restoring = true
    this._restorePromise = (async () => {
      try { await this.ctx.restore(snap, ms) } catch (e) { console.warn('restore failed:', e && (e.stack || e.message || e)) }
      this._restoring = false
    })()
    return this._restorePromise
  }

  async _drive () {
    if (this._driving) return
    this._driving = true
    this.onState('playing')
    try {
      while (this._alive()) {
        await this._runRep()
        if (this.mode === 'step') break
      }
    } finally {
      this._driving = false
      // ALWAYS emit: user-initiated pause sets mode='idle' and relies on this
      // (reset/load emit their own 'ready' afterwards)
      this.onState('paused')
    }
  }

  async play () {
    if (this.mode === 'playing' || this._restoring) return
    if (this._resetPromise) await this._resetPromise
    if (this.mode === 'playing') return
    this.mode = 'playing'
    if (this._reviewing()) {
      // jump to the live head and WAIT for it before resuming draws,
      // so two animations never run on the same elements concurrently
      this.cursor = this.history.length - 1
      const head = this.history[this.cursor]
      if (head) { this.onPhase(head.idx); await this._restore(head, 150) }
    }
    this._pending = false
    this._releaseGate()
    this._drive()
  }

  pause () {
    this.mode = 'idle'
    this._releaseGate()
  }

  // animate to the next phase boundary, then stop
  async stepForward () {
    if (this._restoring) return
    if (this._resetPromise) await this._resetPromise
    if (this._reviewing()) {
      this.cursor++
      const s = this.history[this.cursor]
      this.onPhase(s.idx)
      await this._restore(s, 450 / this.speed)
      this.onState('paused')
      return
    }
    if (this._gate) { this.mode = 'step'; this._releaseGate(); return }
    if (this._driving) {
      // playing continuously: convert to "stop at the next boundary"
      if (this.mode === 'playing') this.mode = 'step'
      return
    }
    this.mode = 'step'
    this._armed = true
    this._drive()
  }

  // animated rewind to the previous phase boundary
  async stepBack () {
    if (this._restoring) return
    if (this._driving && !this._gate) {
      // mid-animation: first stop at the next boundary
      if (this.mode === 'playing') this.mode = 'step'
      return
    }
    if (this.cursor <= 0) return
    this.cursor--
    const s = this.history[this.cursor]
    this.onPhase(s.idx)
    this.onState('review')
    await this._restore(s, 450 / this.speed)
  }

  async reset () {
    this.mode = 'idle'
    this._releaseGate()
    const p = (async () => {
      await this.repPromise
      await this._restorePromise
      try {
        await this.drill.reset(this.ctx)
      } catch (e) {
        console.warn('drill reset failed, rebuilding court:', e && (e.stack || e.message || e))
        await this._recover()
      }
      this.history = []
      this.cursor = -1
      this._pending = false
      this._armed = false
      this.repCount = 0
      this.onRep(0)
      this.onPhase([])
      this.onState('ready')
    })()
    this._resetPromise = p
    await p
  }

  async load (drill) {
    this.mode = 'idle'
    this._releaseGate()
    await this.repPromise
    await this._restorePromise
    this.drill = drill
    this.history = []
    this.cursor = -1
    this._pending = false
    this._armed = false
    this.repCount = 0
    this.onRep(0)
    this.onPhase([])
    await this.build()
  }
}

/* Drill registry — unchanged contract: a new drill = one file + one script tag. */
const DRILLS = []

function registerDrill (drill) {
  DRILLS.push(drill)
  return drill
}

function getDrill (id) {
  return DRILLS.find(d => d.id === id)
}

function drillCategories () {
  const cats = []
  for (const d of DRILLS) {
    let c = cats.find(x => x.name === d.category)
    if (!c) { c = { name: d.category, drills: [] }; cats.push(c) }
    c.drills.push(d)
  }
  return cats
}

/* Warmup registry — a warmup ("routine") is a timed cue sheet, not an animated
 * drill: pure data (exercises + cues + durations), no court, no playback.
 * Same contract shape: one file in warmups/ + one script tag. */
const WARMUPS = []

function registerWarmup (w) {
  w.kind = 'routine'
  WARMUPS.push(w)
  return w
}

function getWarmup (id) {
  return WARMUPS.find(w => w.id === id)
}

function warmupCategories () {
  // same { name, drills[] } shape as drillCategories, so list-building
  // code in the viewer can treat both uniformly
  const cats = []
  for (const w of WARMUPS) {
    let c = cats.find(x => x.name === w.category)
    if (!c) { c = { name: w.category, drills: [] }; cats.push(c) }
    c.drills.push(w)
  }
  return cats
}
