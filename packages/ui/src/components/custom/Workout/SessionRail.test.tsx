import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Text } from 'react-native'
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
]

const baseProps = {
  title: 'Pull A · Intensification',
  status: 'ex 3/5 · set 2 live',
  exercises,
}

describe('SessionRail', () => {
  it('renders the session title', () => {
    render(<SessionRail {...baseProps} />)
    expect(screen.getByTestId('session-rail-title')).toHaveTextContent('Pull A · Intensification')
  })

  it('renders the mono status sub-line', () => {
    render(<SessionRail {...baseProps} />)
    expect(screen.getByTestId('session-rail-status')).toHaveTextContent('ex 3/5 · set 2 live')
  })

  it('omits the status line when no status is given', () => {
    render(<SessionRail title="Pull A" exercises={exercises} />)
    expect(screen.queryByTestId('session-rail-status')).not.toBeInTheDocument()
  })

  it('defaults the eyebrow to "Live session" with a live dot', () => {
    render(<SessionRail {...baseProps} />)
    expect(screen.getByTestId('session-rail-eyebrow')).toHaveTextContent('Live session')
    expect(screen.getByTestId('status-dot')).toBeInTheDocument()
  })

  it('hides the live dot when live is false', () => {
    render(<SessionRail {...baseProps} live={false} />)
    expect(screen.queryByTestId('status-dot')).not.toBeInTheDocument()
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

  describe('footer slot', () => {
    it('renders the footer when provided', () => {
      render(<SessionRail {...baseProps} footer={<Text>Session pace</Text>} />)
      expect(screen.getByTestId('session-rail-footer')).toHaveTextContent('Session pace')
    })

    it('renders no footer slot when absent', () => {
      render(<SessionRail {...baseProps} />)
      expect(screen.queryByTestId('session-rail-footer')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <SessionRail {...baseProps} footer={<Text>Session pace</Text>} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
