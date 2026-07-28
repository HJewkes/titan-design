#!/usr/bin/env node
/**
 * Storybook launcher — one locked port, no silent drift.
 *
 * Storybook's `dev` auto-increments off a busy port. That is actively dangerous here:
 * a launch on a "free" port silently lands on ANOTHER worktree's server, and every
 * screenshot taken afterwards is plausible and wrong. It cost a VW-85 evidence set.
 * `--exact-port` turns that into a loud failure, and this script owns the port policy
 * around it.
 *
 *   node scripts/storybook-launch.mjs              # the locked port, reclaiming it
 *   node scripts/storybook-launch.mjs --isolated   # a private port, for parallel work
 *   node scripts/storybook-launch.mjs --list       # inventory only, launch nothing
 *   node scripts/storybook-launch.mjs --restart    # replace our own server on the port
 *
 * Reaping is scoped, and the default is the only category that is unambiguously dead:
 *
 *   --reap                 orphans (default) — worktree deleted, process still running
 *   --reap=orphans         the same, said explicitly
 *   --reap=foreign         live servers rooted in ANOTHER tree — may be a parallel agent's
 *   --reap=dupes           our own extra servers, off the locked port
 *   --reap=all             orphans + foreign + dupes
 *   --reap=foreign,dupes   any combination
 *
 * The locked port is never reaped (use `--restart`), and anything not identifiable as
 * Storybook is never touched.
 *
 * Anything not understood is forwarded to `storybook dev`.
 */
import { execFileSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** THE port. Everything non-isolated uses it, so a stale server is a bug, not a fork. */
const LOCKED_PORT = 6006
/** Isolated launches allocate here — deliberately clear of the locked port. */
const ISOLATED_RANGE = [6100, 6199]
/** Scanned for the inventory. Wide enough to catch Storybook's own auto-increment drift. */
const SCAN_RANGE = [6000, 6250]

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const FLAGS = ['--isolated', '--list', '--restart', '--reap', '--reap-all']
const isReapFlag = (a) => a === '--reap' || a === '--reap-all' || a.startsWith('--reap=')
const passthrough = argv.filter((a) => !FLAGS.includes(a) && !isReapFlag(a))

/** Reap categories requested, or `null` when reaping was not asked for at all. */
function requestedScopes() {
  const flag = argv.find(isReapFlag)
  if (!flag) return null
  if (flag === '--reap-all') return ['orphan', 'foreign', 'dupe']
  if (flag === '--reap') return ['orphan'] // the default scope
  const asked = flag.slice('--reap='.length).split(',').filter(Boolean)
  if (asked.includes('all')) return ['orphan', 'foreign', 'dupe']
  const map = {
    orphans: 'orphan',
    orphan: 'orphan',
    foreign: 'foreign',
    dupes: 'dupe',
    dupe: 'dupe',
  }
  const scopes = asked.map((a) => map[a]).filter(Boolean)
  const unknown = asked.filter((a) => !map[a] && a !== 'all')
  if (unknown.length) {
    console.error(`\n  Unknown reap scope: ${unknown.join(', ')}`)
    console.error(`  Valid: orphans (default), foreign, dupes, all\n`)
    process.exit(1)
  }
  return scopes.length ? scopes : ['orphan']
}

/**
 * Best-effort shell out. Swallowing the error is deliberate: on a runner without `lsof`
 * the inventory simply comes back empty and we fall through to launching normally, which
 * is the safe degradation. A port policy must not be able to block CI.
 */
const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return ''
  }
}

/** Every listening TCP socket, as `{ port, pid }`. One lsof call, not one per port. */
function listeners() {
  const out = sh('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN', '-Fpn'])
  const found = []
  let pid = null
  for (const line of out.split('\n')) {
    if (line.startsWith('p')) pid = Number(line.slice(1))
    else if (line.startsWith('n')) {
      const m = line.match(/:(\d+)$/)
      if (m && pid) found.push({ port: Number(m[1]), pid })
    }
  }
  return found
}

