/**
 * The deload column and the current week are the chart's two marked columns. Round 5
 * dropped the round-4 current-week outline ("it was a misunderstanding on my part");
 * the 2026-09-18 review brought the week back as the compact chart's tint instead
 * (VW-423: "Large chart should also have a current week highlight"). The deload
 * column still says so in its tip; the tip says nothing about a current week.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalCard } from './GoalCard'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const GOAL = S.onTrack.goal!
const DELOAD_WEEK = GOAL.weeks.find((w) => w.isDeload)!.index

describe('the deload column', () => {
  it("stays marked beside the card's current week", () => {
    render(
      <GoalCard
        {...S.onTrack}
        chartWidth={360}
        milestone={{ ...S.onTrack.milestone, currentWeek: 2 }}
      />
    )
    expect(screen.getAllByTestId('goal-trajectory-chart-deload')).toHaveLength(1)
    expect(screen.getAllByTestId('goal-trajectory-chart-current-week')).toHaveLength(1)
  })

  it('says "Deload week" in that week\'s tip, and says nothing about a current week', () => {
    render(<GoalTrajectoryChart {...GOAL} width={360} height={220} status="on_track" />)
    const label =
      screen
        .getByTestId(`goal-trajectory-chart-week-target-${String(DELOAD_WEEK)}`)
        .getAttribute('aria-label') ?? ''
    expect(label).toContain('Deload week')
    expect(label).not.toContain('Current week')
  })
})
