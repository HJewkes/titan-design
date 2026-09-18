import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { GoalTrajectoryChart, outcomeReach, trajectoryReach } from './GoalTrajectoryChart'
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
  })

  describe('status tone', () => {
    // Short of the committed target on purpose: a reading that reaches it takes
    // the goal's own tone rather than the pace's.
    const shortOfGoal: GoalActualPoint[] = [
      { weekIndex: 1, value: 175 },
      { weekIndex: 2, value: 178 },
      { weekIndex: 3, value: 181, isPR: true },
      { weekIndex: 4, value: 183 },
    ]
    const toneOf = (status: GoalTrajectoryStatus): string | null => {
      const { unmount } = render(
        <GoalTrajectoryChart {...baseProps} actuals={shortOfGoal} status={status} />
      )
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

    it('names each status in the accessible summary — the chart draws no legend', () => {
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
        const { unmount } = render(
          <GoalTrajectoryChart {...baseProps} actuals={shortOfGoal} status={status} />
        )
        expect(screen.getByTestId('goal-trajectory-chart-canvas')).toHaveAttribute(
          'aria-label',
          expect.stringContaining(`Status: ${label}`)
        )
        expect(screen.queryByText(label)).toBeNull()
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

    it('draws a week label per week, and none when the caller says so', () => {
      const { unmount } = render(
        <GoalTrajectoryChart {...baseProps} width={1200} status="on_track" />
      )
      expect(screen.getAllByTestId('goal-trajectory-chart-week-label')).toHaveLength(weeks.length)
      unmount()
      render(
        <GoalTrajectoryChart {...baseProps} width={1200} status="on_track" showWeekLabels={false} />
      )
      expect(screen.queryAllByTestId('goal-trajectory-chart-week-label')).toHaveLength(0)
    })

    it('draws no legend at either density: each rule labels itself on the plane', () => {
      const { unmount } = render(
        <GoalTrajectoryChart {...baseProps} width={1200} status="on_track" />
      )
      expect(screen.queryByTestId('goal-trajectory-chart-legend')).toBeNull()
      expect(screen.getByText('Committed 185')).toBeInTheDocument()
      unmount()
      render(<GoalTrajectoryChart {...baseProps} width={360} status="on_track" />)
      expect(screen.queryByTestId('goal-trajectory-chart-legend')).toBeNull()
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
      render(
        <GoalTrajectoryChart
          {...baseProps}
          actuals={[
            { weekIndex: 1, value: 175 },
            { weekIndex: 3, value: 181, isPR: true },
          ]}
          status="behind"
          unit="lbs"
        />
      )
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

describe('GoalTrajectoryChart next target', () => {
  const nextTarget = { weekIndex: 5, value: 183, label: 'next week: 183 x 8' }

  it('draws a hollow dot and a dashed lead in the status tone', () => {
    render(<GoalTrajectoryChart {...baseProps} status="on_track" nextTarget={nextTarget} />)
    const dot = screen.getByTestId('goal-trajectory-chart-next-target-dot')
    expect(dot.getAttribute('fill')).toBe('none')
    expect(dot.getAttribute('stroke')).toBe(dark['status-success'])
    const lead = screen.getByTestId('goal-trajectory-chart-next-target-lead')
    expect(lead.getAttribute('stroke-dasharray')).toBe('6 5')
  })

  it('carries no label on the plane', () => {
    render(<GoalTrajectoryChart {...baseProps} status="on_track" nextTarget={nextTarget} />)
    expect(screen.queryByText(nextTarget.label)).not.toBeInTheDocument()
  })

  it('opens the label as a tip on hover', () => {
    render(<GoalTrajectoryChart {...baseProps} status="on_track" nextTarget={nextTarget} />)

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Next target' }))

    expect(screen.getByText(nextTarget.label)).toBeInTheDocument()
  })

  it('draws nothing when the caller passes no next target', () => {
    render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
    expect(screen.queryByTestId('goal-trajectory-chart-next-target-dot')).not.toBeInTheDocument()
  })
})

describe('GoalTrajectoryChart goal reach', () => {
  const reaching = (value: number): GoalActualPoint[] => [
    { weekIndex: 1, value: 175 },
    { weekIndex: 2, value },
  ]

  function lineStroke(): string | null {
    return screen.getByTestId('goal-trajectory-chart-actual-line').getAttribute('stroke')
  }

  function summary(): string {
    return screen.getByTestId('goal-trajectory-chart-canvas').getAttribute('aria-label') ?? ''
  }

  it('turns the line blue once a reading beats the committed target', () => {
    render(<GoalTrajectoryChart {...baseProps} actuals={reaching(190)} status="behind" />)
    expect(lineStroke()).toBe(dark['status-info'])
    expect(summary()).toContain('Status: Beyond goal')
  })

  it('keeps success green for a reading exactly on the target', () => {
    render(<GoalTrajectoryChart {...baseProps} actuals={reaching(185)} status="behind" />)
    expect(lineStroke()).toBe(dark['status-success'])
    expect(summary()).toContain('Status: Goal met')
  })

  it('reports pace while every reading is short of the target', () => {
    render(<GoalTrajectoryChart {...baseProps} actuals={reaching(180)} status="behind" />)
    expect(lineStroke()).toBe(dark['status-warning'])
    expect(summary()).toContain('Status: Behind')
  })

  it('judges a loss goal by its lowest reading', () => {
    const cut = [
      { weekIndex: 1, value: 190 },
      { weekIndex: 2, value: 179 },
    ]
    expect(trajectoryReach(180, cut, 'down')).toBe('beyond')
    expect(trajectoryReach(180, cut.slice(0, 1), 'down')).toBe('short')
  })
})

describe('GoalTrajectoryChart outcome statuses', () => {
  const shortOfIt: GoalActualPoint[] = [
    { weekIndex: 1, value: 175 },
    { weekIndex: 2, value: 178 },
  ]

  function lineStrokeFor(status: GoalTrajectoryStatus): string | null {
    const { unmount } = render(
      <GoalTrajectoryChart {...baseProps} actuals={shortOfIt} status={status} />
    )
    const stroke = screen.getByTestId('goal-trajectory-chart-actual-line').getAttribute('stroke')
    unmount()
    return stroke
  }

  it('paints goal_met success green and beyond_goal the ahead blue', () => {
    expect(lineStrokeFor('goal_met')).toBe(dark['status-success'])
    expect(lineStrokeFor('beyond_goal')).toBe(dark['status-info'])
  })

  it('names them in the accessible summary', () => {
    const summaryFor = (status: GoalTrajectoryStatus) => {
      const { unmount } = render(
        <GoalTrajectoryChart {...baseProps} actuals={shortOfIt} status={status} />
      )
      const label =
        screen.getByTestId('goal-trajectory-chart-canvas').getAttribute('aria-label') ?? ''
      unmount()
      return label
    }
    expect(summaryFor('goal_met')).toContain('Status: Goal met')
    expect(summaryFor('beyond_goal')).toContain('Status: Beyond goal')
  })

  it('believes the read model over its own comparison', () => {
    // Every reading is short of the committed target, and the status still wins.
    expect(outcomeReach('goal_met')).toBe('met')
    expect(outcomeReach('beyond_goal')).toBe('beyond')
    expect(outcomeReach('behind')).toBeNull()
    expect(trajectoryReach(baseProps.committed, shortOfIt)).toBe('short')
    expect(lineStrokeFor('goal_met')).toBe(dark['status-success'])
  })
})
