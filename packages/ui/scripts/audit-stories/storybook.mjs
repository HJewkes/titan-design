/**
 * The story audit's Storybook: started isolated, stopped by process group, never by name.
 *
 * `startStorybook` spawns `storybook-launch.mjs --isolated` detached, so the launcher and the
 * Storybook it spawns (a non-detached child with inherited stdio) share one process group whose
 * id is the launcher's PID. The port comes from the launcher's own `http://127.0.0.1:P` line.
 * Ready means `/index.json` answers on that port, the launcher is alive, and the listener on the
 * port is in our group. The last check matters: the launcher prints its port before Storybook
 * binds, so two concurrent launches can print the same port, and the loser would otherwise accept
 * the winner's index while its own launcher is still alive.
 *
 * `attachStorybook` reuses a server the caller already runs (`--url`). It refuses anything off
 * loopback and stops nothing.
 */
/* global process, URL, setTimeout, clearTimeout */
import { execFileSync, spawn } from 'node:child_process'
import { get } from 'node:http'
import { constants } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveLsof } from '../storybook-launch.mjs'

export const EXIT_USAGE = 64
export const EXIT_INTERRUPT = 130

const DEFAULT_LAUNCHER = resolve(dirname(fileURLToPath(import.meta.url)), '../storybook-launch.mjs')
const LAUNCHER_URL_LINE = /http:\/\/127\.0\.0\.1:(\d+)/
const LOOPBACK_HOSTS = new Set(['localhost', '[::1]'])
const OUTPUT_TAIL_LINES = 40
const STOP_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP']

/** A start or usage failure; the command maps it to exit 64. */
export class StorybookError extends Error {
  exitCode = EXIT_USAGE
}

/** The port in a launcher output line, or `null` when the line carries none. */
export function parseLauncherPort(line) {
  const match = LAUNCHER_URL_LINE.exec(line)
  return match ? Number(match[1]) : null
}

/** The parsed URL when it is http on a loopback host; throws a usage error otherwise. */
export function assertLoopbackUrl(raw) {
  let url
  try {
    url = new URL(raw)
  } catch {
    throw new StorybookError(`--url is not a URL: ${raw}`)
  }
  const loopback = LOOPBACK_HOSTS.has(url.hostname) || /^127(\.\d{1,3}){3}$/.test(url.hostname)
  if (url.protocol !== 'http:' || !loopback) {
    throw new StorybookError(
      `--url must be http on a loopback host, not ${url.protocol}//${url.host}`
    )
  }
  return url
}

/** The process group of `pid`, or `null` when the process is gone. */
export function pgidOf(pid) {
  try {
    const out = execFileSync('ps', ['-o', 'pgid=', '-p', String(pid)], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return Number(out.trim()) || null
  } catch {
    return null
  }
}

let ownGroup
const ownPgid = () => (ownGroup ??= pgidOf(process.pid))

/** Throws unless `pgid` names a group we may signal: never 0, 1, ourselves or our own group. */
export function assertSignallableGroup(pgid) {
  const valid = Number.isInteger(pgid) && pgid > 1 && pgid !== process.pid
  if (!valid || pgid === ownPgid()) {
    throw new StorybookError(`Refusing to signal process group ${pgid}`)
  }
}

/** True while any process in the group still exists. */
export function isGroupAlive(pgid) {
  assertSignallableGroup(pgid)
  try {
    process.kill(-pgid, 0)
    return true
  } catch (err) {
    return err.code === 'EPERM'
  }
}

function signalGroup(pgid, signal) {
  assertSignallableGroup(pgid)
  try {
    process.kill(-pgid, signal)
  } catch (err) {
    if (err.code !== 'ESRCH') throw err
  }
}

/** A cancellable delay, so a won race leaves no timer holding the event loop open. */
function timer(ms) {
  let id
  const promise = new Promise((done) => (id = setTimeout(done, ms)))
  return { promise, cancel: () => clearTimeout(id) }
}

const delay = (ms) => timer(ms).promise

async function waitForGroupExit(pgid, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!isGroupAlive(pgid)) return true
    await delay(50)
  }
  return !isGroupAlive(pgid)
}

/**
 * SIGTERM to the whole group, SIGKILL after `graceMs` if anything in it survives.
 * Resolves `true` once the group is confirmed gone.
 */
