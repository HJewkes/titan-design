// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ESLint } from 'eslint'
import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  EXIT_INTERRUPT,
  EXIT_USAGE,
  StorybookError,
  assertListenerInGroup,
  assertLoopbackUrl,
  attachStorybook,
  isGroupAlive,
  listenerPids,
  parseLauncherPort,
  pgidOf,
  startStorybook,
  stopGroup,
  stopOnSignals,
} from './storybook.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(here, '../..')
const FAKE_LAUNCHER = join(here, 'fixtures/fake-launcher.mjs')
const DRIVER = join(here, 'fixtures/start-and-wait.mjs')
const FAKE_IMPORT_PATH = './src/components/ui/fake-button/FakeButton.stories.tsx'
const OWN_FILES = [
  'scripts/audit-stories/storybook.mjs',
  'scripts/audit-stories/storybook.test.mjs',
  'scripts/audit-stories/fixtures/fake-launcher.mjs',
  'scripts/audit-stories/fixtures/start-and-wait.mjs',
]

// Every group and PID a test starts, killed in afterEach even when the test failed.
const groups = new Set()
const pids = new Set()

const OWN_GROUP = pgidOf(process.pid)

// Only a child this file spawned: never 0, ±1, this process, this group or a non-integer.
const isSpawnedTarget = (target) =>
  Number.isInteger(target) &&
  OWN_GROUP != null &&
  ![0, 1, process.pid, OWN_GROUP].includes(Math.abs(target))

const quietKill = (target) => {
  if (!isSpawnedTarget(target)) throw new Error(`refusing to kill ${target}`)
  try {
    process.kill(target, 'SIGKILL')
  } catch {
    // already gone
  }
}

afterEach(() => {
  groups.forEach((g) => quietKill(-g))
  pids.forEach((p) => quietKill(p))
  groups.clear()
  pids.clear()
})

const isAlive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err.code === 'EPERM'
  }
}

// Only ever wraps fake-launcher groups started by these tests, never a guard case.
const passThroughKill = (target, signal) => {
  if (!isSpawnedTarget(target)) throw new Error(`refusing to signal ${target}`)
  return process.kill(target, signal)
}

async function waitUntil(condition, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('condition not met in time')
    await new Promise((ok) => setTimeout(ok, 50))
  }
}

const startFake = (args = [], options = {}) =>
  startStorybook({
    launcher: FAKE_LAUNCHER,
    args,
    readyTimeoutMs: 10_000,
    pollMs: 50,
    graceMs: 1000,
    onSpawn: (pgid) => groups.add(pgid),
    ...options,
  })

const serverPidOf = (server) => {
  const pid = Number(server.output().match(/fake-server-pid (\d+)/)[1])
  pids.add(pid)
  return pid
}

function spawnTracked(args) {
  const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'inherit'] })
  pids.add(child.pid)
  return child
}

const firstLineMatching = (child, pattern) =>
  new Promise((done, fail) => {
    let out = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => {
      out += chunk
      const match = pattern.exec(out)
      if (match) done(match)
    })
    child.once('exit', (code) => fail(new Error(`exited ${code} before ${pattern}: ${out}`)))
  })

const exitCodeOf = (child) =>
  new Promise((done) => child.once('exit', (code, signal) => done(code ?? signal)))

async function startDriver(args = []) {
  const driver = spawnTracked([DRIVER, ...args])
  const exited = exitCodeOf(driver)
  const match = await firstLineMatching(driver, /ready (\d+) (\d+)/)
  const [launcherPid, serverPid] = match.slice(1).map(Number)
  groups.add(launcherPid)
  pids.add(serverPid)
  return { driver, exited, launcherPid, serverPid }
}

describe('lint', () => {
  it('lints clean under the package ESLint config', async () => {
    const results = await new ESLint({ cwd: PKG_ROOT }).lintFiles(OWN_FILES)
    const problems = results.flatMap((r) =>
      r.messages.map((m) => `${r.filePath}:${m.line} ${m.message}`)
    )
    expect(problems).toEqual([])
  }, 60_000)
})

