/**
 * The committed and stretch labels (titan-0201 round 2, human: "Lets drop the literal
 * committed / stretch text and just show the numeric labels"). `named` is 0.21's
 * layout; `numeric` places each number clear of the readings, the tip targets and
 * the other label.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { GoalCard } from './GoalCard'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import {
  CHART_FONT,
  LABEL_ASCENT,
  LABEL_DESCENT,
  PLOT_LEFT,
  PLOT_RIGHT,
  deriveTrajectoryGeometry,
  type GeometryPoint,
  type GoalTrajectoryGeometry,
} from './GoalTrajectoryChartGeometry'
import { numericLabelWidth, ruleLabelSpecs, type RuleLabelSpec } from './goalTrajectoryRuleLabels'
import type { HitBox } from './goalTrajectoryTargets'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const GOAL = S.onTrack.goal!
const SIZES = [
  { width: 1920, height: 340 },
  { width: 360, height: 220 },
]

function geometryFor(extra: object, size = SIZES[1]) {
  return deriveTrajectoryGeometry({ ...GOAL, ...extra, ...size })
}

function rectOf(l: RuleLabelSpec) {
  const width = numericLabelWidth(l.text)
  const left = l.anchor === 'start' ? l.x : l.x - width
  return {
    left,
    right: left + width,
    top: l.y - CHART_FONT * LABEL_ASCENT,
    bottom: l.y + CHART_FONT * LABEL_DESCENT,
  }
}

const gap = (r: ReturnType<typeof rectOf>, p: GeometryPoint) =>
  Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom))

function assertClear(g: GoalTrajectoryGeometry, labels: RuleLabelSpec[], boxes: HitBox[]) {
  const rects = labels.map(rectOf)
  const dots = g.nextTarget ? [...g.actuals, g.nextTarget] : g.actuals
  for (const r of rects) {
    for (const p of dots) expect(gap(r, p)).toBeGreaterThanOrEqual(6)
    for (const b of boxes) {
      const apart =
        r.right <= b.x || b.x + b.size <= r.left || r.bottom <= b.y || b.y + b.size <= r.top
      expect(apart).toBe(true)
    }
  }
  if (rects.length === 2) {
    const [a, b] = rects
    const apart = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top
    expect(apart).toBe(true)
  }
}

describe('named labels', () => {
  it("are 0.21's words and places", () => {
    const g = geometryFor({})
    const labels = ruleLabelSpecs({
      geometry: g,
      committed: 185,
      stretch: 195,
      text: 'named',
      side: 'left',
    })
    expect(labels.map((l) => l.text)).toEqual(['Committed 185', 'Stretch 195'])
    expect(labels.every((l) => l.anchor === 'start')).toBe(true)
  })

  it('merge when the rules coincide', () => {
    const g = geometryFor({ committed: 185, stretch: 185 })
    const labels = ruleLabelSpecs({
      geometry: g,
      committed: 185,
      stretch: 185,
      text: 'named',
      side: 'left',
    })
    expect(labels.map((l) => l.text)).toEqual(['Committed = Stretch 185'])
  })
})

describe('numeric labels', () => {
  it('show the numbers only', () => {
    const g = geometryFor({})
    const labels = ruleLabelSpecs({
      geometry: g,
      committed: 185,
      stretch: 195,
      text: 'numeric',
      side: 'left',
    })
    expect(labels.map((l) => l.text)).toEqual(['185', '195'])
  })

  it('show one number when the rules coincide (a hold)', () => {
    const g = geometryFor({ committed: 185, stretch: 185 })
    const labels = ruleLabelSpecs({
      geometry: g,
      committed: 185,
      stretch: 185,
      text: 'numeric',
      side: 'left',
    })
    expect(labels.map((l) => l.text)).toEqual(['185'])
  })

  it('draw nothing for `none`', () => {
    const g = geometryFor({})
    expect(
      ruleLabelSpecs({ geometry: g, committed: 185, stretch: 195, text: 'none', side: 'left' })
    ).toEqual([])
  })

  describe.each(SIZES)('at $width', (size) => {
    it.each([
      ['far apart', 185, 195],
      ['close (slow loss)', 185, 186],
      ['equal (hold)', 185, 185],
    ])('clear the readings, the next target and each other when %s', (_, committed, stretch) => {
      // Readings walked onto the committed rule at the left, where a label starts.
      for (const value of [175, 183, 185, 187]) {
        const actuals = [
          { weekIndex: 1, value },
          { weekIndex: 2, value: committed },
        ]
        const g = geometryFor({ committed, stretch, actuals }, size)
        const labels = ruleLabelSpecs({
          geometry: g,
          committed,
          stretch,
          text: 'numeric',
          side: 'left',
        })
        assertClear(g, labels, [])
      }
    })

    it('clear a tip target sitting where the label would go', () => {
      const g = geometryFor({}, size)
      const first = ruleLabelSpecs({
        geometry: g,
        committed: 185,
        stretch: 195,
        text: 'numeric',
        side: 'left',
      })
      const r = rectOf(first[0])
      const box = { x: r.left - 2, y: r.top - 2, size: 24 }
      const labels = ruleLabelSpecs({
        geometry: g,
        committed: 185,
        stretch: 195,
        text: 'numeric',
        side: 'left',
        boxes: [box],
      })
      assertClear(g, labels, [box])
    })
  })
})

describe('the chart without its y axis', () => {
  it('drops the value labels and takes back their gutter', () => {
    render(
      <GoalTrajectoryChart
        {...GOAL}
        width={360}
        height={220}
        status="on_track"
        yAxisLabels={false}
      />
    )
    expect(screen.queryByTestId('goal-trajectory-chart-y-label')).toBeNull()
    const plane = screen.getByTestId('goal-trajectory-chart-plane')
    expect(Number(plane.getAttribute('x'))).toBeLessThanOrEqual(PLOT_RIGHT)
  })

  it.each([
    [true, PLOT_LEFT],
    [false, PLOT_RIGHT],
  ])("keeps a card's week cells on the plot's columns (y axis %s)", (yAxisLabels, left) => {
    render(<GoalCard {...S.onTrack} chartWidth={360} goal={{ ...GOAL, yAxisLabels }} />)
    expect(screen.getByTestId('goal-milestone-week-strip')).toHaveStyle({ marginLeft: `${left}px` })
  })

  it('keeps the words in the accessible name when the labels are numeric', () => {
    render(
      <GoalTrajectoryChart
        {...GOAL}
        width={360}
        height={220}
        status="on_track"
        ruleLabelText="numeric"
      />
    )
    expect(screen.getByTestId('goal-trajectory-chart-committed-label')).toHaveTextContent(/^185$/)
    expect(screen.getByTestId('goal-trajectory-chart-canvas').getAttribute('aria-label')).toMatch(
      /Committed 185 \w+, stretch 195 \w+/
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GoalTrajectoryChart
        {...GOAL}
        width={360}
        height={220}
        status="on_track"
        yAxisLabels={false}
        ruleLabelText="numeric"
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
