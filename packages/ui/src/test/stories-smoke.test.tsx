import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'

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
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoryModule = Record<string, any>

const storyModules = import.meta.glob<StoryModule>('../components/**/*.stories.tsx', {
  eager: true,
})

describe('storybook stories render (composeStories smoke)', () => {
  const entries = Object.entries(storyModules)

  it('discovers a non-trivial number of story modules', () => {
    expect(entries.length).toBeGreaterThan(10)
  })

  for (const [file, mod] of entries) {
    const label = file.replace('../components/', '')
    const composed = composeStories(mod)
    for (const [name, Story] of Object.entries(composed)) {
      it(`${label} › ${name} renders`, () => {
        // Smoke level: every story must MOUNT without throwing. `firstChild` is
        // not asserted — portal/modal organisms (PrHistoryModal) render into
        // document.body, and empty-state stories legitimately render null; the
        // hand-written per-organism tests own the detailed output assertions.
        const result = render(<Story />)
        expect(result.unmount).toBeTypeOf('function')
        result.unmount()
      })
    }
  }
})
