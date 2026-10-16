import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { test, expect, type Page } from '@playwright/test'
import tailwindcss from 'tailwindcss'
import { build } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import tailwindConfig from '../../tailwind.config.js'

/**
 * TD-36: a consumer built as one HTML file and opened from disk (titan-platform's
 * code-report) must render the titan families with no network at all. This builds
 * such a consumer from `global.css` the way code-report does (vite-plugin-singlefile),
 * opens it over file:// with every http(s) request aborted, and checks each family
 * and weight the tokens use actually loads.
 */

const FIXTURE_DIR = path.join(__dirname, 'fixture')

const FACES = [
  ...[400, 500, 600, 700].map((weight) => `${weight} 16px "Inter"`),
  ...[400, 500, 600, 700].map((weight) => `${weight} 16px "Nunito Sans"`),
  ...[400, 500, 600, 700].map((weight) => `${weight} 16px "Space Grotesk"`),
  ...[400, 500, 600, 700].map((weight) => `${weight} 16px "JetBrains Mono"`),
]

/** Fixture element id → the one bundled family that must paint every glyph in it. */
const SAMPLES = {
  sans: 'Inter',
  body: 'Nunito Sans',
  heading: 'Space Grotesk',
  mono: 'JetBrains Mono',
  'mono-class': 'JetBrains Mono',
} as const

let outDir: string

test.beforeAll(async () => {
  outDir = mkdtempSync(path.join(tmpdir(), 'titan-offline-fonts-'))
  await build({
    root: FIXTURE_DIR,
    configFile: false,
    logLevel: 'warn',
    plugins: [viteSingleFile()],
    css: {
      postcss: {
        plugins: [tailwindcss({ ...tailwindConfig, content: [path.join(FIXTURE_DIR, '*.html')] })],
      },
    },
    build: { outDir, emptyOutDir: true },
  })
})

test.afterAll(() => {
  rmSync(outDir, { recursive: true, force: true })
})

async function openOffline(page: Page) {
  await page.route(/^https?:/, (route) => route.abort())
  await page.goto(pathToFileURL(path.join(outDir, 'index.html')).href)
  await page.evaluate(() => document.fonts.ready)
}

test('a single-file consumer loads every titan font face without a network request', async ({
  page,
}) => {
  const networkRequests: string[] = []
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) networkRequests.push(request.url())
  })
  await openOffline(page)

  const unloadedFaces = await page.evaluate(async (faces) => {
    const results = await Promise.all(
      faces.map(async (face) => ({ face, loaded: (await document.fonts.load(face)).length > 0 }))
    )
    return results.filter((result) => !result.loaded).map((result) => result.face)
  }, FACES)

  expect
    .soft(
      networkRequests,
      'no request to fonts.googleapis.com, fonts.gstatic.com or any other host'
    )
    .toEqual([])
  expect(unloadedFaces, 'every family and weight resolves from the bundle').toEqual([])
})

/**
 * TD-840: loading a face is not the same as painting with it. A glyph outside the
 * bundled subsets, or a stack that names a host font first, renders in a system font
 * that differs per machine. Chromium reports the font that painted each run of text,
 * so every sample must be painted by its bundled face alone. Host fonts stay reachable
 * here on purpose: the test fails if any of them is used.
 */
test('every sample is painted by its bundled face, with no system-font fallback', async ({
  page,
}) => {
  await openOffline(page)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const { root } = await cdp.send('DOM.getDocument')

  const painted: Record<string, string[]> = {}
  for (const [id, family] of Object.entries(SAMPLES)) {
    const { nodeId } = await cdp.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: `#${id}`,
    })
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
    // A variable face reports its default instance ("Space Grotesk Light"), so match the prefix.
    painted[id] = fonts.map((font) =>
      font.isCustomFont && font.familyName.startsWith(family)
        ? family
        : `${font.familyName}${font.isCustomFont ? '' : ' (system)'}`
    )
  }

  const expected = Object.fromEntries(Object.entries(SAMPLES).map(([id, family]) => [id, [family]]))
  expect(painted, 'each sample paints only with its packaged face').toEqual(expected)
})

/** Pairs JetBrains Mono's contextual alternates draw as one glyph (≠, ⇒). */
const LIGATURE_PAIRS = ['!=', '=>']

type PairRender = 'font-mono' | 'ligatures-on' | 'one-cell-per-character'

/**
 * Screenshots `pair` in `font-mono` at a fixed spot. JetBrains Mono's ligatures keep
 * the two-cell advance, so a width check cannot see them; pixels can. The reference
 * puts each character in its own inline-block, which no shaper joins into one glyph.
 */
async function renderPair(page: Page, pair: string, render: PairRender) {
  await page.evaluate(
    ({ pair, render }) => {
      const stage = document.getElementById('ligature-stage') ?? document.createElement('div')
      stage.id = 'ligature-stage'
      stage.className = 'font-mono'
      stage.style.cssText =
        'position:fixed;top:0;left:0;width:64px;height:40px;font-size:20px;line-height:40px;' +
        'background:#fff;color:#000;z-index:1'
      if (render === 'ligatures-on') stage.style.fontVariantLigatures = 'normal'
      stage.replaceChildren(
        ...(render === 'one-cell-per-character' ? [...pair] : [pair]).map((text) => {
          const cell = document.createElement('span')
          if (render === 'one-cell-per-character') cell.style.display = 'inline-block'
          cell.textContent = text
          return cell
        })
      )
      document.body.append(stage)
    },
    { pair, render }
  )
  return page.locator('#ligature-stage').screenshot()
}

/**
 * TD-840 (owner decision: JetBrains with ligatures off). Mono text is code, paths and
 * counts, so "!=" must read as the two characters typed. Catches `font-mono` losing
 * `font-variant-ligatures: none`, or a value that leaves calt on (`no-common-ligatures`).
 */
test('font-mono draws "!=" and "=>" as two characters, not a ligature glyph', async ({ page }) => {
  await openOffline(page)

  for (const pair of LIGATURE_PAIRS) {
    const reference = await renderPair(page, pair, 'one-cell-per-character')
    const ligated = await renderPair(page, pair, 'ligatures-on')
    const mono = await renderPair(page, pair, 'font-mono')

    expect(ligated.equals(reference), `the bundled face ligates "${pair}" when allowed`).toBe(false)
    expect(mono.equals(reference), `font-mono draws "${pair}" one glyph per character`).toBe(true)
  }
})
