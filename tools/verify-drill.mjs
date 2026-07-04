#!/usr/bin/env node
'use strict'

/*
 * Headless drill verifier — asserts the DRILL-AUTHORING.md contract in Node,
 * no browser needed.
 *
 *   node tools/verify-drill.mjs                          verify every drills/*.js
 *   node tools/verify-drill.mjs drills/my-drill.js ...   verify specific files
 *
 * Each drill file is executed in its own VM sandbox with a stubbed `ctx`
 * (same API + `_home`/`_cur` semantics as DrillContext in engine.js), then:
 *
 *   1. descriptor shape    id/category/name/legend/phases, palette colours
 *   2. full run            setup → rep × 25 → reset, checking on the way:
 *                            - ball added last in setup()
 *                            - ctx.phase() called before each rep's moves,
 *                              indices valid, every phase reached (warn)
 *                            - every position inside the renderable area
 *                            - tint and highlight never mixed on one object
 *   3. abort matrix        the rep is re-run with isRunning() turning false
 *                          after draw #1, #2, … — one extra draw after that
 *                          means a missing `if (!isRunning()) return`
 *   4. statics             <script> tag present in index.html, unique id,
 *                          top-level declarations that would collide in the
 *                          browser's shared global scope, no setTimeout
 *
 * Exit code 0 = no failures (warnings allowed), 1 = at least one failure.
 */

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DRILLS_DIR = path.join(ROOT, 'drills')
const WARMUPS_DIR = path.join(ROOT, 'warmups')

const PALETTE = ['#efa581', '#e23b2b', '#3b5bdb', '#5b7fb5', '#66dd66']
// A player circle (54 units wide) renders fully inside roughly this window of
// the 1140×2040 design box — see "Engine facts" in DRILL-AUTHORING.md.
const BOUNDS = { xMin: -90, xMax: 990, yAbs: 960 }
const REPS = 25
const ENGINE_GLOBALS = ['clearChildren', 'DrillContext', 'DrillPlayer', 'DRILLS',
  'registerDrill', 'getDrill', 'drillCategories',
  'WARMUPS', 'registerWarmup', 'getWarmup', 'warmupCategories']

/* ------------------------------------------------------------------ report */

class Report {
  constructor (label) {
    this.label = label
    this.failures = new Set()
    this.warnings = new Set()
    this.stats = null
  }

  fail (msg) { this.failures.add(msg) }
  warn (msg) { this.warnings.add(msg) }
}

/* ---------------------------------------------------------------- stub ctx */

class StubCtx {
  constructor (drill, report) {
    this.o = {}
    // pre-seeded convenience arrays, mirroring DrillContext
    this.attackers = []; this.subQueue = []; this.frontZones = []
    this.approach = []; this.contact = []; this.subSlots = []
    this._objects = []
    this._highlighted = new Set()
    this._drill = drill
    this._report = report
    this._mode = 'setup'          // 'setup' | 'rep' | 'reset'
    this._phaseThisRep = false
    this._phaseSeen = new Set()
    this._ballSeen = false
    this._playerCount = 0
    this._ballCount = 0
    this.drawCount = 0
  }

  _mk (kind, name, x, y, label) {
    const obj = {
      _kind: kind,
      _dbg: name || label || (kind + this._objects.length),
      _home: { x, y },
      _cur: { x, y },
      _tinted: false,
      _everHighlighted: false,
      circle: { attr () {} },
      toggleHighlight () {},
      setPosition (nx, ny) { obj._cur = { x: nx, y: ny } }
    }
    this._checkBounds(obj, x, y)
    this._objects.push(obj)
    if (name) this.o[name] = obj
    return obj
  }

  _checkBounds (obj, x, y) {
    if (typeof x !== 'number' || typeof y !== 'number' ||
        !Number.isFinite(x) || !Number.isFinite(y)) {
      this._report.fail(`"${obj._dbg}": non-numeric position (${x}, ${y}) during ${this._mode}`)
      return
    }
    if (x < BOUNDS.xMin || x > BOUNDS.xMax || Math.abs(y) > BOUNDS.yAbs) {
      this._report.fail(`"${obj._dbg}" leaves the renderable area at (${x}, ${y}) during ` +
        `${this._mode} — needs x in ${BOUNDS.xMin}..${BOUNDS.xMax}, |y| <= ${BOUNDS.yAbs}`)
    }
  }

  player (name, x, y, label) {
    if (this._mode === 'setup' && this._ballSeen) {
      this._report.fail(`setup(): player "${name || label}" added after the ball — the ball must be added LAST (contract rule 5)`)
    }
    this._playerCount++
    return this._mk('player', name, x, y, label)
  }