export async function stopGroup(pgid, { graceMs = 5000 } = {}) {
  signalGroup(pgid, 'SIGTERM')
  if (await waitForGroupExit(pgid, graceMs)) return true
  signalGroup(pgid, 'SIGKILL')
  return waitForGroupExit(pgid, graceMs)
}

/**
 * An idempotent stop for one group. `stopped` latches once the group is confirmed gone, after
 * which nothing signals the pgid again, since the OS may have reused it.
 */
function groupStopper(pgid, graceMs) {
  let stopping = null
  let markStopped
  const state = {
    stopped: false,
    whenStopped: new Promise((done) => (markStopped = done)),
    stop() {
      stopping ??= stopGroup(pgid, { graceMs }).then((gone) => {
        if (!gone) throw new StorybookError(`Process group ${pgid} survived SIGKILL`)
        state.stopped = true
        markStopped()
      })
      return stopping
    },
  }
  return state
}

/** GET a URL and parse JSON; resolves `null` on any failure so callers can poll. */
function getJson(url, timeoutMs = 2000) {
  return new Promise((done) => {
    const req = get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode !== 200) {
        res.resume()
        return done(null)
      }
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        try {
          done(JSON.parse(body))
        } catch {
          done(null)
        }
      })
    })
    req.on('timeout', () => req.destroy())
    req.on('error', () => done(null))
  })
}

/** Throws unless every expected `importPath` appears among the index entries. */
export function assertIndexLists(index, importPaths) {
  const served = new Set(Object.values(index?.entries ?? {}).map((e) => e.importPath))
  const missing = importPaths.filter((p) => !served.has(p))
  if (missing.length) {
    throw new StorybookError(`Storybook index does not list: ${missing.join(', ')}`)
  }
}

