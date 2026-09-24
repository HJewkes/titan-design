/**
 * VW-433: the calibrating chart the human chose in round 1. Plain dots, the next
 * target as a hollow dot with no dashed run, the ramp dashed, and the weeks after
 * the latest reading hatched with a note the consumer words.
 */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { capturedClassNames } from '../../../test/classname-capture'
import { GoalTrajectoryChart, type GoalTrajectoryStatus } from './GoalTrajectoryChart'
import { DASHED_EDGE } from './GoalTrajectoryBand'
import {
  CALIBRATING_EXPLANATION,
  CALIBRATING_TIP_LABEL,
  DEFAULT_CALIBRATING_NOTE,
} from './GoalTrajectoryCalibrating'
import { deriveTrajectoryGeometry, trajectoryInsets } from './GoalTrajectoryChartGeometry'
import { calibratingGoalAt, type CalibratingPlacement } from './goalTrajectoryCalibratingFixture'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const WALL = { width: 1200, height: 340 }
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
    const g = deriveTrajectoryGeometry({
      ...calibratingGoalAt(placement),
      ...WALL,
      insets: trajectoryInsets(false),
    })
    const span = g.toX(2) - g.toX(1)
    const hatch = screen.getByTestId('goal-trajectory-chart-calibrating-hatch')
    expect(Number(hatch.getAttribute('x'))).toBeCloseTo(g.toX(lastWeek) + span / 2, 5)
  })

  it('writes no note on the plane: the reason lives in the tip', () => {
    renderAt('above')
    expect(screen.queryByText(DEFAULT_CALIBRATING_NOTE)).toBeNull()
    expect(screen.queryByText(/planned ramp/)).toBeNull()
    expect(screen.queryByTestId('goal-trajectory-chart-calibrating-ramp-label')).toBeNull()
  })

  it('offers a named button for the tip', () => {
    renderAt('above')
    expect(screen.getByRole('button', { name: CALIBRATING_TIP_LABEL })).toBeInTheDocument()
  })

  it.each([
    ['focus', (el: HTMLElement) => fireEvent.focus(el)],
    ['hover', (el: HTMLElement) => fireEvent.mouseEnter(el)],
    ['press', (el: HTMLElement) => fireEvent.click(el)],
  ])('opens the tip on %s: the note, then the explanation as running sentences', (_, open) => {
    renderAt('above', { calibratingNote: '1 more comparable session' })
    open(screen.getByRole('button', { name: CALIBRATING_TIP_LABEL }))
    const tip = screen.getByTestId('goal-trajectory-chart-calibrating-tip')
    expect(tip).toHaveTextContent(`1 more comparable session${CALIBRATING_EXPLANATION}`)
    expect(screen.getByTestId('goal-trajectory-chart-calibrating-tip-explanation')).toHaveTextContent(
      /history\. Until then/
    )
  })

  it("sets the explanation on a normal line height, not the caption's loose one", () => {
    renderAt('above')
    fireEvent.focus(screen.getByRole('button', { name: CALIBRATING_TIP_LABEL }))
    expect(capturedClassNames.get('goal-trajectory-chart-calibrating-tip-explanation')).toContain(
      'leading-normal'
    )
  })

  it('closes the tip on Escape and on blur', () => {
    renderAt('above')
    const target = screen.getByRole('button', { name: CALIBRATING_TIP_LABEL })
    fireEvent.focus(target)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('goal-trajectory-chart-calibrating-tip')).toBeNull()
    fireEvent.focus(target)
    fireEvent.blur(target)
    expect(screen.queryByTestId('goal-trajectory-chart-calibrating-tip')).toBeNull()
  })

  it("makes the open tip the button's description for screen readers", () => {
    renderAt('above', { calibratingNote: '1 more session' })
    const target = screen.getByRole('button', { name: CALIBRATING_TIP_LABEL })
    fireEvent.focus(target)
    expect(target).toHaveAccessibleDescription(
      expect.stringContaining('1 more session') as unknown as string
    )
  })

  it.each(['', '   ', undefined])('falls back to the default note for %j', (calibratingNote) => {
    renderAt('above', { calibratingNote })
    fireEvent.focus(screen.getByRole('button', { name: CALIBRATING_TIP_LABEL }))
    expect(screen.getByTestId('goal-trajectory-chart-calibrating-tip')).toHaveTextContent(
      DEFAULT_CALIBRATING_NOTE
    )
    expect(screen.queryByText(/session/i)).not.toBeInTheDocument()
  })

  it('warns in development when the note repeats the status, and still shows it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    renderAt('above', { calibratingNote: 'Calibrating: 2 more sessions' })
    fireEvent.focus(screen.getByRole('button', { name: CALIBRATING_TIP_LABEL }))
    expect(screen.getByText('Calibrating: 2 more sessions')).toBeInTheDocument()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('status pill already says'))
    warn.mockRestore()
  })

  it('does not warn for a note that only mentions calibration later on', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    renderAt('above', { calibratingNote: '2 sessions until calibrating ends' })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('stays silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    renderAt('above', { calibratingNote: 'calibrating, 3 more sessions' })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    vi.unstubAllEnvs()
  })
})

describe('the calibrating accessible name', () => {
  const nameOf = () =>
    screen.getByTestId('goal-trajectory-chart-canvas').getAttribute('aria-label') ?? ''
  const LONG =
    'Waiting on 3 more comparable sessions, more working sets of this lift at a steady load, ' +
    'and a fresh start lift after the deload so the band has something honest to fit'

  it('says the note and that the line is the planned ramp, not a band', () => {
    renderAt('above')
    expect(nameOf()).toContain('Status: Calibrating.')
    expect(nameOf()).toContain(
      `${DEFAULT_CALIBRATING_NOTE}. The line is the planned ramp from the start lift, not an expected band.`
    )
  })

  it('carries a full-sentence note whole', () => {
    renderAt('above', { calibratingNote: LONG })
    expect(nameOf()).toContain(`${LONG}.`)
  })

  it('says nothing about a ramp for a goal that is not calibrating', () => {
    render(<GoalTrajectoryChart {...calibratingGoalAt('above')} {...WALL} status="on_track" />)
    expect(nameOf()).not.toMatch(/planned ramp|No band yet/)
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
    expect(markup(status, { calibratingNote: 'x' })).toBe(markup(status))
  })

  it.each(OTHER_STATUSES)('keeps its PR star, dashed run and no hatch (%s)', (status) => {
    render(<GoalTrajectoryChart {...S.onTrack.goal!} {...WALL} status={status} />)
    expect(screen.getByTestId('goal-trajectory-chart-pr-star')).toBeInTheDocument()
    expect(screen.getByTestId('goal-trajectory-chart-next-target-lead')).toBeInTheDocument()
    expect(screen.queryByTestId('goal-trajectory-chart-calibrating-hatch')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: CALIBRATING_TIP_LABEL })).toBeNull()
  })

  it('draws a degenerate band solid when the goal is not calibrating', () => {
    render(<GoalTrajectoryChart {...calibratingGoalAt('above')} {...WALL} status="on_track" />)
    const edge = screen.getByTestId('goal-trajectory-chart-band-edge')
    expect(edge.getAttribute('stroke-dasharray')).toBeNull()
    expect(screen.getByTestId('goal-trajectory-chart-pr-star')).toBeInTheDocument()
  })
})