  ball (name, x, y) {
    this._ballSeen = true
    this._ballCount++
    return this._mk('ball', name, x, y)
  }

  move (obj, x, y) {
    if (!obj || typeof obj.setPosition !== 'function') {
      this._report.fail(`ctx.move() called on a missing/foreign object during ${this._mode}`)
      return obj
    }
    if (this._mode === 'rep' && !this._phaseThisRep) {
      this._report.fail('rep(): ctx.move() before the first ctx.phase() — each phase\'s moves must follow its boundary (contract rule 1)')
    }
    this._checkBounds(obj, x, y)
    obj.setPosition(x, y)
    return obj
  }

  phase (...idx) {
    if (idx.length === 0) this._report.warn('ctx.phase() called with no indices')
    const max = this._drill.phases.length - 1
    for (const i of idx) {
      if (!Number.isInteger(i) || i < 0 || i > max) {
        this._report.fail(`ctx.phase(${i}) is not a valid index into phases[] (0..${max})`)
      } else {
        this._phaseSeen.add(i)
      }
    }
    this._phaseThisRep = true
  }

  async draw (ms) {
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) {
      this._report.fail(`ctx.draw(${ms}): duration must be a positive number of milliseconds`)
    }
    this.drawCount++
    if (this.drawCount > 5000) throw new Error('runaway rep: more than 5000 draws — infinite loop?')
    await null
  }

  pick (arr) { return arr[Math.floor(Math.random() * arr.length)] }
  pickIndex (n) { return Math.floor(Math.random() * n) }

  highlight (obj, on) {
    if (!obj) { this._report.fail('ctx.highlight() on a missing object'); return }
    if (on) {
      obj._everHighlighted = true
      if (obj._tinted) this._mixFail(obj)
      this._highlighted.add(obj)
    } else {
      this._highlighted.delete(obj)
    }
  }

  clearHighlights () { this._highlighted.clear() }

  tint (obj, colour) {
    if (!obj) { this._report.fail('ctx.tint() on a missing object'); return }
    obj._tinted = true
    if (obj._everHighlighted) this._mixFail(obj)
    if (!PALETTE.includes(String(colour).toLowerCase())) {
      this._report.warn(`tint colour ${colour} is outside the legend palette (${PALETTE.join(' ')})`)
    }
  }

  _mixFail (obj) {
    this._report.fail(`"${obj._dbg}" gets both ctx.tint() and ctx.highlight() — un-highlight resets fill to the DEFAULT colour and silently wipes the tint (contract rule 4)`)
  }
}

/* ------------------------------------------------------------ file loading */

function loadFile (file) {
  const src = fs.readFileSync(file, 'utf8')
  const drills = []
  const warmups = []
  const sandbox = {
    registerDrill: (d) => { drills.push(d); return d },
    registerWarmup: (w) => { w.kind = 'routine'; warmups.push(w); return w },
    console
  }
  vm.createContext(sandbox)
  vm.runInContext(src, sandbox, { filename: file })
  return { drills, warmups }
}

function topLevelDecls (src) {
  // Column-0 declarations only — in the browser all drill files share ONE
  // global scope, so these are the names that can collide across files.
  const names = []
  const re = /^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm
  let m
  while ((m = re.exec(src))) names.push(m[1])
  return names
}

function firstIdIn (src) {
  const m = src.match(/\bid:\s*['"]([^'"]+)['"]/)
  return m ? m[1] : null
}

