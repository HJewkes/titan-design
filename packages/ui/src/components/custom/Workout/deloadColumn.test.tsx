/**
 * The chart marks no current week. Round 4 read the deload shading as a selection, so
 * round 4's fix outlined the current week; in round 5 the owner dropped it ("I don't like
 * the outline lets drop it (it was a misunderstanding on my part)"). The deload column is
 * the only marked column, and it says so in its tip.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalCard } from './GoalCard'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const GOAL = S.onTrack.goal!
const DELOAD_WEEK = GOAL.weeks.find((w) => w.isDeload)!.index

describe('the deload column', () => {
  it("is the chart's only marked column: no current-week mark", () => {
    render(<GoalCard {...S.onTrack} chartWidth={360} />)
    expect(screen.queryByTestId('goal-trajectory-chart-current-week')).toBeNull()
    expect(screen.getAllByTestId('goal-trajectory-chart-deload')).toHaveLength(1)
  })

  it('takes no current week from a card, whatever week the cells ring', () => {
    render(
      <GoalCard
        {...S.onTrack}
        chartWidth={360}
        milestone={{ ...S.onTrack.milestone, currentWeek: 2 }}
      />
    )
    expect(screen.queryByTestId('goal-trajectory-chart-current-week')).toBeNull()
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
