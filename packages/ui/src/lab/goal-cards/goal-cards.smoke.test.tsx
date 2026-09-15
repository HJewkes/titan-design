import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'

import * as roundFiveStories from './Round5.stories'
import { liftRowText, type MuscleLiftRow } from './goal-cards-kit'

/**
 * `src/test/stories-smoke.test.tsx` globs `../components/**` only, so NOTHING
 * under `src/lab` has render coverage. That gap is why two defects in this
 * unit's round-one specimen reached the browser: a sparkline measured against
 * the padded box bled through the card's edge, and a sentence set in
 * `microLabel` rendered in all caps.
 *
 * Scoped deliberately to this unit rather than widening the global glob: lab
 * churns by design, and enrolling all of `src/lab` is its own decision.
 */
describe('Lab/Goals round-five specimen', () => {
  const composed = composeStories(roundFiveStories)
  for (const [name, Story] of Object.entries(composed)) {
    it(`${name} renders`, () => {
      const result = render(<Story />)
      expect(result.unmount).toBeTypeOf('function')
      result.unmount()
    })
  }
})

describe('liftRowText', () => {
  const row: MuscleLiftRow = {
    name: 'Barbell row',
    status: 'on_track',
    reps: 10,
    load: 100,
    unit: 'lb',
    goalWeek: 5,
  }

  it('elides the week when this lift is due in the muscle common week', () => {
    expect(liftRowText(row, 5)).toBe('10 x 100 lb')
  })

  it('shows the week only when this lift is due in a different one', () => {
    expect(liftRowText({ ...row, goalWeek: 7 }, 5)).toBe('10 x 100 lb · wk 7')
  })
})
