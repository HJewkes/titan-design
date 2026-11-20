import { readdirSync, readFileSync } from 'node:fs'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { probeClip } from '../src/clip-probe.ts'

const FIXTURE_DIR = new URL('../test/fixtures/clip-probe/', import.meta.url)
const SELECTOR = '#probe'
const SCALES = [1, 2]

/** `fire-*` fixtures clip their text and must fire; `quiet-*` fixtures fit and must not. */
const fixtures = readdirSync(FIXTURE_DIR)
  .filter((name) => name.endsWith('.html'))
  .sort()
  .map((name) => ({ name, fires: name.startsWith('fire-') }))

async function openFixture(browser: Browser, name: string, scale: number): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: 400, height: 240 },
    deviceScaleFactor: scale,
  })
  const page = await context.newPage()
  await page.setContent(readFileSync(new URL(name, FIXTURE_DIR), 'utf8'))
  return page
}

test('the fixture set pairs fire and quiet cases', () => {
  const stems = (prefix: string) =>
    fixtures.filter((f) => f.name.startsWith(prefix)).map((f) => f.name.slice(prefix.length))
  expect(stems('fire-').length).toBeGreaterThan(0)
  expect(stems('fire-')).toEqual(stems('quiet-'))
})

for (const { name, fires } of fixtures) {
  for (const scale of SCALES) {
    test(`${name} at ${scale}x ${fires ? 'fires' : 'stays quiet'}`, async ({ browser }) => {
      const page = await openFixture(browser, name, scale)

      const result = await probeClip(page, SELECTOR)

      const counts = `full=${result.fullCount} downscaled=${result.downscaledCount}`
      expect(result.clipped, `${name} at ${scale}x: ${counts}`).toBe(fires)
      expect(result.scale).toBe(scale)
      await page.context().close()
    })
  }

  test(`${name}: the probe leaves the DOM and the render as it found them`, async ({ browser }) => {
    const page = await openFixture(browser, name, 1)
    const before = await page.locator('body').innerHTML()
    const shotBefore = await page.screenshot()

    await probeClip(page, SELECTOR)

    expect(await page.locator('body').innerHTML()).toBe(before)
    expect((await page.screenshot()).equals(shotBefore)).toBe(true)
    await page.context().close()
  })
}
