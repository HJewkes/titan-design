import type { ComponentType } from 'react'
import { afterEach, describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { configureAxe } from 'jest-axe'
import type { ComposedStoryEntry } from './composed-stories'
import { ratchetProblems } from './ratchet'

/**
 * Axe on every composed story (TD-26 S2), under the same jsdom pipeline as the smoke test.
 *
 * `stories-axe-baseline.json` maps a story id to the axe rule ids it fails today. It may only
 * shrink: a failure it does not list fails the story's test, and a listed rule that now passes
 * fails as stale until someone removes it. The stories run in shards, one test file each, so the
 * thread pool spreads them.
 */

export type AxeBaseline = Record<string, string[]>

export const BASELINE_FILE = 'packages/ui/src/test/stories-axe-baseline.json'

const axe = configureAxe({
  rules: {
    // jsdom has no layout, so contrast cannot be computed; the browser run of TD-26 S7 covers it.
    'color-contrast': { enabled: false },
    // A story is a component, not a page; landmark containment belongs to the consuming page.
    region: { enabled: false },
  },
})

export type AxeRun = (element: Element) => Promise<{ violations: unknown[] }>

// A timed-out test abandons its run without stopping it, so every run queues behind the last.
let lastRun: Promise<unknown> = Promise.resolve()

export function axeIdle(): Promise<unknown> {
  return lastRun
}

export function violatedRules(Story: ComponentType, run: AxeRun = axe): Promise<string[]> {
  const current = lastRun.then(() => axeOnStory(Story, run))
  lastRun = current.catch(() => undefined)
  return current
}

async function axeOnStory(Story: ComponentType, run: AxeRun): Promise<string[]> {
  const { unmount } = render(<Story />)
  try {
    // document.body, not the container: modal and popover stories render into portals.
    const { violations } = await run(document.body)
    const ids = (violations as { id: string }[]).map((violation) => violation.id)
    return [...new Set(ids)].sort()
  } finally {
    unmount()
  }
}

export function baselineProblems(
  id: string,
  failing: string[],
  baselined: string[] = []
): string[] {
  return ratchetProblems(failing, baselined, {
    added: (added) =>
      `${id} fails axe rule(s) ${added.join(', ')}, which ${BASELINE_FILE} does not list. ` +
      'Fix the story or the component; the baseline may only shrink, so do not add them.',
    stale: (stale) =>
      `${id} now passes axe rule(s) ${stale.join(', ')}. Remove them from ${BASELINE_FILE}, ` +
      'and delete the entry once its list is empty.',
  })
}

// Lab decision record that mounts every rejected palette at once; axe did not finish in 8 min.
export const EXCLUDED_STORY_IDS = new Set(['lab-decisions-volume-status-palette--compare'])

// Decision-record stories take 5 s or more under axe, and a timed-out run blocks every later one.
const AXE_TIMEOUT = 30_000
// Long enough for an abandoned run to finish, so the next story's own timeout starts after it.
const AXE_DRAIN_TIMEOUT = 120_000

const isWorkout = (file: string) => file.startsWith('custom/Workout/')
const workoutInitial = (file: string) => file.charAt('custom/Workout/'.length).toUpperCase()

// custom/Workout is flat and holds over half the axe time, so it splits by file name.
export const AXE_SHARDS = {
  core: (file: string) => !file.startsWith('custom/'),
  custom: (file: string) => file.startsWith('custom/') && !isWorkout(file),
  'workout-a-g': (file: string) => isWorkout(file) && workoutInitial(file) <= 'G',
  'workout-h-z': (file: string) => isWorkout(file) && workoutInitial(file) > 'G',
} satisfies Record<string, (file: string) => boolean>

export type AxeShard = keyof typeof AXE_SHARDS

export function describeAxeShard(
  shard: AxeShard,
  baseline: AxeBaseline,
  stories: ComposedStoryEntry[]
): void {
  describe(`axe on every composed story (${shard})`, () => {
    afterEach(axeIdle, AXE_DRAIN_TIMEOUT)
    for (const { file, name, id, Story } of stories.filter((s) => AXE_SHARDS[shard](s.file))) {
      const test = EXCLUDED_STORY_IDS.has(id) ? it.skip : it
      test(
        `${file} › ${name} passes axe or matches the baseline`,
        { timeout: AXE_TIMEOUT },
        async () => {
          expect(baselineProblems(id, await violatedRules(Story), baseline[id])).toEqual([])
        }
      )
    }
  })
}
