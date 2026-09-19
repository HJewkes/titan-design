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

function storedDrafts(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('titan-review:draft:'))
  )
}

async function openRound(page: Page, height?: number) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-e2e-'))
  const manifestPath = join(dir, 'round.json')
  await writeFile(manifestPath, JSON.stringify(round(storybook.url, height)))
  const run = startCli(manifestPath, dir)
  cli = run.child
  await page.goto(await run.url)
  return run
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
  expect(await storedDrafts(page), 'a sent round leaves no draft behind').toEqual([])
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

test('a reload keeps the unsent verdicts, comments, pins and answers', async ({ page }) => {
  const run = await openRound(page)
  const verdictA = page.getByRole('radiogroup', { name: 'Verdict for A' })
  await verdictA.getByRole('radio', { name: /chosen/i }).click()
  const commentA = page.getByLabel('Comment on A')
  await commentA.fill('Tiles read better')
  await commentA.blur()
  await page.keyboard.press('a')
  await page.getByTestId('overlay-A-360').click({ position: { x: 40, y: 40 } })
  await page.keyboard.type('too faint')
  await page.keyboard.press('Escape')
  const pickB = page.getByTestId('question-q1').getByRole('radio').nth(1)
  await pickB.click()
  await page.getByLabel('General notes').fill('light mode next')
  await expect.poll(() => storedDrafts(page)).toHaveLength(1)

  await page.reload()

  await expect(verdictA.getByRole('radio', { checked: true })).toHaveText(/chosen/i)
  await expect(commentA).toHaveValue('Tiles read better')
  await expect(page.getByTestId('overlay-A-360').locator('.pin')).toHaveCount(1)
  await expect(page.getByLabel('Note for pin A-1')).toHaveValue('too faint')
  await expect(pickB).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByLabel('General notes')).toHaveValue('light mode next')
  run.child.kill()
})

test('a frame Storybook does not answer says so and retries', async ({ page }) => {
  const dead = '**/iframe.html?id=lab-decisions-compact-goal-chart--phone*'
  await page.route(dead, (route) =>
    route.fulfill({ status: 502, contentType: 'text/plain', body: 'unreachable' })
  )
  const run = await openRound(page)
  const notice = page.getByTestId('dead-B-360')
  await expect(notice).toContainText('Preview unreachable')
  await expect(page.getByTestId('dead-A-360')).toHaveCount(0)

  await page.unroute(dead)
  await notice.getByRole('button', { name: 'Retry' }).click()

  await expect(notice).toHaveCount(0)
  const chart = page.frameLocator('[data-testid="variant-B"] iframe').first()
  await expect(chart.locator('#storybook-root')).not.toBeEmpty()
  run.child.kill()
})
