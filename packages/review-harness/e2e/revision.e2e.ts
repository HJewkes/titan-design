import { spawn, type ChildProcess } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { FeedbackSchema, MANIFEST_SCHEMA_ID, type ManifestInput } from '@titan-design/review-schema'
import { SECTION_TEXTS } from '../test/fixtures.ts'

const CLI = new URL('../src/cli.ts', import.meta.url).pathname
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

/** An image-only round with one required pick-one: no Storybook is needed, so none is started. */
const ROUND: ManifestInput = {
  schema: MANIFEST_SCHEMA_ID,
  unit: 'td-672-e2e',
  round: 1,
  storybookUrl: 'http://127.0.0.1:6100',
  widths: [1280],
  variants: [
    { key: 'A', image: 'shots/a.png', label: 'First' },
    { key: 'B', image: 'shots/b.png', label: 'Second' },
  ],
  questions: [
    {
      id: 'q1',
      kind: 'pick-one',
      prompt: 'Which one?',
      options: ['A', 'B'],
      required: true,
      signsOff: 'which frame leads',
    },
  ],
  sections: [
    {
      id: 'lead',
      title: 'Lead',
      ...SECTION_TEXTS,
      kind: 'CHOICE',
      variantKeys: ['A', 'B'],
      questionIds: ['q1'],
    },
  ],
}

let cli: ChildProcess | undefined
test.afterEach(() => cli?.kill())

async function openRound(page: Page) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-revision-e2e-'))
  await mkdir(join(dir, 'shots'), { recursive: true })
  await writeFile(join(dir, 'shots', 'a.png'), PNG)
  await writeFile(join(dir, 'shots', 'b.png'), PNG)
  const manifestPath = join(dir, 'round.json')
  await writeFile(manifestPath, JSON.stringify(ROUND))
  cli = spawn('node', [
    CLI,
    manifestPath,
    '--no-open',
    '--out',
    dir,
    '--contrast-override',
    'e2e fixture round, tiny images',
  ])
  const exit = new Promise<number | null>((resolve) => cli?.once('exit', resolve))
  let stderr = ''
  // A CLI that exits before printing its URL rejected the round; fail now, not at the timeout.
  const url = await new Promise<string>((resolve, reject) => {
    cli?.stderr?.on('data', (c: Buffer) => {
      stderr += c.toString()
      const found = stderr.match(/at (http\S+__review\/)/)?.[1]
      if (found) resolve(found)
    })
    void exit.then((code) => reject(new Error(`titan-review exited ${code}:\n${stderr}`)))
  })
  await page.goto(url)
  return { dir, exit }
}

const readFeedback = async (dir: string) =>
  FeedbackSchema.parse(JSON.parse(await readFile(join(dir, 'feedback.json'), 'utf8')))

test('a normal pick is recorded as a pick', async ({ page }) => {
  const { dir, exit } = await openRound(page)
  await page.getByTestId('question-q1').getByRole('radio', { name: /^1 A/ }).click()
  await page.keyboard.press('Meta+Enter')
  await page.keyboard.press('Meta+Enter')
  await expect(page.getByTestId('sent')).toBeVisible()
  expect(await exit).toBe(0)
  expect((await readFeedback(dir)).answers).toEqual([{ questionId: 'q1', pick: 'A' }])
})

test('a revision request with a comment is recorded as a revision, not a pick', async ({
  page,
}) => {
  const { dir, exit } = await openRound(page)
  const question = page.getByTestId('question-q1')
  await question.getByRole('radio', { name: /None of these, request a revision/ }).click()
  await question.getByLabel('Comment on q1').fill('Neither carries the goal')
  await page.getByRole('button', { name: /Review/ }).click()
  await page.getByTestId('send').click()
  await expect(page.getByTestId('sent')).toBeVisible()
  expect(await exit).toBe(0)
  expect((await readFeedback(dir)).answers).toEqual([
    { questionId: 'q1', revisionRequested: true, comment: 'Neither carries the goal' },
  ])
})

test('a revision request without a comment cannot be sent and says why', async ({ page }) => {
  const { dir } = await openRound(page)
  const question = page.getByTestId('question-q1')
  await question.getByRole('radio', { name: /None of these, request a revision/ }).click()
  await expect(page.getByTestId('revision-needs-comment-q1')).toBeVisible()
  await page.keyboard.press('Meta+Enter')
  await expect(page.getByTestId('send')).toBeDisabled()
  await expect(page.getByRole('alert').last()).toContainText('needs a comment')
  await expect(page.getByTestId('sent')).toHaveCount(0)
  await expect(readFile(join(dir, 'feedback.json'))).rejects.toThrow()
})
