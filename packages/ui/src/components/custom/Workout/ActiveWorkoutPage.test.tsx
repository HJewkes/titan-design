import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ActiveWorkoutPage,
  countCompletedSets,
  deriveWorkoutProgress,
  findActiveExercise,
  statusToCardState,
  groupExercises,
  type ActiveWorkoutExercise,
  type ActiveWorkoutPageProps,
} from './ActiveWorkoutPage'

const exercises: ActiveWorkoutExercise[] = [
  {
    id: 'warmup',
    name: 'Band Pull-Apart',
    status: 'completed',
    unit: 'lbs',
    totalPlannedSets: 2,
    summary: { sets: 2, reps: 15, weight: 0, unit: 'lbs' },
    setVelocities: [[0.9], [0.88]],
  },
  {
    id: 'bench',
    name: 'Barbell Bench Press',
    status: 'active',
    unit: 'lbs',
    totalPlannedSets: 4,
    setVelocities: [[0.72], [0.68]],
    sets: [
      { mode: 'completed', setNumber: 1, reps: 8, weight: 195, rpe: 8, unit: 'lbs' },
      { mode: 'active', setNumber: 3, reps: null, weight: null, unit: 'lbs', isNextSet: true },
    ],
  },
  {
    id: 'incline',
    name: 'Incline DB Press',
    status: 'upcoming',
    unit: 'lbs',
    totalPlannedSets: 3,
    prescription: '3 × 10',
    supersetId: 'ss1',
  },
  {
    id: 'lateral',
    name: 'Cable Lateral Raise',
    status: 'upcoming',
    unit: 'lbs',
    totalPlannedSets: 3,
    prescription: '3 × 15',
    supersetId: 'ss1',
  },
]

const baseProps: ActiveWorkoutPageProps = {
  title: 'Push Day A',
  subtitle: 'Week 6 of 8',
  exercises,
  supersets: [{ id: 'ss1', label: 'SS1', color: '#22D3EE' }],
  input: { reps: '8', weight: '195' },
  rest: { totalSeconds: 120, elapsedMs: 30_000, nextSetInfo: 'Set 3' },
}

describe('countCompletedSets', () => {
  it('uses logged velocities when present', () => {
    expect(countCompletedSets(exercises[1])).toBe(2)
  })

  it('falls back to the full plan for a completed exercise without velocities', () => {
    expect(countCompletedSets({ ...exercises[0], setVelocities: undefined })).toBe(2)
  })

  it('counts zero for an upcoming exercise', () => {
    expect(countCompletedSets(exercises[2])).toBe(0)
  })
})

describe('deriveWorkoutProgress', () => {
  it('rolls up completed exercises, sets, and the fraction', () => {
    const progress = deriveWorkoutProgress(exercises)
    expect(progress.completedExercises).toBe(1)
    expect(progress.totalExercises).toBe(4)
    expect(progress.completedSets).toBe(4)
    expect(progress.totalSets).toBe(12)
    expect(progress.fraction).toBeCloseTo(1 / 3)
  })

  it('is zeroed for an empty workout', () => {
    expect(deriveWorkoutProgress([])).toEqual({
      completedExercises: 0,
      totalExercises: 0,
      completedSets: 0,
      totalSets: 0,
      fraction: 0,
    })
  })
})

describe('findActiveExercise', () => {
  it('returns the active exercise', () => {
    expect(findActiveExercise(exercises)?.id).toBe('bench')
  })

  it('returns null when none are active', () => {
    expect(findActiveExercise([exercises[0]])).toBeNull()
  })
})

describe('statusToCardState', () => {
  it('keeps upcoming exercises upcoming regardless of focus', () => {
    expect(statusToCardState('upcoming', true)).toBe('upcoming')
    expect(statusToCardState('upcoming', false)).toBe('upcoming')
  })

  it('expands only the focused active/completed exercise', () => {
    expect(statusToCardState('active', true)).toBe('expanded')
    expect(statusToCardState('active', false)).toBe('collapsed')
    expect(statusToCardState('completed', true)).toBe('expanded')
  })
})

describe('groupExercises', () => {
  it('folds consecutive same-superset exercises into one group', () => {
    const groups = groupExercises(exercises, baseProps.supersets ?? [])
    expect(groups).toHaveLength(3)
    expect(groups[0]).toEqual({ type: 'single', exercise: exercises[0] })
    expect(groups[2].type).toBe('superset')
    if (groups[2].type === 'superset') {
      expect(groups[2].exercises).toHaveLength(2)
      expect(groups[2].superset.label).toBe('SS1')
    }
  })
})

describe('ActiveWorkoutPage', () => {
  it('renders the header, progress, and the focused active exercise expanded', () => {
    render(<ActiveWorkoutPage {...baseProps} />)
    expect(screen.getByTestId('active-workout-page')).toBeInTheDocument()
    expect(screen.getByTestId('active-workout-page-title')).toHaveTextContent('Push Day A')
    expect(screen.getByTestId('active-workout-page-progress-count')).toHaveTextContent('1/4')
    expect(screen.getByTestId('exercise-card-sets')).toBeInTheDocument()
    expect(screen.getByTestId('superset-wrapper')).toBeInTheDocument()
  })

  it('shows the input bar and hides it once a set is recorded (starts rest)', () => {
    render(<ActiveWorkoutPage {...baseProps} />)
    expect(screen.getByTestId('input-bar')).toBeInTheDocument()
    expect(screen.getByTestId('input-bar-set-info')).toHaveTextContent('Set 3/4')

    fireEvent.click(screen.getByTestId('input-bar-record'))
    expect(screen.queryByTestId('input-bar')).not.toBeInTheDocument()
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument()
  })

  it('zoom-toggles focus: collapsing the active card hides its sets', () => {
    render(<ActiveWorkoutPage {...baseProps} />)
    expect(screen.getByTestId('exercise-card-sets')).toBeInTheDocument()

    fireEvent.click(screen.getAllByTestId('exercise-card-header')[0])
    expect(screen.queryByTestId('exercise-card-sets')).not.toBeInTheDocument()
  })

  it('skipping rest restores the input bar', () => {
    render(<ActiveWorkoutPage {...baseProps} initialResting />)
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('rest-timer-skip'))
    expect(screen.getByTestId('input-bar')).toBeInTheDocument()
  })
})
