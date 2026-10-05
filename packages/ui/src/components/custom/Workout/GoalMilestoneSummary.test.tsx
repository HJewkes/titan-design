import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'

import {
  GoalMilestoneSummary,
  MilestoneFacts,
  MilestoneHero,
  MilestoneWeekStrip,
  useResolvedMilestone,
  resolveTile,
  type GoalMilestoneSummaryProps,
} from './GoalMilestoneSummary'
import { milestoneReach, valueReach, type GoalReach } from './goalMilestone'
import { trajectoryReach } from './goalTrajectoryChartModel'
import { getSemanticColors } from '../../../theme'

const props: GoalMilestoneSummaryProps = {
  target: { metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' },
  weekCount: 6,
  currentWeek: 4,
  latest: { reps: 8, load: 100 },
  status: 'on_track',
  summaryFit: 'row',
  scale: 'wall',
}

function Parts() {
  const tile = useResolvedMilestone(props)
  return (
    <>
      <MilestoneHero tile={tile} scale="wall" />
      <MilestoneFacts tile={tile} />
      <MilestoneWeekStrip tile={tile} scale="wall" />
    </>
  )
}

describe('GoalMilestoneSummary parts', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<GoalMilestoneSummary {...props} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders hero, facts and week cells from one resolved milestone', () => {
    render(<Parts />)

    expect(screen.getByTestId('goal-milestone-hero')).toHaveTextContent('5 lb')
    const facts = screen.getByTestId('goal-milestone-facts')
    expect(within(facts).getByText('Week 4 of 6')).toBeInTheDocument()
    expect(facts).toHaveTextContent('Best 8 x 100 lb')
    expect(facts).toHaveTextContent('Goal 8 x 105 lb')
    expect(screen.getAllByTestId(/^goal-milestone-week-\d+$/)).toHaveLength(6)
  })

  it('hides the measuring copy so each fact is read once', () => {
    render(<GoalMilestoneSummary {...props} />)

    const measure = screen.getByTestId('goal-milestone-facts-measure')
    expect(measure).toHaveAttribute('aria-hidden', 'true')
    for (const fact of ['Week 4 of 6', 'Best', '8 x 100 lb', 'Goal', '8 x 105 lb']) {
      const visible = screen
        .getAllByText(fact)
        .filter((node) => !node.closest('[aria-hidden="true"]'))
      expect(visible).toHaveLength(1)
    }
  })
})

describe('one place decides short, met and beyond', () => {
  const READINGS: GoalReach[] = ['short', 'met', 'beyond']
  const cut = { metric: 'bodyweight', value: 189, unit: 'lb' } as const
  const topSet = { metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' } as const

  // Each row: a target, the lead number the chart plots, and a reading for each reach.
  const valueRows = (['up', 'down'] as const).flatMap((direction) => {
    const step = direction === 'up' ? 1 : -1
    return READINGS.map((reach) => ({
      name: `value ${direction} ${reach}`,
      target: cut,
      direction,
      latest: { value: cut.value + step * { short: -2, met: 0, beyond: 2 }[reach] },
      lead: cut.value + step * { short: -2, met: 0, beyond: 2 }[reach],
      goal: cut.value,
      reach,
    }))
  })
  const loadRows = READINGS.map((reach) => {
    const load = topSet.load + { short: -5, met: 0, beyond: 5 }[reach]
    return {
      name: `load up ${reach}`,
      target: topSet,
      direction: 'up' as const,
      latest: { reps: topSet.reps, load },
      lead: load,
      goal: topSet.load,
      reach,
    }
  })

  it.each([...valueRows, ...loadRows])(
    'milestoneReach, the tile and the chart agree on $name',
    ({ target, direction, latest, lead, goal, reach }) => {
      const tile = resolveTile(
        { target, latest, direction, weekCount: 6, currentWeek: 4 },
        getSemanticColors('dark')
      )

      expect(milestoneReach(target, latest, direction)).toBe(reach)
      expect(valueReach(goal, lead, direction)).toBe(reach)
      expect(trajectoryReach(goal, [{ value: lead }], direction)).toBe(reach)
      expect(tile.state).toBe(reach === 'short' ? 'upcoming' : 'hit')
      expect(tile.beyond).toBe(reach === 'beyond')
    }
  )
})