describe('parseLauncherPort', () => {
  it('reads the port from the isolated launcher line', () => {
    expect(parseLauncherPort('  http://127.0.0.1:6123')).toBe(6123)
  })

  it('ignores lines without a loopback URL', () => {
    expect(parseLauncherPort('  ISOLATED launch — this port is yours alone.')).toBeNull()
    expect(parseLauncherPort('  http://localhost:6123')).toBeNull()
  })

  it('matches the line the real launcher prints for an isolated launch', () => {
    const source = readFileSync(join(here, '../storybook-launch.mjs'), 'utf8')
    expect(source).toContain('console.log(`  http://127.0.0.1:${port}\\n`)')
  })
})

describe('process group guard', () => {
  // Every case passes a spy as `kill`: a broken guard must never reach the real process.kill
  // with 0, 1, -1, this pid or this group; a guard mutation once SIGTERMed a whole shell.
  const errorOf = (fn) => {
    try {
      fn()
      return null
    } catch (err) {
      return err
    }
  }

  it.each([
    ['0', 0],
    ['null', null],
    ['1 (every process)', 1],
    ['-1', -1],
    ['a fraction', 2.5],
    ['a numeric string', '4242'],
    ['our own pid', process.pid],
    ['our own group', OWN_GROUP],
  ])('refuses to signal %s', async (_, pgid) => {
    const kill = vi.fn()

    const probe = errorOf(() => isGroupAlive(pgid, { kill }))
    const stop = await stopGroup(pgid, { kill, graceMs: 0 }).then(
      () => null,
      (err) => err
    )

    expect(kill).not.toHaveBeenCalled()
    expect(probe).toMatchObject({ exitCode: EXIT_USAGE })
    expect(stop).toMatchObject({ exitCode: EXIT_USAGE })
  })

  it('refuses every group when its own process group cannot be read', () => {
    const kill = vi.fn()

    const probe = errorOf(() => isGroupAlive(4242, { kill, ownGroup: () => null }))

    expect(kill).not.toHaveBeenCalled()
    expect(probe).toMatchObject({ message: expect.stringMatching(/process group is unknown/) })
  })
})

describe('lsof and ps probes', () => {
  let dir
  let hanging

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'storybook-probe-'))
    hanging = join(dir, 'hang')
    writeFileSync(hanging, '#!/bin/sh\nexec sleep 5\n')
    chmodSync(hanging, 0o755)
  })

  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('fails closed with a usage exit when lsof hangs', () => {
    const started = Date.now()

    const run = () => listenerPids(6123, { lsof: hanging, timeoutMs: 200 })

    expect(run).toThrow(expect.objectContaining({ exitCode: EXIT_USAGE }))
    expect(Date.now() - started).toBeLessThan(2000)
  })

  it('reports no process group when ps hangs', () => {
    const started = Date.now()

    const group = pgidOf(process.pid, { ps: hanging, timeoutMs: 200 })

    expect(group).toBeNull()
    expect(Date.now() - started).toBeLessThan(2000)
  })
})

