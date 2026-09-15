import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'

import * as gridStories from './GoalCardGrid.stories'
import * as bVariationStories from './BVariations.stories'
import { deriveGoalBandSparkGeometry } from './GoalBandSpark'

/**
 * `src/test/stories-smoke.test.tsx` globs `../components/**` only, so NOTHING
 * under `src/lab` has render coverage. That gap is why two defects in this
 * unit's round-one specimen reached the browser: a sparkline measured against
 * the padded box bled through the card's edge, and a sentence set in
 * `microLabel` rendered in all caps. Neither would have been caught here
 * either — but a story that throws would be, and that is worth the file.
 *
 * Scoped deliberately to this unit rather than widening the global glob: lab
 * churns by design, and enrolling all of `src/lab` is its own decision.
 */
describe('Lab/Goals goal-card specimens', () => {
  for (const [label, mod] of [
    ['GoalCardGrid', gridStories],
    ['BVariations', bVariationStories],
  ] as const) {
    const composed = composeStories(mod)
    for (const [name, Story] of Object.entries(composed)) {
      it(`${label} › ${name} renders`, () => {
        const result = render(<Story />)
        expect(result.unmount).toBeTypeOf('function')
        result.unmount()
      })
    }
  }
})

describe('deriveGoalBandSparkGeometry', () => {
  const base = {
    actuals: [
      { week: 1, value: 90 },
      { week: 3, value: 100 },
    ],
    committed: 102.5,
    stretch: 110,
    goalWeek: 8,
    width: 200,
    height: 50,
    labelGutter: 40,
  }

  it('spans the x domain to the goal week, not to the last reading', () => {
    const g = deriveGoalBandSparkGeometry(base)
    // Week 3 of 8 across a 160px plot: the line stops well short of the edge,
    // which is the whole point of the round-two change.
    const [segment] = g.segments
    expect(segment).toBeDefined()
    expect(segment!.left).toBe(0)
    expect(segment!.left + segment!.length).toBeLessThan(g.plotWidth * 0.6)
  })

  it('reserves the label gutter out of the plot width', () => {
    expect(deriveGoalBandSparkGeometry(base).plotWidth).toBe(160)
    expect(deriveGoalBandSparkGeometry({ ...base, labelGutter: 0 }).plotWidth).toBe(200)
  })

  it('keeps both targets inside the box even when they exceed every reading', () => {
    const g = deriveGoalBandSparkGeometry(base)
    for (const y of [g.committedY, g.stretchY]) {
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(base.height)
    }
    expect(g.bandHeight).toBeGreaterThan(0)
  })

  it('survives a flat series without dividing by zero', () => {
    const g = deriveGoalBandSparkGeometry({
      ...base,
      actuals: [
        { week: 1, value: 100 },
        { week: 2, value: 100 },
      ],
      committed: 100,
      stretch: 100,
    })
    expect(Number.isFinite(g.committedY)).toBe(true)
    expect(g.bandHeight).toBe(0)
  })
})
