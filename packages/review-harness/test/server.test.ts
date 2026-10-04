import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exampleManifest } from '../src/example.ts'
import { runCli, type CliIo } from '../src/run.ts'
import { startReviewServer, type ReviewServer } from '../src/server.ts'
import { SHA, manifest, validFeedback } from './fixtures.ts'

/** Stands in for Storybook: an index listing the example's stories, and a canvas page. */
async function fakeStorybook(): Promise<{ url: string; close: () => void }> {
  const ids = exampleManifest('').variants.map((v) => v.storyId)
  const server = http.createServer((req, res) => {
    if (req.url === '/index.json') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ entries: Object.fromEntries(ids.map((id) => [id, {}])) }))
    }
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(`storybook saw ${req.url} host=${req.headers.host}`)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}`, close: () => server.close() }
}

const OVERRIDE = ['--contrast-override', 'unit-test round']

const stubPage = {
  handler: (_req: http.IncomingMessage, res: http.ServerResponse) => res.end('review page'),
  close: async () => {},
}

const post = (url: string, body: unknown) =>
  fetch(`${url}api/submit`, { method: 'POST', body: JSON.stringify(body) })

describe('review server', () => {
  let sb: Awaited<ReturnType<typeof fakeStorybook>>
  let server: ReviewServer

  beforeEach(async () => {
    sb = await fakeStorybook()
    const m = manifest(sb.url)
    server = await startReviewServer({
      manifest: m,
      manifestSha256: SHA,
      storybookUrl: sb.url,
      page: stubPage.handler,
    })
  })
  afterEach(async () => {
    await server.close()
    sb.close()
  })

  it('listens on 127.0.0.1 and serves the round and the page under /__review/', async () => {
    expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/__review\/$/)
    const round = await (await fetch(`${server.url}api/round`)).json()
    expect(round.manifestSha256).toBe(SHA)
    expect(await (await fetch(server.url)).text()).toBe('review page')
  })

  it('proxies every other path to Storybook on the same origin', async () => {
    const origin = new URL(server.url).origin
    const text = await (await fetch(`${origin}/iframe.html?id=x`)).text()
    expect(text).toBe(`storybook saw /iframe.html?id=x host=${new URL(sb.url).host}`)
  })

  it('rejects malformed, stale and inconsistent submissions without resolving', async () => {
    const stale = validFeedback(manifest(sb.url), 'b'.repeat(64))
    const incomplete = { ...validFeedback(manifest(sb.url)), answers: [] }
    expect((await post(server.url, { nope: true })).status).toBe(400)
    expect((await post(server.url, stale)).status).toBe(409)
    const res = await post(server.url, incomplete)
    expect(res.status).toBe(422)
    expect((await res.json()).errors).toEqual(['q1: required'])
  })

  it('resolves with the first valid submission and refuses a second', async () => {
    const feedback = validFeedback(manifest(sb.url))
    expect((await post(server.url, feedback)).status).toBe(200)
    await expect(server.submitted).resolves.toEqual(feedback)
    expect((await post(server.url, feedback)).status).toBe(409)
  })
})

describe('titan-review CLI', () => {
  let sb: Awaited<ReturnType<typeof fakeStorybook>>
  let dir: string
  let out: { stdout: string; stderr: string[] }

  beforeEach(async () => {
    sb = await fakeStorybook()
    dir = await mkdtemp(join(tmpdir(), 'titan-review-'))
    await writeFile(join(dir, 'round.json'), JSON.stringify(exampleManifest(sb.url)))
    out = { stdout: '', stderr: [] }
  })
  afterEach(() => sb.close())

  function io(signal: AbortSignal, onUrl: (url: string) => void): CliIo {
    return {
      stdout: (t) => (out.stdout += t),
      stderr: (t) => {
        out.stderr.push(t)
        const url = t.match(/at (http\S+)/)?.[1]
        if (url) onUrl(url)
      },
      openBrowser: () => {},
      capture: async (_round, outDir) => [join(outDir, 'fake.png')],
      measure: async () => [],
      createPage: async () => stubPage,
      signal,
    }
  }

  const sha256 = async (file: string) =>
    (await import('node:crypto'))
      .createHash('sha256')
      .update(await readFile(file))
      .digest('hex')

  async function writeContrast(report: Record<string, unknown>) {
    const manifestSha256 = await sha256(join(dir, 'round.json'))
    await writeFile(join(dir, 'contrast.json'), JSON.stringify({ manifestSha256, ...report }))
  }

  it('blocks until submit, writes feedback.json next to the manifest, prints it, exits 0', async () => {
    await writeContrast({ passed: true, failures: [] })
    const before = await readFile(join(dir, 'round.json'))
    const feedback = validFeedback(manifest(sb.url), await sha256(join(dir, 'round.json')))
    const code = await runCli(
      [join(dir, 'round.json'), '--no-open', ...OVERRIDE],
      io(new AbortController().signal, (url) => void post(url, feedback))
    )
    expect(code).toBe(0)
    expect(JSON.parse(out.stdout)).toEqual(feedback)
    expect(JSON.parse(await readFile(join(dir, 'feedback.json'), 'utf8'))).toEqual(feedback)
    expect((await readFile(join(dir, 'round.json'))).equals(before)).toBe(true)
  })

  it('records an override in round.json and feedback.json, with the misses it shipped', async () => {
    const miss = {
      variant: 'A',
      mode: 'light',
      kind: 'text',
      testId: 'chip-label',
      selector: 'div > span',
      ratio: 1.7,
      required: 4.5,
    }
    await writeContrast({ passed: false, failures: [miss] })
    const code = await runCli(
      [join(dir, 'round.json'), '--no-open', ...OVERRIDE],
      io(new AbortController().signal, async (url) => {
        const sha = await sha256(join(dir, 'round.json'))
        await post(url, validFeedback(manifest(sb.url), sha))
      })
    )
    const record = {
      reason: 'unit-test round',
      problem: 'contrast.json records undeclared contrast failures',
      failures: [
        {
          variant: 'A',
          element: 'chip-label',
          mode: 'light',
          kind: 'text',
          ratio: 1.7,
          required: 4.5,
        },
      ],
    }
    expect(code).toBe(0)
    const round = JSON.parse(await readFile(join(dir, 'round.json'), 'utf8'))
    expect(round.contrastOverride).toEqual(record)
    const written = JSON.parse(await readFile(join(dir, 'feedback.json'), 'utf8'))
    expect(written.contrastOverride).toEqual(record)
    expect(written.manifestSha256).toBe(await sha256(join(dir, 'round.json')))
  })

  it('drops a contrastOverride the page posts when the round carries none', async () => {
    await writeContrast({ passed: true, failures: [] })
    const sha = await sha256(join(dir, 'round.json'))
    const forged = { reason: 'posted by the page', problem: 'not from round.json', failures: [] }
    const code = await runCli(
      [join(dir, 'round.json'), '--no-open'],
      io(new AbortController().signal, (url) => {
        void post(url, { ...validFeedback(manifest(sb.url), sha), contrastOverride: forged })
      })
    )
    expect(code).toBe(0)
    const written = JSON.parse(await readFile(join(dir, 'feedback.json'), 'utf8'))
    expect(written).not.toHaveProperty('contrastOverride')
  })

  it('exits 130 and writes nothing when interrupted before submit', async () => {
    const controller = new AbortController()
    const code = await runCli(
      [join(dir, 'round.json'), ...OVERRIDE],
      io(controller.signal, () => controller.abort())
    )
    expect(code).toBe(130)
    expect(out.stdout).toBe('')
    expect(await readdir(dir)).toEqual(['round.json'])
  })

  it('refuses to serve a round with no passing contrast.json, naming the way out', async () => {
    let served = false
    const code = await runCli(
      [join(dir, 'round.json'), '--no-open'],
      io(new AbortController().signal, () => (served = true))
    )
    expect(code).toBe(2)
    expect(served).toBe(false)
    expect(out.stderr.join('\n')).toContain('no contrast.json beside this round')
    expect(out.stderr.join('\n')).toContain('--contrast-override "<reason>"')
  })

  it('refuses an override with no reason', async () => {
    const code = await runCli(
      [join(dir, 'round.json'), '--contrast-override', '  '],
      io(new AbortController().signal, () => {})
    )
    expect(code).toBe(2)
    expect(out.stderr.join('\n')).toContain('needs a reason')
  })

  it('serves an overridden round with its record in the round payload', async () => {
    const controller = new AbortController()
    let payload: unknown
    const code = await runCli(
      [join(dir, 'round.json'), '--no-open', ...OVERRIDE],
      io(controller.signal, async (url) => {
        payload = await (await fetch(`${url}api/round`)).json()
        controller.abort()
      })
    )
    expect(code).toBe(130)
    expect(payload).toMatchObject({
      manifest: { contrastOverride: { reason: 'unit-test round', failures: [] } },
    })
  })

  it('exits 2 before serving when a story id is not on that Storybook', async () => {
    const m = exampleManifest(sb.url)
    m.variants[0].storyId = 'lab-decisions-other-worktree--only'
    await writeFile(join(dir, 'round.json'), JSON.stringify(m))
    const code = await runCli(
      [join(dir, 'round.json')],
      io(new AbortController().signal, () => {})
    )
    expect(code).toBe(2)
    expect(out.stderr.join('\n')).toContain('unknown story ids')
  })

  it('exits 2 with the launch command when Storybook is not running', async () => {
    const code = await runCli(
      [join(dir, 'round.json'), '--storybook', 'http://127.0.0.1:9'],
      io(new AbortController().signal, () => {})
    )
    expect(code).toBe(2)
    expect(out.stderr.join('\n')).toContain('storybook-launch.mjs --isolated')
  })

  it('exits 2 when --storybook overrides to a non-loopback host', async () => {
    const code = await runCli(
      [join(dir, 'round.json'), '--storybook', 'http://evil.example.com:6006'],
      io(new AbortController().signal, () => {})
    )
    expect(code).toBe(2)
    expect(out.stderr.join('\n')).toContain('loopback')
  })
})
