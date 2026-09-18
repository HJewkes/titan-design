import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { FeedbackSchema, MANIFEST_SCHEMA_ID, type ManifestInput } from '../src/schema.ts'
import { isolatedStorybook, type RunningStorybook } from './storybook.ts'

const CLI = new URL('../src/cli.ts', import.meta.url).pathname

function round(storybookUrl: string, height = 700): ManifestInput {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'vw-419-e2e',
    round: 1,
    storybookUrl,
    widths: [360],
    height,
    variants: [
      { key: 'A', storyId: 'lab-decisions-goal-milestone-tiles--phone', label: 'Tiles' },
      { key: 'B', storyId: 'lab-decisions-compact-goal-chart--phone', label: 'Chart' },
    ],
    questions: [
      { id: 'q1', kind: 'pick-one', prompt: 'Which one?', options: ['A', 'B'], required: true },
    ],
  }
}

function startCli(manifestPath: string, outDir: string) {
  const child = spawn('node', [CLI, manifestPath, '--no-open', '--out', outDir])
  let stdout = ''
  child.stdout.on('data', (c: Buffer) => (stdout += c.toString()))
  const url = new Promise<string>((resolve) => {
    child.stderr.on('data', (c: Buffer) => {
      const found = c.toString().match(/at (http\S+__review\/)/)?.[1]
      if (found) resolve(found)
    })
  })
  const exit = new Promise<number | null>((resolve) => child.once('exit', resolve))
  return { child, url, exit, stdout: () => stdout }
}

/** Enter scrolls smoothly to the next stop; measure only once the page has stopped moving. */
async function scrollSettled(page: Page): Promise<number> {
  let last = -1
  for (;;) {
    const y = await page.evaluate(() => window.scrollY)
    if (y === last) return y
    last = y
    await page.waitForTimeout(150)
  }
}

let storybook: RunningStorybook
let cli: ChildProcess | undefined

test.beforeAll(async () => {
  storybook = await isolatedStorybook()
})
test.afterAll(() => {
  cli?.kill()
  storybook?.stop()
})

test('a keyboard pick, a comment and a pin come back as feedback.json', async ({ page }) => {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-e2e-'))
  const manifestPath = join(dir, 'round.json')
  await writeFile(manifestPath, JSON.stringify(round(storybook.url)))
  const run = startCli(manifestPath, dir)
  cli = run.child

  await page.goto(await run.url)
  await expect(page.getByTestId('hit-testing')).toContainText('hit-testing on')
  const tiles = page.frameLocator('[data-width="360"] iframe').first()
  const caption = tiles.getByTestId('state-onTrack').getByText('Upcoming, on track')
  await expect(caption).toBeVisible()

  await page.keyboard.press('1')
  await page.keyboard.press('Tab')
  await page.keyboard.type('Tiles read better')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.keyboard.press('1')

  await page.keyboard.press('a')
  await scrollSettled(page)
  const box = await caption.boundingBox()
  const overlay = page.getByTestId('overlay-A-360')
  const origin = await overlay.boundingBox()
  await overlay.click({
    position: { x: box!.x - origin!.x + 10, y: box!.y - origin!.y + box!.height / 2 },
  })
  await page.keyboard.type('This label is too faint')
  await page.keyboard.press('Escape')

  await page.keyboard.press('Meta+Enter')
  await expect(page.getByTestId('review-screen')).toContainText('This label is too faint')
  await page.keyboard.press('Meta+Enter')
  await expect(page.getByTestId('sent')).toBeVisible()

  expect(await run.exit).toBe(0)
  const written = FeedbackSchema.parse(
    JSON.parse(await readFile(join(dir, 'feedback.json'), 'utf8'))
  )
  expect(JSON.parse(run.stdout())).toEqual(written)
  expect(written.answers).toEqual([{ questionId: 'q1', pick: 'A' }])
  const [a, b] = written.variants
  expect(a).toMatchObject({ key: 'A', verdict: 'chosen', comment: 'Tiles read better' })
  expect(b.verdict).toBeNull()
  expect(a.annotations).toHaveLength(1)
  expect(a.annotations[0]).toMatchObject({ id: 'A-1', width: 360, note: 'This label is too faint' })
  expect(a.annotations[0].target).toMatchObject({
    testId: 'state-onTrack',
    text: 'Upcoming, on track',
  })
  expect(existsSync(join(dir, '360-A-phone.png'))).toBe(true)
  expect(existsSync(join(dir, '360-B-phone.png'))).toBe(true)
})

test('clicking into a tall variant leaves the page where it is', async ({ page }) => {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-e2e-'))
  const manifestPath = join(dir, 'round.json')
  await writeFile(manifestPath, JSON.stringify(round(storybook.url, 1600)))
  const run = startCli(manifestPath, dir)
  cli = run.child

  await page.goto(await run.url)
  const card = page.getByTestId('variant-B')
  const comment = card.getByLabel('Comment on B')
  await comment.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  const before = await scrollSettled(page)
  expect((await card.boundingBox())!.y, 'the card top is above the viewport').toBeLessThan(0)

  await comment.click()
  await comment.pressSequentially('stays put')

  await expect(card).toHaveAttribute('data-active', 'true')
  await expect(comment).toBeFocused()
  expect(await scrollSettled(page)).toBe(before)
  run.child.kill()
})
