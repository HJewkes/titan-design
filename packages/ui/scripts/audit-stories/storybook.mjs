/**
 * The story audit's Storybook: started isolated, stopped by process group, never by name.
 *
 * `startStorybook` spawns `storybook-launch.mjs --isolated` detached, so the launcher and the
 * Storybook it spawns (a non-detached child with inherited stdio) share one process group whose
 * id is the launcher's PID. The port comes from the launcher's own `http://127.0.0.1:P` line, and
 * readiness is our own child answering `/index.json` on that port while it is still alive. That
 * pairing is the provenance check: `importPath`s are relative and identical across worktrees, so
 * an index alone cannot prove which tree is serving.
 *
 * `attachStorybook` reuses a server the caller already runs (`--url`). It refuses anything off
 * loopback and stops nothing.
 */
import { spawn } from 'node:child_process'
import { get } from 'node:http'
import { constants } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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

/** The parsed URL when it is http(s) on a loopback host; throws a usage error otherwise. */
export function assertLoopbackUrl(raw) {
  let url
  try {
    url = new URL(raw)
  } catch {
    throw new StorybookError(`--url is not a URL: ${raw}`)
  }
  const loopback = LOOPBACK_HOSTS.has(url.hostname) || /^127(\.\d{1,3}){3}$/.test(url.hostname)
  if (!['http:', 'https:'].includes(url.protocol) || !loopback) {
    throw new StorybookError(`--url must be http on a loopback host, not ${url.host}`)
  }
  return url
}

/** True while any process in the group still exists. */
export function isGroupAlive(pgid) {
  try {
    process.kill(-pgid, 0)
    return true
  } catch (err) {
    return err.code === 'EPERM'
  }
}

function signalGroup(pgid, signal) {
  try {
    process.kill(-pgid, signal)
  } catch (err) {
    if (err.code !== 'ESRCH') throw err
  }
}

const delay = (ms) => new Promise((done) => setTimeout(done, ms))

async function waitForGroupExit(pgid, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!isGroupAlive(pgid)) return true
    await delay(50)
  }
  return !isGroupAlive(pgid)
}

/** SIGTERM to the whole group, SIGKILL after `graceMs` if anything in it survives. */
export async function stopGroup(pgid, { graceMs = 5000 } = {}) {
  signalGroup(pgid, 'SIGTERM')
  if (await waitForGroupExit(pgid, graceMs)) return
  signalGroup(pgid, 'SIGKILL')
  await waitForGroupExit(pgid, graceMs)
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

/** Collects launcher output: the last lines for error messages, and the first printed port. */
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

function launcherExit(child) {
  return new Promise((done) => {
    if (child.exitCode !== null || child.signalCode !== null) return done(child.exitCode)
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

function spawnLauncher({ launcher, args, cwd }) {
  const child = spawn(process.execPath, [launcher, ...args], {
    cwd,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (!child.pid) throw new StorybookError(`Could not spawn ${launcher}`)
  return child
}

/** Waits for the printed port, then for `/index.json` from the still-living launcher. */
async function awaitReady(child, outputTail, readLine, { readyTimeoutMs, pollMs }) {
  const deadline = Date.now() + readyTimeoutMs
  const exited = launcherExit(child)
  const port = await Promise.race([waitForPort(child, readLine), delay(readyTimeoutMs)])
  const fail = (why) => new StorybookError(`${why}\n${outputTail()}`)
  if (port == null) throw fail('Launcher printed no http://127.0.0.1:<port> line')
  const result = await pollIndex(port, { exited, deadline, pollMs })
  if (result.timedOut) throw fail(`Storybook on ${port} did not serve /index.json in time`)
  if ('exited' in result || child.exitCode !== null || child.signalCode !== null) {
    throw fail(`Launcher exited (${result.exited}) before /index.json answered on ${port}`)
  }
  return { port, index: result.index }
}

/**
 * Starts an isolated Storybook and resolves once it serves `/index.json`. `onSpawn` receives
 * the launcher PID (the group id) as soon as it exists. On any failure the group is stopped
 * before the error propagates.
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
} = {}) {
  const child = spawnLauncher({ launcher, args, cwd })
  const pgid = child.pid
  onSpawn(pgid)
  const listeners = []
  const outputTail = watchOutput(child, (line) => listeners.forEach((fn) => fn(line)))
  const stop = () => stopGroup(pgid, { graceMs })
  try {
    const { port, index } = await awaitReady(child, outputTail, (fn) => listeners.push(fn), {
      readyTimeoutMs,
      pollMs,
    })
    assertIndexLists(index, expectImportPaths)
    return { url: `http://127.0.0.1:${port}`, port, pid: pgid, index, output: outputTail, stop }
  } catch (err) {
    await stop()
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
  return { url: base, port: Number(url.port), pid: null, index, stop: async () => {} }
}

/**
 * Stops the server on SIGINT, SIGTERM and SIGHUP before exiting 128 + the signal number
 * (130 for SIGINT), and SIGKILLs the group synchronously if the process exits any other way.
 * Returns a function that removes the handlers.
 */
export function stopOnSignals(server, { exit = (code) => process.exit(code) } = {}) {
  const onSignal = async (signal) => {
    await server.stop()
    exit(128 + constants.signals[signal])
  }
  const onExit = () => {
    if (server.pid != null) signalGroup(server.pid, 'SIGKILL')
  }
  STOP_SIGNALS.forEach((s) => process.once(s, onSignal))
  process.once('exit', onExit)
  return () => {
    STOP_SIGNALS.forEach((s) => process.off(s, onSignal))
    process.off('exit', onExit)
  }
}
