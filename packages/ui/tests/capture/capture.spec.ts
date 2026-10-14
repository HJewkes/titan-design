import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test, expect, type Browser } from '@playwright/test'
import { build, preview, type PreviewServer } from 'vite'
import { PROOF_COMPONENTS } from './page/proof-components'
import { NO_RNW_ALIAS_MODE, pageBuild } from './build-modes'
import {
  FPS,
  STAGE,
  captureFrame,
  captureRun,
  median,
  openCapturePage,
  scrambled,
  seekTo,
} from './capture'

/**
 * TD-845: react-ui renders under capture on the web. The page is built with Vite, aliasing
 * react-native to react-native-web and compiling className through nativewind, and is driven
 * frame by frame through `window.__titanMotion` under virtual time.
 */

const STILLS_DIR = path.join(__dirname, 'stills')
const STILL_TIMES_S = [0.4, 1.2, 2.9]
const SEEK_BUDGET_MS = 100

let outDir: string
let server: PreviewServer
let url: string

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  outDir = mkdtempSync(path.join(tmpdir(), 'titan-capture-page-'))
  const config = pageBuild(outDir)
  await build(config)
  server = await preview({ ...config, preview: { port: 0, host: '127.0.0.1' } })
  url = server.resolvedUrls?.local[0] ?? ''
  expect(url, 'vite preview reports a URL').not.toBe('')
})

test.afterAll(async () => {
  await server?.close()
  rmSync(outDir, { recursive: true, force: true })
})

/**
 * Catches: a component dropped from the page, one that throws under react-native-web, or a page
 * that builds without nativewind's JSX runtime (className is then ignored, so the stage has no fill).
 */
test('all six react-ui components render inside the stage, styled by nativewind', async ({
  browser,
}) => {
  const { page, errors } = await openCapturePage(browser, url)
  await seekTo(page, 2.9)

  const cells = await page.locator('[data-testid^="proof-"]').evaluateAll((els) =>
    els.map((el) => {
      const { right, bottom, width, height } = el.getBoundingClientRect()
      return {
        id: el.getAttribute('data-testid'),
        right,
        bottom,
        area: width * height,
        text: el.textContent ?? '',
      }
    })
  )
  const stageFill = await page
    .getByTestId('beat-rnw-proof')
    .evaluate((el) => getComputedStyle(el).backgroundColor)

  expect(errors.map((e) => e.message)).toEqual([])
  expect(cells.map((cell) => cell.id)).toEqual(PROOF_COMPONENTS.map((name) => `proof-${name}`))
  for (const { id, right, bottom, area, text } of cells) {
    expect(area, `${id} has area`).toBeGreaterThan(0)
    expect(right, `${id} fits the stage width`).toBeLessThanOrEqual(STAGE.width)
    expect(bottom, `${id} fits the stage height`).toBeLessThanOrEqual(STAGE.height)
    expect(text.trim(), `${id} paints text`).not.toBe('')
  }
  expect(stageFill, 'bg-background-base resolved').not.toBe('rgba(0, 0, 0, 0)')
})

/**
 * Catches: anything in the render that reads real time or unseeded randomness (for example
 * dropping the virtual-time init script while a component reads Date.now()), and a page that
 * no longer moves, since a frozen page would also be identical run to run.
 */
test('two captures of every frame are byte-identical, and the frames move', async ({ browser }) => {
  const first = await captureRun(browser, url)
  const second = await captureRun(browser, url)

  const differing = first.flatMap((hash, i) => (hash === second[i] ? [] : [i]))
  expect(first.length).toBe(3 * FPS)
  expect(differing, 'frames whose hash differs between runs').toEqual([])
  expect(new Set(first).size, 'distinct frames in a 3 s timeline').toBeGreaterThan(FPS)
  test.info().annotations.push({ type: 'frames', description: `${first.length} frames, identical` })
})

/**
 * Catches: a frame that depends on the frame before it. Each frame is captured after a different
 * one than in a sweep, so a seek that commits after `ready()` resolves (the shim's seek wrapped in
 * setTimeout) or raster left over from the previous frame (the capture without
 * `--disable-partial-raster`) shows up as differing hashes.
 */
test('frames captured in a scrambled order equal the same frames captured in a sweep', async ({
  browser,
}) => {
  const sweep = await captureRun(browser, url)
  const shuffled = await captureRun(browser, url, scrambled)

  const differing = sweep.flatMap((hash, i) => (hash === shuffled[i] ? [] : [i]))
  expect(differing, 'frames whose hash depends on capture order').toEqual([])
})

async function timeSeeks(browser: Browser): Promise<number[]> {
  const { page, duration } = await openCapturePage(browser, url)
  const elapsed: number[] = []
  for (const frame of scrambled(Math.round(duration * FPS))) {
    const start = performance.now()
    await seekTo(page, frame / FPS)
    elapsed.push(performance.now() - start)
  }
  await page.context().close()
  return elapsed
}

/**
 * Catches: a seek that costs far more than one render. Measured: 150 extra renders per seek give a
 * median of about 190 ms; 60 extra still pass, so the budget is loose by design.
 */
test(`seek + ready median is under ${SEEK_BUDGET_MS} ms`, async ({ browser }) => {
  const elapsed = await timeSeeks(browser)

  const ms = median(elapsed)
  test.info().annotations.push({
    type: 'seek',
    description: `median ${ms.toFixed(1)} ms, max ${Math.max(...elapsed).toFixed(1)} ms over ${elapsed.length} seeks`,
  })
  expect(ms).toBeLessThan(SEEK_BUDGET_MS)
})

/** Catches: a page that no longer needs react-native-web, so the proof proves nothing about it. */
test('the page does not build without the react-native → react-native-web alias', async () => {
  const brokenOut = mkdtempSync(path.join(tmpdir(), 'titan-capture-noalias-'))
  try {
    await expect(build(pageBuild(brokenOut, NO_RNW_ALIAS_MODE))).rejects.toThrow(
      /node_modules[\\/]react-native[\\/]index\.js/
    )
  } finally {
    rmSync(brokenOut, { recursive: true, force: true })
  }
})

/** Writes the committed stills; run with UPDATE_STILLS=1 to refresh them. */
test('stills at the start, middle and end of the beat', async ({ browser }) => {
  const { page, errors } = await openCapturePage(browser, url)
  const dir = process.env.UPDATE_STILLS ? STILLS_DIR : test.info().outputPath('stills')
  mkdirSync(dir, { recursive: true })
  for (const t of STILL_TIMES_S) {
    writeFileSync(path.join(dir, `proof-${t.toFixed(1)}s.png`), await captureFrame(page, t))
  }
  expect(errors.map((e) => e.message)).toEqual([])
})
