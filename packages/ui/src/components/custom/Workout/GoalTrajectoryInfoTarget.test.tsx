/**
 * The calibrating info target (titan-0201 round 1): lower-right corner of the plot,
 * never over a data mark, at least 24px to hit (44px on touch), and a tip that fits
 * between the chart's left edge and the target.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import {
  CALIBRATING_TIP_LABEL,
  INFO_TARGET_POINTER,
  INFO_TARGET_TOUCH,
  calibratingMarks,
  calibratingTipWidth,
  infoTargetSize,
} from './GoalTrajectoryCalibrating'
import {
  deriveTrajectoryGeometry,
  type GeometryPoint,
  type GoalTrajectoryGeometry,
} from './GoalTrajectoryChartGeometry'
import { calibratingGoalAt } from './goalTrajectoryCalibratingFixture'

const SIZES = [
  { width: 1920, height: 340 },
  { width: 360, height: 220 },
  { width: 320, height: 220 },
]

/** An 8-week ramp from 100 with readings every week up to `latestWeek`, `value` lb each. */
function goalWithLatest(latestWeek: number, value: number) {
  const expected = Array.from({ length: 8 }, (_, i) => ({
    weekIndex: i + 1,
    low: 100 + i * 2.5,
    high: 100 + i * 2.5,
  }))
  return {
    ...calibratingGoalAt('start'),
    expected,
    weeks: expected.map((e) => ({ index: e.weekIndex })),
    committed: 117.5,
    stretch: 117.5,
    actuals: Array.from({ length: latestWeek }, (_, i) => ({ weekIndex: i + 1, value })),
    nextTarget:
      latestWeek < 8
        ? { weekIndex: latestWeek + 1, value: 100 + latestWeek * 2.5, label: 'next' }
        : undefined,
  }
}

function distanceToBox(box: { x: number; y: number; size: number }, p: GeometryPoint) {
  const dx = Math.max(box.x - p.x, 0, p.x - (box.x + box.size))
  const dy = Math.max(box.y - p.y, 0, p.y - (box.y + box.size))
  return Math.hypot(dx, dy)
}

/** Every drawn mark as points: dots, and the reading line and ramp sampled every pixel or so. */
function markPoints(g: GoalTrajectoryGeometry) {
  const sample = (pts: GeometryPoint[]) =>
    pts.flatMap((a, i) => {
      const b = pts[i + 1]
      if (!b) return [a]
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y))
      return Array.from({ length: n }, (_, s) => ({
        x: a.x + ((b.x - a.x) * s) / n,
        y: a.y + ((b.y - a.y) * s) / n,
      }))
    })
  const dots = g.nextTarget ? [...g.actuals, g.nextTarget] : g.actuals
  return { dots, lines: [...sample(g.actuals), ...sample(g.bandPolygon)] }
}

describe('the info target', () => {
  it.each(SIZES)('sits in the lower-right corner of an early goal at $width', (size) => {
    const g = deriveTrajectoryGeometry({ ...calibratingGoalAt('above'), ...size })
    const { target } = calibratingMarks({ geometry: g, targetSize: INFO_TARGET_POINTER })
    expect(target.corner).toBe('bottom-right')
    expect(target.x + target.size).toBeLessThanOrEqual(g.plot.right)
    expect(target.y + target.size).toBeLessThanOrEqual(g.plot.bottom)
  })

  describe.each(SIZES)('walking the latest reading through the block at $width', (size) => {
    it.each([
      [INFO_TARGET_POINTER, 90],
      [INFO_TARGET_POINTER, 100],
      [INFO_TARGET_POINTER, 118],
      [INFO_TARGET_TOUCH, 90],
      [INFO_TARGET_TOUCH, 100],
      [INFO_TARGET_TOUCH, 118],
    ])('a %ipx target never covers a mark (readings at %i lb)', (targetSize, value) => {
      for (let week = 1; week <= 8; week++) {
        const g = deriveTrajectoryGeometry({ ...goalWithLatest(week, value), ...size })
        const { target } = calibratingMarks({ geometry: g, targetSize })
        const { dots, lines } = markPoints(g)
        for (const p of dots) expect(distanceToBox(target, p)).toBeGreaterThanOrEqual(6)
        for (const p of lines) expect(distanceToBox(target, p)).toBeGreaterThanOrEqual(2)
      }
    })
  })

  // A fake plot with its lower-right and upper-right corners reachable by one mark each.
  function fakeGeometry(actuals: GeometryPoint[]): GoalTrajectoryGeometry {
    return {
      plot: { left: 0, right: 400, top: 0, bottom: 200 },
      toX: (week: number) => week * 40,
      actuals,
      nextTarget: null,
      bandPolygon: [],
    } as unknown as GoalTrajectoryGeometry
  }

  it('moves to the upper-right corner when a reading sits in the lower-right one', () => {
    const geometry = fakeGeometry([{ x: 380, y: 185 }])
    expect(calibratingMarks({ geometry, targetSize: 24 }).target.corner).toBe('top-right')
  })

  it('hangs under the plot when readings sit in both right corners', () => {
    const geometry = fakeGeometry([
      { x: 380, y: 15 },
      { x: 380, y: 185 },
    ])
    const { target } = calibratingMarks({ geometry, targetSize: 24 })
    expect(target.corner).toBe('below')
    expect(target.y).toBeGreaterThan(200)
  })
})

describe('the hit size', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is 24px under a fine pointer', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(infoTargetSize()).toBe(INFO_TARGET_POINTER)
  })

  it('is 44px when the main pointer is touch', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(infoTargetSize()).toBe(INFO_TARGET_TOUCH)
  })
})

describe('the tip width', () => {
  it.each([60, 296, 1908])(
    'keeps the whole tip right of 8px when the target ends at %ipx',
    (right) => {
      const tip = calibratingTipWidth(right) + 24
      expect(right - tip).toBeGreaterThanOrEqual(Math.min(8, right))
      expect(calibratingTipWidth(right)).toBeLessThanOrEqual(280)
    }
  )
})

describe('the calibrating chart with its target', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <GoalTrajectoryChart {...calibratingGoalAt('above')} width={360} height={220} />
    )
    expect(screen.getByRole('button', { name: CALIBRATING_TIP_LABEL })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
