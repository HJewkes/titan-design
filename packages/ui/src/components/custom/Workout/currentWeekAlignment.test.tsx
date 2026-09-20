/**
 * The chart's current-week column and the card's week cells come from ONE value
 * (titan-0201 round 4, human: "The highlighted week band doesn't match the current week
 * selector on the week segments, that should be aligned"). What he saw was the DELOAD
 * shading, a fill on another column; the chart had no current-week mark at all.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { GoalCard } from './GoalCard'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const GOAL = S.onTrack.goal!
const DELOAD_WEEK = GOAL.weeks.find((w) => w.isDeload)!.index

function card(currentWeek: number, width: number) {
  return render(
    <GoalCard
      {...S.onTrack}
      chartWidth={width}
      milestone={{ ...S.onTrack.milestone, currentWeek }}
    />
  )
}

const px = (el: Element | null, prop: string) => {
  const found = new RegExp(`(?:^|;)\\s*${prop}:\\s*([-\\d.]+)px`).exec(
    el?.getAttribute('style') ?? ''
  )
  return found ? Number(found[1]) : Number.NaN
}

/** jsdom has no layout, so both centres are read in the chart's own pixels. */
function columnCentre(): number {
  const rect = screen.getByTestId('goal-trajectory-chart-current-week')
  return Number(rect.getAttribute('x')) + Number(rect.getAttribute('width')) / 2
}

/** The cell's centre in the same pixels: the strip is inset to the plot by its marginLeft. */
function cellCentre(week: number): number {
  const strip = screen.getByTestId('goal-milestone-week-strip')
  const cell = screen.getByTestId(`goal-milestone-week-cell-${String(week)}`)
  return px(strip, 'margin-left') + px(cell, 'left') + px(cell, 'width') / 2
}

describe('the current week', () => {
  it.each([
    [2, 360],
    [4, 360],
    [2, 1920],
    [4, 1920],
  ])('marks week %i on the chart and the cells alike at %ipx', (week, width) => {
    const { unmount } = card(week, width)
    expect(columnCentre()).toBeCloseTo(cellCentre(week), 0)
    unmount()
  })

  it('is a different kind of mark from the deload shading, on its own column', () => {
    card(4, 360)
    const outline = screen.getByTestId('goal-trajectory-chart-current-week')
    const deload = screen.getByTestId('goal-trajectory-chart-deload')
    expect(outline.getAttribute('fill')).toBe('none')
    expect(outline.getAttribute('stroke')).toBeTruthy()
    expect(deload.getAttribute('fill')).toMatch(/rgba/)
    expect(deload.getAttribute('stroke')).toBeNull()
    expect(Number(outline.getAttribute('x'))).not.toBeCloseTo(Number(deload.getAttribute('x')), 0)
  })

  it('draws both marks on one column when the current week IS the deload week', () => {
    card(DELOAD_WEEK, 360)
    const outline = screen.getByTestId('goal-trajectory-chart-current-week')
    const deload = screen.getByTestId('goal-trajectory-chart-deload')
    // The outline insets half a pixel so its stroke lands crisp on the deload fill's edge.
    expect(
      Math.abs(Number(outline.getAttribute('x')) - Number(deload.getAttribute('x')))
    ).toBeLessThanOrEqual(1)
    expect(columnCentre()).toBeCloseTo(cellCentre(DELOAD_WEEK), 0)
  })

  it("says both facts in that week's tip", () => {
    card(DELOAD_WEEK, 360)
    const label =
      screen
        .getByTestId(`goal-trajectory-chart-week-target-${DELOAD_WEEK}`)
        .getAttribute('aria-label') ?? ''
    expect(label).toContain('Deload week')
    expect(label).toContain('Current week')
  })

  it('marks no column when no current week is given', () => {
    render(<GoalTrajectoryChart {...GOAL} width={360} height={220} status="on_track" />)
    expect(screen.queryByTestId('goal-trajectory-chart-current-week')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { container } = card(4, 360)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('warns in development when the current week is not a week of the block', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    card(99, 360)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not a week of this block'))
    warn.mockRestore()
  })

  it('stays silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    card(98, 360)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    vi.unstubAllEnvs()
  })
})
