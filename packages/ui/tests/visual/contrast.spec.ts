import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test, expect, type Page, type TestInfo } from '@playwright/test'
import {
  BASELINE_FILE,
  CONTRAST_THEMES,
  baselineKey,
  contrastProblems,
  interleaveForShards,
  pairCounts,
  type ContrastBaseline,
  type ContrastNode,
  type ContrastTheme,
} from '../../src/test/contrast-stories'
import { installPausedClock, loadStory, readStoryIds } from './render-story'
import { CONTRAST_REPORT_ENV } from './contrast.global-setup'
import { STORY_INDEX_ENV } from './story-index.global-setup'

/**
 * axe `color-contrast` in real Chromium on every Storybook story, dark and light (TD-738).
 *
 * One test per story and theme, on the static build `playwright.contrast.config.ts` serves. Each
 * story renders under the Layer 2 paused clock, then the clock resumes (axe schedules its run with
 * `setTimeout`, so it never returns while the clock is paused) and axe reports the violating nodes.
 * Their foreground|background pairs are counted and compared with `contrast-stories-baseline.json`,
 * which may only shrink: a pair or count above it fails, and a pair or count that no longer occurs
 * fails as stale until `pnpm contrast:baseline` regenerates the file.
 *
 * A story that renders blank is recorded and skipped, not failed: Layer 2's guard owns that.
 *
 * Light mode: `addon-themes` applies `globals=theme:light` from an effect the paused clock never
 * runs, so the class is also set on `<html>` directly. jsdom cannot compute contrast at all
 * (`src/test/stories-axe-suite.tsx` disables the rule), so this is the only gate for it.
 *
 * Every test appends `{ key, id, theme, counts | blank }` to the report file (`TITAN_CONTRAST_REPORT`,
 * else `contrast-report.jsonl` in the output dir); CI uploads it per shard, and the regeneration
 * script merges those files into the baseline.
 */

const baselineFile = path.join(__dirname, 'contrast-stories-baseline.json')
const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8')) as ContrastBaseline
const storyIds = interleaveForShards(readStoryIds())

// axe-core is jest-axe's dependency, so it resolves from there (as scripts/audit-stories does).
const fromUi = createRequire(path.join(__dirname, '..', '..', 'package.json'))
const axeSource = fs.readFileSync(
  createRequire(fromUi.resolve('jest-axe')).resolve('axe-core/axe.min.js'),
  'utf8'
)

type ReportRow = { key: string; id: string; theme: ContrastTheme } & (
  | { counts: Record<string, number> }
  | { blank: string }
)

function record(testInfo: TestInfo, row: ReportRow) {
  const file =
    process.env[CONTRAST_REPORT_ENV] ??
    path.join(testInfo.project.outputDir, 'contrast-report.jsonl')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.appendFileSync(file, `${JSON.stringify(row)}\n`)
}

interface AxeCheckNode {
  any?: { data?: ContrastNode }[]
}

async function contrastNodes(page: Page): Promise<ContrastNode[]> {
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run(
            context: string,
            options: object
          ): Promise<{ violations: { id: string; nodes: AxeCheckNode[] }[] }>
        }
      }
    ).axe
    const result = await axe.run('#storybook-root', {
      runOnly: ['color-contrast'],
      resultTypes: ['violations'],
    })
    const rule = result.violations.find((violation) => violation.id === 'color-contrast')
    return (rule?.nodes ?? []).map((node) => ({
      fgColor: node.any?.[0]?.data?.fgColor,
      bgColor: node.any?.[0]?.data?.bgColor,
    }))
  })
}

// Four times Layer 2's guard: the Lab decision records that mount every variant at once took over
// 5 s on a loaded machine, and a story blank at generation time hides its violations until a later
// run renders it and fails as unlisted.
const RENDER_TIMEOUT = 20_000

/** Renders the story under the paused clock, or returns the blank reason; axe is ready either way. */
async function renderForAxe(page: Page, id: string, theme: ContrastTheme) {
  await installPausedClock(page)
  await page.addInitScript({ content: axeSource })
  const blank = await loadStory(page, id, theme, RENDER_TIMEOUT)
  if (blank) return blank
  if (theme === 'light') await page.evaluate(() => document.documentElement.classList.add('light'))
  return null
}

async function measure(page: Page) {
  await page.clock.resume()
  return pairCounts(await contrastNodes(page))
}

test('the story index lists every story', () => {
  expect(process.env[STORY_INDEX_ENV], 'globalSetup wrote the story index').toBeTruthy()
  expect(storyIds.length, 'stories were found').toBeGreaterThan(0)
})

test('every baseline entry names an indexed story-theme with positive counts', () => {
  const known = new Set(
    storyIds.flatMap((id) => CONTRAST_THEMES.map((theme) => baselineKey(id, theme)))
  )
  const orphans = Object.keys(baseline).filter((key) => !known.has(key))
  expect(
    orphans,
    `${BASELINE_FILE} lists story-themes the index no longer has; remove them`
  ).toEqual([])
  const empty = Object.entries(baseline)
    .filter(([, counts]) => !Object.values(counts).some((n) => Number.isInteger(n) && n > 0))
    .map(([key]) => key)
  expect(empty, `${BASELINE_FILE} entries must list at least one pair with a count`).toEqual([])
})

test.describe('axe color-contrast on every story', () => {
  for (const id of storyIds) {
    for (const theme of CONTRAST_THEMES) {
      const key = baselineKey(id, theme)
      test(key, async ({ page }, testInfo) => {
        const blank = await renderForAxe(page, id, theme)
        if (blank) {
          record(testInfo, { key, id, theme, blank })
          test.skip(true, `blank render, left to Layer 2's guard: ${blank}`)
          return
        }
        const counts = await measure(page)
        record(testInfo, { key, id, theme, counts })
        expect(contrastProblems(key, counts, baseline[key]), `contrast gate for ${key}`).toEqual([])
      })
    }
  }
})

/**
 * Sensitivity proof, like Layer 2's: a story whose baseline is clean in both themes is re-rendered
 * with every text node forced to 1.1:1 against its background, and the gate must report nodes
 * above the baseline. Any other failure (a blank render, axe not running) would make the gate vacuous.
 */
// Badge has real text: axe leaves a one-character label (Kbd) or a symbol as `incomplete`, not a violation.
const SENSITIVITY_STORY = 'components-atoms-badge--default'
const SENSITIVITY_CSS =
  '#storybook-root, #storybook-root * { color: #2c2a28 !important; background-color: #252321 !important }'

for (const theme of CONTRAST_THEMES) {
  test(`sensitivity: 1.1:1 text in ${SENSITIVITY_STORY} (${theme}) fails the gate`, async ({
    page,
  }) => {
    test.skip(!storyIds.includes(SENSITIVITY_STORY), `${SENSITIVITY_STORY} is not in the index`)
    const key = baselineKey(SENSITIVITY_STORY, theme)
    expect(
      baseline[key],
      `${key} must have no baseline entry for the proof to mean anything`
    ).toBeUndefined()

    const blank = await renderForAxe(page, SENSITIVITY_STORY, theme)
    expect(blank, 'the sensitivity story rendered').toBeNull()
    await page.addStyleTag({ content: SENSITIVITY_CSS })
    const counts = await measure(page)

    const problems = contrastProblems(key, counts, baseline[key])
    expect(problems, 'a 1.1:1 render must fail').toHaveLength(1)
    expect(problems[0]).toContain('above')
    console.log(`[sensitivity] ${key}: ${JSON.stringify(counts)}`)
  })
}
