import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type Browser } from '@playwright/test'
import { FeedbackSchema, MANIFEST_SCHEMA_ID, type ManifestInput } from '../src/schema.ts'

const CLI = new URL('../src/cli.ts', import.meta.url).pathname

/** An image-only round: no Storybook is needed, so none is started. */
const ROUND: ManifestInput = {
  schema: MANIFEST_SCHEMA_ID,
  unit: 'vw-723-e2e',
  round: 1,
  storybookUrl: 'http://127.0.0.1:6100',
  widths: [1280],
  variants: [
    { key: 'A', image: 'shots/wall-a.png', label: 'Wall, dense' },
    { key: 'B', image: 'shots/wall-b.png', label: 'Wall, sparse' },
  ],
  questions: [{ id: 'q1', kind: 'pick-one', prompt: 'Which wall?', options: ['A', 'B'] }],
}

/** A synthetic 1280x720 screen, so the e2e never depends on a real app's screenshot. */
async function syntheticPng(browser: Browser, file: string, text: string): Promise<void> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.setContent(
    `<body style="margin:0;background:#123;color:#fff;font:64px sans-serif"><p>${text}</p></body>`
  )
  await page.screenshot({ path: file })
  await page.close()
}

/** A hand-written test round: it bypasses the contrast gate, and the page must say so. */
const OVERRIDE = ['--contrast-override', 'e2e fixture round, synthetic images']

let cli: ChildProcess | undefined
test.afterAll(() => cli?.kill())

test('an image variant renders at its width and its feedback comes back', async ({
  page,
  browser,
}) => {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-image-e2e-'))
  await mkdir(join(dir, 'shots'))
  await syntheticPng(browser, join(dir, 'shots', 'wall-a.png'), 'Dense wall')
  await syntheticPng(browser, join(dir, 'shots', 'wall-b.png'), 'Sparse wall')
  const manifestPath = join(dir, 'round.json')
  await writeFile(manifestPath, JSON.stringify(ROUND))

  cli = spawn('node', [CLI, manifestPath, '--no-open', '--out', dir, ...OVERRIDE])
  let stdout = ''
  cli.stdout?.on('data', (c: Buffer) => (stdout += c.toString()))
  const exit = new Promise<number | null>((resolve) => cli?.once('exit', resolve))
  const url = await new Promise<string>((resolve) =>
    cli?.stderr?.on('data', (c: Buffer) => {
      const found = c.toString().match(/at (http\S+__review\/)/)?.[1]
      if (found) resolve(found)
    })
  )

  await page.goto(url)
  await expect(page.getByTestId('contrast-override')).toHaveText(
    'Contrast was not gated for this round: e2e fixture round, synthetic images'
  )
  await expect(page.getByTestId('contrast-override')).toHaveCSS('position', 'sticky')
  const image = page.getByRole('img', { name: 'A · Wall, dense at 1280px' })
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1280)
  const box = (await image.boundingBox())!
  const frame = (await page.locator('[data-width="1280"] .frame-box').first().boundingBox())!
  expect(box.width).toBeCloseTo(frame.width, 0)
  expect(box.height).toBeCloseTo((box.width * 720) / 1280, 0)
  await expect(page.locator('iframe')).toHaveCount(0)

  await page.keyboard.press('1')
  await page.keyboard.press('Tab')
  await page.keyboard.type('Dense reads at distance')
  await page.keyboard.press('Enter')
  await page.keyboard.press('2')

  await page.keyboard.press('a')
  await page.getByTestId('overlay-A-1280').click({ position: { x: 20, y: 20 } })
  await page.keyboard.type('Header too close to the edge')
  await page.keyboard.press('Escape')

  await page.keyboard.press('Meta+Enter')
  await expect(page.getByTestId('review-screen')).toContainText('Header too close to the edge')
  await page.keyboard.press('Meta+Enter')
  await expect(page.getByTestId('sent')).toBeVisible()

  expect(await exit).toBe(0)
  const written = FeedbackSchema.parse(
    JSON.parse(await readFile(join(dir, 'feedback.json'), 'utf8'))
  )
  expect(JSON.parse(stdout)).toEqual(written)
  expect(written.contrastOverride).toMatchObject({
    reason: 'e2e fixture round, synthetic images',
    problem: 'no contrast.json beside this round',
  })
  const [a, b] = written.variants
  expect(a).toMatchObject({ key: 'A', image: 'shots/wall-a.png', verdict: 'chosen' })
  expect(a.comment).toBe('Dense reads at distance')
  expect(a.annotations).toHaveLength(1)
  expect(a.annotations[0]).toMatchObject({ width: 1280, note: 'Header too close to the edge' })
  expect(a.annotations[0].target).toBeUndefined()
  expect(b).toMatchObject({ key: 'B', image: 'shots/wall-b.png', verdict: 'rejected' })
  expect(existsSync(join(dir, 'A-image.png'))).toBe(true)
  expect(existsSync(join(dir, 'B-image.png'))).toBe(true)
})

test('sticky heads stay below an override banner whose reason wraps', async ({ page, browser }) => {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-banner-e2e-'))
  await mkdir(join(dir, 'shots'))
  await syntheticPng(browser, join(dir, 'shots', 'wall-a.png'), 'Dense wall')
  await syntheticPng(browser, join(dir, 'shots', 'wall-b.png'), 'Sparse wall')
  const manifestPath = join(dir, 'round.json')
  const sectioned = {
    ...ROUND,
    sections: [{ id: 'wall', title: 'Wall', variantKeys: ['A', 'B'], questionIds: ['q1'] }],
  }
  await writeFile(manifestPath, JSON.stringify(sectioned))

  const reason = 'long reason '.repeat(17).slice(0, 200)
  const server = spawn('node', [
    CLI,
    manifestPath,
    '--no-open',
    '--out',
    dir,
    '--contrast-override',
    reason,
  ])
  try {
    const url = await new Promise<string>((resolve) =>
      server.stderr?.on('data', (c: Buffer) => {
        const found = c.toString().match(/at (http\S+__review\/)/)?.[1]
        if (found) resolve(found)
      })
    )
    await page.setViewportSize({ width: 1400, height: 400 })
    await page.goto(url)
    const banner = page.getByTestId('contrast-override')
    await expect(banner).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
    const bannerBox = (await banner.boundingBox())!
    expect(bannerBox.height).toBeGreaterThan(40)
    const bannerBottom = bannerBox.y + bannerBox.height
    const sectionHead = (await page.locator('.section-head').first().boundingBox())!
    const variantHead = (await page.locator('.variant-head').first().boundingBox())!
    expect(sectionHead.y).toBeGreaterThanOrEqual(bannerBottom - 0.5)
    expect(variantHead.y).toBeGreaterThanOrEqual(bannerBottom - 0.5)
  } finally {
    server.kill()
  }
})