function truncate (s, n = 44) {
  s = String(s).trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

/* ------------------------------------------------------------ drill runner */

async function verifyDrill (drill, report) {
  // --- descriptor shape
  if (!drill.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(drill.id)) {
    report.fail(`id "${drill.id}" must be stable kebab-case (it is the URL hash)`)
  }
  if (!drill.category || typeof drill.category !== 'string') report.fail('missing category')
  if (!drill.name || typeof drill.name !== 'string') report.fail('missing name')
  if (!drill.summary || typeof drill.summary !== 'string') report.warn('missing summary')
  const phasesOk = Array.isArray(drill.phases) && drill.phases.length > 0 &&
    drill.phases.every((p) => typeof p === 'string')
  if (!phasesOk) report.fail('phases[] must be a non-empty array of strings')
  if (!Array.isArray(drill.legend) || drill.legend.length === 0) {
    report.fail('legend[] must be a non-empty array of { c, t }')
  } else {
    for (const l of drill.legend) {
      if (!l || typeof l.t !== 'string' || !l.t) report.fail('legend entry missing t (label)')
      if (!l || !PALETTE.includes(String(l.c).toLowerCase())) {
        report.fail(`legend colour ${l && l.c} is outside the palette ${PALETTE.join(' ')} (contract rule 8)`)
      }
    }
  }
  const fnsOk = ['setup', 'rep', 'reset'].every((f) => typeof drill[f] === 'function')
  for (const f of ['setup', 'rep', 'reset']) {
    if (typeof drill[f] !== 'function') report.fail(`missing ${f}()`)
  }
  if (drill.afterSetup && typeof drill.afterSetup !== 'function') report.fail('afterSetup must be a function')
  if (!fnsOk || !phasesOk) return // can't run the behavioural checks

  // --- full run: setup → rep × REPS → reset
  const ctx = new StubCtx(drill, report)
  drill.setup(ctx)
  if (ctx._playerCount === 0) report.fail('setup() adds no players')
  if (ctx._ballCount === 0) report.warn('setup() adds no ball')
  if (drill.afterSetup) drill.afterSetup(ctx)

  ctx._mode = 'rep'
  for (let i = 0; i < REPS; i++) {
    ctx._phaseThisRep = false
    await drill.rep(ctx, () => true)
  }
  const totalDraws = ctx.drawCount
  if (totalDraws === 0) report.fail('rep() never calls ctx.draw() — nothing animates')

  for (let i = 0; i < drill.phases.length; i++) {
    if (!ctx._phaseSeen.has(i)) {
      report.warn(`phases[${i}] ("${truncate(drill.phases[i])}") is never passed to ctx.phase() in ${REPS} reps — the stepper will never highlight it`)
    }
  }

  ctx._mode = 'reset'
  await drill.reset(ctx)
  if (ctx._highlighted.size > 0) report.warn('reset() leaves highlights on — call ctx.clearHighlights()')

  // --- abort matrix: isRunning() flips false after draw #k; the rep must not
  // draw again (that is exactly the `if (!isRunning()) return` guard).
  const drawsPerRep = Math.max(1, Math.ceil(totalDraws / REPS))
  for (let k = 1; k <= Math.min(drawsPerRep + 2, 40); k++) {
    const c2 = new StubCtx(drill, report)
    drill.setup(c2)
    if (drill.afterSetup) drill.afterSetup(c2)
    c2._mode = 'rep'
    c2._phaseThisRep = false
    await drill.rep(c2, () => c2.drawCount < k)
    if (c2.drawCount > k) {
      report.fail(`rep() kept animating after isRunning() went false (paused at draw #${k}, saw ${c2.drawCount}) — a "if (!isRunning()) return" is missing after an await ctx.draw() (contract rule 2)`)
    }
    c2._mode = 'reset'
    await drill.reset(c2) // reset must be safe from any aborted mid-rep state
  }

  report.stats = { reps: REPS, draws: totalDraws, objects: ctx._objects.length }
}

/* ----------------------------------------------------------- warmup runner */

function verifyWarmup (w, report) {
  if (!w.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.id)) {
    report.fail(`id "${w.id}" must be stable kebab-case (it is the URL hash)`)
  }
  if (!w.category || typeof w.category !== 'string') report.fail('missing category')
  if (!w.name || typeof w.name !== 'string') report.fail('missing name')
  if (!w.summary || typeof w.summary !== 'string') report.warn('missing summary')
  if (w.setupNote != null && typeof w.setupNote !== 'string') report.fail('setupNote must be a string')

  if (!Array.isArray(w.exercises) || w.exercises.length === 0) {
    report.fail('exercises[] must be a non-empty array of { name, duration, cues[] }')
    return
  }
  w.exercises.forEach((e, i) => {
    if (!e || typeof e.name !== 'string' || !e.name.trim()) {
      report.fail(`exercises[${i}]: missing name`)
      return
    }
    if (typeof e.duration !== 'number' || !Number.isFinite(e.duration) || e.duration <= 0) {
      report.fail(`exercises[${i}] ("${truncate(e.name)}"): duration must be a positive number of seconds`)
    } else if (e.duration > 1800) {
      report.warn(`exercises[${i}] ("${truncate(e.name)}"): duration ${e.duration}s is over 30 min — is that intended?`)
    }
    if (e.cues != null && (!Array.isArray(e.cues) || e.cues.some((c) => typeof c !== 'string' || !c.trim()))) {
      report.fail(`exercises[${i}] ("${truncate(e.name)}"): cues must be an array of non-empty strings`)
    }
  })
  report.stats = { exercises: w.exercises.length }
}

