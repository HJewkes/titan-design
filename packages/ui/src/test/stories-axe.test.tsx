import type { ComponentType } from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { composeStory } from '@storybook/react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pressable } from 'react-native'
import { configureAxe } from 'jest-axe'
import baselineJson from './stories-axe-baseline.json'
import { composedStories } from './composed-stories'

/**
 * Axe on every composed story (TD-26 S2), under the same jsdom pipeline as the smoke test.
 *
 * `stories-axe-baseline.json` maps a story id to the axe rule ids it fails today. It may only
 * shrink: a failure it does not list fails the story's test, and a listed rule that now passes
 * fails as stale until someone removes it.
 */

const BASELINE_FILE = 'packages/ui/src/test/stories-axe-baseline.json'
const baseline: Record<string, string[]> = baselineJson

const axe = configureAxe({
  rules: {
    // jsdom has no layout, so contrast cannot be computed; the browser run of TD-26 S7 covers it.
    'color-contrast': { enabled: false },
    // A story is a component, not a page; landmark containment belongs to the consuming page.
    region: { enabled: false },
  },
})

async function violatedRules(Story: ComponentType): Promise<string[]> {
  const { unmount } = render(<Story />)
  // document.body, not the container: modal and popover stories render into portals.
  const { violations } = await axe(document.body)
  unmount()
  const ids = (violations as { id: string }[]).map((violation) => violation.id)
  return [...new Set(ids)].sort()
}

function baselineProblems(id: string, failing: string[], baselined: string[] = []): string[] {
  const added = failing.filter((rule) => !baselined.includes(rule))
  const stale = baselined.filter((rule) => !failing.includes(rule))
  const problems: string[] = []
  if (added.length > 0) {
    problems.push(
      `${id} fails axe rule(s) ${added.join(', ')}, which ${BASELINE_FILE} does not list. ` +
        'Fix the story or the component; the baseline may only shrink, so do not add them.'
    )
  }
  if (stale.length > 0) {
    problems.push(
      `${id} now passes axe rule(s) ${stale.join(', ')}. Remove them from ${BASELINE_FILE}, ` +
        'and delete the entry once its list is empty.'
    )
  }
  return problems
}

function isSorted(values: string[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] < value)
}

// Lab decision record that mounts every rejected palette at once; axe did not finish in 8 min.
const EXCLUDED_STORY_IDS = new Set(['lab-decisions-volume-status-palette--compare'])

// Decision-record stories take 5 s or more under axe, and a timed-out run blocks every later one.
const AXE_TIMEOUT = 30_000

const stories = composedStories()

describe('axe on every composed story', () => {
  for (const { file, name, id, Story } of stories) {
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

describe('stories-axe baseline', () => {
  it('lists only stories that still exist', () => {
    const known = new Set(stories.map((story) => story.id))
    const missing = Object.keys(baseline).filter((id) => !known.has(id))
    expect(missing, `Remove these ids from ${BASELINE_FILE}; no story has them now`).toEqual([])
  })

  it('excludes only stories that still exist', () => {
    const known = new Set(stories.map((story) => story.id))
    expect([...EXCLUDED_STORY_IDS].filter((id) => !known.has(id))).toEqual([])
  })

  it('is sorted with no empty entries, so a diff shows exactly what changed', () => {
    expect(isSorted(Object.keys(baseline)), 'story ids are not sorted').toBe(true)
    for (const [id, rules] of Object.entries(baseline)) {
      expect(rules.length > 0 && isSorted(rules), `${id}: rule ids empty or unsorted`).toBe(true)
    }
  })
})

function IconOnlyButton({ label }: { label?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => {}} />
}

const fixtureMeta: Meta<typeof IconOnlyButton> = {
  title: 'Test/Fixtures/IconOnlyButton',
  component: IconOnlyButton,
}
const Unlabelled: StoryObj<typeof IconOnlyButton> = {}
const Labelled: StoryObj<typeof IconOnlyButton> = { args: { label: 'Add item' } }

describe('stories-axe failure paths', () => {
  it('fails a violating story that the baseline does not list', async () => {
    const rules = await violatedRules(composeStory(Unlabelled, fixtureMeta))

    expect(rules).toContain('button-name')
    expect(baselineProblems('fixture--unlabelled', rules)).toEqual([
      expect.stringMatching(/fails axe rule\(s\) .*button-name.*do not add them/),
    ])
  })

  it('fails a baselined rule that now passes as stale', async () => {
    const rules = await violatedRules(composeStory(Labelled, fixtureMeta))

    expect(rules).toEqual([])
    expect(baselineProblems('fixture--labelled', rules, ['button-name'])).toEqual([
      expect.stringMatching(/now passes axe rule\(s\) button-name\. Remove them/),
    ])
  })
})