describe('startStorybook', () => {
  it('serves on the port the launcher printed', async () => {
    const server = await startFake()
    const printed = parseLauncherPort(server.output())
    expect(server.port).toBe(printed)
    expect(server.url).toBe(`http://127.0.0.1:${printed}`)
    expect(server.index.entries['fake-button--default'].importPath).toBe(FAKE_IMPORT_PATH)
    await server.stop()
  })

  it('fails with a usage exit when the launcher dies before /index.json answers', async () => {
    let pgid
    const start = startFake(['--die-before-ready'], {
      onSpawn: (p) => groups.add((pgid = p)),
    })
    await expect(start).rejects.toThrow(/exited \(3\) before \/index\.json/)
    await expect(start).rejects.toMatchObject({ exitCode: EXIT_USAGE })
    expect(isAlive(pgid)).toBe(false)
  })

  it('fails and stops the group when the launcher prints no port line', async () => {
    let pgid
    const start = startFake(['--no-line'], {
      readyTimeoutMs: 500,
      onSpawn: (p) => groups.add((pgid = p)),
    })
    await expect(start).rejects.toThrow(/printed no http/)
    expect(isAlive(pgid)).toBe(false)
  })

  it('fails and stops the group when the index lacks an expected story file', async () => {
    let pgid
    const start = startFake([], {
      expectImportPaths: [FAKE_IMPORT_PATH, './src/Missing.stories.tsx'],
      onSpawn: (p) => groups.add((pgid = p)),
    })
    await expect(start).rejects.toThrow(/does not list: \.\/src\/Missing\.stories\.tsx/)
    expect(isAlive(pgid)).toBe(false)
  })

  it("refuses another launcher's server when two launches print the same port", async () => {
    const winner = await startFake()
    let loserPgid
    const loser = startFake(['--port', String(winner.port), '--idle'], {
      onSpawn: (p) => groups.add((loserPgid = p)),
    })

    await expect(loser).rejects.toMatchObject({
      exitCode: EXIT_USAGE,
      message: expect.stringMatching(/is served by pid \d+, not by launcher group/),
    })
    expect(isAlive(loserPgid)).toBe(false)
    expect(isGroupAlive(winner.pid)).toBe(true)
    await winner.stop()
  })

  it('leaves no timer behind, so a caller exits promptly after stop', async () => {
    const started = Date.now()
    const { exited } = await startDriver(['--stop-and-return'])

    expect(await exited).toBe(0)
    expect(Date.now() - started).toBeLessThan(10_000)
  }, 20_000)
})

describe('assertListenerInGroup', () => {
  it('refuses a port with no listener', () => {
    expect(() => assertListenerInGroup(6123, 4242, { listenersOn: () => [] })).toThrow(
      /served by no listener/
    )
  })

  it('accepts a port whose every listener is in the group', () => {
    const ownership = { listenersOn: () => [10, 11], groupOf: () => 4242 }
    expect(() => assertListenerInGroup(6123, 4242, ownership)).not.toThrow()
  })
})

describe('stop', () => {
  it('kills the launcher and its Storybook child while a sibling process survives', async () => {
    const sibling = spawnTracked(['-e', 'setInterval(() => {}, 1000)'])
    const server = await startFake()
    const serverPid = serverPidOf(server)
    expect(isAlive(server.pid)).toBe(true)
    expect(isAlive(serverPid)).toBe(true)

    await server.stop()

    expect(isAlive(server.pid)).toBe(false)
    expect(isAlive(serverPid)).toBe(false)
    expect(isAlive(sibling.pid)).toBe(true)
  })

  it('falls back to SIGKILL when the Storybook child ignores SIGTERM', async () => {
    const server = await startFake(['--ignore-term'])
    const serverPid = serverPidOf(server)

    await server.stop()

    expect(isAlive(serverPid)).toBe(false)
  })

  it('is idempotent and latches once the group is gone', async () => {
    const server = await startFake()

    const first = server.stop()
    expect(server.stop()).toBe(first)
    await first

    expect(server.stopped).toBe(true)
  })

  it('latches without signalling once the group has died on its own', async () => {
    const kill = vi.fn(passThroughKill)
    const server = await startFake([], { kill })
    quietKill(-server.pid)
    await waitUntil(() => !isGroupAlive(server.pid))
    kill.mockClear()

    await server.stop()
    server.killNow()

    expect(kill.mock.calls.filter(([, signal]) => signal !== 0)).toEqual([])
    expect(server.stopped).toBe(true)
  })
})

