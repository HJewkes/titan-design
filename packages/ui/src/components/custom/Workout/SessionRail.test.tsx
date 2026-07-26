import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionRail, type SessionRailExercise } from './SessionRail'

const exercises: SessionRailExercise[] = [
  {
    name: 'Seated Cable Row',
    summary: { sets: 5, reps: 8, weight: 145, unit: 'lbs' },
    tempo: [3, 1, 2, 0],
    indicator: 'pr',
    setStates: [{ status: 'done', velocities: [1, 0.9] }],
  },
  {
    name: 'Cable Chest Press',
    summary: { sets: 3, reps: 10, weight: 90, unit: 'lbs' },
    setStates: [{ status: 'active', velocities: [0.6], planned: 10 }],
  },
  {
    name: 'Face Pull',
    summary: { sets: 3, reps: '15-20', weight: 40, unit: 'lbs' },
    upcoming: true,
    setStates: [{ status: 'todo', planned: 18 }],
  },
] // total = 11 sets

const baseProps = {
  title: 'Pull A · Intensification',
  exercises,
  setsDone: 4,
  elapsedMs: 20 * 60 * 1000,
  budgetMs: 60 * 60 * 1000,
  metrics: [
    { label: 'Volume', value: '40%' },
    { label: 'Load', value: '3.1k' },
    { label: 'Fatigue', value: 'LOW' },
  ],
}

describe('SessionRail', () => {
  it('renders the session title', () => {
    render(<SessionRail {...baseProps} />)
    expect(screen.getByTestId('session-rail-title')).toHaveTextContent('Pull A · Intensification')
  })

  it('derives the header sets label from the exercises', () => {
    render(<SessionRail {...baseProps} />)
    expect(screen.getByTestId('session-rail-sets')).toHaveTextContent('4/11 sets')
  })

  it('feeds the live metric tiles into the header', () => {
    render(<SessionRail {...baseProps} />)
    expect(screen.getByText('Volume')).toBeInTheDocument()
    expect(screen.getByText('Fatigue')).toBeInTheDocument()
  })

  it('renders the upcoming glance when next is set', () => {
    render(
      <SessionRail title="Lower B" exercises={exercises} next={new Date('2026-07-11T18:30:00')} />
    )
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Until')).toBeInTheDocument()
  })

  it('renders one rail heading per exercise', () => {
    render(<SessionRail {...baseProps} />)
    expect(screen.getAllByTestId('exercise-card')).toHaveLength(3)
    expect(screen.getByText('Seated Cable Row')).toBeInTheDocument()
    expect(screen.getByText('Face Pull')).toBeInTheDocument()
  })

  it('fires onExercisePress with the exercise and its index', () => {
    const onExercisePress = vi.fn()
    render(<SessionRail {...baseProps} onExercisePress={onExercisePress} />)
    fireEvent.click(screen.getAllByTestId('exercise-card-header')[1])
    expect(onExercisePress).toHaveBeenCalledWith(exercises[1], 1)
  })

  describe('expandedIndex', () => {
    const withSets: SessionRailExercise[] = exercises.map((ex, i) =>
      i === 1
        ? {
            ...ex,
            sets: [
              {
                state: 'done' as const,
                setNumber: 1,
                unit: 'lbs' as const,
                reps: 10,
                weight: 90,
                velocities: [0.72, 0.66],
              },
            ],
          }
        : ex
    )

    it('renders the named exercise expanded in place, leaving the others collapsed', () => {
      render(<SessionRail {...baseProps} exercises={withSets} expandedIndex={1} />)
      // The expanded row reveals the set table; the collapsed ones do not.
      expect(screen.getByText('SET')).toBeInTheDocument()
      expect(screen.getByText('RPE')).toBeInTheDocument()
      // Every exercise still has a row.
      expect(screen.getByText('Seated Cable Row')).toBeInTheDocument()
      expect(screen.getByText('Cable Chest Press')).toBeInTheDocument()
      expect(screen.getByText('Face Pull')).toBeInTheDocument()
    })

    it('stays collapsed when the named exercise has no sets', () => {
      // Guards the real case: an exercise whose sets have not loaded yet must not
      // expand into an empty table.
      render(<SessionRail {...baseProps} expandedIndex={1} />)
      expect(screen.queryByText('SET')).not.toBeInTheDocument()
    })

    it('leaves every row collapsed when expandedIndex is omitted', () => {
      render(<SessionRail {...baseProps} exercises={withSets} />)
      expect(screen.queryByText('SET')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SessionRail {...baseProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
