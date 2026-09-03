import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActiveWorkoutPage, type ActiveWorkoutExercise } from './ActiveWorkoutPage'
import type { SetRowProps } from './SetRow'

const velocities = (base: number): number[] =>
  Array.from({ length: 8 }, (_, i) => Number((base - i * 0.03).toFixed(2)))

// logged sets are done; the next set is being performed (live, a couple reps in);
// the remainder are planned todo. Mirrors an active workout mid-set.
function activeSets(weight: number, logged: number, total: number): SetRowProps[] {
  return Array.from({ length: total }, (_, i) => {
    const setNumber = i + 1
    if (setNumber <= logged) {
      return {
        state: 'done' as const,
        setNumber,
        reps: 8,
        weight,
        rpe: 7.5 + setNumber * 0.5,
        unit: 'lbs' as const,
        velocities: velocities(0.74 - (setNumber - 1) * 0.03),
      }
    }
    if (setNumber === logged + 1) {
      return {
        state: 'live' as const,
        setNumber,
        unit: 'lbs' as const,
        target: { reps: 8, weight },
        reps: 8,
        weight,
        velocities: velocities(0.7).slice(0, 3),
      }
    }
    return {
      state: 'todo' as const,
      setNumber,
      unit: 'lbs' as const,
      target: { reps: 8, weight },
    }
  })
}

const exercises: ActiveWorkoutExercise[] = [
  {
    id: 'warmup',
    name: 'Band Pull-Apart',
    status: 'completed',
    unit: 'lbs',
    totalPlannedSets: 2,
    summary: { sets: 2, reps: 15, weight: 0, unit: 'lbs' },
    setVelocities: [velocities(0.9), velocities(0.88)],
  },
  {
    id: 'bench',
    name: 'Barbell Bench Press',
    status: 'active',
    unit: 'lbs',
    totalPlannedSets: 4,
    tempo: [3, 1, 1, 0],
    setVelocities: [velocities(0.72), velocities(0.68)],
    sets: activeSets(195, 2, 4),
  },
  {
    id: 'incline-db',
    name: 'Incline DB Press',
    status: 'upcoming',
    unit: 'lbs',
    totalPlannedSets: 3,
    prescription: '3 × 10 @ RPE 8',
    previousBest: 'Last: 70 lbs',
    supersetId: 'ss1',
  },
  {
    id: 'lateral-raise',
    name: 'Cable Lateral Raise',
    status: 'upcoming',
    unit: 'lbs',
    totalPlannedSets: 3,
    prescription: '3 × 15 @ RPE 9',
    previousBest: 'Last: 20 lbs',
    supersetId: 'ss1',
  },
  {
    id: 'triceps',
    name: 'Rope Pushdown',
    status: 'upcoming',
    unit: 'lbs',
    totalPlannedSets: 3,
    prescription: '3 × 12 @ RPE 9',
    previousBest: 'Last: 55 lbs',
  },
]

const meta: Meta<typeof ActiveWorkoutPage> = {
  title: 'Pages/Active Workout',
  component: ActiveWorkoutPage,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    title: 'Push Day A',
    subtitle: 'Hypertrophy · Week 6 of 8',
    exercises,
    supersets: [{ id: 'ss1', label: 'SS1', color: '#22D3EE' }],
    input: { reps: '8', weight: '195' },
    rest: { totalSeconds: 120, elapsedMs: 42_000, nextSetInfo: 'Set 3 · 8 × 195 lbs' },
  },
}

export default meta
type Story = StoryObj<typeof ActiveWorkoutPage>

export const Default: Story = {}

export const Resting: Story = {
  args: { initialResting: true },
}

export const AllCollapsed: Story = {
  args: {
    exercises: exercises.map((exercise) =>
      exercise.status === 'active' ? { ...exercise, status: 'completed' } : exercise
    ),
    input: undefined,
  },
}
