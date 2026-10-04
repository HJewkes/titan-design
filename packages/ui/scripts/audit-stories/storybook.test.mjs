// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  EXIT_INTERRUPT,
  EXIT_USAGE,
  StorybookError,
  assertLoopbackUrl,
  attachStorybook,
  parseLauncherPort,
  startStorybook,
} from './storybook.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const FAKE_LAUNCHER = join(here, 'fixtures/fake-launcher.mjs')
const DRIVER = join(here, 'fixtures/start-and-wait.mjs')
const FAKE_IMPORT_PATH = './src/components/ui/fake-button/FakeButton.stories.tsx'

// Every group and PID a test starts, killed in afterEach even when the test failed.
const groups = new Set()
const pids = new Set()

const quietKill = (target) => {
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
})

describe('stopOnSignals', () => {
  it('stops the group on SIGINT before the process exits 130', async () => {
    const driver = spawnTracked([DRIVER])
    const [, launcherPid, serverPid] = (await firstLineMatching(driver, /ready (\d+) (\d+)/)).map(
      Number
    )
    groups.add(launcherPid)
    pids.add(serverPid)
    const exited = exitCodeOf(driver)

    driver.kill('SIGINT')

    expect(await exited).toBe(EXIT_INTERRUPT)
    expect(isAlive(launcherPid)).toBe(false)
    expect(isAlive(serverPid)).toBe(false)
  })
})

describe('--url', () => {
  it.each([
    'http://example.com:6006',
    'http://10.0.0.5:6006',
    'http://0.0.0.0:6006',
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
