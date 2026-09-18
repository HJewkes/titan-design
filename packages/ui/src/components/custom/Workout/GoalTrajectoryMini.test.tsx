import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { getSemanticColors } from '../../../theme/tokens/semantic'
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
  MINI_INSETS,
  MINI_PLANE_TOP,
  miniGeometryInput,
  miniWeekAxis,
  tickSpan,
  withPlaneTop,
  type GoalTrajectoryMiniData,
  type MiniTrajectoryVariant,
} from './GoalTrajectoryMini'
import { GoalWeekColumnsChart, cellReadingText, cellsRowTop } from './GoalWeekColumnsChart'

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

const VARIANTS: MiniTrajectoryVariant[] = ['plane', 'cells', 'cells-ticks', 'cells-inset']

function renderMini(
  variant: MiniTrajectoryVariant,
  overrides: Partial<GoalTrajectoryMiniData> = {}
) {
  return render(
    <GoalTrajectoryMini
      {...data}
      {...overrides}
      status="on_track"
      variant={variant}
      width={400}
      height={64}
      currentWeek={4}
      animate={false}
    />
  )
}

describe('shared geometry insets', () => {
  it('keeps the axis-bearing gutters when no insets are passed', () => {
    const input = miniGeometryInput(data, 'plane', 400, 64)
    delete input.insets
    const g = deriveTrajectoryGeometry(input)
    expect(g.plot.left).toBe(DEFAULT_PLOT_INSETS.left)
    expect(g.plot.right).toBe(400 - DEFAULT_PLOT_INSETS.right)
  })

  it('runs the compact plot edge to edge with its floor one pixel off the canvas bottom', () => {
    const g = deriveTrajectoryGeometry(miniGeometryInput(data, 'plane', 400, 64))
    expect(g.plot).toEqual({ left: 0, right: 400, top: MINI_INSETS.top, bottom: 63 })
  })

  it('places the week strip on the same columns the chart plots on', () => {
    const g = deriveTrajectoryGeometry(miniGeometryInput(data, 'cells', 400, 64))
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

  it('lowers the plot for cells-inset but keeps its plane starting where the others do', () => {
    const plane = withPlaneTop(deriveTrajectoryGeometry(miniGeometryInput(data, 'plane', 400, 74)))
    const inset = withPlaneTop(
      deriveTrajectoryGeometry(miniGeometryInput(data, 'cells-inset', 400, 74))
    )
    expect(inset.plot.top).toBeGreaterThan(plane.plot.top)
    expect(inset.plane.y).toBe(MINI_PLANE_TOP)
    expect(plane.plane.y).toBe(MINI_PLANE_TOP)
    expect(inset.plane.y + inset.plane.height).toBe(inset.plot.bottom)
  })
})

describe('GoalTrajectoryMini', () => {
  it('draws the line, a dot per reading, the PR star and the next target in every variant', () => {
    VARIANTS.forEach((variant) => {
      const { unmount } = renderMini(variant)
      expect(screen.getByTestId('goal-trajectory-mini-line')).toBeTruthy()
      expect(screen.getAllByTestId('goal-trajectory-mini-dot')).toHaveLength(3)
      expect(screen.getByTestId('goal-trajectory-mini-pr-star')).toBeTruthy()
      expect(screen.getByTestId('goal-trajectory-mini-next-target')).toBeTruthy()
      unmount()
    })
  })

  it('lights the current week column only in the cells variants', () => {
    VARIANTS.forEach((variant) => {
      const { unmount } = renderMini(variant)
      const lit = screen.queryByTestId('goal-trajectory-mini-current-week') !== null
      expect(lit).toBe(variant !== 'plane')
      unmount()
    })
  })

  it('recesses the line in the cells variants so the points lead', () => {
    renderMini('cells')
    const stroke = screen.getByTestId('goal-trajectory-mini-line').getAttribute('stroke')
    expect(stroke).not.toBe(dark['status-success'])
    expect(stroke).toMatch(/^rgba\(/)
  })

  it('ticks every reading and the next target only in cells-ticks', () => {
    renderMini('cells-ticks')
    expect(screen.getAllByTestId('goal-trajectory-mini-tick')).toHaveLength(5)
  })

  it('draws no ticks outside cells-ticks', () => {
    renderMini('cells')
    expect(screen.queryByTestId('goal-trajectory-mini-tick')).toBeNull()
  })

  it('stops a tick short of its mark, and drops one with no room to run', () => {
    expect(tickSpan(2, 40)).toEqual({ y1: 2, y2: 35 })
    expect(tickSpan(2, 6)).toBeNull()
  })

  it('paints a reading past the committed target in the beyond-goal blue', () => {
    renderMini('plane', { actuals: [...actuals, { weekIndex: 5, value: 105 }] })
    expect(screen.getByTestId('goal-trajectory-mini-line').getAttribute('stroke')).toBe(
      dark['status-info']
    )
  })

  it('paints a reading exactly at the committed target in success green', () => {
    renderMini('plane', { actuals: [...actuals, { weekIndex: 5, value: 102.5 }] })
    expect(screen.getByTestId('goal-trajectory-mini-line').getAttribute('stroke')).toBe(
      dark['status-success']
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = renderMini('cells')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('GoalWeekColumnsChart', () => {
  it('stands the cells row on the plane top edge, or inside the plane for cells-inset', () => {
    expect(cellsRowTop('cells') + 8).toBe(MINI_PLANE_TOP)
    expect(cellsRowTop('cells-inset')).toBeGreaterThan(MINI_PLANE_TOP)
  })

  it('renders one cell per week over the chart', () => {
    render(
      <GoalWeekColumnsChart
        {...data}
        variant="cells"
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
        variant="cells-inset"
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
  it('anchors the rule labels at the right edge by default', () => {
    render(<GoalTrajectoryChart {...chartProps} />)
    const label = screen.getByTestId('goal-trajectory-chart-committed-label')
    expect(label.getAttribute('text-anchor')).toBe('end')
    expect(label.getAttribute('x')).toBe(String(1200 - DEFAULT_PLOT_INSETS.right))
  })

  it('anchors both rule labels just inside the left edge when asked', () => {
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
