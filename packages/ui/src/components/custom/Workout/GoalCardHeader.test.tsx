import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { GoalCard, type GoalCardProps, type GoalCardSize } from './GoalCard'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const LONG_NAME = 'Single-Arm Half-Kneeling Cable Row'

function card(size: GoalCardSize): GoalCardProps {
  const base = { ...S.onTrack, title: LONG_NAME, priority: 'specialize', isPR: true } as const
  return size === 'full' ? { ...base, chartWidth: 296 } : { ...base, size, goal: undefined }
}

function styleOf(testId: string): string {
  return screen.getByTestId(testId).getAttribute('style') ?? ''
}

/**
 * jsdom has no layout engine: these pin the flex rules that let the marks drop
 * under the name and the name wrap. Whether the marks actually drop at 360 is
 * proven only by the VW-432 captures of `Lab/Decisions/Goal Card Header`.
 */
describe.each<GoalCardSize>(['full', 'compact'])('the %s title row at phone width', (size) => {
  it('puts every mark after the name, so a wrap drops them under it', () => {
    render(<GoalCard {...card(size)} />)
    const title = screen.getByTestId('goal-card-title')
    const marks = screen.getByTestId('goal-card-marks')
    expect(title.compareDocumentPosition(marks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(marks).toContainElement(screen.getByRole('button', { name: 'Priority: Specialize' }))
    expect(marks).toContainElement(screen.getByTestId('goal-card-status'))
  })

  it('lets the row wrap and keeps the marks whole', () => {
    render(<GoalCard {...card(size)} />)
    expect(styleOf('goal-card-title-row')).toContain('flex-wrap: wrap')
    expect(styleOf('goal-card-marks')).toContain('flex-shrink: 0')
  })

  it('never clamps the name, so a long one wraps rather than truncates', () => {
    render(<GoalCard {...card(size)} />)
    const title = screen.getByTestId('goal-card-title')
    expect(title).toHaveTextContent(LONG_NAME, { normalizeWhitespace: true })
    expect(styleOf('goal-card-title')).not.toMatch(/line-clamp|text-overflow|ellipsis/)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<GoalCard {...card(size)} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