/** A process's working directory — the only reliable way to tell WHICH worktree it serves. */
function cwdOf(pid) {
  const out = sh('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'])
  const line = out.split('\n').find((l) => l.startsWith('n'))
  return line ? line.slice(1) : null
}

const commandOf = (pid) => sh('ps', ['-o', 'command=', '-p', String(pid)]).trim()
const isStorybook = (cmd) => /storybook|\bsb\b/i.test(cmd)

/** What is listening in the scan range, and whose it is. */
function inventory() {
  const [lo, hi] = SCAN_RANGE
  const seen = new Map()
  for (const { port, pid } of listeners()) {
    if (port < lo || port > hi) continue
    if (seen.has(port)) continue
    const command = commandOf(pid)
    seen.set(port, {
      port,
      pid,
      command,
      cwd: cwdOf(pid),
      storybook: isStorybook(command),
    })
  }
  return [...seen.values()].sort((a, b) => a.port - b.port)
}

const isOurs = (entry) => entry.cwd != null && entry.cwd.startsWith(PKG_ROOT)

/**
 * Which reap scope an entry belongs to. These names are exactly the `--reap=` values, so
 * the inventory reads as a map of what each option would kill.
 *
 *   other   not identifiable as Storybook — never touched
 *   locked  ours, on the locked port — never reaped; use --restart
 *   orphan  the tree it serves is GONE. Unambiguously dead: nobody can be using it, and
 *           it is exactly what squats ports and poisons screenshots. The DEFAULT scope.
 *   foreign live, rooted in another tree — may be a parallel agent's, so opt-in only
 *   dupe    ours, off the locked port — probably a leftover --isolated, so opt-in only
 */
function category(entry) {
  if (!entry.storybook) return 'other'
  if (entry.cwd != null && !existsSync(entry.cwd)) return 'orphan'
  if (isOurs(entry)) return entry.port === LOCKED_PORT ? 'locked' : 'dupe'
  return 'foreign'
}

const isOrphan = (entry) => category(entry) === 'orphan'

function printInventory(entries) {
  if (entries.length === 0) {
    console.log(`\n  Nothing listening in ${SCAN_RANGE[0]}-${SCAN_RANGE[1]}.\n`)
    return
  }
  console.log(`\n  Listening in ${SCAN_RANGE[0]}-${SCAN_RANGE[1]}:\n`)
  console.log('  PORT   PID     CATEGORY   ROOT')
  for (const e of entries) {
    console.log(
      `  ${String(e.port).padEnd(6)} ${String(e.pid).padEnd(7)} ${category(e).padEnd(10)} ${e.cwd ?? '(unknown)'}`
    )
  }

  const counts = entries.reduce((acc, e) => {
    acc[category(e)] = (acc[category(e)] ?? 0) + 1
    return acc
  }, {})
  console.log('\n  locked  = ours on the locked port     → --restart to replace')
  console.log('  orphan  = its worktree is GONE        → --reap            (default)')
  console.log('  foreign = another live tree           → --reap=foreign')
  console.log('  dupe    = ours, off the locked port   → --reap=dupes')
  console.log('  other   = not Storybook               → never touched')
  const summary = ['orphan', 'foreign', 'dupe']
    .filter((c) => counts[c])
    .map((c) => `${counts[c]} ${c}`)
    .join(', ')
  if (summary) console.log(`\n  Reapable: ${summary}.  --reap=all clears every one of them.`)
  console.log('')
}

/** Kill everything in the requested scopes. Returns the ports freed. */
function reap(entries, scopes) {
  const targets = entries.filter((e) => scopes.includes(category(e)))
  if (targets.length === 0) {
    console.log(`  Nothing to reap in scope: ${scopes.join(', ')}.\n`)
    return []
  }
  console.log(`  Reaping scope: ${scopes.join(', ')}`)
  for (const e of targets) {
    const c = category(e)
    killPid(e.pid, c === 'orphan' ? `orphan — ${e.cwd} is gone` : `${c} on ${e.port}`)
  }
  console.log('')
  return targets.map((e) => e.port)
}

