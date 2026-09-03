import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VelocityHero } from './VelocityHero'
import { MOCK_MEAN_VELOCITIES } from './fatigue-mock'

describe('VelocityHero', () => {
  it('renders the hero container', () => {
    render(
      <VelocityHero velocities={MOCK_MEAN_VELOCITIES} targetReps={8} width={800} height={300} />
    )
    expect(screen.getByTestId('velocity-hero')).toBeInTheDocument()
  })

  it('draws the VL20 / VL30 loss bands when there is data', () => {
    render(
      <VelocityHero velocities={MOCK_MEAN_VELOCITIES} targetReps={8} width={800} height={300} />
    )
    expect(screen.getByText('VL 20%')).toBeInTheDocument()
    expect(screen.getByText('VL 30%')).toBeInTheDocument()
  })

  it('draws no bands when there is no data', () => {
    render(<VelocityHero velocities={[]} width={800} height={300} />)
    expect(screen.queryByText('VL 20%')).not.toBeInTheDocument()
  })
})
