import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ExerciseDetailPage,
  type ExerciseDetailEntry,
  type ExerciseTrend,
  type ExerciseVbt,
} from './ExerciseDetailPage'
import type { MesoStatusCardProps } from './MesoStatusCard'
import type { SetRowProps } from './SetRow'

const meso: MesoStatusCardProps = {
  mesoName: 'Hypertrophy Block',
  mesoSubtitle: 'Week 6 of 8 · Push/Pull/Legs',
  statusBadge: { label: 'On Track', variant: 'success' },
  metrics: [
    { label: 'Prescribed', value: '4×8 @ RPE 8' },
    { label: 'Actual', value: '4×8 @ 195 lbs' },
    { label: 'Best e1RM', value: '248 lbs' },
    { label: 'Sessions', value: '11' },
  ],
  gauges: [
    { label: 'Intensity', level: 0.72, sublabel: 'Actual' },
    { label: 'Volume', level: 0.6, sublabel: 'Weekly' },
  ],
  coaching: {
    text: 'Bar speed is holding — add 5 lbs next session before the deload.',
    highlights: ['add 5 lbs'],
  },
  nextTarget: { icon: '🎯', text: '200 lbs × 8 @ RPE 8' },
}

function historySets(weight: number, topRpe: number): SetRowProps[] {
  return [1, 2, 3, 4].map((setNumber) => ({
    mode: 'history' as const,
    setNumber,
    previous: { reps: 8, weight: weight - 5 },
    reps: 8,
    weight,
    rpe: topRpe - (4 - setNumber) * 0.5,
    unit: 'lbs' as const,
  }))
}

const progression: ExerciseDetailEntry[] = [
  {
    id: 'w1',
    title: 'Week 1',
    summary: { sets: 4, reps: 8, weight: 175, unit: 'lbs' },
    e1rm: { value: 222, unit: 'lbs' },
    tempo: [3, 1, 1, 0],
    sets: historySets(175, 7.5),
  },
  {
    id: 'w2',
    title: 'Week 2',
    summary: { sets: 4, reps: 8, weight: 180, unit: 'lbs' },
    e1rm: { value: 228, unit: 'lbs' },
    tempo: [3, 1, 1, 0],
    sets: historySets(180, 8),
  },
  {
    id: 'w3',
    title: 'Week 3',
    summary: { sets: 4, reps: 8, weight: 185, unit: 'lbs' },
    e1rm: { value: 235, unit: 'lbs' },
    tempo: [3, 1, 1, 0],
    sets: historySets(185, 8.5),
  },
  {
    id: 'w4',
    title: 'Week 4 · Deload',
    summary: { sets: 3, reps: 6, weight: 165, unit: 'lbs' },
    e1rm: { value: 205, unit: 'lbs' },
    sets: historySets(165, 6.5).slice(0, 3),
  },
  {
    id: 'w5',
    title: 'Week 5',
    summary: { sets: 4, reps: 8, weight: 190, unit: 'lbs' },
    e1rm: { value: 241, unit: 'lbs' },
    tempo: [3, 1, 1, 0],
    sets: historySets(190, 8.5),
  },
  {
    id: 'w6',
    title: 'Week 6',
    summary: { sets: 4, reps: 8, weight: 195, unit: 'lbs' },
    e1rm: { value: 248, unit: 'lbs' },
    isPR: true,
    tempo: [3, 1, 1, 0],
    sets: historySets(195, 9),
  },
]

