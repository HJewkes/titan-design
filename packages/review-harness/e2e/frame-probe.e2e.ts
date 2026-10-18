import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import { measureRound } from '../src/contrast-measure.ts'
import { lightFrameProblems } from '../src/frame-checks.ts'
import { MANIFEST_SCHEMA_ID, RoundSchema } from '@titan-design/review-schema'
import { SECTION_TEXTS } from '../test/fixtures.ts'

const STORY = 'fixture-toolbar--default'

/**
 * A synthetic toolbar in the shape the light-frame check reads (TD-962): in light the plane is
 * light but one button keeps a charcoal face; a tinted solid button is not a grey face.
 */
function storyHtml(light: boolean): string {
  const plane = light ? '#f3f4f6' : '#111827'
  return `<!doctype html><html class="${light ? 'light' : ''}"><body style="margin:0;background:${plane}">
<div id="storybook-root" style="padding:16px;font:16px sans-serif">
  <button data-testid="bold" style="background:#333333;color:#fff;border:0;padding:8px">B</button>
  <button data-testid="save" style="background:#1d4ed8;color:#fff;border:0;padding:8px">Save</button>
</div>
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

function round(storybookUrl: string) {
  return RoundSchema.parse({
    schema: MANIFEST_SCHEMA_ID,
    unit: 'td-962-e2e',
    round: 1,
    storybookUrl,
    widths: [360],
    variants: [{ key: 'tb-l', storyId: STORY, label: 'Toolbar', globals: { theme: 'light' } }],
    questions: [{ id: 'q', kind: 'text', prompt: 'Anything?' }],
    sections: [
      {
        id: 's',
        title: 'Toolbar',
        ...SECTION_TEXTS,
        kind: 'STATES',
        questionIds: ['q'],
        variantKeys: ['tb-l'],
      },
    ],
  })
}

test('the measure pass probes the story plane and its grey control faces', async ({ browser }) => {
  test.info().annotations.push({ type: 'chromium', description: browser.version() })
  const storybook = await fakeStorybook()
  try {
    const manifest = round(storybook.url)
    const frames = await measureRound(manifest, storybook.url)
    const light = frames.find((f) => f.mode === 'light')!
    expect(light.probe?.plane).toMatchObject({ hex: '#f3f4f6' })
    expect(light.probe?.faces).toEqual([
      { selector: '[data-testid="bold"]', hex: '#333333', lstar: 21.2, neutral: true },
      {
        selector: '[data-testid="save"]',
        hex: '#1d4ed8',
        lstar: expect.any(Number),
        neutral: false,
      },
    ])
    expect(lightFrameProblems(manifest, frames)).toEqual([
      'light frame tb-l light @360: control face [[data-testid="bold"]] reads dark (L* 21.2 #333333)',
    ])
  } finally {
    storybook.close()
  }
})
