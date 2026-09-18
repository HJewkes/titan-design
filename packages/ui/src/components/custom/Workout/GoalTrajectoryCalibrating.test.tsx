/**
 * VW-433: the calibrating chart the human chose in round 1. Plain dots, the next
 * target as a hollow dot with no dashed run, the ramp dashed, and the weeks after
 * the latest reading hatched with a note the consumer words.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalTrajectoryChart, type GoalTrajectoryStatus } from './GoalTrajectoryChart'
import { DASHED_EDGE } from './GoalTrajectoryBand'
import { DEFAULT_CALIBRATING_NOTE } from './GoalTrajectoryCalibrating'
import { deriveTrajectoryGeometry } from './GoalTrajectoryChartGeometry'
import { calibratingGoalAt, type CalibratingPlacement } from './goalTrajectoryCalibratingFixture'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const WALL = { width: 1200, height: 340 }
const PHONE = { width: 360, height: 220 }
const NEXT = (weekIndex: number) => ({ weekIndex, value: 102.5 + weekIndex, label: 'next' })

function renderAt(placement: CalibratingPlacement, extra: object = {}) {
  const goal = calibratingGoalAt(placement)
  const next = NEXT(goal.actuals.length + 1)
  return render(
    <GoalTrajectoryChart {...goal} {...WALL} nextTarget={next} animate={false} {...extra} />
  )
}

const PLACEMENTS: CalibratingPlacement[] = ['start', 'above', 'on', 'below']

describe('a calibrating goal chart', () => {
  it.each(PLACEMENTS)('draws readings as plain dots, never a PR star (%s)', (placement) => {
    renderAt(placement)
    expect(calibratingGoalAt('start').actuals[0].isPR).toBe(true)
    expect(screen.queryByTestId('goal-trajectory-chart-pr-star')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('goal-trajectory-chart-actual-dot')).toHaveLength(
      calibratingGoalAt(placement).actuals.length
    )
  })

  it.each(PLACEMENTS)('keeps the next target as a hollow dot with no dashed run (%s)', (p) => {
    renderAt(p)
    expect(screen.getByTestId('goal-trajectory-chart-next-target-dot')).toBeInTheDocument()
    expect(screen.queryByTestId('goal-trajectory-chart-next-target-lead')).not.toBeInTheDocument()
  })

  it('dashes the ramp', () => {
    renderAt('above')
    const edge = screen.getByTestId('goal-trajectory-chart-band-edge')
    expect(edge.getAttribute('stroke-dasharray')).toBe(DASHED_EDGE)
  })

  it.each<[CalibratingPlacement, number]>([
    ['start', 1],
    ['above', 2],
  ])('starts the hatch after the last reading week (%s, week %d)', (placement, lastWeek) => {
    renderAt(placement)
    const g = deriveTrajectoryGeometry({ ...calibratingGoalAt(placement), ...WALL })
    const span = g.toX(2) - g.toX(1)
    const hatch = screen.getByTestId('goal-trajectory-chart-calibrating-hatch')
    expect(Number(hatch.getAttribute('x'))).toBeCloseTo(g.toX(lastWeek) + span / 2, 5)
  })

  it('writes the neutral default note, with no session count', () => {
    renderAt('above')
    expect(screen.getByTestId('goal-trajectory-chart-calibrating-note-0')).toHaveTextContent(
      DEFAULT_CALIBRATING_NOTE
    )
    expect(screen.queryByText(/session/i)).not.toBeInTheDocument()
  })

  it('writes the note the consumer supplies', () => {
    renderAt('above', { calibratingNote: 'Calibrating: 1 more session' })
    expect(screen.getByText('Calibrating: 1 more session')).toBeInTheDocument()
  })

  it('names the ramp only when asked to', () => {
    const { unmount } = renderAt('on')
    expect(screen.queryByText('Planned ramp')).not.toBeInTheDocument()
    unmount()
    renderAt('on', { showRampLabel: true })
    expect(screen.getByText('Planned ramp')).toBeInTheDocument()
  })

  it('shortens the note to two lines on a phone', () => {
    const goal = calibratingGoalAt('below')
    render(<GoalTrajectoryChart {...goal} {...PHONE} animate={false} />)
    expect(screen.getAllByTestId(/goal-trajectory-chart-calibrating-note-/)).toHaveLength(2)
  })
})

const OTHER_STATUSES: GoalTrajectoryStatus[] = [
  'on_track',
  'ahead',
  'behind',
  'tolerated',
  'deload_week',
  'stalled',
  'goal_met',
  'beyond_goal',
]

/** Markup with the per-render `useId` suffixes blanked, so two renders can be compared. */
function markup(status: GoalTrajectoryStatus, extra: object = {}): string {
  const { container, unmount } = render(
    <GoalTrajectoryChart {...S.onTrack.goal!} {...WALL} status={status} {...extra} />
  )
  const html = container.innerHTML.replace(/(gtc-[a-z-]+-)[A-Za-z0-9]+/g, '$1ID')
  unmount()
  return html
}

describe('every other status', () => {
  it.each(OTHER_STATUSES)('ignores the calibrating props (%s)', (status) => {
    expect(markup(status, { calibratingNote: 'x', showRampLabel: true })).toBe(markup(status))
  })

  it.each(OTHER_STATUSES)('keeps its PR star, dashed run and no hatch (%s)', (status) => {
    render(<GoalTrajectoryChart {...S.onTrack.goal!} {...WALL} status={status} />)
    expect(screen.getByTestId('goal-trajectory-chart-pr-star')).toBeInTheDocument()
    expect(screen.getByTestId('goal-trajectory-chart-next-target-lead')).toBeInTheDocument()
    expect(screen.queryByTestId('goal-trajectory-chart-calibrating-hatch')).not.toBeInTheDocument()
  })

  it('draws a degenerate band solid when the goal is not calibrating', () => {
    render(<GoalTrajectoryChart {...calibratingGoalAt('above')} {...WALL} status="on_track" />)
    const edge = screen.getByTestId('goal-trajectory-chart-band-edge')
    expect(edge.getAttribute('stroke-dasharray')).toBeNull()
    expect(screen.getByTestId('goal-trajectory-chart-pr-star')).toBeInTheDocument()
  })
})
