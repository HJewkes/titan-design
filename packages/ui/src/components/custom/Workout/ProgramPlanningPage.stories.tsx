import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgramPlanningPage, type PlanMeso } from './ProgramPlanningPage'
import type { ExerciseCardProps } from './ExerciseCard'
import type { WorkoutMuscleGroup } from './WorkoutCard'

const upperMuscles: WorkoutMuscleGroup[] = [
  { group: 'chest', label: 'Chest', volumeStatus: 'productive' },
  { group: 'front-delts', label: 'Front Delts', volumeStatus: 'maintenance' },
  { group: 'triceps', label: 'Triceps', volumeStatus: 'productive' },
]

const lowerMuscles: WorkoutMuscleGroup[] = [
  { group: 'quads', label: 'Quads', volumeStatus: 'over' },
  { group: 'glutes', label: 'Glutes', volumeStatus: 'productive' },
  { group: 'hamstrings', label: 'Hamstrings', volumeStatus: 'maintenance' },
]

const upperExercises: ExerciseCardProps[] = [
  {
    name: 'Barbell Bench Press',
    state: 'collapsed',
    onToggle: () => {},
    summary: { sets: 4, reps: 8, weight: 185, unit: 'lbs' },
    e1rm: { value: 235, unit: 'lbs' },
    isPR: true,
    setVelocities: [
      [1.05, 0.94, 0.82, 0.74],
      [0.98, 0.9, 0.8, 0.71],
    ],
    totalPlannedSets: 4,
  },
  {
    name: 'Incline Dumbbell Press',
    state: 'collapsed',
    onToggle: () => {},
    summary: { sets: 3, reps: 10, weight: 70, unit: 'lbs' },
    e1rm: { value: 92, unit: 'lbs' },
    totalPlannedSets: 3,
  },
  {
    name: 'Cable Triceps Pushdown',
    state: 'upcoming',
    onToggle: () => {},
    prescription: '3×12-15 @ RPE 8',
    previousBest: '50 lbs × 14',
  },
]

const lowerExercises: ExerciseCardProps[] = [
  {
    name: 'Back Squat',
    state: 'collapsed',
    onToggle: () => {},
    summary: { sets: 5, reps: 5, weight: 275, unit: 'lbs' },
    e1rm: { value: 335, unit: 'lbs' },
    totalPlannedSets: 5,
  },
  {
    name: 'Romanian Deadlift',
    state: 'upcoming',
    onToggle: () => {},
    prescription: '3×8-10 @ RPE 8',
    previousBest: '225 lbs × 9',
  },
  {
    name: 'Leg Press',
    state: 'upcoming',
    onToggle: () => {},
    prescription: '3×12 @ RPE 9',
    previousBest: '450 lbs × 12',
  },
]

function upperWorkout(
  id: string,
  date: string,
  status: 'completed' | 'today' | 'upcoming'
): PlanMeso['weeks'][number]['workouts'][number] {
  return {
    id,
    name: 'Upper A',
    date,
    duration: '52 min',
    status,
    muscleGroups: upperMuscles,
    totalSets: 18,
    totalVolume: 21400,
    unit: 'lbs',
    exercises: upperExercises,
  }
}

function lowerWorkout(
  id: string,
  date: string,
  status: 'completed' | 'today' | 'upcoming'
): PlanMeso['weeks'][number]['workouts'][number] {
  return {
    id,
    name: 'Lower A',
    date,
    duration: '58 min',
    status,
    muscleGroups: lowerMuscles,
    totalSets: 16,
    totalVolume: 28800,
    unit: 'lbs',
    exercises: lowerExercises,
  }
}

