import { describe, it, expect } from 'vitest'
import { siblingSource, resolveAll } from '../../../test/spacing-resolver'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import type {
  GoalActualPoint,
  GoalExpectedPoint,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChart'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { pressedLevel, surfaceBackground } from '../../../theme/surface-planes'
import { PLOT_LEFT } from './GoalTrajectoryChartGeometry'

const dark = getSemanticColors('dark')

const expected: GoalExpectedPoint[] = [
  { weekIndex: 1, low: 175, high: 175 },
  { weekIndex: 2, low: 177, high: 179 },
  { weekIndex: 3, low: 179, high: 183 },
  { weekIndex: 4, low: 181, high: 187 },
  { weekIndex: 5, low: 183, high: 191 },
  { weekIndex: 6, low: 185, high: 195 },
]

const weeks: GoalTrajectoryWeek[] = [
  { index: 1 },
  { index: 2 },
  { index: 3 },
  { index: 4 },
  { index: 5, isDeload: true },
  { index: 6 },
]

const actuals: GoalActualPoint[] = [
  { weekIndex: 1, value: 175 },
  { weekIndex: 2, value: 178 },
  { weekIndex: 3, value: 183, isPR: true },
  { weekIndex: 4, value: 185 },
]

const baseProps = {
  expected,
  committed: 185,
  stretch: 195,
  actuals,
  weeks,
  mesoBoundaries: [6],
  width: 600,
  height: 300,
  metricLabel: 'Bench top load',
}

/** The path the band is clipped to, i.e. the band's drawn outline. */
function bandOutline(root: HTMLElement): string {
  const band = within(root).getByTestId('goal-trajectory-chart-band')
  const id = /url\(#(.+)\)/.exec(band.getAttribute('clip-path') ?? '')?.[1] ?? ''
  return root.querySelector(`[id="${id}"] path`)?.getAttribute('d') ?? ''
}

describe('GoalTrajectoryChart', () => {
  describe('rendering', () => {
    it('renders the chart canvas', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toBeInTheDocument()
    })

    it('renders the expected band inside one closed outline', () => {
      const { container } = render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(bandOutline(container)).toMatch(/^M.*Z$/)
    })

    it('renders the committed and stretch rules with their values', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(screen.getByTestId('goal-trajectory-chart-committed-line')).toBeInTheDocument()
      expect(screen.getByTestId('goal-trajectory-chart-stretch-line')).toBeInTheDocument()
      expect(screen.getByText('Committed 185')).toBeInTheDocument()
      expect(screen.getByText('Stretch 195')).toBeInTheDocument()
    })

    it('renders one actual line, a star for each PR and a dot for every other point', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(screen.getAllByTestId('goal-trajectory-chart-actual-line')).toHaveLength(1)
      expect(screen.getAllByTestId('goal-trajectory-chart-actual-dot')).toHaveLength(
        actuals.length - 1
      )
      expect(screen.getAllByTestId('goal-trajectory-chart-pr-star')).toHaveLength(1)
    })

    it('draws round joins and caps on the actual line', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      const line = screen.getByTestId('goal-trajectory-chart-actual-line')
      expect(line.getAttribute('stroke-linejoin')).toBe('round')
      expect(line.getAttribute('stroke-linecap')).toBe('round')
    })

    it('fills no area under the line: nothing is filled in the status tone but the dots', () => {
      const { container } = render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      const drawn = [...container.querySelectorAll('path, rect')].filter(
        (el) => !el.closest('defs')
      )
      const filledPaths = drawn.filter(
        (el) => el.tagName.toLowerCase() === 'path' && el.getAttribute('fill') !== 'none'
      )
      expect(filledPaths.map((el) => el.getAttribute('data-testid'))).toEqual([
        'goal-trajectory-chart-lip',
      ])
      expect(drawn.filter((el) => el.getAttribute('fill') === dark['status-success'])).toEqual([])
    })

    it('shades each deload week and rules each meso boundary', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(screen.getAllByTestId('goal-trajectory-chart-deload')).toHaveLength(1)
      expect(screen.getAllByTestId('goal-trajectory-chart-meso-boundary')).toHaveLength(1)
    })

    it('renders the calibrating placeholder when there is no band and no actuals', () => {
      render(
        <GoalTrajectoryChart
          {...baseProps}
          expected={[]}
          actuals={[]}
          weeks={[]}
          status="calibrating"
        />
      )
      expect(screen.getByTestId('goal-trajectory-chart-empty')).toBeInTheDocument()
      expect(screen.queryByTestId('goal-trajectory-chart-canvas')).not.toBeInTheDocument()
    })
  })

  describe('loss goals', () => {
    const lossExpected: GoalExpectedPoint[] = [
      { weekIndex: 1, low: 196, high: 196 },
      { weekIndex: 2, low: 195, high: 194 },
      { weekIndex: 3, low: 194, high: 192 },
      { weekIndex: 4, low: 193, high: 190 },
    ]

    it('draws a band when low is numerically greater than high', () => {
      render(
        <GoalTrajectoryChart
          {...baseProps}
          expected={lossExpected}
          weeks={[{ index: 1 }, { index: 2 }, { index: 3 }, { index: 4 }]}
          actuals={[
            { weekIndex: 1, value: 196 },
            { weekIndex: 3, value: 193 },
          ]}
          committed={193}
          stretch={190}
          direction="down"
          status="on_track"
          unit="lbs"
        />
      )
      expect(bandOutline(document.body)).toMatch(/Z$/)
    })

    it('labels the legend as a loss band', () => {
      render(<GoalTrajectoryChart {...baseProps} direction="down" status="on_track" />)
      expect(screen.getByText('Expected (loss)')).toBeInTheDocument()
    })
  })

  describe('status tone', () => {
    const toneOf = (status: GoalTrajectoryStatus): string | null => {
      const { unmount } = render(<GoalTrajectoryChart {...baseProps} status={status} />)
      const tone = screen.getByTestId('goal-trajectory-chart-actual-line').getAttribute('stroke')
      unmount()
      return tone
    }

    it('never paints "ahead" in warning-amber', () => {
      const ahead = toneOf('ahead')
      expect(ahead).not.toBe(toneOf('behind'))
      expect(ahead).not.toBe(dark['status-warning'])
      expect(ahead).not.toBe(dark['brand-primary'])
    })

    it('paints "ahead" in a cool tone, clear of the warm pacing family', () => {
      expect(toneOf('ahead')).toBe(dark['status-info'])
    })

    it('gives each status its own pill label', () => {
      const labels: Array<[GoalTrajectoryStatus, string]> = [
        ['on_track', 'On track'],
        ['ahead', 'Ahead'],
        ['behind', 'Behind'],
        ['tolerated', 'Tolerated'],
        ['deload_week', 'Deload week'],
        ['calibrating', 'Calibrating'],
        ['stalled', 'Stalled'],
      ]
      labels.forEach(([status, label]) => {
        const { unmount } = render(<GoalTrajectoryChart {...baseProps} status={status} />)
        expect(screen.getByText(label)).toBeInTheDocument()
        unmount()
      })
    })

    it('paints on_track, behind and stalled in three different tones', () => {
      const tones = new Set([toneOf('on_track'), toneOf('behind'), toneOf('stalled')])
      expect(tones.size).toBe(3)
    })
  })

  describe('target rules', () => {
    it('keeps both target rules and their labels neutral whatever the status', () => {
      const statuses: GoalTrajectoryStatus[] = ['on_track', 'behind', 'stalled']
      statuses.forEach((status) => {
        const { unmount } = render(<GoalTrajectoryChart {...baseProps} status={status} />)
        ;['committed-line', 'stretch-line'].forEach((id) => {
          const rule = screen.getByTestId(`goal-trajectory-chart-${id}`)
          expect(rule.getAttribute('stroke')).toBe(dark['text-secondary'])
        })
        ;['committed-label', 'stretch-label'].forEach((id) => {
          const label = screen.getByTestId(`goal-trajectory-chart-${id}`)
          expect(label.getAttribute('fill')).toBe(dark['text-secondary'])
        })
        unmount()
      })
    })

    it('draws the committed rule solid and the stretch rule dashed', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      const committedRule = screen.getByTestId('goal-trajectory-chart-committed-line')
      const stretchRule = screen.getByTestId('goal-trajectory-chart-stretch-line')
      expect(committedRule.getAttribute('stroke-dasharray')).toBeNull()
      expect(stretchRule.getAttribute('stroke-dasharray')).not.toBeNull()
    })
  })

  describe('density', () => {
    const strokeAt = (width: number): number => {
      const { unmount } = render(
        <GoalTrajectoryChart {...baseProps} width={width} status="on_track" />
      )
      const line = screen.getByTestId('goal-trajectory-chart-actual-line')
      const stroke = Number(line.getAttribute('stroke-width'))
      unmount()
      return stroke
    }

    it('keeps the rule entries in the wall legend and drops them on the phone', () => {
      const { unmount } = render(
        <GoalTrajectoryChart {...baseProps} width={1200} status="on_track" />
      )
      const wallLegend = screen.getByTestId('goal-trajectory-chart-legend')
      expect(wallLegend).toHaveTextContent('Committed')
      expect(wallLegend).toHaveTextContent('Stretch')
      unmount()
      render(<GoalTrajectoryChart {...baseProps} width={360} status="on_track" />)
      const phoneLegend = screen.getByTestId('goal-trajectory-chart-legend')
      expect(phoneLegend).not.toHaveTextContent('Committed')
      expect(phoneLegend).not.toHaveTextContent('Stretch')
      expect(screen.getByText('Committed 185')).toBeInTheDocument()
    })

    it('strokes the line 2px on the phone and 3px on the wall', () => {
      expect(strokeAt(360)).toBe(2)
      expect(strokeAt(1200)).toBe(3)
    })

    it('draws three gridlines on the phone and more on the wall', () => {
      const { unmount } = render(
        <GoalTrajectoryChart {...baseProps} width={360} status="on_track" />
      )
      expect(screen.getAllByTestId('goal-trajectory-chart-y-label')).toHaveLength(3)
      unmount()
      render(<GoalTrajectoryChart {...baseProps} width={1200} status="on_track" />)
      expect(screen.getAllByTestId('goal-trajectory-chart-y-label').length).toBeGreaterThan(3)
    })
  })

  describe('axis and plane', () => {
    it('labels each gridline 8px left of the plot, right-aligned', () => {
      render(<GoalTrajectoryChart {...baseProps} width={1200} status="on_track" />)
      const labels = screen.getAllByTestId('goal-trajectory-chart-y-label')
      expect(labels.map((l) => l.textContent)).toEqual(['170', '175', '180', '185', '190', '195'])
      labels.forEach((label) => {
        expect(label.getAttribute('x')).toBe(String(PLOT_LEFT - 8))
        expect(label.getAttribute('text-anchor')).toBe('end')
      })
    })

    it('lowers the plane one surface step below the enclosing surface', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      const plane = screen.getByTestId('goal-trajectory-chart-plane')
      expect(plane.getAttribute('fill')).toBe(surfaceBackground(pressedLevel('base'), 'dark'))
      expect(plane.getAttribute('fill')).not.toBe(surfaceBackground('base', 'dark'))
    })

    it('rings each dot in the plane colour', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      const plane = screen.getByTestId('goal-trajectory-chart-plane').getAttribute('fill')
      screen.getAllByTestId('goal-trajectory-chart-actual-dot').forEach((dot) => {
        expect(dot.getAttribute('r')).toBe('4')
        expect(dot.getAttribute('stroke')).toBe(plane)
        expect(dot.getAttribute('stroke-width')).toBe('2')
      })
    })
  })

  describe('depth', () => {
    const effective = (el: Element, attr: string): number => Number(el.getAttribute(attr)) * 0.5 // scrim-default is 50% black

    it('shadows the line 2px down with a 3px blur at 45% black', () => {
      const { container } = render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      const shadow = container.querySelector('feDropShadow') as Element
      expect(shadow.getAttribute('dy')).toBe('2')
      expect(shadow.getAttribute('stdDeviation')).toBe('3')
      expect(effective(shadow, 'flood-opacity')).toBeCloseTo(0.45)
      expect(shadow.getAttribute('flood-color')).toBe(dark['scrim-default'])
    })

    it('fades the top inner shadow from 22% over 12% of the height', () => {
      const { container } = render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      const [top] = [...container.querySelectorAll('linearGradient')]
      const stops = top.querySelectorAll('stop')
      expect(top.getAttribute('y2')).toBe('1')
      expect(effective(stops[0], 'stop-opacity')).toBeCloseTo(0.22)
      expect(stops[1].getAttribute('offset')).toBe('0.12')
    })

    it('fades the left inner shadow from 16% over the given spread', () => {
      const { container } = render(
        <GoalTrajectoryChart {...baseProps} leftShadowSpread={0.03} status="on_track" />
      )
      const left = [...container.querySelectorAll('linearGradient')][1]
      const stops = left.querySelectorAll('stop')
      expect(left.getAttribute('x2')).toBe('1')
      expect(effective(stops[0], 'stop-opacity')).toBeCloseTo(0.16)
      expect(stops[1].getAttribute('offset')).toBe('0.03')
    })

    it('defaults the left inner shadow spread to 4%', () => {
      const { container } = render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      const left = [...container.querySelectorAll('linearGradient')][1]
      expect(left.querySelectorAll('stop')[1].getAttribute('offset')).toBe('0.04')
    })
  })

  describe('accessibility', () => {
    it('summarizes the status, targets and PR count in the image label', () => {
      render(<GoalTrajectoryChart {...baseProps} status="behind" unit="lbs" />)
      const canvas = screen.getByTestId('goal-trajectory-chart-canvas')
      const label = canvas.getAttribute('aria-label') ?? ''
      expect(label).toContain('Bench top load')
      expect(label).toContain('Status: Behind')
      expect(label).toContain('Committed 185 lbs')
      expect(label).toContain('1 personal record')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations in the calibrating empty state', async () => {
      const { container } = render(
        <GoalTrajectoryChart
          {...baseProps}
          expected={[]}
          actuals={[]}
          weeks={[]}
          status="calibrating"
        />
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})

/**
 * GoalTrajectoryChart's chrome geometry, pinned (AW-142). The plot itself is
 * untouched — only the legend and status pill around it. The five legend rows
 * were 5px swatch-to-label, off the 4px grain; they take `inline-sm`, and the
 * status pill takes Pill's `sm` rung as MesoStatusCard's badge did.
 */
describe('GoalTrajectoryChart chrome resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'GoalTrajectoryChart.tsx')

  it('puts every legend row on the inline ramp', () => {
    expect(source).not.toContain('gap: 5')
    expect(source.match(/gap-inline-sm/g)).toHaveLength(5)
    expect(resolveAll(['gap-inline-sm'])).toEqual(['4px'])
  })

  it('puts the status pill on Pill’s sm rung', () => {
    expect(source).toContain('px-squish-x-sm py-squish-y-sm')
    expect(resolveAll(['px-squish-x-sm', 'py-squish-y-sm'])).toEqual(['8px', '2px'])
  })
})
