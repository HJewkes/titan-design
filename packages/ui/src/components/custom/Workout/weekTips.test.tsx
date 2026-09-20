/**
 * Every week of a goal chart opens a tip (titan-0201 round 4, human: "Can we add hover
 * support for the chart for all week indicators (not just next week)"). Hover, keyboard
 * focus and press all open it; the group is one tab stop and the arrows rove between weeks.
 */
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { nextRovingWeek } from './GoalTrajectoryWeekTips'
import { weekTips } from './weekTipModel'
import { deriveTrajectoryGeometry, trajectoryInsets } from './GoalTrajectoryChartGeometry'
import { HIT_TARGET_POINTER } from './goalTrajectoryTargets'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const GOAL = S.onTrack.goal!
const SIZE = { width: 360, height: 220 }
const target = (week: number) => screen.getByTestId(`goal-trajectory-chart-week-target-${week}`)
const tip = (week: number) => screen.queryByTestId(`goal-trajectory-chart-week-tip-${week}`)

function renderChart(extra: object = {}) {
  return render(<GoalTrajectoryChart {...GOAL} {...SIZE} status="on_track" {...extra} />)
}

function model(extra: object = {}) {
  const input = { ...GOAL, ...SIZE, insets: trajectoryInsets(false), ...extra }
  return weekTips({
    geometry: deriveTrajectoryGeometry(input),
    weeks: input.weeks,
    expected: input.expected,
    ...(input.nextTarget ? { nextTarget: input.nextTarget } : {}),
    ...extra,
    unit: 'lb',
    width: SIZE.width,
    height: SIZE.height,
    size: HIT_TARGET_POINTER,
  })
}

describe('a week tip', () => {
  it('gives every week of the block its own target', () => {
    renderChart()
    for (const week of GOAL.weeks.map((w) => w.index)) expect(target(week)).toBeInTheDocument()
  })

  it.each([
    ['hover', (el: HTMLElement) => fireEvent.mouseEnter(el)],
    ['focus', (el: HTMLElement) => fireEvent.focus(el)],
    ['press', (el: HTMLElement) => fireEvent.click(el)],
  ])('opens on %s and closes again', (_, open) => {
    renderChart()
    expect(tip(2)).toBeNull()
    open(target(2))
    expect(tip(2)).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(tip(2)).toBeNull()
  })

  it('says the reading, the plan and the record on a past week', () => {
    const [, week2] = model()
    expect(week2.lines).toContain('178 lb')
    expect(week2.lines.some((l) => l.startsWith('Plan '))).toBe(true)
    expect(model()[2].lines).toContain('Personal record')
  })

  it('says there is no reading yet on a future week', () => {
    const future = model().at(-1)!
    expect(future.lines).toContain('No reading yet')
  })

  it('says "Deload week" on the deload column', () => {
    const deloadWeek = GOAL.weeks.find((w) => w.isDeload)!.index
    const entry = model().find((t) => t.week === deloadWeek)!
    expect(entry.lines).toContain('Deload week')
  })

  it('says "Current week" on the current week', () => {
    expect(model({ currentWeek: 4 }).find((t) => t.week === 4)!.lines).toContain('Current week')
  })

  it("carries the same facts in the target's accessible name", () => {
    renderChart()
    expect(target(4).getAttribute('aria-label')).toMatch(/^Week 4, 184 lb, Plan /)
  })

  it('has no accessibility violations', async () => {
    const { container } = renderChart()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('the week group', () => {
  it('is one tab stop: the active week only', () => {
    renderChart()
    const stops = GOAL.weeks.map((w) => target(w.index).getAttribute('tabindex'))
    expect(stops.filter((t) => t === '0')).toHaveLength(1)
    expect(stops.filter((t) => t === '-1')).toHaveLength(GOAL.weeks.length - 1)
  })

  it('moves the stop with the arrows, Home and End', () => {
    renderChart()
    fireEvent.keyDown(target(1), { key: 'ArrowRight' })
    expect(target(2).getAttribute('tabindex')).toBe('0')
    expect(target(1).getAttribute('tabindex')).toBe('-1')
    fireEvent.keyDown(target(2), { key: 'End' })
    expect(target(GOAL.weeks.at(-1)!.index).getAttribute('tabindex')).toBe('0')
    fireEvent.keyDown(target(GOAL.weeks.at(-1)!.index), { key: 'Home' })
    expect(target(1).getAttribute('tabindex')).toBe('0')
  })

  it.each([
    ['ArrowRight', 1, 6, 2],
    ['ArrowDown', 1, 6, 2],
    ['ArrowLeft', 3, 6, 2],
    ['ArrowUp', 0, 6, 0],
    ['Home', 4, 6, 0],
    ['End', 0, 6, 5],
  ])('%s from %i of %i moves to %i', (key, index, count, expected) => {
    expect(nextRovingWeek(key, index, count)).toBe(expected)
  })

  it('leaves keys it does not own alone', () => {
    expect(nextRovingWeek('Enter', 1, 6)).toBeNull()
    expect(nextRovingWeek('Escape', 1, 6)).toBeNull()
  })

  it('keeps every target inside the chart', () => {
    for (const t of model()) {
      expect(t.box.x).toBeGreaterThanOrEqual(0)
      expect(t.box.x + t.box.size).toBeLessThanOrEqual(SIZE.width)
      expect(t.box.y).toBeGreaterThanOrEqual(0)
      expect(t.box.y + t.box.size).toBeLessThanOrEqual(SIZE.height)
    }
  })
})