const history: ExerciseDetailEntry[] = [
  {
    id: 's6',
    title: 'Mon, Jun 16',
    summary: { sets: 4, reps: 8, weight: 195, unit: 'lbs' },
    e1rm: { value: 248, unit: 'lbs' },
    isPR: true,
    tempo: [3, 1, 1, 0],
    sets: historySets(195, 9),
  },
  {
    id: 's5',
    title: 'Mon, Jun 9',
    summary: { sets: 4, reps: 8, weight: 190, unit: 'lbs' },
    e1rm: { value: 241, unit: 'lbs' },
    sets: historySets(190, 8.5),
  },
  {
    id: 's4',
    title: 'Mon, Jun 2 · Deload',
    summary: { sets: 3, reps: 6, weight: 165, unit: 'lbs' },
    e1rm: { value: 205, unit: 'lbs' },
    sets: historySets(165, 6.5).slice(0, 3),
  },
  {
    id: 's3',
    title: 'Mon, May 26',
    summary: { sets: 4, reps: 8, weight: 185, unit: 'lbs' },
    e1rm: { value: 235, unit: 'lbs' },
    sets: historySets(185, 8.5),
  },
  {
    id: 's2',
    title: 'Mon, May 19',
    summary: { sets: 4, reps: 8, weight: 180, unit: 'lbs' },
    e1rm: { value: 228, unit: 'lbs' },
    sets: historySets(180, 8),
  },
  {
    id: 's1',
    title: 'Mon, May 12',
    summary: { sets: 4, reps: 8, weight: 175, unit: 'lbs' },
    e1rm: { value: 222, unit: 'lbs' },
    sets: historySets(175, 7.5),
  },
]

const trend: ExerciseTrend = {
  data: [
    { date: '2026-05-12', e1rm: 222 },
    { date: '2026-05-19', e1rm: 228 },
    { date: '2026-05-26', e1rm: 235 },
    { date: '2026-06-02', e1rm: 231 },
    { date: '2026-06-09', e1rm: 241 },
    { date: '2026-06-16', e1rm: 248, isPR: true },
  ],
  projection: [
    { date: '2026-06-16', e1rm: 248 },
    { date: '2026-06-23', e1rm: 253 },
    { date: '2026-06-30', e1rm: 258 },
  ],
  mesoBoundaries: [{ date: '2026-06-02', label: 'Deload' }],
}

const vbt: ExerciseVbt = {
  band: [
    { date: '2026-05-12', bandLow: 40, bandHigh: 70 },
    { date: '2026-05-26', bandLow: 48, bandHigh: 78 },
    { date: '2026-06-09', bandLow: 55, bandHigh: 86 },
    { date: '2026-06-16', bandLow: 60, bandHigh: 92 },
  ],
  workouts: [
    { date: '2026-05-12', load: 52, status: 'within' },
    { date: '2026-05-26', load: 80, status: 'above' },
    { date: '2026-06-09', load: 68, status: 'within' },
    { date: '2026-06-16', load: 58, status: 'below' },
  ],
  projection: {
    withTraining: [
      { date: '2026-06-16', bandLow: 60, bandHigh: 92 },
      { date: '2026-06-23', bandLow: 64, bandHigh: 98 },
    ],
    withRest: [
      { date: '2026-06-16', bandLow: 60, bandHigh: 92 },
      { date: '2026-06-23', bandLow: 54, bandHigh: 84 },
    ],
  },
  sets: [
    { label: 'Set 1', velocities: [0.72, 0.7, 0.68, 0.66, 0.63, 0.6, 0.57, 0.54] },
    { label: 'Set 2', velocities: [0.7, 0.67, 0.64, 0.61, 0.58, 0.54, 0.5, 0.46] },
    { label: 'Set 3', velocities: [0.68, 0.64, 0.6, 0.56, 0.52, 0.47, 0.42, 0.38] },
    { label: 'Set 4', velocities: [0.65, 0.6, 0.55, 0.5, 0.44, 0.39, 0.34, 0.3] },
  ],
}

const meta: Meta<typeof ExerciseDetailPage> = {
  title: 'Pages/Exercise Detail',
  component: ExerciseDetailPage,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    exercise: {
      name: 'Barbell Bench Press',
      subtitle: 'Chest · Barbell',
      unit: 'lbs',
      currentE1rm: 248,
    },
    meso,
    trend,
    progression,
    history,
    vbt,
  },
}

export default meta
type Story = StoryObj<typeof ExerciseDetailPage>

export const Default: Story = {}

export const NoVbtData: Story = {
  args: {
    exercise: {
      name: 'Goblet Squat',
      subtitle: 'Quads · Dumbbell',
      unit: 'lbs',
      currentE1rm: 132,
    },
    vbt: { band: [], workouts: [], sets: [] },
  },
}
