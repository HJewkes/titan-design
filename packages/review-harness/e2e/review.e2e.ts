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

const STORIES = [
  'lab-decisions-goal-milestone-tiles--phone',
  'lab-decisions-compact-goal-chart--phone',
]

/** A synthetic sectioned round: 7 variants, 14 frames, 4 sections, auto heights. */
function sectionedRound(storybookUrl: string): ManifestInput {
  const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  const pick = (id: string, options: string[]) =>
    ({ id, kind: 'pick-one', prompt: `Pick for ${id}?`, options, required: true }) as const
  const text = (id: string) => ({ id, kind: 'text', prompt: `Wording for ${id}?` }) as const
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'vw-545-e2e',
    round: 2,
    storybookUrl,
    widths: [1920, 360],
    variants: keys.map((key, i) => ({ key, storyId: STORIES[i % 2], label: `Frame ${key}` })),
    questions: [
      pick('q1', ['A', 'B']),
      text('q1-text'),
      pick('q2', ['on the chart', 'in the hero eyebrow']),
      pick('q3', ['D', 'E']),
      pick('q4', ['F', 'G']),
      text('overall'),
    ],
    sections: [
      { id: 's1', title: 'First', questionIds: ['q1', 'q1-text'], variantKeys: ['A', 'B'] },
      { id: 's2', title: 'Second', questionIds: ['q2'], variantKeys: ['C'] },
      {
        id: 's3',
        title: 'Third',
        questionIds: ['q3'],
        variantKeys: ['D', 'E'],
      },
      {
        id: 's4',
        title: 'Fourth',
        questionIds: ['q4'],
        variantKeys: ['F', 'G'],
      },
    ],
  }
}

function startCli(manifestPath: string, outDir: string, ...flags: string[]) {
  const child = spawn('node', [
    CLI,
    manifestPath,
    '--no-open',
    '--out',
    outDir,
    '--contrast-override',
    'e2e fixture round',
    ...flags,
  ])
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

test('a sectioned round pages section by section and sends with focus left in a story', async ({
  page,
}) => {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-e2e-'))
  const manifestPath = join(dir, 'round.json')
  await writeFile(manifestPath, JSON.stringify(sectionedRound(storybook.url)))
  const run = startCli(manifestPath, dir, '--no-capture')
  cli = run.child
  await page.goto(await run.url)

  const ids = ['q1', 'q2', 'q3', 'q4']
  for (const [i, id] of ids.entries()) {
    await expect(page.getByTestId('page-position')).toContainText(`Section ${i + 1} of 5`)
    await page.getByTestId(`question-${id}`).getByRole('radio').first().click()
    if (i < ids.length - 1) await page.keyboard.press(']')
  }
  expect(await page.locator('[data-width] iframe').count(), 'only section 4 is on screen').toBe(4)

  const story = page.getByTestId('variant-G').locator('iframe').last()
  // A cold Storybook compiles the story on first request, which can outlast the 5 s default.
  await expect(story.contentFrame().locator('#storybook-root')).not.toBeEmpty({ timeout: 30_000 })
  await expect
    .poll(() => story.evaluate((f: HTMLIFrameElement) => f.contentDocument?.readyState))
    .toBe('complete')
  await story.click({ position: { x: 20, y: 20 }, force: true })
  await expect(story, 'a click in a story moves focus into its iframe').toBeFocused()

  await page.keyboard.press('Meta+Enter')
  await expect(page.getByTestId('review-screen'), 'focus leaves the hidden form').toBeFocused()
  await page.keyboard.press('Meta+Enter')
  await expect(page.getByTestId('sent')).toBeVisible()

  expect(await run.exit).toBe(0)
  const written = FeedbackSchema.parse(
    JSON.parse(await readFile(join(dir, 'feedback.json'), 'utf8'))
  )
  expect(written.answers.map((a) => a.questionId)).toEqual(['q1', 'q2', 'q3', 'q4'])
})

/** Two auto variants about 450 px apart in content, and one tall story in a fixed box. */
function mixedHeightRound(storybookUrl: string): ManifestInput {
  return {
    ...round(storybookUrl, 1300),
    unit: 'vw-695-e2e',
    variants: [
      { key: 'A', storyId: 'lab-decisions-compact-goal-chart--phone', label: 'Chart' },
      { key: 'B', storyId: 'custom-workout-goals-goalcard--phone', label: 'Card' },
      { key: 'C', storyId: STORIES[0], label: 'Tiles', height: 500 },
    ],
  }
}

/** The story's drawn height, measured the way page/autoHeight.ts measures it. */
function drawnHeight(page: Page, key: string): Promise<number> {
  const story = page.getByTestId(`variant-${key}`).locator('iframe').contentFrame()
  return story.locator('#storybook-root').evaluate((root) => {
    const boxes = Array.from(root.children).map((c) => c.getBoundingClientRect())
    return Math.ceil(Math.max(...boxes.map((b) => b.bottom)) - Math.min(...boxes.map((b) => b.top)))
  })
}

async function frameBoxHeight(page: Page, key: string): Promise<number> {
  return (await page.getByTestId(`variant-${key}`).locator('.frame-box').boundingBox())!.height
}

test("a round with mixed story heights fits each frame under the round's height", async ({
  page,
}) => {
  test.setTimeout(120_000)
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-e2e-'))
  const manifestPath = join(dir, 'round.json')
  await writeFile(manifestPath, JSON.stringify(mixedHeightRound(storybook.url)))
  const run = startCli(manifestPath, dir, '--no-capture')
  cli = run.child
  await page.goto(await run.url)

  const fitted: number[] = []
  for (const key of ['A', 'B']) {
    const card = page.getByTestId(`variant-${key}`)
    await card.scrollIntoViewIfNeeded()
    const root = card.locator('iframe').contentFrame().locator('#storybook-root')
    await expect(root).not.toBeEmpty({ timeout: 30_000 })
    const offFit = async () =>
      Math.abs((await frameBoxHeight(page, key)) - ((await drawnHeight(page, key)) + 32))
    await expect.poll(offFit, `frame ${key} fits its story`).toBeLessThanOrEqual(8)
    const box = await frameBoxHeight(page, key)
    expect(box, `frame ${key} sits under the round's height`).toBeLessThan(1300)
    fitted.push(box)
  }
  expect(
    Math.abs(fitted[0] - fitted[1]),
    'the two auto frames fit different stories'
  ).toBeGreaterThan(40)

  await page.getByTestId('variant-C').scrollIntoViewIfNeeded()
  expect(await frameBoxHeight(page, 'C')).toBe(500)
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
