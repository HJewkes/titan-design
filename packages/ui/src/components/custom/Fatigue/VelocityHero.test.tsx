import { describe, it, expect } from 'vitest'
import { axe } from 'jest-axe'
import { render, screen, within } from '@testing-library/react'
import { VelocityHero } from './VelocityHero'
import { MOCK_MEAN_VELOCITIES } from './fatigue-mock'

describe('VelocityHero', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <VelocityHero velocities={MOCK_MEAN_VELOCITIES} targetReps={8} width={800} height={300} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('names the chart with every rep velocity', () => {
    render(<VelocityHero velocities={[0.62, 0.58, 0.5]} width={800} height={300} />)
    expect(
      screen.getByRole('img', { name: 'Bar velocity by rep, 3 reps: 0.62, 0.58, 0.50 m/s' })
    ).toBeInTheDocument()
  })

  it('exposes one image, named by the rep velocities, not a nested strip image', () => {
    const { container } = render(
      <VelocityHero velocities={[0.62, 0.58, 0.5]} width={800} height={300} />
    )
    const images = within(container).getAllByRole('img')
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveAccessibleName('Bar velocity by rep, 3 reps: 0.62, 0.58, 0.50 m/s')
  })

  it('names the chart when there are no reps', () => {
    render(<VelocityHero velocities={[]} width={800} height={300} />)
    expect(
      screen.getByRole('img', { name: 'Bar velocity by rep, no reps yet' })
    ).toBeInTheDocument()
  })

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

  it('moves its decision bands with the loss thresholds it is given', () => {
    render(
      <VelocityHero
        velocities={MOCK_MEAN_VELOCITIES}
        width={800}
        height={300}
        lossThresholds={[10 / 3, 20 / 3, 10]}
      />
    )
    expect(screen.getByText('VL 7%')).toBeInTheDocument()
    expect(screen.getByText('VL 10%')).toBeInTheDocument()
  })

  it('draws no bands when there is no data', () => {
    render(<VelocityHero velocities={[]} width={800} height={300} />)
    expect(screen.queryByText('VL 20%')).not.toBeInTheDocument()
  })
})
