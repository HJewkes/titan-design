import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BAND_OPACITY } from './GoalTrajectoryBand'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { LIFT_RIM_ALPHA } from '../../../theme/lift'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'
import { BAND_COLUMN_STEP, PLOT_LEFT } from './GoalTrajectoryChartGeometry'

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

/** The gradient an element's `fill="url(#id)"` points at. */
function gradientOf(container: HTMLElement, element: Element): Element {
  const id = /url\(#(.+)\)/.exec(element.getAttribute('fill') ?? '')?.[1] ?? ''
  return container.querySelector(`[id="${id}"]`) as Element
}

const stopOpacities = (gradient: Element): string[] =>
  [...gradient.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-opacity') ?? '')

describe('GoalTrajectoryChart band (locked: smoothed, 28% centre to 14% edge)', () => {
  it('fades continuously from 14% at each edge to 28% on the centre line', () => {
    const { container } = render(<GoalTrajectoryChart {...props} />)
    const column = screen.getAllByTestId('goal-trajectory-chart-band-column')[0]
    const gradient = gradientOf(container, column)
    expect(gradient.getAttribute('y2')).toBe('1')
    expect(stopOpacities(gradient)).toEqual(['0.14', '0.28', '0.14'])
    expect(
      [...gradient.querySelectorAll('stop')].map((stop) => stop.getAttribute('offset'))
    ).toEqual(['0', '0.5', '1'])
  })

  it('paints one shared gradient over abutting 2px columns, clipped to the smoothed band', () => {
    const { container } = render(<GoalTrajectoryChart {...props} />)
    const columns = screen.getAllByTestId('goal-trajectory-chart-band-column')
    const xs = columns.map((c) => Number(c.getAttribute('x')))
    xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBe(BAND_COLUMN_STEP))
    expect(new Set(columns.map((c) => c.getAttribute('fill'))).size).toBe(1)
    const band = screen.getByTestId('goal-trajectory-chart-band')
    const clipId = /url\(#(.+)\)/.exec(band.getAttribute('clip-path') ?? '')?.[1] ?? ''
    const clip = container.querySelector(`[id="${clipId}"] path`)
    expect(clip?.getAttribute('d')).toContain('C')
  })

  it('keeps the NOT CHOSEN flat band reachable at a uniform 28%', () => {
    render(<GoalTrajectoryChart {...props} bandFade="none" bandCurve="linear" />)
    const band = screen.getByTestId('goal-trajectory-chart-band')
    expect(band.getAttribute('fill')).toBe(getSemanticColors('dark')['brand-secondary'])
    expect(band.getAttribute('fill-opacity')).toBe(String(BAND_OPACITY))
    expect(band.getAttribute('d')).not.toContain('C')
  })

  it('keeps the NOT CHOSEN 20% centre fade on the same continuous gradient', () => {
    const { container } = render(<GoalTrajectoryChart {...props} bandFade="centre-20" />)
    const column = screen.getAllByTestId('goal-trajectory-chart-band-column')[0]
    expect(stopOpacities(gradientOf(container, column))).toEqual(['0.2', '0.28', '0.2'])
  })

  it('keeps the NOT CHOSEN across fade from w1 to the last week', () => {
    const { container } = render(<GoalTrajectoryChart {...props} bandFade="across-20" />)
    const band = screen.getByTestId('goal-trajectory-chart-band')
    const gradient = gradientOf(container, band)
    expect(gradient.getAttribute('x2')).toBe('1')
    expect(stopOpacities(gradient)).toEqual(['0.28', '0.2'])
  })
})

describe('GoalTrajectoryChart baseline (locked: lip)', () => {
  it('drops the floor gridline for the card rim light, keeping its label', () => {
    render(<GoalTrajectoryChart {...props} />)
    expect(screen.queryByTestId('goal-trajectory-chart-baseline')).not.toBeInTheDocument()
    const lip = screen.getByTestId('goal-trajectory-chart-lip')
    expect(lip.getAttribute('fill')).toBe(alpha(primitiveColors.white, LIFT_RIM_ALPHA.dark))
    expect(lip.getAttribute('fill-rule')).toBe('evenodd')
    expect(screen.getByText('170')).toBeInTheDocument()
  })

  it('keeps the NOT CHOSEN inset floor rule clear of the rounded corners', () => {
    render(<GoalTrajectoryChart {...props} baseline="inset-rule" />)
    const baseline = screen.getByTestId('goal-trajectory-chart-baseline')
    expect(Number(baseline.getAttribute('x1'))).toBe(PLOT_LEFT + 6)
    expect(screen.queryByTestId('goal-trajectory-chart-lip')).not.toBeInTheDocument()
  })
})
