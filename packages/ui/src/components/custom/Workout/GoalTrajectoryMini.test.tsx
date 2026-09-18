import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import {
  DEFAULT_PLOT_INSETS,
  deriveTrajectoryGeometry,
  trajectoryWeekScale,
  type GoalActualPoint,
} from './GoalTrajectoryChartGeometry'
import { LEFT_LABEL_INSET } from './GoalTrajectoryPlot'
import {
  GoalTrajectoryMini,
  MINI_CELL_HEIGHT,
  MINI_INSETS,
  MINI_PLANE_TOP,
  WEEK_COLUMN,
  miniGeometryInput,
  miniWeekAxis,
  type GoalTrajectoryMiniData,
} from './GoalTrajectoryMini'
import { CELLS_ROW_TOP, GoalWeekColumnsChart, cellReadingText } from './GoalWeekColumnsChart'

const dark = getSemanticColors('dark')

const actuals: GoalActualPoint[] = [
  { weekIndex: 1, value: 92.5 },
  { weekIndex: 2, value: 95 },
  { weekIndex: 3, value: 97.5, isPR: true },
  { weekIndex: 4, value: 100 },
]

const data: GoalTrajectoryMiniData = {
  actuals,
  committed: 102.5,
  goalWeek: 8,
  nextTarget: { weekIndex: 5, value: 102.5, label: 'next week: 102.5 x 8' },
}

function renderMini(overrides: Partial<GoalTrajectoryMiniData> = {}) {
  return render(
    <GoalTrajectoryMini
      {...data}
      {...overrides}
      status="on_track"
      width={400}
      height={64}
      currentWeek={4}
      animate={false}
    />
  )
}

describe('shared geometry insets', () => {
  it('keeps the axis-bearing gutters when no insets are passed', () => {
    const input = miniGeometryInput(data, 400, 64)
    delete input.insets
    const g = deriveTrajectoryGeometry(input)
    expect(g.plot.left).toBe(DEFAULT_PLOT_INSETS.left)
    expect(g.plot.right).toBe(400 - DEFAULT_PLOT_INSETS.right)
  })

  it('runs the compact plot edge to edge with its floor one pixel off the canvas bottom', () => {
    const g = deriveTrajectoryGeometry(miniGeometryInput(data, 400, 64))
    expect(g.plot).toEqual({ left: 0, right: 400, top: MINI_INSETS.top, bottom: 63 })
  })

  it('places the week strip on the same columns the chart plots on', () => {
    const g = deriveTrajectoryGeometry(miniGeometryInput(data, 400, 64))
    const axis = miniWeekAxis(data, 400)
    ;[1, 4, 8].forEach((week) => expect(axis.x(week)).toBeCloseTo(g.toX(week)))
    expect(axis.span).toBeCloseTo(g.toX(2) - g.toX(1))
  })

  it('shifts the week scale by the insets it is given', () => {
    const input = { expected: [], weeks: [{ index: 1 }, { index: 8 }], actuals: [], width: 400 }
    const wide = trajectoryWeekScale(input)
    const flush = trajectoryWeekScale({ ...input, insets: MINI_INSETS })
    expect(flush.plot.left).toBe(0)
    expect(flush.toX(1)).toBeLessThan(wide.toX(1))
  })

  it('starts the plane where the cells row expects to stand on it', () => {
    const g = deriveTrajectoryGeometry(miniGeometryInput(data, 400, 74))
    expect(g.plane.y).toBe(MINI_PLANE_TOP)
    expect(g.plane.y + g.plane.height).toBe(g.plot.bottom)
  })
})

