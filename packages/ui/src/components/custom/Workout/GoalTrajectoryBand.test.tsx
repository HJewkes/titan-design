import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BAND_OPACITY, FADE_LAYERS, fadeLayerOpacities } from './GoalTrajectoryBand'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { LIFT_RIM_ALPHA } from '../../../theme/lift'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'
import { PLOT_LEFT } from './GoalTrajectoryChartGeometry'

const composite = (opacities: number[]): number =>
  1 - opacities.reduce((clear, a) => clear * (1 - a), 1)

const props = {
  expected: [
    { weekIndex: 1, low: 175, high: 175 },
    { weekIndex: 3, low: 179, high: 183 },
    { weekIndex: 6, low: 185, high: 195 },
  ],
  committed: 185,
  stretch: 195,
  actuals: [{ weekIndex: 1, value: 175 }],
  weeks: [{ index: 1 }, { index: 6 }],
  status: 'on_track' as const,
  width: 1200,
  height: 340,
  animate: false,
}

describe('fadeLayerOpacities', () => {
  it.each([
    [0.2, 0.28],
    [0.14, 0.28],
  ])('composites to %d at the edge and %d at the centre', (edge, centre) => {
    const layers = fadeLayerOpacities(edge, centre, FADE_LAYERS)
    expect(layers).toHaveLength(FADE_LAYERS)
    expect(composite(layers.slice(0, 1))).toBeCloseTo(edge)
    expect(composite(layers)).toBeCloseTo(centre)
  })

  it('rises evenly from the edge to the centre', () => {
    const layers = fadeLayerOpacities(0.2, 0.28, FADE_LAYERS)
    const steps = layers.map((_, k) => composite(layers.slice(0, k + 1)))
    steps.slice(1).forEach((value, k) => expect(value - steps[k]).toBeCloseTo(0.08 / 7))
  })
})

describe('GoalTrajectoryChart band treatments', () => {
  const hue = getSemanticColors('dark')['brand-secondary']

  it('paints the locked flat band at 28% by default', () => {
    render(<GoalTrajectoryChart {...props} />)
    const band = screen.getByTestId('goal-trajectory-chart-band')
    expect(band.getAttribute('fill')).toBe(hue)
    expect(band.getAttribute('fill-opacity')).toBe(String(BAND_OPACITY))
    expect(band.getAttribute('d')).not.toContain('C')
  })

  it('smooths the band edges when asked', () => {
    render(<GoalTrajectoryChart {...props} bandCurve="monotone" />)
    expect(screen.getByTestId('goal-trajectory-chart-band').getAttribute('d')).toContain('C')
  })

  it('fades toward the edges with nested layers for a centre fade', () => {
    render(<GoalTrajectoryChart {...props} bandFade="centre-14" />)
    const layers = screen.getAllByTestId('goal-trajectory-chart-band-layer')
    expect(layers).toHaveLength(FADE_LAYERS)
    expect(Number(layers[0].getAttribute('fill-opacity'))).toBeCloseTo(0.14)
  })

  it('fades from w1 to the last week for the across fade', () => {
    const { container } = render(<GoalTrajectoryChart {...props} bandFade="across-20" />)
    const band = screen.getByTestId('goal-trajectory-chart-band')
    const id = /url\(#(.+)\)/.exec(band.getAttribute('fill') ?? '')?.[1] ?? ''
    const stops = container.querySelectorAll(`[id="${id}"] stop`)
    expect([...stops].map((stop) => stop.getAttribute('stop-opacity'))).toEqual(['0.28', '0.2'])
  })
})

describe('GoalTrajectoryChart baseline', () => {
  it('pulls the floor gridline clear of the rounded corners by default', () => {
    render(<GoalTrajectoryChart {...props} />)
    const baseline = screen.getByTestId('goal-trajectory-chart-baseline')
    expect(Number(baseline.getAttribute('x1'))).toBeGreaterThan(PLOT_LEFT)
    expect(Number(baseline.getAttribute('x1'))).toBe(PLOT_LEFT + 6)
    expect(screen.queryByTestId('goal-trajectory-chart-lip')).not.toBeInTheDocument()
  })

  it('swaps the floor gridline for the card rim light in lip mode, keeping its label', () => {
    render(<GoalTrajectoryChart {...props} baseline="lip" />)
    expect(screen.queryByTestId('goal-trajectory-chart-baseline')).not.toBeInTheDocument()
    const lip = screen.getByTestId('goal-trajectory-chart-lip')
    expect(lip.getAttribute('fill')).toBe(alpha(primitiveColors.white, LIFT_RIM_ALPHA.dark))
    expect(lip.getAttribute('fill-rule')).toBe('evenodd')
    expect(screen.getByText('170')).toBeInTheDocument()
  })
})
