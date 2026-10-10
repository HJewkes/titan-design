import { describe, expect, it } from 'vitest'
import { greyRamp, primitiveRamps, semanticPins } from './primitives'
import { getSemanticColors } from './semantic'

// Dark values agreed at Gate 2 (decisions-r2-dark round 1, item 42). Light is unchanged.
const DARK_VALUES = [
  ['border-input-hover', greyRamp[400]],
  ['border-prominent', 'rgba(255, 255, 255, 0.30)'],
  ['status-error', primitiveRamps.red[500]],
  ['brand-secondary', primitiveRamps.cyan[500]],
  ['text-link', primitiveRamps.blue[300]],
] as const

describe('item 42 dark values', () => {
  it.each(DARK_VALUES)('dark %s is %s', (token, value) => {
    expect(getSemanticColors('dark')[token]).toBe(value)
  })

  it('keeps the indigo pin on dark border-focus while text-link leaves it', () => {
    expect(getSemanticColors('dark')['border-focus']).toBe(semanticPins.focusIndigoDark)
  })
})
