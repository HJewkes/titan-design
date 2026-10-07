import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test, expect, type Page, type TestInfo } from '@playwright/test'
import {
  BASELINE_FILE,
  BLANK_LIST_FILE,
  CONTRAST_THEMES,
  baselineKey,
  blankProblems,
  contrastProblems,
  interleaveForShards,
  pairCounts,
  type ContrastBaseline,
  type ContrastNode,
  type ContrastTheme,
} from '../../src/test/contrast-stories'
import { installPausedClock, loadStory, readStories } from './render-story'
import { CONTRAST_REPORT_ENV } from './contrast.global-setup'
import { STORY_INDEX_ENV } from './story-index.global-setup'

/**
 * axe `color-contrast` in real Chromium on every Storybook story, dark and light (TD-738).
 *
 * One test per story and theme, on the static build `playwright.contrast.config.ts` serves. Each
 * story renders under the Layer 2 paused clock, the clock runs forward a fixed `SETTLE_MS` so
 * entrance animations and the theme switch reach their final frame, CSS animations are finished or
 * cancelled as Playwright's screenshots do, and axe samples at that frozen instant. axe yields with
 * `setTimeout`, which never fires under the paused clock, so its timers are shimmed to microtasks
 * for the run: resuming the clock instead let real time pass while axe walked the tree, and the
 * counts of mid-transition colours varied from one CI run to the next (TD-738, PR #726).
 *
 * The violating nodes' foreground|background pairs are counted and compared with
 * `contrast-stories-baseline.json`, which may only shrink: a pair or count above it fails, and a
 * pair or count that no longer occurs fails as stale until `pnpm contrast:baseline` regenerates it.
 *
 * A story that renders blank is recorded and skipped only if `contrast-blank-stories.json` lists it;
 * that list may only shrink (an unlisted blank story fails, a listed story that renders fails until
 * removed), so a new blank story cannot slip past the gate. A story tagged `play` is left out: its play function scrolls and presses in real time before the clock
 * settles, so the frame axe sees is not the same twice (the carousel interaction stories moved by a
 * card between CI runs); the interaction project owns them, and their static render is the same
 * carousel as the non-play stories.
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
const blankListFile = path.join(__dirname, 'contrast-blank-stories.json')
const blankStories = new Set(JSON.parse(fs.readFileSync(blankListFile, 'utf8')) as string[])
const PLAY_TAG = 'play'
const storyIds = interleaveForShards(
  readStories()
    .filter((entry) => !entry.tags?.includes(PLAY_TAG))
    .map((entry) => entry.id)
)

// axe-core is jest-axe's dependency, so it resolves from there (as scripts/audit-stories does).
const fromUi = createRequire(path.join(__dirname, '..', '..', 'package.json'))
const axeSource = fs.readFileSync(
  createRequire(fromUi.resolve('jest-axe')).resolve('axe-core/axe.min.js'),
  'utf8'
)
// The preview bundles addon-a11y's own axe-core, which also assigns `window.axe` and runs on each
// story; sharing that instance hit its "Axe is already running" guard, so this copy moves aside.
const AXE_GLOBAL = '__titanContrastAxe'
const axeInitScript = `${axeSource}\n;window.${AXE_GLOBAL} = window.axe; delete window.axe;`

// `retry` tells the regeneration script which row of a retried test is the last attempt.
type ReportRow = { key: string; id: string; theme: ContrastTheme; retry: number } & (
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

interface AxeInstance {
  run(
    context: string,
    options: object
  ): Promise<{ violations: { id: string; nodes: AxeCheckNode[] }[] }>
}

interface AxeWindow {
  setTimeout: (handler: () => void, ...rest: unknown[]) => number
  requestAnimationFrame: (callback: (time: number) => void) => number
}

/** axe at the paused instant: its timer yields run as microtasks, so no page time passes. */
async function contrastNodes(page: Page): Promise<ContrastNode[]> {
  return page.evaluate(async (axeGlobal) => {
    const win = window as unknown as AxeWindow & Record<string, AxeInstance>
    const { setTimeout: realSetTimeout, requestAnimationFrame: realRaf } = win
    win.setTimeout = (handler) => {
      void Promise.resolve().then(handler)
      return 0
    }
    win.requestAnimationFrame = (callback) => {
      void Promise.resolve().then(() => callback(0))
      return 0
    }
    try {
      const result = await win[axeGlobal].run('#storybook-root', {
        runOnly: ['color-contrast'],
        resultTypes: ['violations'],
      })
      const rule = result.violations.find((violation) => violation.id === 'color-contrast')
      return (rule?.nodes ?? []).map((node) => ({
        fgColor: node.any?.[0]?.data?.fgColor,
        bgColor: node.any?.[0]?.data?.bgColor,
      }))
    } finally {
      win.setTimeout = realSetTimeout
      win.requestAnimationFrame = realRaf
    }
  }, AXE_GLOBAL)
}

// Four times Layer 2's guard: the Lab decision records that mount every variant at once took over
// 5 s on a loaded machine, and a story blank at generation time hides its violations until a later
// run renders it and fails as unlisted.
const RENDER_TIMEOUT = 20_000

/** Renders the story under the paused clock, or returns the blank reason; axe is ready either way. */
async function renderForAxe(page: Page, id: string, theme: ContrastTheme) {
  await installPausedClock(page)
  await page.addInitScript({ content: axeInitScript })
  const blank = await loadStory(page, id, theme, RENDER_TIMEOUT)
  if (blank) return blank
  if (theme === 'light') await page.evaluate(() => document.documentElement.classList.add('light'))
  return null
}

// Past every entrance animation and the light-mode switch (a 600 ms draw, 150 ms theme
// transitions), so axe sees the final frame; the clock stays paused once it has run this far.
const SETTLE_MS = 5000

// Finite CSS animations and transitions jump to their end, infinite ones (pulse, ping) are
// cancelled: the same rule as Playwright's `animations: 'disabled'`, since they run on real time.
async function settleCssAnimations(page: Page) {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      const timing = animation.effect?.getComputedTiming()
      if (timing && timing.iterations === Infinity) animation.cancel()
      else animation.finish()
    }
  })
}

async function measure(page: Page) {
  await page.clock.runFor(SETTLE_MS)
  await settleCssAnimations(page)
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

test('every listed blank story is still in the index', () => {
  const indexed = new Set(storyIds)
  const orphans = [...blankStories].filter((id) => !indexed.has(id))
  expect(orphans, `${BLANK_LIST_FILE} lists stories the index no longer has; remove them`).toEqual(
    []
  )
})

test.describe('axe color-contrast on every story', () => {
  for (const id of storyIds) {
    for (const theme of CONTRAST_THEMES) {
      const key = baselineKey(id, theme)
      test(key, async ({ page }, testInfo) => {
        const blank = await renderForAxe(page, id, theme)
        const listedBlank = blankStories.has(id)
        if (blank) {
          record(testInfo, { key, id, theme, blank, retry: testInfo.retry })
          expect(blankProblems(id, blank, listedBlank), `blank guard for ${key}`).toEqual([])
          test.skip(true, `listed blank story, skipped: ${blank}`)
          return
        }
        expect(blankProblems(id, null, listedBlank), `blank guard for ${key}`).toEqual([])
        const counts = await measure(page)
        record(testInfo, { key, id, theme, counts, retry: testInfo.retry })
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
    // A missing proof story fails rather than skips: a vacuous gate must not look green.
    expect(storyIds, `${SENSITIVITY_STORY} must be in the index`).toContain(SENSITIVITY_STORY)
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
