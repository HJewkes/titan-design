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
 *   node scripts/storybook-launch.mjs --reap       # kill ORPHANED servers, then launch
 *   node scripts/storybook-launch.mjs --reap-all   # also kill live foreign / duplicate ours
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
const passthrough = argv.filter((a) => !FLAGS.includes(a))

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
 * The server is still running but the tree it serves is GONE — a worktree was deleted
 * out from under it. Unambiguously dead, and the safe default for reaping: nobody can
 * be using it, and it is exactly what squats ports and poisons screenshots.
 */
const isOrphan = (entry) => entry.storybook && entry.cwd != null && !existsSync(entry.cwd)

function printInventory(entries) {
  if (entries.length === 0) {
    console.log(`\n  Nothing listening in ${SCAN_RANGE[0]}-${SCAN_RANGE[1]}.\n`)
    return
  }
  console.log(`\n  Listening in ${SCAN_RANGE[0]}-${SCAN_RANGE[1]}:\n`)
  console.log('  PORT   PID     KIND        STATE     ROOT')
  for (const e of entries) {
    const kind = e.storybook ? (isOurs(e) ? 'storybook*' : 'storybook') : 'other'
    const state = isOrphan(e) ? 'ORPHAN' : e.port === LOCKED_PORT ? 'locked' : 'live'
    const root = e.cwd ?? '(unknown)'
    console.log(
      `  ${String(e.port).padEnd(6)} ${String(e.pid).padEnd(7)} ${kind.padEnd(11)} ${state.padEnd(9)} ${root}`
    )
  }
  const orphans = entries.filter(isOrphan).length
  console.log('\n  * = this package.  ORPHAN = its worktree no longer exists on disk.')
  if (orphans) console.log(`  ${orphans} orphaned server(s) — clear with --reap.`)
  console.log('')
}

/** Kill the dead (and, with --reap-all, the merely redundant). Returns ports freed. */
function reap(entries, all) {
  const targets = entries.filter((e) => {
    if (!e.storybook) return false // never touch what we cannot identify
    if (isOrphan(e)) return true
    if (!all) return false
    return e.port !== LOCKED_PORT // --reap-all: every duplicate except the locked port
  })
  if (targets.length === 0) {
    console.log('  Nothing to reap.\n')
    return []
  }
  for (const e of targets) {
    killPid(e.pid, isOrphan(e) ? `orphaned — ${e.cwd} is gone` : `duplicate on ${e.port}`)
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
if (has('--reap') || has('--reap-all')) {
  const freed = reap(entries, has('--reap-all'))
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
