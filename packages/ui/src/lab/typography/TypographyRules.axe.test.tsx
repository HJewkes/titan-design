import { describe, it, expect } from 'vitest'
import { composeStories } from '@storybook/react-vite'
import * as stories from './TypographyRules.stories'
import { violatedRules } from '../../test/stories-axe-suite'

describe('Lab/Typography/Rules axe', () => {
  for (const [name, Story] of Object.entries(composeStories(stories))) {
    it(`${name} has no axe violations`, { timeout: 30_000 }, async () => {
      expect(await violatedRules(Story)).toEqual([])
    })
  }
})
