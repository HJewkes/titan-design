import { describe, expect, it } from 'vitest'
import type { TooltipPlacement } from './Tooltip'
import { arrowStyles, portalPosition, tooltipPositionStyles } from './tooltipPosition'

const rect = { top: 100, left: 200, bottom: 140, right: 280, width: 80, height: 40 }

describe('portalPosition', () => {
  it('centres above the trigger with an 8px gap for top', () => {
    expect(portalPosition(rect, 'top')).toEqual({
      top: 92,
      left: 240,
      transform: 'translate(-50%, -100%)',
    })
  })

  it('centres below the trigger for bottom', () => {
    expect(portalPosition(rect, 'bottom')).toEqual({
      top: 148,
      left: 240,
      transform: 'translate(-50%, 0%)',
    })
  })

  it('centres vertically to the left and right of the trigger', () => {
    expect(portalPosition(rect, 'left')).toEqual({
      top: 120,
      left: 192,
      transform: 'translate(-100%, -50%)',
    })
    expect(portalPosition(rect, 'right')).toEqual({
      top: 120,
      left: 288,
      transform: 'translate(0%, -50%)',
    })
  })

  it('ignores the start and end half of a placement', () => {
    expect(portalPosition(rect, 'top-start')).toEqual(portalPosition(rect, 'top'))
    expect(portalPosition(rect, 'bottom-end')).toEqual(portalPosition(rect, 'bottom'))
  })
})

describe('placement class maps', () => {
  const placements: TooltipPlacement[] = [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'right',
  ]

  it('give every placement an arrow and a box position', () => {
    for (const placement of placements) {
      expect(arrowStyles[placement]).toContain('-surface-overlay')
      expect(tooltipPositionStyles[placement]).toMatch(/(top|bottom|left|right)-full/)
    }
  })
})
