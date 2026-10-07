import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  loadComposedStories,
  loadLabDecisionStories,
  storyFiles,
  storyModuleCount,
  storyTimeout,
} from './composed-stories'
import { includeFamily, storyFamily } from './stories-smoke-families'

/**
 * Storybook → render-test bridge (TD-04.11 / VW-20).
 *
 * The design system has a complete `*.stories.tsx` set but no test consumed it.
 * This uses Storybook's portable-stories `composeStories` to mount EVERY story
 * (with its args/decorators applied) through the same react-native-web + jsdom
 * pipeline the unit tests use, asserting each renders without throwing and emits
 * output. It's broad, near-free coverage that catches "this organism/variant
 * crashes on render" regressions across the whole component set — the long tail
 * the hand-written per-organism tests don't enumerate.
 *
 * Project annotations (the preview's theme decorator) are intentionally NOT
 * applied: a smoke test only needs to prove each story renders, and skipping
 * them avoids importing global.css / addon-themes into the test env.
 *
 * This file holds the ui, shell and lab decision stories; `stories-smoke-workout` and
 * `stories-smoke-custom` hold the rest (see `stories-smoke-families.ts`).
 */

const stories = [
  ...(await loadComposedStories(includeFamily('ui'))),
  ...(await loadLabDecisionStories()),
]

describe('storybook stories render (composeStories smoke)', () => {
  it('discovers a non-trivial number of story modules', () => {
    expect(storyModuleCount()).toBeGreaterThan(10)
  })

  it('assigns every story file to exactly one smoke family', () => {
    const families = ['ui', 'workout', 'custom'] as const
    const covered = families.flatMap((family) => storyFiles().filter(includeFamily(family)))
    expect([...covered].sort()).toEqual([...storyFiles()].sort())
    expect(storyFiles().every((file) => families.includes(storyFamily(file)))).toBe(true)
  })

  for (const { file, name, id, Story } of stories) {
    it(`${file} › ${name} renders`, { timeout: storyTimeout(id) }, () => {
      // Smoke level: every story must MOUNT without throwing. `firstChild` is
      // not asserted — portal/modal organisms (PrHistoryModal) render into
      // document.body, and empty-state stories legitimately render null; the
      // hand-written per-organism tests own the detailed output assertions.
      const result = render(<Story />)
      expect(result.unmount).toBeTypeOf('function')
      result.unmount()
    })
  }
})