const accumulation: PlanMeso = {
  id: 'm1',
  name: 'Accumulation',
  goal: 'Hypertrophy',
  split: 'Upper/Lower',
  weekRange: 'Weeks 1-4',
  weekCount: 4,
  currentWeek: 3,
  status: 'current',
  volumeHeatmap: [
    { group: 'chest', percentage: 72 },
    { group: 'back', percentage: 85 },
    { group: 'legs', percentage: 90 },
    { group: 'shoulders', percentage: 55 },
    { group: 'arms', percentage: 60 },
  ],
  weeks: [
    {
      weekNumber: 1,
      intensityLevel: 0.5,
      intensityThreshold: 0.85,
      workouts: [
        upperWorkout('m1w1-u', 'Mon, Jun 2', 'completed'),
        lowerWorkout('m1w1-l', 'Wed, Jun 4', 'completed'),
      ],
    },
    {
      weekNumber: 2,
      intensityLevel: 0.62,
      intensityThreshold: 0.85,
      workouts: [
        upperWorkout('m1w2-u', 'Mon, Jun 9', 'completed'),
        lowerWorkout('m1w2-l', 'Wed, Jun 11', 'completed'),
      ],
    },
    {
      weekNumber: 3,
      intensityLevel: 0.74,
      intensityThreshold: 0.85,
      isCurrent: true,
      workouts: [
        upperWorkout('m1w3-u', 'Mon, Jun 16', 'today'),
        lowerWorkout('m1w3-l', 'Wed, Jun 18', 'upcoming'),
      ],
    },
    {
      weekNumber: 4,
      intensityLevel: 0.35,
      intensityThreshold: 0.85,
      isDeload: true,
      workouts: [
        upperWorkout('m1w4-u', 'Mon, Jun 23', 'upcoming'),
        lowerWorkout('m1w4-l', 'Wed, Jun 25', 'upcoming'),
      ],
    },
  ],
}

const intensification: PlanMeso = {
  id: 'm2',
  name: 'Intensification',
  goal: 'Strength',
  split: 'Push/Pull/Legs',
  weekRange: 'Weeks 5-7',
  weekCount: 3,
  status: 'upcoming',
  volumeHeatmap: [
    { group: 'chest', percentage: 60 },
    { group: 'back', percentage: 70 },
    { group: 'legs', percentage: 80 },
    { group: 'shoulders', percentage: 50 },
    { group: 'arms', percentage: 45 },
  ],
  weeks: [
    {
      weekNumber: 1,
      intensityLevel: 0.78,
      intensityThreshold: 0.9,
      workouts: [upperWorkout('m2w1-u', 'Mon, Jun 30', 'upcoming')],
    },
    {
      weekNumber: 2,
      intensityLevel: 0.86,
      intensityThreshold: 0.9,
      workouts: [lowerWorkout('m2w2-l', 'Mon, Jul 7', 'upcoming')],
    },
    {
      weekNumber: 3,
      intensityLevel: 0.92,
      intensityThreshold: 0.9,
      workouts: [upperWorkout('m2w3-u', 'Mon, Jul 14', 'upcoming')],
    },
  ],
}

const peak: PlanMeso = {
  id: 'm3',
  name: 'Peak',
  goal: 'Peaking',
  split: 'Full Body',
  weekRange: 'Weeks 8-9',
  weekCount: 2,
  status: 'upcoming',
  weeks: [
    {
      weekNumber: 1,
      intensityLevel: 0.95,
      intensityThreshold: 0.95,
      workouts: [upperWorkout('m3w1-u', 'Mon, Jul 21', 'upcoming')],
    },
    {
      weekNumber: 2,
      intensityLevel: 0.6,
      intensityThreshold: 0.95,
      isDeload: true,
      workouts: [lowerWorkout('m3w2-l', 'Mon, Jul 28', 'upcoming')],
    },
  ],
}

const accumulationDone: PlanMeso = {
  ...accumulation,
  id: 'm0',
  name: 'Base',
  status: 'completed',
  weekRange: 'Weeks -3-0',
}

const mesos: PlanMeso[] = [accumulationDone, accumulation, intensification, peak]

const meta: Meta<typeof ProgramPlanningPage> = {
  title: 'Custom/Workout/ProgramPlanningPage',
  component: ProgramPlanningPage,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { title: 'Program Plan', mesos },
}

export default meta
type Story = StoryObj<typeof ProgramPlanningPage>

export const Default: Story = {}

export const SingleMeso: Story = {
  args: { mesos: [accumulation] },
}
