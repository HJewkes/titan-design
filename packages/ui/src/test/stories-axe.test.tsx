import { describe, it, expect } from 'vitest'
import { composeStory } from '@storybook/react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pressable } from 'react-native'
import baseline from './stories-axe-baseline.json'
import { loadComposedStories } from './composed-stories'
import {
  AXE_SHARDS,
  BASELINE_FILE,
  EXCLUDED_STORY_IDS,
  baselineProblems,
  describeAxeShard,
  violatedRules,
} from './stories-axe-suite'

const stories = await loadComposedStories()

describeAxeShard('core', baseline, stories)

function isSorted(values: string[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] < value)
}

describe('stories-axe baseline', () => {
  const known = new Set(stories.map((story) => story.id))

  it('lists only stories that still exist', () => {
    const missing = Object.keys(baseline).filter((id) => !known.has(id))
    expect(missing, `Remove these ids from ${BASELINE_FILE}; no story has them now`).toEqual([])
  })

  it('excludes only stories that still exist', () => {
    expect([...EXCLUDED_STORY_IDS].filter((id) => !known.has(id))).toEqual([])
  })

  it('is sorted with no empty entries, so a diff shows exactly what changed', () => {
    expect(isSorted(Object.keys(baseline)), 'story ids are not sorted').toBe(true)
    for (const [id, rules] of Object.entries(baseline)) {
      expect(rules.length > 0 && isSorted(rules), `${id}: rule ids empty or unsorted`).toBe(true)
    }
  })

  it('puts every story in exactly one shard', () => {
    const predicates = Object.values(AXE_SHARDS)
    const misplaced = stories
      .filter(({ file }) => predicates.filter((inShard) => inShard(file)).length !== 1)
      .map(({ file }) => file)
    expect(misplaced, 'add these files to one shard in stories-axe-suite.tsx').toEqual([])
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
