import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ExerciseCard } from './ExerciseCard'
import type { SetRowProps } from './SetRow'

const baseCollapsedProps = {
  name: 'Bench Press',
  summary: { sets: 3, reps: 6, weight: 175, unit: 'lbs' as const },
}

// Done · LIVE · upcoming — the locked "one object" narrative.
const unifiedSets: SetRowProps[] = [
  {
    state: 'done',
    setNumber: 1,
    unit: 'lbs',
    reps: 10,
    weight: 90,
    rpe: 7.5,
    velocities: [1.05, 0.9, 0.82],
  },
  {
    state: 'live',
    setNumber: 2,
    unit: 'lbs',
    target: { reps: 10, weight: 90 },
    reps: 2,
    weight: 90,
    velocities: [0.95, 0.9],
  },
  { state: 'todo', setNumber: 3, unit: 'lbs', target: { reps: 10, weight: 90 } },
]

describe('ExerciseCard', () => {
  describe('collapsed', () => {
    it('renders exercise name', () => {
      render(<ExerciseCard {...baseCollapsedProps} />)
      expect(screen.getByTestId('exercise-card-name')).toHaveTextContent('Bench Press')
    })

    it('renders summary text', () => {
      render(<ExerciseCard {...baseCollapsedProps} />)
      expect(screen.getByTestId('exercise-card-summary')).toHaveTextContent('3×6 @ 175 lbs')
    })

    it('renders PrBadge when isPR is true', () => {
      render(<ExerciseCard {...baseCollapsedProps} isPR />)
      expect(screen.getByTestId('pr-badge-star')).toBeInTheDocument()
    })

    it('renders compact velocity strips for logged sets', () => {
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          setVelocities={[
            [1.1, 0.95],
            [0.9, 0.8],
          ]}
          totalPlannedSets={4}
        />
      )
      expect(screen.getByTestId('exercise-card-velocity-strip-0')).toBeInTheDocument()
      expect(screen.getByTestId('exercise-card-velocity-strip-1')).toBeInTheDocument()
    })

    it('renders placeholder strips for remaining planned sets', () => {
      render(
        <ExerciseCard {...baseCollapsedProps} setVelocities={[[1.1, 0.95]]} totalPlannedSets={3} />
      )
      expect(screen.getByTestId('exercise-card-placeholder-0')).toBeInTheDocument()
      expect(screen.getByTestId('exercise-card-placeholder-1')).toBeInTheDocument()
    })

    it('does not render strips container when no velocities and no planned sets', () => {
      render(<ExerciseCard {...baseCollapsedProps} />)
      expect(screen.queryByTestId('exercise-card-strips')).not.toBeInTheDocument()
    })
  })

  describe('expanded (unified: rail heading header + faded body)', () => {
    const expandedProps = {
      name: 'Squat',
      defaultExpanded: true,
      summary: { sets: 3, reps: 8, weight: 185, unit: 'lbs' as const },
      sets: unifiedSets,
    }

    // Literal-hex text treatments (dark theme neutral 100 / 400).
    const T_ACTIVE = '#F3F4F6'
    const T_MUTED = '#9CA3AF'

    it('renders exercise name via the real ExerciseCardHeading header', () => {
      render(<ExerciseCard {...expandedProps} />)
      expect(screen.getByTestId('exercise-card-name')).toHaveTextContent('Squat')
    })

    it('is a single object: the heading is nested in the card, not a duplicate exercise-card', () => {
      render(<ExerciseCard {...expandedProps} />)
      expect(screen.getByTestId('exercise-card')).toBeInTheDocument()
      expect(screen.getByTestId('exercise-card-heading')).toBeInTheDocument()
      expect(screen.getByTestId('exercise-card-body')).toBeInTheDocument()
    })

    it('renders the header per-set strip derived from the set rows', () => {
      render(<ExerciseCard {...expandedProps} />)
      expect(screen.getByTestId('exercise-card-strip')).toBeInTheDocument()
      expect(screen.getByTestId('set-strip')).toBeInTheDocument()
    })

    it('drops the PREV column (showPrevious=false) but keeps SET/REPS/LBS/RPE', () => {
      render(<ExerciseCard {...expandedProps} />)
      const headers = screen.getByTestId('exercise-card-column-headers')
      expect(headers).toHaveTextContent('SET')
      expect(headers).toHaveTextContent('REPS')
      expect(headers).toHaveTextContent('LBS')
      expect(headers).toHaveTextContent('RPE')
      expect(headers).not.toHaveTextContent('PREV')
    })

    it('shows the KG weight header when the unit is kg', () => {
      render(
        <ExerciseCard {...expandedProps} summary={{ sets: 3, reps: 8, weight: 84, unit: 'kg' }} />
      )
      const headers = screen.getByTestId('exercise-card-column-headers')
      expect(headers).toHaveTextContent('KG')
      expect(headers).not.toHaveTextContent('LBS')
    })

    it('derives the weight header from the sets unit when summary is absent', () => {
      render(
        <ExerciseCard
          name="Squat"
          defaultExpanded
          sets={[{ state: 'done', setNumber: 1, unit: 'kg', reps: 8, weight: 60, velocities: [] }]}
        />
      )
      expect(screen.getByTestId('exercise-card-column-headers')).toHaveTextContent('KG')
    })

    it('renders one SetRow per set', () => {
      render(<ExerciseCard {...expandedProps} />)
      expect(screen.getAllByTestId('set-row')).toHaveLength(3)
    })

    it('shows the TARGET reps for the live set (no "reps-done/target")', () => {
      render(<ExerciseCard {...expandedProps} />)
      const rows = screen.getAllByTestId('set-row')
      expect(rows[1]).toHaveTextContent('10')
      expect(rows[1]).not.toHaveTextContent('2/10')
    })

    it('spotlights the active set by brightness and mutes done + upcoming', () => {
      render(<ExerciseCard {...expandedProps} />)
      const rows = screen.getAllByTestId('set-row')
      expect(within(rows[0]).getByText('1')).toHaveStyle({ color: T_MUTED })
      expect(within(rows[1]).getByText('2')).toHaveStyle({ color: T_ACTIVE })
      expect(within(rows[2]).getByText('3')).toHaveStyle({ color: T_MUTED })
    })

    it('uses the velocity-height spotlight for the live set and the flat compact strip elsewhere', () => {
      render(<ExerciseCard {...expandedProps} />)
      expect(screen.getAllByTestId('velocity-strip-spotlight')).toHaveLength(1)
      expect(screen.getAllByTestId('velocity-strip-compact')).toHaveLength(2)
    })

    it('renders the TempoDisplay in the header when tempo provided', () => {
      render(<ExerciseCard {...expandedProps} tempo={[2, 1, 3, 0]} />)
      expect(screen.getByTestId('tempo-display')).toBeInTheDocument()
    })

    it('does not render TempoDisplay when no tempo', () => {
      render(<ExerciseCard {...expandedProps} />)
      expect(screen.queryByTestId('tempo-display')).not.toBeInTheDocument()
    })
  })

  describe('upcoming', () => {
    const upcomingProps = {
      name: 'Deadlift',
      upcoming: true,
      prescription: '3×8-12 @ RPE 8',
      previousBest: '185 lbs × 10',
    }

    it('renders with reduced opacity', () => {
      render(<ExerciseCard {...upcomingProps} />)
      expect(screen.getByTestId('exercise-card')).toHaveStyle({ opacity: 0.6 })
    })

    it('renders exercise name', () => {
      render(<ExerciseCard {...upcomingProps} />)
      expect(screen.getByTestId('exercise-card-name')).toHaveTextContent('Deadlift')
    })

    it('renders prescription text', () => {
      render(<ExerciseCard {...upcomingProps} />)
      expect(screen.getByTestId('exercise-card-prescription')).toHaveTextContent('3×8-12 @ RPE 8')
    })

    it('renders previous best text', () => {
      render(<ExerciseCard {...upcomingProps} />)
      expect(screen.getByTestId('exercise-card-previous-best')).toHaveTextContent('185 lbs × 10')
    })

    it('ignores expand and never reveals the body', () => {
      render(<ExerciseCard {...upcomingProps} defaultExpanded sets={unifiedSets} />)
      expect(screen.queryByTestId('exercise-card-body')).not.toBeInTheDocument()
      expect(screen.queryByTestId('exercise-card-column-headers')).not.toBeInTheDocument()
    })
  })

  describe('expand control', () => {
    it('uncontrolled: defaultExpanded opens, and pressing the header collapses it', () => {
      render(<ExerciseCard {...baseCollapsedProps} defaultExpanded sets={unifiedSets} />)
      expect(screen.getByTestId('exercise-card-body')).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('exercise-card-header'))
      expect(screen.queryByTestId('exercise-card-body')).not.toBeInTheDocument()
    })

    it('uncontrolled: collapsed by default, pressing the header expands it', () => {
      render(<ExerciseCard {...baseCollapsedProps} sets={unifiedSets} />)
      expect(screen.queryByTestId('exercise-card-body')).not.toBeInTheDocument()
      fireEvent.click(screen.getByTestId('exercise-card-header'))
      expect(screen.getByTestId('exercise-card-body')).toBeInTheDocument()
    })

    it('controlled: reports the requested state but does not self-toggle', () => {
      const onExpandedChange = vi.fn()
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          expanded={false}
          onExpandedChange={onExpandedChange}
          sets={unifiedSets}
        />
      )
      expect(screen.queryByTestId('exercise-card-body')).not.toBeInTheDocument()
      fireEvent.click(screen.getByTestId('exercise-card-header'))
      expect(onExpandedChange).toHaveBeenCalledWith(true)
      // Controlled: still collapsed until the parent flips `expanded`.
      expect(screen.queryByTestId('exercise-card-body')).not.toBeInTheDocument()
    })

    it('fires onExpandedChange(false) when an expanded header is pressed', () => {
      const onExpandedChange = vi.fn()
      render(
        <ExerciseCard
          {...baseCollapsedProps}
          defaultExpanded
          onExpandedChange={onExpandedChange}
          sets={unifiedSets}
        />
      )
      fireEvent.click(screen.getByTestId('exercise-card-header'))
      expect(onExpandedChange).toHaveBeenCalledWith(false)
    })
  })

  describe('superset position border radius', () => {
    it('applies first position border radius', () => {
      render(<ExerciseCard {...baseCollapsedProps} supersetPosition="first" />)
      const container = screen.getByTestId('exercise-card').firstChild as HTMLElement
      expect(container).toHaveStyle({
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
      })
    })

    it('applies last position border radius', () => {
      render(<ExerciseCard {...baseCollapsedProps} supersetPosition="last" />)
      const container = screen.getByTestId('exercise-card').firstChild as HTMLElement
      expect(container).toHaveStyle({
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
      })
    })

    it('applies middle position border radius', () => {
      render(<ExerciseCard {...baseCollapsedProps} supersetPosition="middle" />)
      const container = screen.getByTestId('exercise-card').firstChild as HTMLElement
      expect(container).toHaveStyle({
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
      })
    })
  })

  describe('accessibility', () => {
    it('has correct accessibility label for collapsed', () => {
      render(<ExerciseCard {...baseCollapsedProps} />)
      expect(screen.getByLabelText('Bench Press, 3×6 @ 175 lbs')).toBeInTheDocument()
    })

    it('has correct accessibility label for upcoming with prescription', () => {
      render(<ExerciseCard name="Deadlift" upcoming prescription="3x8 @ RPE 8" />)
      expect(screen.getByLabelText('Deadlift, 3x8 @ RPE 8')).toBeInTheDocument()
    })

    it('has no accessibility violations when collapsed', async () => {
      const { container } = render(
        <ExerciseCard
          {...baseCollapsedProps}
          isPR
          setVelocities={[[1.1, 0.95]]}
          totalPlannedSets={3}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when expanded', async () => {
      const { container } = render(
        <ExerciseCard
          name="Squat"
          defaultExpanded
          summary={{ sets: 3, reps: 8, weight: 185, unit: 'lbs' }}
          sets={unifiedSets}
          tempo={[2, 1, 3, 0]}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when upcoming', async () => {
      const { container } = render(
        <ExerciseCard
          name="Deadlift"
          upcoming
          prescription="3x8 @ RPE 8"
          previousBest="185 lbs x 10"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
