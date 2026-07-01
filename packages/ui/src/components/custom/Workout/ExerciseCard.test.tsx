import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ExerciseCard } from './ExerciseCard'
import type { SetRowProps } from './SetRow'

const baseCollapsedProps = {
  name: 'Bench Press',
  state: 'collapsed' as const,
  onToggle: vi.fn(),
  summary: { sets: 3, reps: 6, weight: 175, unit: 'lbs' as const },
}

const baseSets: SetRowProps[] = [
  { mode: 'completed', setNumber: 1, reps: 8, weight: 135, unit: 'lbs' },
  { mode: 'completed', setNumber: 2, reps: 8, weight: 135, unit: 'lbs' },
  { mode: 'active', setNumber: 3, reps: null, weight: null, unit: 'lbs', isNextSet: true },
]

describe('ExerciseCard', () => {
  describe('collapsed state', () => {
    it('renders exercise name', () => {
      render(<ExerciseCard {...baseCollapsedProps} />)
      expect(screen.getByTestId('exercise-card-name')).toHaveTextContent('Bench Press')
    })

    it('renders summary text', () => {
      render(<ExerciseCard {...baseCollapsedProps} />)
      expect(screen.getByTestId('exercise-card-summary')).toHaveTextContent(
        '3\u00D76 @ 175 lbs',
      )
    })

    it('renders WeightBadge when e1rm provided', () => {
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          e1rm={{ value: 225, unit: 'lbs' }}
        />,
      )
      expect(screen.getByTestId('exercise-card-e1rm')).toBeInTheDocument()
    })

    it('renders PrBadge when isPR is true', () => {
      render(<ExerciseCard {...baseCollapsedProps} isPR />)
      expect(screen.getByTestId('pr-badge-star')).toBeInTheDocument()
    })

    it('renders mini velocity strips for completed sets', () => {
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          setVelocities={[[1.1, 0.95], [0.9, 0.8]]}
          totalPlannedSets={4}
        />,
      )
      expect(screen.getByTestId('exercise-card-velocity-strip-0')).toBeInTheDocument()
      expect(screen.getByTestId('exercise-card-velocity-strip-1')).toBeInTheDocument()
    })

    it('renders placeholder strips for remaining planned sets', () => {
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          setVelocities={[[1.1, 0.95]]}
          totalPlannedSets={3}
        />,
      )
      expect(screen.getByTestId('exercise-card-placeholder-0')).toBeInTheDocument()
      expect(screen.getByTestId('exercise-card-placeholder-1')).toBeInTheDocument()
    })

    it('does not render strips container when no velocities and no planned sets', () => {
      render(<ExerciseCard {...baseCollapsedProps} />)
      expect(screen.queryByTestId('exercise-card-strips')).not.toBeInTheDocument()
    })
  })

  describe('expanded state', () => {
    const expandedProps = {
      name: 'Squat',
      state: 'expanded' as const,
      onToggle: vi.fn(),
      summary: { sets: 3, reps: 8, weight: 185, unit: 'lbs' as const },
      sets: baseSets,
    }

    it('renders exercise name in header', () => {
      render(<ExerciseCard {...expandedProps} />)
      expect(screen.getByTestId('exercise-card-name')).toHaveTextContent('Squat')
    })

    it('renders column headers', () => {
      render(<ExerciseCard {...expandedProps} />)
      const headers = screen.getByTestId('exercise-card-column-headers')
      expect(headers).toHaveTextContent('SET')
      expect(headers).toHaveTextContent('PREV')
      expect(headers).toHaveTextContent('REPS')
      expect(headers).toHaveTextContent('LBS')
      expect(headers).toHaveTextContent('RPE')
    })

    it('shows the KG weight header when the unit is kg', () => {
      render(
        <ExerciseCard
          {...expandedProps}
          summary={{ sets: 3, reps: 8, weight: 84, unit: 'kg' }}
        />,
      )
      const headers = screen.getByTestId('exercise-card-column-headers')
      expect(headers).toHaveTextContent('KG')
      expect(headers).not.toHaveTextContent('LBS')
    })

    it('derives the weight header from the sets unit when summary is absent', () => {
      render(
        <ExerciseCard
          name="Squat"
          state="expanded"
          onToggle={vi.fn()}
          sets={[{ mode: 'completed', setNumber: 1, reps: 8, weight: 60, unit: 'kg' }]}
        />,
      )
      expect(screen.getByTestId('exercise-card-column-headers')).toHaveTextContent('KG')
    })

    it('renders SetRow components', () => {
      render(<ExerciseCard {...expandedProps} />)
      const setRows = screen.getAllByTestId('set-row')
      expect(setRows).toHaveLength(3)
    })

    it('renders TempoDisplay when tempo provided', () => {
      render(
        <ExerciseCard
          {...expandedProps}
          tempo={[2, 1, 3, 0]}
        />,
      )
      expect(screen.getByTestId('exercise-card-tempo')).toBeInTheDocument()
      expect(screen.getByTestId('tempo-display')).toBeInTheDocument()
    })

    it('does not render TempoDisplay when no tempo', () => {
      render(<ExerciseCard {...expandedProps} />)
      expect(screen.queryByTestId('exercise-card-tempo')).not.toBeInTheDocument()
    })

    it('sets aria-expanded on header button', () => {
      render(<ExerciseCard {...expandedProps} />)
      const header = screen.getByTestId('exercise-card-header')
      expect(header).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('upcoming state', () => {
    const upcomingProps = {
      name: 'Deadlift',
      state: 'upcoming' as const,
      onToggle: vi.fn(),
      prescription: '3\u00D78-12 @ RPE 8',
      previousBest: '185 lbs \u00D7 10',
    }

    it('renders with reduced opacity', () => {
      render(<ExerciseCard {...upcomingProps} />)
      const card = screen.getByTestId('exercise-card')
      expect(card).toHaveStyle({ opacity: 0.6 })
    })

    it('renders exercise name', () => {
      render(<ExerciseCard {...upcomingProps} />)
      expect(screen.getByTestId('exercise-card-name')).toHaveTextContent('Deadlift')
    })

    it('renders prescription text', () => {
      render(<ExerciseCard {...upcomingProps} />)
      expect(screen.getByTestId('exercise-card-prescription')).toHaveTextContent(
        '3\u00D78-12 @ RPE 8',
      )
    })

    it('renders previous best text', () => {
      render(<ExerciseCard {...upcomingProps} />)
      expect(screen.getByTestId('exercise-card-previous-best')).toHaveTextContent(
        '185 lbs \u00D7 10',
      )
    })

    it('does not render interactive elements', () => {
      render(<ExerciseCard {...upcomingProps} />)
      expect(screen.queryByTestId('exercise-card-strips')).not.toBeInTheDocument()
      expect(screen.queryByTestId('exercise-card-column-headers')).not.toBeInTheDocument()
    })
  })

  describe('onToggle', () => {
    it('fires onToggle when collapsed card is pressed', () => {
      const onToggle = vi.fn()
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          onToggle={onToggle}
        />,
      )
      fireEvent.click(screen.getByTestId('exercise-card-header'))
      expect(onToggle).toHaveBeenCalledOnce()
    })

    it('fires onToggle when expanded header is pressed', () => {
      const onToggle = vi.fn()
      render(
        <ExerciseCard
          name="Squat"
          state="expanded"
          onToggle={onToggle}
          sets={baseSets}
        />,
      )
      fireEvent.click(screen.getByTestId('exercise-card-header'))
      expect(onToggle).toHaveBeenCalledOnce()
    })
  })

  describe('superset position border radius', () => {
    it('applies first position border radius', () => {
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          supersetPosition="first"
        />,
      )
      const card = screen.getByTestId('exercise-card')
      const container = card.firstChild as HTMLElement
      expect(container).toHaveStyle({
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
      })
    })

    it('applies last position border radius', () => {
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          supersetPosition="last"
        />,
      )
      const card = screen.getByTestId('exercise-card')
      const container = card.firstChild as HTMLElement
      expect(container).toHaveStyle({
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
      })
    })

    it('applies middle position border radius', () => {
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          supersetPosition="middle"
        />,
      )
      const card = screen.getByTestId('exercise-card')
      const container = card.firstChild as HTMLElement
      expect(container).toHaveStyle({
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
      })
    })
  })

  describe('accessibility', () => {
    it('has correct accessibility label for collapsed state', () => {
      render(<ExerciseCard {...baseCollapsedProps} />)
      expect(
        screen.getByLabelText('Bench Press, 3\u00D76 @ 175 lbs'),
      ).toBeInTheDocument()
    })

    it('has correct accessibility label for upcoming state with prescription', () => {
      render(
        <ExerciseCard
          name="Deadlift"
          state="upcoming"
          onToggle={vi.fn()}
          prescription="3x8 @ RPE 8"
        />,
      )
      expect(
        screen.getByLabelText('Deadlift, 3x8 @ RPE 8'),
      ).toBeInTheDocument()
    })

    it('has no accessibility violations in collapsed state', async () => {
      const { container } = render(
        <ExerciseCard
          {...baseCollapsedProps}
          e1rm={{ value: 225, unit: 'lbs' }}
          isPR
          setVelocities={[[1.1, 0.95]]}
          totalPlannedSets={3}
        />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in expanded state', async () => {
      const { container } = render(
        <ExerciseCard
          name="Squat"
          state="expanded"
          onToggle={vi.fn()}
          summary={{ sets: 3, reps: 8, weight: 185, unit: 'lbs' }}
          sets={baseSets}
          tempo={[2, 1, 3, 0]}
        />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in upcoming state', async () => {
      const { container } = render(
        <ExerciseCard
          name="Deadlift"
          state="upcoming"
          onToggle={vi.fn()}
          prescription="3x8 @ RPE 8"
          previousBest="185 lbs x 10"
        />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