/** PIDs listening on a TCP port, from lsof. */
export function listenerPids(port) {
  const lsof = resolveLsof()
  if (!lsof) throw new StorybookError(`lsof not found, so the owner of port ${port} is unproven`)
  try {
    const out = execFileSync(lsof, ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out
      .split('\n')
      .filter((l) => l.startsWith('p'))
      .map((l) => Number(l.slice(1)))
  } catch (err) {
    if (err.status === 1) return []
    throw new StorybookError(`lsof failed on port ${port}: ${err.message}`)
  }
}

/** Throws unless the port has a listener and every listener belongs to process group `pgid`. */
export function assertListenerInGroup(
  port,
  pgid,
  { listenersOn = listenerPids, groupOf = pgidOf } = {}
) {
  const pids = listenersOn(port)
  const strangers = pids.filter((pid) => groupOf(pid) !== pgid)
  if (pids.length === 0 || strangers.length > 0) {
    const who = strangers.length ? `pid ${strangers.join(', ')}` : 'no listener'
    throw new StorybookError(`Port ${port} is served by ${who}, not by launcher group ${pgid}`)
  }
}

/** Collects launcher output: the last lines for error messages, and each line for listeners. */
function watchOutput(child, onLine) {
  const tail = []
  let pending = ''
  const take = (chunk) => {
    const lines = (pending + chunk).split('\n')
    pending = lines.pop()
    for (const line of lines) {
      tail.push(line)
      if (tail.length > OUTPUT_TAIL_LINES) tail.shift()
      onLine(line)
    }
  }
  child.stdout.setEncoding('utf8').on('data', take)
  child.stderr.setEncoding('utf8').on('data', take)
  return () => tail.join('\n')
}

const hasExited = (child) => child.exitCode !== null || child.signalCode !== null

function launcherExit(child) {
  return new Promise((done) => {
    if (hasExited(child)) return done(child.exitCode ?? child.signalCode)
    child.once('exit', (code, signal) => done(code ?? signal))
  })
}

async function pollIndex(port, { exited, deadline, pollMs }) {
  const url = `http://127.0.0.1:${port}/index.json`
  while (Date.now() < deadline) {
    const raced = await Promise.race([getJson(url), exited.then((code) => ({ exited: code }))])
    if (raced && 'exited' in raced) return raced
    if (raced) return { index: raced }
    await delay(pollMs)
  }
  return { timedOut: true }
}

function waitForPort(child, readLine) {
  return new Promise((done) => {
    readLine((line) => {
      const port = parseLauncherPort(line)
      if (port != null) done(port)
    })
    child.once('exit', () => done(null))
  })
}

async function waitForPortWithin(child, readLine, timeoutMs) {
  const limit = timer(timeoutMs)
  try {
    return await Promise.race([waitForPort(child, readLine), limit.promise])
  } finally {
    limit.cancel()
  }
}

function spawnLauncher({ launcher, args, cwd }) {
  const child = spawn(process.execPath, [launcher, ...args], {
    cwd,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (!child.pid) throw new StorybookError(`Could not spawn ${launcher}`)
  return child
}

/** Waits for the printed port, then for `/index.json` served by our own living group. */
async function awaitReady(child, outputTail, readLine, { readyTimeoutMs, pollMs, ownership }) {
  const deadline = Date.now() + readyTimeoutMs
  const exited = launcherExit(child)
  const port = await waitForPortWithin(child, readLine, readyTimeoutMs)
  const fail = (why) => new StorybookError(`${why}\n${outputTail()}`)
  if (port == null) throw fail('Launcher printed no http://127.0.0.1:<port> line')
  const result = await pollIndex(port, { exited, deadline, pollMs })
  if (result.timedOut) throw fail(`Storybook on ${port} did not serve /index.json in time`)
  if ('exited' in result || hasExited(child)) {
    throw fail(`Launcher exited (${result.exited}) before /index.json answered on ${port}`)
  }
  assertListenerInGroup(port, child.pid, ownership)
  return { port, index: result.index }
}

/**
 * Starts an isolated Storybook and resolves once it serves `/index.json`. `onSpawn` receives
 * the launcher PID (the group id) as soon as it exists. On any failure the group is stopped
 * before the error propagates. `ownership` overrides the listener lookup, for tests only.
 */
export async function startStorybook({
  launcher = DEFAULT_LAUNCHER,
  args = ['--isolated'],
  cwd = dirname(dirname(launcher)),
  expectImportPaths = [],
  readyTimeoutMs = 120_000,
  pollMs = 250,
  graceMs = 5000,
  onSpawn = () => {},
  ownership,
} = {}) {
  const child = spawnLauncher({ launcher, args, cwd })
  const pgid = child.pid
  onSpawn(pgid)
  const stopper = groupStopper(pgid, graceMs)
  const listeners = []
  const output = watchOutput(child, (line) => listeners.forEach((fn) => fn(line)))
  const readLine = (fn) => listeners.push(fn)
  try {
    const ready = await awaitReady(child, output, readLine, { readyTimeoutMs, pollMs, ownership })
    assertIndexLists(ready.index, expectImportPaths)
    return Object.assign(stopper, {
      ...ready,
      url: `http://127.0.0.1:${ready.port}`,
      pid: pgid,
      output,
    })
  } catch (err) {
    await stopper.stop()
    throw err
  }
}

/** Reuses a caller's server on loopback. It must answer `/index.json`; `stop` is a no-op. */
export async function attachStorybook(raw, { expectImportPaths = [] } = {}) {
  const url = assertLoopbackUrl(raw)
  const base = url.origin
  const index = await getJson(`${base}/index.json`)
  if (!index) throw new StorybookError(`No Storybook index at ${base}/index.json`)
  assertIndexLists(index, expectImportPaths)
  return {
    url: base,
    port: Number(url.port),
    pid: null,
    index,
    stopped: true,
    whenStopped: Promise.resolve(),
    stop: async () => {},
  }
}

/**
 * Stops the server on SIGINT, SIGTERM and SIGHUP, then exits 128 + the signal number (130 for
 * SIGINT). A repeated signal joins the stop already running instead of killing us mid-stop. If
 * the process exits any other way before the group is gone, the group gets a synchronous SIGKILL.
 * Every handler is removed once the group is confirmed gone. Returns the remover.
 */
export function stopOnSignals(
  server,
  { proc = process, exit = (code) => process.exit(code), kill = signalGroup } = {}
) {
  const onSignal = async (signal) => {
    await server.stop().catch(() => {})
    exit(128 + constants.signals[signal])
  }
  const onExit = () => {
    if (server.stopped || server.pid == null) return
    try {
      kill(server.pid, 'SIGKILL')
    } catch {
      // Exiting anyway; there is no one left to report to.
    }
  }
  STOP_SIGNALS.forEach((s) => proc.on(s, onSignal))
  proc.on('exit', onExit)
  const remove = () => {
    STOP_SIGNALS.forEach((s) => proc.off(s, onSignal))
    proc.off('exit', onExit)
  }
  server.whenStopped.then(remove)
  return remove
}
