import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { VerdictHero } from './VerdictHero'
import type { FatigueVerdict } from './fatigue-model'

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
