import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { GoalMuscleCard, goalMuscleLiftText, type GoalMuscleCardProps } from './GoalMuscleCard'
import { MuscleGroup } from './muscleTaxonomy'

const baseProps: GoalMuscleCardProps = {
  name: 'BACK',
  muscle: MuscleGroup.UPPER_BACK,
  side: 'back',
  status: 'ahead',
  liftsOnTrack: 3,
  liftsTotal: 3,
  commonGoalWeek: 5,
  lifts: [
    { name: 'Barbell row', status: 'on_track', reps: 10, load: 100, unit: 'lb', goalWeek: 5 },
    { name: 'Weighted pull up', status: 'deload_week', reps: 6, load: 30, unit: 'lb', goalWeek: 5 },
    { name: 'Lat pulldown', status: 'ahead', reps: 12, load: 70, unit: 'lb', goalWeek: 7 },
  ],
}

describe('GoalMuscleCard', () => {
  it('renders the muscle name', () => {
    render(<GoalMuscleCard {...baseProps} />)
    expect(screen.getByTestId('goal-muscle-card-name')).toHaveTextContent('BACK')
  })

  describe('the contributing lifts', () => {
    it('renders one row per lift', () => {
      render(<GoalMuscleCard {...baseProps} />)
      expect(screen.getAllByTestId('goal-muscle-card-lift')).toHaveLength(3)
    })

    it('names each lift', () => {
      render(<GoalMuscleCard {...baseProps} />)
      expect(screen.getByText('Barbell row')).toBeInTheDocument()
      expect(screen.getByText('Lat pulldown')).toBeInTheDocument()
    })

    it('renders a single-lift muscle without collapsing', () => {
      render(<GoalMuscleCard {...baseProps} lifts={[baseProps.lifts[0]!]} liftsTotal={1} />)
      expect(screen.getAllByTestId('goal-muscle-card-lift')).toHaveLength(1)
    })

    it('renders no rows when a muscle has no accepted targets yet', () => {
      render(<GoalMuscleCard {...baseProps} lifts={[]} liftsOnTrack={0} liftsTotal={0} />)
      expect(screen.queryByTestId('goal-muscle-card-lift')).toBeNull()
      expect(screen.getByTestId('goal-muscle-card-count')).toHaveTextContent('0/0 on track')
    })
  })

  describe('the week rule', () => {
    it('elides the week on a lift due in the muscle common week', () => {
      render(<GoalMuscleCard {...baseProps} />)
      expect(screen.getByText('10 x 100 lb')).toBeInTheDocument()
    })

    it('prints the week only on a lift due in a different one', () => {
      render(<GoalMuscleCard {...baseProps} />)
      expect(screen.getByText('12 x 70 lb · wk 7')).toBeInTheDocument()
    })

    it('is a pure function of the lift and the common week', () => {
      const lift = baseProps.lifts[0]!
      expect(goalMuscleLiftText(lift, 5)).toBe('10 x 100 lb')
      expect(goalMuscleLiftText({ ...lift, goalWeek: 7 }, 5)).toBe('10 x 100 lb · wk 7')
    })

    it('drops every week when the whole muscle shares one', () => {
      const lifts = baseProps.lifts.map((l) => ({ ...l, goalWeek: 5 }))
      render(<GoalMuscleCard {...baseProps} lifts={lifts} />)
      expect(screen.queryByText(/wk /)).toBeNull()
    })
  })

  describe('the count label', () => {
    it('reads as a label, not a bare number', () => {
      render(<GoalMuscleCard {...baseProps} />)
      expect(screen.getByTestId('goal-muscle-card-count')).toHaveTextContent('3/3 on track')
    })

    it('reports a partial count', () => {
      render(<GoalMuscleCard {...baseProps} liftsOnTrack={1} liftsTotal={2} />)
      expect(screen.getByTestId('goal-muscle-card-count')).toHaveTextContent('1/2 on track')
    })
  })

  describe('the figure', () => {
    it('renders with an accessible name for the muscle', () => {
      render(<GoalMuscleCard {...baseProps} />)
      expect(screen.getByLabelText('Upper Back highlighted on the body map')).toBeInTheDocument()
    })

    it('sits in its own column beside the rows', () => {
      render(<GoalMuscleCard {...baseProps} />)
      expect(screen.getByTestId('goal-muscle-card-figure')).toBeInTheDocument()
    })
  })

  describe('status vocabulary', () => {
    // The figure is lit by GOAL status, never BodyMap's volume-landmark heatmap.
    const cases: [GoalMuscleCardProps['status'], string][] = [
      ['on_track', 'On track'],
      ['ahead', 'Ahead'],
      ['behind', 'Behind'],
      ['tolerated', 'Tolerated'],
      ['deload_week', 'Deload week'],
      ['calibrating', 'Calibrating'],
      ['stalled', 'Stalled'],
    ]

    for (const [status, label] of cases) {
      it(`labels ${status} as "${label}"`, () => {
        render(<GoalMuscleCard {...baseProps} status={status} />)
        expect(screen.getByTestId('goal-muscle-card-status-pill')).toHaveTextContent(label)
      })
    }

    it('collapses the status to its light at the compact density', () => {
      render(<GoalMuscleCard {...baseProps} density="compact" />)
      expect(screen.getByTestId('goal-muscle-card-status-dot')).toBeInTheDocument()
      expect(screen.queryByTestId('goal-muscle-card-status-pill')).toBeNull()
    })
  })

  it('names itself for assistive tech', () => {
    render(<GoalMuscleCard {...baseProps} />)
    expect(screen.getByLabelText('BACK goal rollup, Ahead')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<GoalMuscleCard {...baseProps} />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations at the compact density', async () => {
      const { container } = render(<GoalMuscleCard {...baseProps} density="compact" />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
