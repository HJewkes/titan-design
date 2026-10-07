import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { loadComposedStories, storyTimeout } from './composed-stories'
import { includeFamily } from './stories-smoke-families'

/**
 * Storybook → render-test bridge, custom/Workout family (see `stories-smoke-ui.test.tsx` for the
 * rationale and `stories-smoke-families.ts` for the split, TD-732).
 */

const stories = await loadComposedStories(includeFamily('workout'))

describe('storybook stories render (composeStories smoke)', () => {
  for (const { file, name, id, Story } of stories) {
    it(`${file} › ${name} renders`, { timeout: storyTimeout(id) }, () => {
      // Smoke level: every story must MOUNT without throwing; see the ui file.
      const result = render(<Story />)
      expect(result.unmount).toBeTypeOf('function')
      result.unmount()
    })
  }
})
