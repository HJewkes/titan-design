import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiveFatigueCard } from './LiveFatigueCard'
import { FATIGUE_STATES, WARMING_UP_MODEL } from './fatigue-mock'

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