/* ------------------------------------------------------------------- main */

function listDir (dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => path.join(dir, f))
}

function relPath (file) {
  return path.relative(ROOT, file).split(path.sep).join('/')
}

async function main () {
  const args = process.argv.slice(2)
  const allFiles = [...listDir(DRILLS_DIR), ...listDir(WARMUPS_DIR)]
  const targets = args.length ? args.map((a) => path.resolve(ROOT, a)) : allFiles
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')

  // cross-file maps built from EVERY drill + warmup file, so single-file runs
  // still catch collisions with the rest of the library (all these files share
  // one global scope in the browser)
  const declOwners = new Map()
  const idOwners = new Map()
  for (const f of allFiles) {
    const src = fs.readFileSync(f, 'utf8')
    const rel = relPath(f)
    for (const n of topLevelDecls(src)) {
      if (!declOwners.has(n)) declOwners.set(n, [])
      declOwners.get(n).push(rel)
    }
    const id = firstIdIn(src)
    if (id) {
      if (!idOwners.has(id)) idOwners.set(id, [])
      idOwners.get(id).push(rel)
    }
  }

  let anyFailed = false
  for (const file of targets) {
    const base = path.basename(file)
    const rel = relPath(file)
    const isWarmupFile = rel.startsWith('warmups/')
    const report = new Report(rel)

    if (!fs.existsSync(file)) {
      report.fail('file not found')
    } else {
      const src = fs.readFileSync(file, 'utf8')

      // statics
      if (!indexHtml.includes(`src="${rel}"`)) {
        report.fail(`no <script src="${rel}"> tag in index.html — it will not load`)
      }
      if (/\bsetTimeout\b|\bsetInterval\b/.test(src)) {
        report.fail('uses setTimeout/setInterval — never hard-code delays outside ctx.draw() (contract rule 7)')
      }
      for (const n of topLevelDecls(src)) {
        const others = (declOwners.get(n) || []).filter((r) => r !== rel)
        if (others.length) {
          report.fail(`top-level "${n}" is also declared in ${others.join(', ')} — these files share ONE browser global scope; wrap the file in an IIFE (see DRILL-AUTHORING.md)`)
        }
        if (ENGINE_GLOBALS.includes(n)) {
          report.fail(`top-level "${n}" collides with an engine global`)
        }
      }

      // load + run
      let loaded = { drills: [], warmups: [] }
      try {
        loaded = loadFile(file)
      } catch (e) {
        report.fail('file threw while loading: ' + e.message)
      }
      if (isWarmupFile && loaded.drills.length) {
        report.fail('a file in warmups/ must call registerWarmup(), not registerDrill()')
      }
      if (!isWarmupFile && loaded.warmups.length) {
        report.fail('a file in drills/ must call registerDrill(), not registerWarmup()')
      }
      const items = isWarmupFile ? loaded.warmups : loaded.drills
      if (items.length === 0 && report.failures.size === 0) {
        report.fail(`file never calls ${isWarmupFile ? 'registerWarmup()' : 'registerDrill()'}`)
      }
      for (const d of items) {
        const others = (idOwners.get(d.id) || []).filter((r) => r !== rel)
        if (others.length) report.fail(`id "${d.id}" is also used by ${others.join(', ')}`)
        if (items.length === 1 && d.id && base !== d.id + '.js') {
          report.warn(`filename ${base} does not match id "${d.id}" (convention: <id>.js)`)
        }
        try {
          if (isWarmupFile) verifyWarmup(d, report)
          else await verifyDrill(d, report)
        } catch (e) {
          report.fail(`threw at runtime: ${e.message}`)
        }
      }
    }

    // print
    const status = report.failures.size ? 'FAIL' : 'PASS'
    const s = report.stats
    const statTxt = !s ? ''
      : s.exercises != null ? `  (${s.exercises} exercises)`
        : `  (${s.objects} objects, ${s.reps} reps, ${s.draws} draws)`
    console.log(`${status}  ${rel}${statTxt}`)
    for (const m of Array.from(report.failures).slice(0, 12)) console.log(`      FAIL  ${m}`)
    if (report.failures.size > 12) console.log(`      … and ${report.failures.size - 12} more failures`)
    for (const m of report.warnings) console.log(`      warn  ${m}`)
    if (report.failures.size) anyFailed = true
  }

  console.log(anyFailed
    ? '\nResult: FAILED — fix the failures above before wiring/committing.'
    : '\nResult: OK — everything checked satisfies the contract.')
  process.exit(anyFailed ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
