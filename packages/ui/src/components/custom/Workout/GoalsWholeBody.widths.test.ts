import { describe, it, expect } from 'vitest'
import { Widths } from './GoalsWholeBody.composition.stories'
import { wholeBodyScale } from './wholeBody'

/** The frame's `p-gutter-md` (24px a side) and the card's `p-inset-lg` (16px a side) sit between a frame and the card's content box. */
const FRAME_TO_CONTENT_BOX_X = 48 + 32

describe('GoalsWholeBody Widths story', () => {
  it('straddles the width where the stacked cards move from the phone to the wall scale', () => {
    const [threshold] = Widths.parameters?.widthMatrix?.thresholds ?? []
    const below = wholeBodyScale(threshold - 1 - FRAME_TO_CONTENT_BOX_X)
    const above = wholeBodyScale(threshold + 1 - FRAME_TO_CONTENT_BOX_X)
    expect([below, above]).toEqual(['phone', 'wall'])
  })
})
