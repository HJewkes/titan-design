import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { test, expect } from '@playwright/test'
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
  ...[600, 700].map((weight) => `${weight} 16px "Space Grotesk"`),
]

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

test('a single-file consumer loads every titan font face without a network request', async ({
  page,
}) => {
  const networkRequests: string[] = []
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) networkRequests.push(request.url())
  })
  await page.route(/^https?:/, (route) => route.abort())

  await page.goto(pathToFileURL(path.join(outDir, 'index.html')).href)
  await page.evaluate(() => document.fonts.ready)

  const unloadedFaces = await page.evaluate(async (faces) => {
    const results = await Promise.all(
      faces.map(async (face) => ({ face, loaded: (await document.fonts.load(face)).length > 0 }))
    )
    return results.filter((result) => !result.loaded).map((result) => result.face)
  }, FACES)

  expect.soft(networkRequests, 'no request to fonts.googleapis.com, fonts.gstatic.com or any other host').toEqual([])
  expect(unloadedFaces, 'every family and weight resolves from the bundle').toEqual([])
})