function killPid(pid, why) {
  console.log(`  Reclaiming: killing pid ${pid} — ${why}`)
  sh('kill', [String(pid)])
  // Give it a moment to release the socket before we bind.
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    if (!listeners().some((l) => l.pid === pid)) return true
    execFileSync('sleep', ['0.2'])
  }
  console.log(`  pid ${pid} did not exit; sending SIGKILL`)
  sh('kill', ['-9', String(pid)])
  return true
}

function pickIsolatedPort(entries) {
  const busy = new Set(entries.map((e) => e.port))
  for (let p = ISOLATED_RANGE[0]; p <= ISOLATED_RANGE[1]; p++) if (!busy.has(p)) return p
  console.error(`\n  No free port in ${ISOLATED_RANGE.join('-')}. Clean some up.\n`)
  process.exit(1)
}

/**
 * The local binary, not bare `storybook` — a bare name only resolves when a package
 * runner has put `node_modules/.bin` on PATH, and this script is meant to be runnable
 * directly (`node scripts/storybook-launch.mjs`) too.
 */
function storybookBin() {
  const local = resolve(PKG_ROOT, 'node_modules/.bin/storybook')
  if (existsSync(local)) return local
  const hoisted = resolve(PKG_ROOT, '../../node_modules/.bin/storybook')
  return existsSync(hoisted) ? hoisted : 'storybook'
}

function launch(port) {
  console.log(`  Starting Storybook on ${port} (--exact-port: it fails rather than drifts)\n`)
  const args = ['dev', '-p', String(port), '--exact-port', ...passthrough]
  const child = spawn(storybookBin(), args, { stdio: 'inherit', cwd: PKG_ROOT })
  child.on('error', (err) => {
    console.error(`\n  Could not start Storybook: ${err.message}\n`)
    process.exit(1)
  })
  child.on('exit', (code) => process.exit(code ?? 0))
}

// --- main --------------------------------------------------------------------

let entries = inventory()
printInventory(entries)

// Reap BEFORE the --list exit, so `--reap --list` reaps and then shows the result.
const scopes = requestedScopes()
if (scopes) {
  const freed = reap(entries, scopes)
  if (freed.length > 0) {
    entries = inventory() // re-read: ports we just freed are now available
    console.log('  After reaping:')
    printInventory(entries)
  }
}

if (has('--list')) process.exit(0)

if (has('--isolated')) {
  const port = pickIsolatedPort(entries)
  console.log(`  ISOLATED launch — this port is yours alone.`)
  console.log(`  http://127.0.0.1:${port}\n`)
  launch(port)
} else {
  const holder = entries.find((e) => e.port === LOCKED_PORT)

  if (!holder) {
    launch(LOCKED_PORT)
  } else if (!holder.storybook) {
    // Never kill something we cannot identify.
    console.error(`  Port ${LOCKED_PORT} is held by a NON-Storybook process (pid ${holder.pid}):`)
    console.error(`    ${holder.command}`)
    console.error(`\n  Refusing to kill it. Free the port, or use --isolated.\n`)
    process.exit(1)
  } else if (isOurs(holder) && !has('--restart')) {
    // Exits 0 WITHOUT holding the foreground. Safe for `playwright.config.ts`, whose
    // webServer sets `reuseExistingServer: true` and therefore never runs this command
    // when 6006 is already serving. If that ever flips to false, this branch has to
    // become a restart instead, or Playwright will wait forever for a server we did
    // not start.
    console.log(`  Storybook for THIS package is already on ${LOCKED_PORT} (pid ${holder.pid}).`)
    console.log(`  http://127.0.0.1:${LOCKED_PORT}`)
    console.log(`\n  Use --restart to replace it, or --isolated for a second instance.\n`)
    process.exit(0)
  } else {
    const why = isOurs(holder)
      ? 'ours, --restart requested'
      : `STALE — serving ${holder.cwd ?? 'an unknown root'}, not this package`
    if (!isOurs(holder)) {
      console.log(`  ⚠ The locked port is held by a DIFFERENT tree. This is the failure mode`)
      console.log(`    that produces plausible screenshots of the wrong code.`)
    }
    killPid(holder.pid, why)
    launch(LOCKED_PORT)
  }
}
