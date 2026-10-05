import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import type { ContrastReport } from '../src/contrast-gate.ts'
import { MANIFEST_SCHEMA_ID, type ManifestInput } from '../src/schema.ts'

const CLI = new URL('../src/cli.ts', import.meta.url).pathname
const STORY = 'fixture-contrast--default'

/**
 * A synthetic story in the shape the gate reads: `globals=theme:light` puts `.light` on
 * <html>, as the real Storybook does. Light mode has 1.5:1 muted text, a 1.1:1 separator
 * and a 1.5:1 tip portalled into <body>; dark mode passes everywhere. Storybook's own
 * `sb-` chrome fails in both modes and must never be measured.
 */
function storyHtml(light: boolean): string {
  const plane = light ? '#f3f4f6' : '#111827'
  const muted = light ? '#c8c9cc' : '#d1d5db'
  const rule = light ? '#e5e7eb' : '#6b7280'
  return `<!doctype html><html class="${light ? 'light' : ''}"><body style="margin:0;background:${plane}">
<div id="storybook-root" style="padding:16px;font:16px sans-serif">
  <p data-testid="muted" style="color:${muted}">Last week</p>
  <div data-testid="rule" style="border-top:1px solid ${rule};height:12px"></div>
  <button style="background:#2563eb;color:#fff;border:0;padding:8px">Save</button>
  <svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="none" stroke="#2563eb" stroke-width="2"/></svg>
</div>
<div data-testid="tip" style="position:absolute;top:0;left:200px;color:${muted}">Tip</div>
<div class="sb-wrapper" style="color:${plane}">Storybook chrome</div>
</body></html>`
}

async function fakeStorybook(): Promise<{ url: string; close: () => void }> {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x')
    if (url.pathname === '/index.json') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ entries: { [STORY]: {} } }))
    }
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(storyHtml((url.searchParams.get('globals') ?? '').includes('theme:light')))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}`, close: () => server.close() }
}

function draft(storybookUrl: string, contrast?: ManifestInput['contrast']): ManifestInput {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'td-478-e2e',
    round: 1,
    storybookUrl,
    widths: [360],
    variants: [{ key: 'A', storyId: STORY, label: 'Muted text and a rule' }],
    questions: [],
    sections: [
      { id: 's1', title: 'Contrast', variantKeys: ['A'], ...(contrast ? { contrast } : {}) },
    ],
  }
}

async function build(input: ManifestInput) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-contrast-e2e-'))
  await writeFile(join(dir, 'draft.json'), JSON.stringify(input))
  const child = spawn('node', [CLI, 'build', join(dir, 'draft.json')])
  let stderr = ''
  child.stderr.on('data', (c: Buffer) => (stderr += c.toString()))
  const code = await new Promise<number | null>((resolve) => child.once('exit', resolve))
  const report = JSON.parse(await readFile(join(dir, 'contrast.json'), 'utf8')) as ContrastReport
  return { code, stderr, report, roundWritten: existsSync(join(dir, 'round.json')) }
}

let sb: Awaited<ReturnType<typeof fakeStorybook>>
test.beforeAll(async () => {
  sb = await fakeStorybook()
})
test.afterAll(() => sb.close())

test('a light-mode miss blocks round.json; each declared miss is excused alone; all declared pass', async () => {
  const blocked = await build(draft(sb.url))
  expect(blocked.code).toBe(3)
  expect(blocked.roundWritten).toBe(false)
  expect(blocked.report.frames.map((f) => f.mode)).toEqual(['light', 'dark'])
  const failures = blocked.report.failures.map((f) => [f.mode, f.testId, f.role, f.kind])
  expect(failures).toEqual([
    ['light', 'muted', 'text', 'text'],
    ['light', 'rule', 'separator', 'non-text'],
    ['light', 'tip', 'text', 'text'],
  ])
  expect(blocked.report.failures[0].ratio).toBeLessThan(2)
  expect(blocked.stderr).toContain('FAIL A light @360 text (text)')
  expect(blocked.stderr).toContain('refused: round.json not written')

  const muted = {
    element: 'muted',
    mode: 'light',
    kind: 'text',
    route: 'TD-490',
    reason: 'muted token on light base',
  } as const
  const partial = await build(draft(sb.url, { knownDefects: [muted] }))
  expect(partial.code).toBe(3)
  expect(partial.report.failures.map((f) => f.testId)).toEqual(['rule', 'tip'])
  expect(partial.report.knownDefects.map((d) => d.testId)).toEqual(['muted'])

  const declared = await build(
    draft(sb.url, {
      knownDefects: [
        muted,
        { element: 'tip', mode: 'light', kind: 'text', route: 'TD-490', reason: 'same token' },
        {
          element: 'rule',
          mode: 'light',
          kind: 'non-text',
          route: 'component',
          reason: 'own border colour',
        },
      ],
    })
  )
  expect(declared.code).toBe(0)
  expect(declared.roundWritten).toBe(true)
  expect(declared.report.passed).toBe(true)
  expect(declared.report.knownDefects.map((d) => [d.testId, d.route])).toEqual([
    ['muted', 'TD-490'],
    ['rule', 'component'],
    ['tip', 'TD-490'],
  ])
  expect(declared.stderr).toContain('KNOWN TD-490 A light @360 text')
})