describe('GoalTrajectoryMini', () => {
  it('draws the line, a dot per reading, the PR star and the next target', () => {
    renderMini()
    expect(screen.getByTestId('goal-trajectory-mini-line')).toBeTruthy()
    expect(screen.getAllByTestId('goal-trajectory-mini-dot')).toHaveLength(3)
    expect(screen.getByTestId('goal-trajectory-mini-pr-star')).toBeTruthy()
    expect(screen.getByTestId('goal-trajectory-mini-next-target')).toBeTruthy()
  })

  it('lights the current week column behind the line', () => {
    renderMini()
    expect(screen.getByTestId('goal-trajectory-mini-current-week')).toBeTruthy()
  })

  it('leaves it dark when no week is current', () => {
    render(
      <GoalTrajectoryMini {...data} status="on_track" width={400} height={64} animate={false} />
    )
    expect(screen.queryByTestId('goal-trajectory-mini-current-week')).toBeNull()
  })

  it('recesses the line so the points lead, and gives it no shadow', () => {
    renderMini()
    const stroke = screen.getByTestId('goal-trajectory-mini-line').getAttribute('stroke')
    expect(stroke).not.toBe(dark['status-success'])
    expect(stroke).toMatch(/^rgba\(/)
    expect(screen.queryByTestId('goal-trajectory-mini-shadow')).toBeNull()
  })

  it('draws no point ticks: the cells above are the labelling', () => {
    renderMini()
    expect(screen.queryByTestId('goal-trajectory-mini-tick')).toBeNull()
  })

  it('paints a reading past the committed target in the beyond-goal blue', () => {
    renderMini({ actuals: [...actuals, { weekIndex: 5, value: 105 }] })
    expect(screen.getByTestId('goal-trajectory-mini-line').getAttribute('stroke')).toBe(
      alpha(dark['status-info'], WEEK_COLUMN.lineAlpha)
    )
  })

  it('paints a reading exactly at the committed target in success green', () => {
    renderMini({ actuals: [...actuals, { weekIndex: 5, value: 102.5 }] })
    expect(screen.getByTestId('goal-trajectory-mini-line').getAttribute('stroke')).toBe(
      alpha(dark['status-success'], WEEK_COLUMN.lineAlpha)
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = renderMini()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('GoalWeekColumnsChart', () => {
  it('stands the cells row on the plane top edge', () => {
    expect(CELLS_ROW_TOP + MINI_CELL_HEIGHT).toBe(MINI_PLANE_TOP)
  })

  it('renders one cell per week over the chart', () => {
    render(
      <GoalWeekColumnsChart
        {...data}
        status="on_track"
        width={400}
        height={64}
        currentWeek={5}
        animate={false}
      />
    )
    expect(screen.getAllByTestId(/^goal-milestone-week-cell-/)).toHaveLength(8)
    expect(screen.getByTestId('goal-trajectory-mini')).toBeTruthy()
  })

  it('writes a week tip as reps x load, and nothing for a week without a set', () => {
    expect(cellReadingText({ outcome: 'on_track', reading: { reps: 8, load: 100 } }, 'lb')).toBe(
      '8 x 100 lb'
    )
    expect(cellReadingText({ outcome: 'none' }, 'lb')).toBe('')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GoalWeekColumnsChart
        {...data}
        status="on_track"
        width={400}
        height={74}
        currentWeek={5}
        animate={false}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

const chartProps = {
  expected: [
    { weekIndex: 1, low: 175, high: 175 },
    { weekIndex: 6, low: 185, high: 195 },
  ],
  committed: 185,
  stretch: 195,
  actuals: [
    { weekIndex: 1, value: 175 },
    { weekIndex: 3, value: 180 },
  ],
  weeks: [{ index: 1 }, { index: 6 }],
  status: 'on_track' as const,
  width: 1200,
  height: 340,
  animate: false,
}

describe('GoalTrajectoryChart referenceLabelSide', () => {
  it('anchors the rule labels just inside the LEFT edge by default', () => {
    // The human's call (VW-385 round 6): a goal that is going well ends its line
    // at the right edge, under the labels that used to anchor there.
    render(<GoalTrajectoryChart {...chartProps} />)
    ;['committed-label', 'stretch-label'].forEach((id) => {
      const label = screen.getByTestId(`goal-trajectory-chart-${id}`)
      expect(label.getAttribute('text-anchor')).toBe('start')
      expect(label.getAttribute('x')).toBe(String(DEFAULT_PLOT_INSETS.left + LEFT_LABEL_INSET))
    })
  })

  it('anchors them at the right edge when asked', () => {
    render(<GoalTrajectoryChart {...chartProps} referenceLabelSide="right" />)
    const label = screen.getByTestId('goal-trajectory-chart-committed-label')
    expect(label.getAttribute('text-anchor')).toBe('end')
    expect(label.getAttribute('x')).toBe(String(1200 - DEFAULT_PLOT_INSETS.right))
  })

  it('keeps both rule labels together on the left', () => {
    render(<GoalTrajectoryChart {...chartProps} referenceLabelSide="left" />)
    ;['committed-label', 'stretch-label'].forEach((id) => {
      const label = screen.getByTestId(`goal-trajectory-chart-${id}`)
      expect(label.getAttribute('text-anchor')).toBe('start')
      expect(label.getAttribute('x')).toBe(String(DEFAULT_PLOT_INSETS.left + LEFT_LABEL_INSET))
    })
  })

  it('anchors the merged calibrating label on the left too', () => {
    render(<GoalTrajectoryChart {...chartProps} stretch={185} referenceLabelSide="left" />)
    const merged = screen.getByTestId('goal-trajectory-chart-merged-rule-label')
    expect(merged.getAttribute('text-anchor')).toBe('start')
  })
})
