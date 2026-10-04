import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import {
  GoalMilestoneSummary,
  MilestoneFacts,
  MilestoneHero,
  MilestoneWeekStrip,
  useResolvedMilestone,
  type GoalMilestoneSummaryProps,
} from './GoalMilestoneSummary'

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
