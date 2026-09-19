import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { resolveAll, spacingClassesOf } from '../../../test/spacing-resolver'
import { capturedClassNames } from '../../../test/classname-capture'

import { GoalCard, type GoalCardProps, type GoalCardSize } from './GoalCard'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const LONG_NAME = 'Single-Arm Half-Kneeling Cable Row'
// Pasted garbage: one 120-character token with no break opportunity.
const GARBAGE = 'X'.repeat(120)

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

  it('wraps a long name whole, clamped only at the four-line garbage guard', () => {
    render(<GoalCard {...card(size)} />)
    const title = screen.getByTestId('goal-card-title')
    expect(title).toHaveTextContent(LONG_NAME, { normalizeWhitespace: true })
    expect(title).toHaveStyle({ WebkitLineClamp: '4' })
  })

  it.each([
    ['with every mark', card(size)],
    ['with no priority or PR mark', { ...card(size), priority: undefined, isPR: false }],
  ])('breaks one unbroken pasted token inside the card %s', (_, props) => {
    render(<GoalCard {...props} title={GARBAGE} />)
    expect(screen.getByTestId('goal-card-title')).toHaveTextContent(GARBAGE)
    expect(styleOf('goal-card-title')).toContain('overflow-wrap: anywhere')
    expect(screen.getByTestId('goal-card-title')).toHaveStyle({ WebkitLineClamp: '4' })
  })

  it('keeps only the status in the marks when there is no priority or PR', () => {
    render(<GoalCard {...card(size)} priority={undefined} isPR={false} title={GARBAGE} />)
    const marks = screen.getByTestId('goal-card-marks')
    expect(marks.children).toHaveLength(1)
    expect(marks).toContainElement(screen.getByTestId('goal-card-status'))
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<GoalCard {...card(size)} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('the gap under the title row', () => {
  // className never reaches the DOM under vitest; setup.ts captures it per testID.
  it('is stack-md (8px) on the compact card, whose name and hero read as one header', () => {
    render(<GoalCard {...card('compact')} />)
    expect(resolveAll(spacingClassesOf('goal-card-content'))).toEqual(['8px'])
  })

  it('stays stack-lg (16px) on the full card', () => {
    render(<GoalCard {...card('full')} />)
    expect(resolveAll(spacingClassesOf('goal-card-content'))).toEqual(['16px'])
  })
})

describe('the hero numeral', () => {
  it('sits on a tight line height on the compact card', () => {
    render(<GoalCard {...card('compact')} />)
    expect(capturedClassNames.get('goal-milestone-hero')).toContain('leading-none')
  })

  it('sits on a tight line height on the full card', () => {
    render(<GoalCard {...card('full')} />)
    expect(capturedClassNames.get('goal-milestone-hero')).toContain('leading-none')
  })

  it('still takes a milestone that asks for the default', () => {
    const base = card('full')
    render(<GoalCard {...base} milestone={{ ...base.milestone, heroLeading: 'default' }} />)
    expect(capturedClassNames.get('goal-milestone-hero')).not.toContain('leading-none')
  })
})
