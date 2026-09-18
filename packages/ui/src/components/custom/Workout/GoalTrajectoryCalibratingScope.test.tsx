/**
 * VW-433: a calibrating treatment may only change a calibrating chart. Every other
 * status renders the same markup whichever treatment the caller passes.
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { GoalTrajectoryChart, type GoalTrajectoryStatus } from './GoalTrajectoryChart'
import type { CalibratingTreatment } from './GoalTrajectoryCalibrating'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const STATUSES: GoalTrajectoryStatus[] = [
  'on_track',
  'ahead',
  'behind',
  'tolerated',
  'deload_week',
  'stalled',
  'goal_met',
  'beyond_goal',
]
const TREATMENTS: CalibratingTreatment[] = ['plain', 'labelled', 'caption', 'annotated']
const goal = S.onTrack.goal!

/** Markup with the per-render `useId` suffixes blanked, so two renders can be compared. */
function markup(status: GoalTrajectoryStatus, treatment?: CalibratingTreatment): string {
  const { container, unmount } = render(
    <GoalTrajectoryChart
      {...goal}
      status={status}
      width={1200}
      height={340}
      {...(treatment ? { calibratingTreatment: treatment } : {})}
      calibration={{ sessions: 2, needed: 3 }}
    />
  )
  const html = container.innerHTML.replace(/(gtc-[a-z-]+-)[A-Za-z0-9]+/g, '$1ID')
  unmount()
  return html
}

describe('calibrating treatments outside the calibrating state', () => {
  it.each(STATUSES)('leave a %s chart exactly as it renders today', (status) => {
    const today = markup(status)
    TREATMENTS.forEach((treatment) => expect(markup(status, treatment)).toBe(today))
  })

  it("render today's calibrating chart when the treatment is v0", () => {
    expect(markup('calibrating', 'v0')).toBe(markup('calibrating'))
  })
})
