import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { WorkoutCard, type WorkoutCardProps } from './WorkoutCard'
import type { ExerciseCardProps } from './ExerciseCard'

const baseProps: WorkoutCardProps = {
  name: 'Upper A',
  date: 'Mon, Jun 23',
  status: 'today',
  muscleGroups: [
    { group: 'chest', label: 'Chest', volumeStatus: 'productive' },
    { group: 'back', label: 'Back', volumeStatus: 'maintenance' },
  ],
  totalSets: 18,
  unit: 'lbs',
}

const exercises: ExerciseCardProps[] = [
  {
    name: 'Bench Press',
    state: 'collapsed',
    onToggle: () => {},
    summary: { sets: 3, reps: 8, weight: 175, unit: 'lbs' },
  },
  {
    name: 'Row',
    state: 'upcoming',
    onToggle: () => {},
    prescription: '3×10 @ RPE 8',
  },
]

describe('WorkoutCard', () => {
  describe('rendering', () => {
    it('renders name and date', () => {
      render(<WorkoutCard {...baseProps} />)
      expect(screen.getByTestId('workout-card-name')).toHaveTextContent(
        'Upper A',
      )
      expect(screen.getByTestId('workout-card-date')).toHaveTextContent(
        'Mon, Jun 23',
      )
    })

    it('renders the set count in the stats row', () => {
      render(<WorkoutCard {...baseProps} />)
      expect(screen.getByTestId('workout-card-stats')).toHaveTextContent(
        '18 sets',
      )
    })

    it('includes duration in stats when provided', () => {
      render(<WorkoutCard {...baseProps} duration="45 min" />)
      expect(screen.getByTestId('workout-card-stats')).toHaveTextContent(
        '45 min',
      )
    })

    it('includes total volume with unit when provided', () => {
      render(<WorkoutCard {...baseProps} totalVolume={12450} unit="lbs" />)
      expect(screen.getByTestId('workout-card-stats')).toHaveTextContent(
        '12450 lbs',
      )
    })

    it('omits volume from stats when not provided', () => {
      render(<WorkoutCard {...baseProps} />)
      expect(screen.getByTestId('workout-card-stats')).not.toHaveTextContent(
        'lbs',
      )
    })
  })

  describe('muscle groups', () => {
    it('renders a chip per muscle group', () => {
      render(<WorkoutCard {...baseProps} />)
      expect(screen.getAllByTestId('muscle-group-chip')).toHaveLength(2)
    })

    it('renders chip labels', () => {
      render(<WorkoutCard {...baseProps} />)
      const row = screen.getByTestId('workout-card-muscle-groups')
      expect(row).toHaveTextContent('Chest')
      expect(row).toHaveTextContent('Back')
    })

    it('does not render the muscle group row when empty', () => {
      render(<WorkoutCard {...baseProps} muscleGroups={[]} />)
      expect(
        screen.queryByTestId('workout-card-muscle-groups'),
      ).not.toBeInTheDocument()
    })
  })

  describe('expansion', () => {
    it('renders exercises when expanded', () => {
      render(
        <WorkoutCard
          {...baseProps}
          expanded
          onToggle={() => {}}
          exercises={exercises}
        />,
      )
      expect(screen.getByTestId('workout-card-exercises')).toBeInTheDocument()
      expect(screen.getAllByTestId('exercise-card')).toHaveLength(2)
    })

    it('does not render exercises when collapsed', () => {
      render(
        <WorkoutCard
          {...baseProps}
          expanded={false}
          onToggle={() => {}}
          exercises={exercises}
        />,
      )
      expect(
        screen.queryByTestId('workout-card-exercises'),
      ).not.toBeInTheDocument()
    })

    it('calls onToggle when pressed', () => {
      const onToggle = vi.fn()
      render(<WorkoutCard {...baseProps} onToggle={onToggle} />)
      fireEvent.click(screen.getByTestId('workout-card-toggle'))
      expect(onToggle).toHaveBeenCalledOnce()
    })
  })

  describe('status styling', () => {
    it('dims the card when upcoming', () => {
      render(<WorkoutCard {...baseProps} status="upcoming" />)
      expect(screen.getByTestId('workout-card')).toHaveStyle({ opacity: 0.6 })
    })

    it('does not dim a completed card', () => {
      render(<WorkoutCard {...baseProps} status="completed" />)
      expect(screen.getByTestId('workout-card')).not.toHaveStyle({
        opacity: 0.6,
      })
    })
  })

  describe('accessibility', () => {
    it('exposes button role and expanded state when expandable', () => {
      render(
        <WorkoutCard {...baseProps} expanded onToggle={() => {}} />,
      )
      const card = screen.getByRole('button', {
        name: 'Upper A workout, Mon, Jun 23, today',
      })
      expect(card).toHaveAttribute('aria-expanded', 'true')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(
        <WorkoutCard
          {...baseProps}
          duration="45 min"
          totalVolume={12450}
          onToggle={() => {}}
          expanded
          exercises={exercises}
        />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