describe('stopOnSignals', () => {
  it('stops the group on SIGINT before the process exits 130', async () => {
    const { driver, exited, launcherPid, serverPid } = await startDriver()

    driver.kill('SIGINT')

    expect(await exited).toBe(EXIT_INTERRUPT)
    expect(isAlive(launcherPid)).toBe(false)
    expect(isAlive(serverPid)).toBe(false)
  })

  it('a second Ctrl-C during the stop still stops the group before exit', async () => {
    const { driver, exited, launcherPid, serverPid } = await startDriver(['--ignore-term'])

    driver.kill('SIGINT')
    await new Promise((ok) => setTimeout(ok, 200))
    driver.kill('SIGINT')

    expect(await exited).toBe(EXIT_INTERRUPT)
    expect(isAlive(launcherPid)).toBe(false)
    expect(isAlive(serverPid)).toBe(false)
  })

  it('removes its handlers after a normal stop and never signals the group again', async () => {
    const proc = new EventEmitter()
    const kill = vi.fn(passThroughKill)
    const server = await startFake([], { kill })
    stopOnSignals(server, { proc, exit: vi.fn() })
    expect(proc.listenerCount('exit')).toBe(1)

    await server.stop()
    await server.whenStopped
    kill.mockClear()
    proc.emit('exit')

    expect(kill).not.toHaveBeenCalled()
    expect(proc.listenerCount('exit')).toBe(0)
    expect(proc.listenerCount('SIGINT')).toBe(0)
  })

  it('never signals a latched group on exit, even before its handlers are removed', () => {
    const proc = new EventEmitter()
    const latched = { stopped: true, whenStopped: new Promise(() => {}), killNow: vi.fn() }
    stopOnSignals(latched, { proc, exit: vi.fn() })

    proc.emit('exit')

    expect(latched.killNow).not.toHaveBeenCalled()
  })

  it('SIGKILLs the group on exit while it is still running', async () => {
    const proc = new EventEmitter()
    const kill = vi.fn(passThroughKill)
    const server = await startFake([], { kill })
    stopOnSignals(server, { proc, exit: vi.fn() })

    proc.emit('exit')

    expect(kill).toHaveBeenCalledWith(-server.pid, 'SIGKILL')
    await server.stop()
  })
})

describe('--url', () => {
  it.each([
    'http://example.com:6006',
    'http://10.0.0.5:6006',
    'http://0.0.0.0:6006',
    'https://127.0.0.1:6006',
    'ftp://127.0.0.1:6006',
    'not a url',
  ])('refuses %s as a usage error', (raw) => {
    expect(() => assertLoopbackUrl(raw)).toThrow(StorybookError)
    try {
      assertLoopbackUrl(raw)
    } catch (err) {
      expect(err.exitCode).toBe(EXIT_USAGE)
    }
  })

  it.each(['http://127.0.0.1:6123', 'http://localhost:6123', 'http://[::1]:6123'])(
    'accepts loopback %s',
    (raw) => {
      expect(() => assertLoopbackUrl(raw)).not.toThrow()
    }
  )

  it('refuses a non-loopback host before making any request', async () => {
    await expect(attachStorybook('http://192.0.2.1:6006')).rejects.toMatchObject({
      exitCode: EXIT_USAGE,
      message: expect.stringMatching(/loopback host, not http:\/\/192\.0\.2\.1:6006/),
    })
  })

  it('refuses https on loopback as a usage error, not a TypeError', async () => {
    await expect(attachStorybook('https://127.0.0.1:6006')).rejects.toMatchObject({
      exitCode: EXIT_USAGE,
    })
  })

  it('reuses a loopback server and stops nothing', async () => {
    const index = { v: 5, entries: { a: { type: 'story', importPath: FAKE_IMPORT_PATH } } }
    const caller = createServer((_, res) => res.end(JSON.stringify(index)))
    await new Promise((ok) => caller.listen(0, '127.0.0.1', ok))
    const { port } = caller.address()
    try {
      const server = await attachStorybook(`http://127.0.0.1:${port}/?path=/story/a`, {
        expectImportPaths: [FAKE_IMPORT_PATH],
      })
      expect(server.url).toBe(`http://127.0.0.1:${port}`)
      expect(server.pid).toBeNull()
      await server.stop()
      expect(caller.listening).toBe(true)
    } finally {
      await new Promise((ok) => caller.close(ok))
    }
  })
})
