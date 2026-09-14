import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { VerdictHero } from './VerdictHero'
import type { FatigueVerdict } from './fatigue-model'
import { resolveAll, siblingSource, spacingClassesIn } from '../../../test/spacing-resolver'

const goodVerdict: FatigueVerdict = {
  state: 'good',
  tone: 'ok',
  dimensions: { velocityLoss: 'ok', rom: 'ok', tempo: 'ok' },
}
const breakdown: FatigueVerdict = {
  state: 'form-breakdown',
  tone: 'alarm',
  dimensions: { velocityLoss: 'alarm', rom: 'alarm', tempo: 'alarm' },
}

describe('VerdictHero', () => {
  it('rounds the RPE to the conventional 0.5 step', () => {
    render(<VerdictHero rpe={7.4} verdict={goodVerdict} />)
    expect(screen.getByText('7.5')).toBeInTheDocument()
  })

  it('renders the verdict word for the state', () => {
    render(<VerdictHero rpe={10} verdict={breakdown} />)
    expect(screen.getByText('Form breaking down')).toBeInTheDocument()
  })

  it('shows an em-dash and "Warming up" when the verdict is null', () => {
    render(<VerdictHero rpe={null} verdict={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Warming up')).toBeInTheDocument()
  })

  it('does not render a reps-in-reserve line (RPE-led only)', () => {
    render(<VerdictHero rpe={8} verdict={goodVerdict} />)
    expect(screen.queryByText(/in reserve/i)).not.toBeInTheDocument()
  })

  it('labels the RPE number for assistive tech', () => {
    render(<VerdictHero rpe={9} verdict={goodVerdict} />)
    expect(screen.getByLabelText('RPE 9.0')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<VerdictHero rpe={8} verdict={goodVerdict} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

/**
 * The hero's spacing, pinned (AW-142 wave three).
 *
 * Two gaps are numeric rungs (6 and 2, neither on the stack ramp). Two values are genuinely
 * optical and stay, with their reason: the 7px between the numeral and its suffix, and the
 * 9px that lifts the suffix onto the numeral's baseline. The comment is asserted alongside
 * the value so a later pass cannot keep the nudge and drop the justification.
 */
describe('VerdictHero geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'VerdictHero.tsx')

  it('spaces the eyebrow from the lockup by gap-1.5', () => {
    expect(spacingClassesIn(source, 'VerdictHero')).toEqual(['gap-1.5'])
    expect(resolveAll(['gap-1.5', 'gap-0.5'])).toEqual(['6px', '2px'])
    expect(source).toContain('className="gap-0.5"')
  })

  it.each([
    ['gap: 7', /\/\/ optical: 7px between the numeral and its RPE suffix/],
    ['marginBottom: 9', /\/\/ optical: 9px lifts the suffix onto the numeral's baseline/],
  ])('keeps %s with its reason beside it', (value, reason) => {
    expect(source).toContain(value)
    expect(source).toMatch(reason)
  })
})
