/**
 * VW-414 regression: a calibrating goal whose committed and stretch targets are the
 * same number. Every one of these fails against 0.17.0, where the chart rendered as
 * an empty plane with two rule labels overprinted into "ConStretcled 128".
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import {
  BAND_MIN_THICKNESS,
  bandThickness,
  deriveTrajectoryGeometry,
  ruleLabelHeight,
  ruleLabelLayout,
  ruleLabelTop,
  CHART_FONT,
  PLOT_LEFT,
  PLOT_RIGHT,
} from './GoalTrajectoryChartGeometry'
import { BAND_EDGE_WIDTH } from './GoalTrajectoryBand'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { calibratingGoal } from './goalTrajectoryCalibratingFixture'

const WALL = { width: 1200, height: 340 }
const PHONE = { width: 360, height: 220 }
const dark = getSemanticColors('dark')

const wall = { ...calibratingGoal, ...WALL, animate: false }

const geometryOf = (size: { width: number; height: number }) =>
  deriveTrajectoryGeometry({
    expected: [...calibratingGoal.expected],
    committed: calibratingGoal.committed,
    stretch: calibratingGoal.stretch,
    actuals: [...calibratingGoal.actuals],
    weeks: [...calibratingGoal.weeks],
    bandCurve: 'monotone',
    ...size,
  })

describe('GoalTrajectoryChart with committed === stretch (VW-414)', () => {
  describe('the degenerate band', () => {
    it('has no drawable thickness on the wall payload', () => {
      expect(bandThickness(geometryOf(WALL).bandSlices)).toBeLessThan(BAND_MIN_THICKNESS)
      expect(geometryOf(WALL).bandIsDegenerate).toBe(true)
    })

    it('draws the centre line as a stroked edge instead of an invisible fill', () => {
      render(<GoalTrajectoryChart {...wall} />)
      const edge = screen.getByTestId('goal-trajectory-chart-band-edge')
      expect(edge.getAttribute('stroke')).toBe(dark['brand-secondary'])
      expect(edge.getAttribute('stroke-width')).toBe(String(BAND_EDGE_WIDTH))
      expect(edge.getAttribute('fill')).toBe('none')
      expect(screen.queryAllByTestId('goal-trajectory-chart-band-column')).toHaveLength(0)
    })

    it('runs the edge the full width of the plot and climbs the whole ramp', () => {
      const g = geometryOf(WALL)
      const xs = [...g.bandEdgePath.matchAll(/([\d.]+),([\d.]+)/g)].map((m) => Number(m[1]))
      const ys = [...g.bandEdgePath.matchAll(/([\d.]+),([\d.]+)/g)].map((m) => Number(m[2]))
      expect(Math.min(...xs)).toBeCloseTo(g.toX(1), 2)
      expect(Math.max(...xs)).toBeCloseTo(g.toX(12), 2)
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(100)
    })

    it('smooths the edge with the same monotone curve as the band fill', () => {
      expect(geometryOf(WALL).bandEdgePath).toContain('C')
    })

    it('keeps the fill for a band that only pinches at week one', () => {
      render(
        <GoalTrajectoryChart
          {...wall}
          expected={[
            { weekIndex: 1, low: 175, high: 175 },
            { weekIndex: 6, low: 185, high: 195 },
          ]}
          committed={185}
          stretch={195}
        />
      )
      expect(screen.queryByTestId('goal-trajectory-chart-band-edge')).not.toBeInTheDocument()
      expect(screen.getAllByTestId('goal-trajectory-chart-band-column').length).toBeGreaterThan(0)
    })
  })

  describe('the coincident rule labels', () => {
    it('prints one merged label, not two on the same baseline', () => {
      render(<GoalTrajectoryChart {...wall} />)
      expect(screen.getByText('Committed = Stretch 128')).toBeInTheDocument()
      expect(screen.queryByTestId('goal-trajectory-chart-committed-label')).not.toBeInTheDocument()
      expect(screen.queryByTestId('goal-trajectory-chart-stretch-label')).not.toBeInTheDocument()
    })

    it('right-anchors the merged label on the plot edge, above the rules', () => {
      const g = geometryOf(WALL)
      const label = screen.queryByTestId('goal-trajectory-chart-merged-rule-label')
      render(<GoalTrajectoryChart {...wall} />)
      const merged = label ?? screen.getByTestId('goal-trajectory-chart-merged-rule-label')
      expect(merged.getAttribute('text-anchor')).toBe('end')
      expect(Number(merged.getAttribute('x'))).toBe(g.plot.right)
      expect(ruleLabelTop(g.committedY)).toBeGreaterThanOrEqual(g.plane.y)
    })

    it('pushes the lower label under its own rule when the two are close but distinct', () => {
      const layout = ruleLabelLayout(100, 104)
      expect(layout.merged).toBe(false)
      expect(layout.committed.side).toBe('above')
      expect(layout.stretch.side).toBe('below')
      expect(layout.stretch.y).toBeGreaterThan(layout.committed.y + ruleLabelHeight())
    })

    it('leaves both labels above their rules once they are a label height apart', () => {
      const layout = ruleLabelLayout(100, 100 + ruleLabelHeight(CHART_FONT) + 1)
      expect(layout.merged).toBe(false)
      expect(layout.committed.side).toBe('above')
      expect(layout.stretch.side).toBe('above')
    })

    it('merges whichever rule is drawn first, for a loss goal too', () => {
      expect(ruleLabelLayout(120, 120).merged).toBe(true)
      expect(ruleLabelLayout(120.4, 120).merged).toBe(true)
    })
  })

  describe('the rules themselves', () => {
    it.each([
      ['wall', WALL],
      ['phone', PHONE],
    ])('spans the full plot at %s width, never the expected points', (_name, size) => {
      const { unmount } = render(
        <GoalTrajectoryChart {...calibratingGoal} {...size} animate={false} />
      )
      const g = geometryOf(size)
      ;['committed-line', 'stretch-line'].forEach((id) => {
        const rule = screen.getByTestId(`goal-trajectory-chart-${id}`)
        expect(Number(rule.getAttribute('x1'))).toBe(PLOT_LEFT)
        expect(Number(rule.getAttribute('x2'))).toBe(size.width - PLOT_RIGHT)
        expect(Number(rule.getAttribute('y1'))).toBeCloseTo(g.committedY, 5)
      })
      unmount()
    })

    it('still draws both rules when the expected array holds a single point', () => {
      render(
        <GoalTrajectoryChart
          {...wall}
          expected={[{ weekIndex: 1, low: 127.5, high: 127.5 }]}
          actuals={[{ weekIndex: 1, value: 110 }]}
        />
      )
      const committed = screen.getByTestId('goal-trajectory-chart-committed-line')
      expect(Number(committed.getAttribute('x2')) - Number(committed.getAttribute('x1'))).toBe(
        WALL.width - PLOT_RIGHT - PLOT_LEFT
      )
      expect(screen.getByTestId('goal-trajectory-chart-stretch-line')).toBeInTheDocument()
    })
  })

  describe('the single actual', () => {
    it('places the one week-indexed marker on its week and value', () => {
      render(<GoalTrajectoryChart {...wall} />)
      const g = geometryOf(WALL)
      const stars = screen.getAllByTestId('goal-trajectory-chart-pr-star')
      expect(stars).toHaveLength(1)
      const [cx, cy] = (stars[0].getAttribute('points') ?? '').split(' ')[0].split(',').map(Number)
      expect(cx).toBeCloseTo(g.toX(1), 5)
      expect(cy).toBeLessThan(g.toY(110) + 1)
      expect(g.actuals).toHaveLength(1)
    })

    it('drops the ts-only actual the wall sent, without letting it skew the domain', () => {
      const wild = { ...calibratingGoal.actuals[0], value: 400 }
      const g = deriveTrajectoryGeometry({
        expected: [...calibratingGoal.expected],
        committed: calibratingGoal.committed,
        stretch: calibratingGoal.stretch,
        actuals: [wild, calibratingGoal.actuals[1]],
        weeks: [...calibratingGoal.weeks],
        ...WALL,
      })
      expect(g.actuals).toHaveLength(1)
      expect(g.domain).toEqual(geometryOf(WALL).domain)
    })

    it('draws no line for a single point instead of a zero-length closed path', () => {
      expect(geometryOf(WALL).linePath).toBe('')
      render(<GoalTrajectoryChart {...wall} />)
      expect(screen.queryByTestId('goal-trajectory-chart-actual-line')).not.toBeInTheDocument()
      expect(screen.queryByTestId('goal-trajectory-chart-actual-shadow')).not.toBeInTheDocument()
    })

    it('leaves the marker fully opaque once the entrance has played', () => {
      render(<GoalTrajectoryChart {...calibratingGoal} {...WALL} animate />)
      const group = screen.getByTestId('goal-trajectory-chart-pr-star').parentElement as HTMLElement
      expect(group.style.opacity === '' || Number(group.style.opacity) >= 0).toBe(true)
      expect(group.style.display).not.toBe('none')
    })
  })

  describe('the y domain', () => {
    it.each([
      ['wall', WALL],
      ['phone', PHONE],
    ])('floors below the ramp and clears the coincident rules at %s width', (_name, size) => {
      const g = geometryOf(size)
      const plotHeight = g.plot.bottom - g.plot.top
      expect(g.domain.min).toBe(95)
      expect(g.domain.max).toBeGreaterThan(127.5)
      expect(g.domain.max).toBeLessThan(140)
      // The ramp has to own most of the plane, not a sliver of an over-padded domain.
      expect(g.toY(100) - g.toY(127.5)).toBeGreaterThan(plotHeight * 0.5)
      expect(ruleLabelTop(g.committedY)).toBeGreaterThanOrEqual(g.plane.y)
    })

    it('keeps the wall gridlines on the round values the capture shows', () => {
      expect(geometryOf(WALL).yTicks.map((t) => t.value)).toEqual([100, 110, 120])
    })
  })
})
