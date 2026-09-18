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
  miniGeometryInput,
  miniRuleLabelYs,
  weekDividerXs,
  miniWeekAxis,
  type GoalTrajectoryMiniData,
  type MiniTrajectoryVariant,
} from './GoalTrajectoryMini'

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
  stretch: 110,
  goalWeek: 8,
  nextTarget: { weekIndex: 5, value: 102.5, label: 'next week: 102.5 x 8' },
}

const VARIANTS: MiniTrajectoryVariant[] = ['plane', 'plane-rules', 'on-card', 'week-columns']

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
    const g = deriveTrajectoryGeometry(miniGeometryInput(data, 'week-columns', 400, 64))
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

  it('leaves an undrawn stretch rule out of the value range', () => {
    const plane = deriveTrajectoryGeometry(miniGeometryInput(data, 'plane', 400, 64))
    const rules = deriveTrajectoryGeometry(miniGeometryInput(data, 'plane-rules', 400, 64))
    expect(plane.domain.max).toBeLessThan(110)
    expect(rules.domain.max).toBeGreaterThanOrEqual(110)
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

  it('drops the plane only for the on-card variant', () => {
    VARIANTS.forEach((variant) => {
      const { unmount } = renderMini(variant)
      expect(screen.queryByTestId('goal-trajectory-mini-plane') !== null).toBe(
        variant !== 'on-card'
      )
      unmount()
    })
  })

  it('labels both rules on the left only in the plane-rules variant', () => {
    renderMini('plane-rules')
    const committed = screen.getByTestId('goal-trajectory-mini-committed-label')
    expect(committed.textContent).toBe('102.5')
    expect(committed.getAttribute('text-anchor')).toBe('start')
    expect(screen.getByTestId('goal-trajectory-mini-stretch-label').textContent).toBe('110')
  })

  it('keeps both labels above their rules when the rules sit well apart', () => {
    const ys = miniRuleLabelYs(40, 10)
    expect(ys.committed).toBeLessThan(40)
    expect(ys.stretch).toBeLessThan(10)
  })

  it('drops the lower label under its rule when the upper rule would strike it', () => {
    const ys = miniRuleLabelYs(30, 22)
    expect(ys.committed).toBeGreaterThan(30)
    expect(ys.stretch).toBeLessThan(22)
  })

  it('drops the stretch label instead when a loss goal puts stretch lower', () => {
    const ys = miniRuleLabelYs(22, 30)
    expect(ys.stretch).toBeGreaterThan(30)
    expect(ys.committed).toBeLessThan(22)
  })

  it('draws no stretch rule and no labels in the plane variant', () => {
    renderMini('plane')
    expect(screen.queryByTestId('goal-trajectory-mini-stretch-line')).toBeNull()
    expect(screen.queryByTestId('goal-trajectory-mini-committed-label')).toBeNull()
  })

  it('tints the current week and rules each column edge only in the week-columns variant', () => {
    renderMini('week-columns')
    expect(screen.getByTestId('goal-trajectory-mini-current-week')).toBeTruthy()
    expect(screen.getAllByTestId('goal-trajectory-mini-week-divider')).toHaveLength(7)
  })

  it('draws no week columns outside the week-columns variant', () => {
    renderMini('plane')
    expect(screen.queryByTestId('goal-trajectory-mini-current-week')).toBeNull()
    expect(screen.queryByTestId('goal-trajectory-mini-week-divider')).toBeNull()
  })

  it('puts each column edge halfway between two week centres', () => {
    expect(weekDividerXs((w) => w * 10, 3)).toEqual([15, 25])
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
    const { container } = renderMini('plane-rules')
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
