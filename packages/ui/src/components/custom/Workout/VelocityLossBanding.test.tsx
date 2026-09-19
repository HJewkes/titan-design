/**
 * Every loss-coloured surface bands a rep on its EXACT loss from the set's best, never on
 * the whole percent it displays. With a 20 percent stop split in thirds, a rep at 13.33
 * percent is past the 13.3 threshold, as the consumer's own unrounded check says.
 * PinnedLiveStrip's half of the proof is in its own test file (tier rule).
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DualVelocityStrip, VelocityStrip, velocityLossForRep } from './VelocityStrip'

const THRESHOLDS = [6.7, 13.3, 20] as const

// Best 1.0 m/s. Each rep's exact loss, and the band it must take.
const EDGES = [
  { velocity: 1.0, loss: 0, band: 0 },
  { velocity: 0.934, loss: 6.6, band: 0 },
  { velocity: 0.933, loss: 6.7, band: 1 },
  { velocity: 0.8671, loss: 13.29, band: 1 },
  { velocity: 0.867, loss: 13.3, band: 2 },
  { velocity: 0.8667, loss: 13.33, band: 2 },
  { velocity: 0.8004, loss: 19.96, band: 2 },
  { velocity: 0.8, loss: 20, band: 3 },
] as const
const VELOCITIES = EDGES.map((e) => e.velocity)

const HEX = ['#2ED573', '#F9B415', '#FF7900', '#D14343']

describe('velocityLossForRep', () => {
  it.each(EDGES)('reads $velocity m/s as $loss percent, unrounded', ({ velocity, loss }) => {
    expect(velocityLossForRep(velocity, 1.0)).toBe(loss)
  })

  it('removes floating-point noise so a rep on a threshold lands on it exactly', () => {
    expect(velocityLossForRep(0.9, 1.0)).toBe(10)
  })

  it('reads a non-positive or non-finite best as no loss', () => {
    expect(velocityLossForRep(0.5, 0)).toBe(0)
    expect(velocityLossForRep(0.5, Number.NaN)).toBe(0)
  })
})

describe.each(['hero', 'compact'] as const)('the %s strip', (variant) => {
  it.each(EDGES.map((e, i) => [i, e.loss, e.band]))(
    'bands rep %i (%f percent) as band %i; a loss on a threshold takes the higher band',
    (index, _loss, band) => {
      render(
        <VelocityStrip
          velocities={VELOCITIES}
          variant={variant}
          height={300}
          lossThresholds={THRESHOLDS}
        />
      )
      expect(screen.getByTestId(`velocity-bar-${index}`)).toHaveStyle({
        backgroundColor: HEX[band],
      })
    }
  )
})

describe('the dual strips', () => {
  it.each(EDGES.map((e, i) => [i, e.loss, e.band]))(
    'band rep %i (%f percent) as band %i on both wings',
    (index, _loss, band) => {
      render(
        <DualVelocityStrip
          left={{ velocities: VELOCITIES }}
          right={{ velocities: VELOCITIES }}
          lossThresholds={THRESHOLDS}
        />
      )
      for (const wing of ['up', 'down']) {
        const bar = within(screen.getByTestId(`dual-velocity-wing-${wing}`)).getByTestId(
          `velocity-bar-${index}`
        )
        expect(bar).toHaveStyle({ backgroundColor: HEX[band] })
      }
    }
  )
})

describe('the loss text', () => {
  it('shows the rounded loss and colours it by the exact one', () => {
    render(<VelocityStrip velocities={[1.0, 0.8004]} lossThresholds={THRESHOLDS} />)
    expect(screen.getByText('Loss: 20%')).toHaveStyle({ color: HEX[2] })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <VelocityStrip velocities={VELOCITIES} lossThresholds={THRESHOLDS} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
