import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiveFatigueCard } from './LiveFatigueCard'
import { FATIGUE_STATES, WARMING_UP_MODEL } from './fatigue-mock'
import { GHOST_GUTTER } from './GhostSpark'
import { resolveAll, siblingSource, spacingClassesIn } from '../../../test/spacing-resolver'

const model = FATIGUE_STATES[3].model

describe('LiveFatigueCard', () => {
  it('composes the verdict hero, lights, ROM chart and ghost spark', () => {
    render(<LiveFatigueCard model={model} width={318} height={508} />)
    expect(screen.getByTestId('live-fatigue-card')).toBeInTheDocument()
    expect(screen.getByTestId('verdict-hero')).toBeInTheDocument()
    expect(screen.getByTestId('fatigue-lights')).toBeInTheDocument()
    expect(screen.getByTestId('rom-progression')).toBeInTheDocument()
    expect(screen.getByTestId('ghost-spark')).toBeInTheDocument()
  })

  it('shows the verdict word from the model', () => {
    render(<LiveFatigueCard model={model} />)
    expect(screen.getByText('Form breaking down')).toBeInTheDocument()
  })

  it('renders a warming-up (cold start) model without a verdict', () => {
    render(<LiveFatigueCard model={WARMING_UP_MODEL} width={318} height={508} />)
    expect(screen.getByText('Warming up')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

/**
 * The card's spacing, pinned (AW-142 wave three).
 *
 * The top group's 12px gap is the numeric rung `gap-3`: it is a vertical gap and the
 * stack ramp runs 4 / 8 / 16 / 24, so 12 has no semantic key. `PAD` stays 18 and stays a
 * number — two MEASURED constants in `panel-layout` count it twice.
 */
describe('LiveFatigueCard geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'LiveFatigueCard.tsx')

  it('spaces the top group by gap-3', () => {
    expect(spacingClassesIn(source, 'LiveFatigueCard')).toEqual(['gap-3'])
    expect(resolveAll(['gap-3'])).toEqual(['12px'])
  })

  it('sizes the plot against the spark gutter it actually renders', () => {
    expect(GHOST_GUTTER).toBe(4)
    expect(source).toContain('GHOST_GUTTER * 2')
    expect(source).not.toMatch(/const GHOST_GUTTER/)
  })
})
