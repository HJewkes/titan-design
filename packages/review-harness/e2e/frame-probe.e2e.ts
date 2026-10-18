import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import { measureRound } from '../src/contrast-measure.ts'
import { lightFrameProblems, renderProblems } from '../src/frame-checks.ts'
import { MANIFEST_SCHEMA_ID, RoundSchema } from '@titan-design/review-schema'
import { SECTION_TEXTS } from '../test/fixtures.ts'

const STORY = 'fixture-toolbar--default'
const CHART = 'fixture-chart--default'

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

/**
 * A synthetic gauge on a light plane: its ticks paint #ebebeb (ΔL* under 12), its bars have
 * zero height, and its tick labels are dark and show.
 */
const chartHtml = (
  light: boolean
) => `<!doctype html><html class="${light ? 'light' : ''}"><body style="margin:0;background:#f3f4f6">
<div id="storybook-root" style="padding:16px;font:16px sans-serif">
  <svg width="200" height="100">
    <line data-testid="tick-0" x1="10" y1="10" x2="10" y2="20" stroke="#ebebeb" stroke-width="1"/>
    <line data-testid="tick-1" x1="20" y1="10" x2="20" y2="20" stroke="#ebebeb" stroke-width="1"/>
    <rect data-testid="bar-0" x="40" y="50" width="10" height="0" fill="#1d4ed8"/>
    <text data-testid="label-0" x="10" y="40" fill="#111827">0</text>
  </svg>
</div>
</body></html>`

async function fakeStorybook(): Promise<{ url: string; close: () => void }> {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x')
    if (url.pathname === '/index.json') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ entries: { [STORY]: {}, [CHART]: {} } }))
    }
    res.writeHead(200, { 'content-type': 'text/html' })
    const light = (url.searchParams.get('globals') ?? '').includes('theme:light')
    res.end(url.searchParams.get('id') === CHART ? chartHtml(light) : storyHtml(light))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}`, close: () => server.close() }
}

const TOOLBAR = { key: 'tb-l', storyId: STORY, label: 'Toolbar', globals: { theme: 'light' } }

function round(storybookUrl: string, variant: Record<string, unknown> = TOOLBAR) {
  return RoundSchema.parse({
    schema: MANIFEST_SCHEMA_ID,
    unit: 'td-962-e2e',
    round: 1,
    storybookUrl,
    widths: [360],
    variants: [variant],
    questions: [{ id: 'q', kind: 'text', prompt: 'Anything?' }],
    sections: [
      {
        id: 's',
        title: 'Toolbar',
        ...SECTION_TEXTS,
        kind: 'STATES',
        questionIds: ['q'],
        variantKeys: [variant.key],
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

test('the measure pass probes named marks for a zero box and a faint paint', async () => {
  const storybook = await fakeStorybook()
  try {
    const marks = {
      ticks: '[data-testid^="tick-"]',
      bars: '[data-testid^="bar-"]',
      labels: '[data-testid^="label-"]',
      axis: '[data-testid="axis"]',
    }
    const gauge = { key: 'ce-head-l', storyId: CHART, label: 'Gauge', globals: { theme: 'light' } }
    const manifest = round(storybook.url, { ...gauge, marks })
    const frames = await measureRound(manifest, storybook.url)
    expect(renderProblems(manifest, frames)).toEqual([
      `frame ce-head-l light @360: mark ticks (${marks.ticks}): all 2 paint under the TD-490 track floor (ΔL* 3.1 < 12), first [[data-testid="tick-0"]]`,
      `frame ce-head-l light @360: mark bars (${marks.bars}): all 1 have a zero box`,
      `frame ce-head-l light @360: mark axis (${marks.axis}) matches nothing`,
    ])
  } finally {
    storybook.close()
  }
})
