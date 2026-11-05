import { mkdirSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { parseArgs } from 'node:util'

import { chromium } from '@playwright/test'

import { isEntryPoint } from './lib/entry.mjs'

/**
 * Screenshots the stories `pr-visual-stories.mjs` chose from one static Storybook build, for one
 * side of the `pr-visual` workflow (TP-1697). It runs only in CI's Playwright container: it serves
 * the build on an ephemeral port, never 6006. A story the build lacks (new on the head, deleted on
 * the base) or one that fails to render is skipped, so its other side is dropped from the manifest.
 */
export const WIDTHS = [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]
const FIXED_TIME = new Date('2024-01-01T16:12:07')
const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

/** A static server for `root` on an ephemeral loopback port. */
export function serve(root) {
  const server = createServer(async (request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname))
    const file = join(root, path.endsWith('/') ? `${path}index.html` : path)
    try {
      const body = await readFile(file)
      response.writeHead(200, {
        'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
      })
      response.end(body)
    } catch {
      response.writeHead(404).end()
    }
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)))
}

async function shoot(browser, origin, id, viewport, file) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  try {
    const page = await context.newPage()
    await page.clock.install({ time: new Date(FIXED_TIME.getTime() - 60_000) })
    await page.clock.pauseAt(FIXED_TIME)
    await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story`)
    await page.waitForLoadState('networkidle')
    await page.evaluate('document.fonts.ready')
    await page.waitForSelector('#storybook-root > *', { timeout: 10_000 })
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' })
  } finally {
    await context.close()
  }
}

async function captureSide({ staticDir, storyIds, outDir }) {
  mkdirSync(outDir, { recursive: true })
  const server = await serve(staticDir)
  const origin = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch()
  try {
    const index = JSON.parse(readFileSync(join(staticDir, 'index.json'), 'utf8'))
    for (const id of storyIds) {
      if (!index.entries[id]) {
        console.log(`pr-visual-capture: ${id} is not in this build; skipped`)
        continue
      }
      for (const viewport of WIDTHS) {
        const file = join(outDir, `${id}@${viewport.width}.png`)
        await shoot(browser, origin, id, viewport, file).catch((error) =>
          console.log(`pr-visual-capture: ${id}@${viewport.width} failed: ${error.message}`)
        )
      }
    }
  } finally {
    await browser.close()
    server.close()
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      static: { type: 'string' },
      stories: { type: 'string' },
      out: { type: 'string' },
      side: { type: 'string' },
    },
  })
  if (!['before', 'after'].includes(values.side)) throw new Error('--side must be before or after')
  const { storyIds } = JSON.parse(readFileSync(values.stories, 'utf8'))
  await captureSide({ staticDir: values.static, storyIds, outDir: join(values.out, values.side) })
}

if (isEntryPoint(import.meta.url, process.argv[1])) await main()
