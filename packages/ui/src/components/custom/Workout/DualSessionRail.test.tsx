import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DualSessionRail, type DualSessionRailSlot } from './DualSessionRail'
import type { SessionRailExercise } from './SessionRail'

const leftExercises: SessionRailExercise[] = [
  {
    name: 'Standing Cable Curl',
    summary: { sets: 4, reps: 10, weight: 35, unit: 'lbs' },
    setStates: [{ status: 'done', velocities: [1, 0.9] }],
  },
]

const rightExercises: SessionRailExercise[] = [
  {
    name: 'Standing Cable Curl',
    summary: { sets: 4, reps: 10, weight: 35, unit: 'lbs' },
    setStates: [{ status: 'active', velocities: [0.7], planned: 10 }],
  },
]

const slots: [DualSessionRailSlot, DualSessionRailSlot] = [
  { label: 'Left Arm', exercises: leftExercises, setsDone: 1 },
  { label: 'Right Arm', exercises: rightExercises, setsDone: 0 },
]

describe('DualSessionRail', () => {
  it('renders one SessionRail column per slot', () => {
    render(<DualSessionRail slots={slots} />)
    expect(screen.getByTestId('dual-session-rail-slot-0')).toBeInTheDocument()
    expect(screen.getByTestId('dual-session-rail-slot-1')).toBeInTheDocument()
  })

  it('titles each column with its own slot label', () => {
    render(<DualSessionRail slots={slots} />)
    const left = screen.getByTestId('dual-session-rail-slot-0')
    const right = screen.getByTestId('dual-session-rail-slot-1')
    expect(within(left).getByTestId('session-rail-title')).toHaveTextContent('Left Arm')
    expect(within(right).getByTestId('session-rail-title')).toHaveTextContent('Right Arm')
  })

  it('keeps each slot’s set progress independent', () => {
    render(<DualSessionRail slots={slots} />)
    const left = screen.getByTestId('dual-session-rail-slot-0')
    const right = screen.getByTestId('dual-session-rail-slot-1')
    expect(within(left).getByTestId('session-rail-sets')).toHaveTextContent('1/4 sets')
    expect(within(right).getByTestId('session-rail-sets')).toHaveTextContent('0/4 sets')
  })

  it('renders one exercise heading per slot exercise list', () => {
    render(<DualSessionRail slots={slots} />)
    const left = screen.getByTestId('dual-session-rail-slot-0')
    const right = screen.getByTestId('dual-session-rail-slot-1')
    expect(within(left).getAllByTestId('exercise-card')).toHaveLength(leftExercises.length)
    expect(within(right).getAllByTestId('exercise-card')).toHaveLength(rightExercises.length)
  })

  it('fires onExercisePress with the slot index, exercise, and its index', () => {
    const onExercisePress = vi.fn()
    render(<DualSessionRail slots={slots} onExercisePress={onExercisePress} />)
    const right = screen.getByTestId('dual-session-rail-slot-1')
    fireEvent.click(within(right).getAllByTestId('exercise-card-header')[0])
    expect(onExercisePress).toHaveBeenCalledWith(1, rightExercises[0], 0)
  })

  it('shares the session clock across both slots', () => {
    render(<DualSessionRail slots={slots} elapsedMs={5 * 60 * 1000} budgetMs={20 * 60 * 1000} />)
    const left = screen.getByTestId('dual-session-rail-slot-0')
    const right = screen.getByTestId('dual-session-rail-slot-1')
    expect(within(left).getByText('5:00')).toBeInTheDocument()
    expect(within(right).getByText('5:00')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DualSessionRail slots={slots} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
