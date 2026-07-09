import type { Meta, StoryObj } from '@storybook/react-vite'
import { TrainingStatusPage, type TrainingStatusMuscle } from './TrainingStatusPage'
import { MesoStatusCardProps } from './MesoStatusCard'
import { MuscleGroup } from './muscleTaxonomy'

const meso: MesoStatusCardProps = {
  mesoName: 'Hypertrophy Block',
  mesoSubtitle: 'Week 6 of 8 · Upper/Lower',
  statusBadge: { label: 'On Track', variant: 'success' },
  metrics: [
    { label: 'Weekly Volume', value: '112 sets' },
    { label: 'Avg Intensity', value: 'RPE 8.2' },
    { label: 'Sessions', value: '5 / 5' },
    { label: 'Deload', value: 'in 2 weeks' },
  ],
  gauges: [
    { label: 'Volume', level: 0.68, sublabel: 'Actual' },
    { label: 'Fatigue', level: 0.55, sublabel: 'Managed' },
  ],
  coaching: {
    text: 'Push volume on lagging back and rear delts before the deload.',
    highlights: ['back and rear delts'],
  },
  nextTarget: { icon: '🎯', text: 'Add 2 sets to pulling this week' },
}

const muscles: TrainingStatusMuscle[] = [
  {
    muscleGroup: MuscleGroup.CHEST,
    displayName: 'Chest',
    side: 'front',
    intensity: 0.72,
    volumeStatus: 'productive',
    weeklySets: 14,
    landmarks: { mev: 8, mav: 14, mrv: 20 },
    lastTrained: '2 days ago',
    weeklyHistory: [8, 10, 12, 11, 13, 14],
    contributingExercises: [
      { name: 'Barbell Bench Press', sets: 4, contributionWeight: 1 },
      { name: 'Incline Dumbbell Press', sets: 3, contributionWeight: 1 },
      { name: 'Cable Fly', sets: 3, contributionWeight: 0.75 },
    ],
    upcomingExercises: [{ name: 'Machine Chest Press', workoutName: 'Push B', sets: 3 }],
  },
  {
    muscleGroup: MuscleGroup.FRONT_DELTS,
    displayName: 'Front Delts',
    side: 'front',
    intensity: 0.45,
    volumeStatus: 'maintenance',
    weeklySets: 5,
    landmarks: { mev: 2, mav: 6, mrv: 10 },
    lastTrained: '2 days ago',
    weeklyHistory: [4, 5, 5, 5],
  },
  {
    muscleGroup: MuscleGroup.SIDE_DELTS,
    displayName: 'Side Delts',
    side: 'front',
    intensity: 0.6,
    volumeStatus: 'productive',
    weeklySets: 12,
    landmarks: { mev: 6, mav: 14, mrv: 22 },
    lastTrained: '1 day ago',
    weeklyHistory: [8, 9, 10, 11, 12],
  },
  {
    muscleGroup: MuscleGroup.BICEPS,
    displayName: 'Biceps',
    side: 'front',
    intensity: 0.3,
    volumeStatus: 'under',
    weeklySets: 3,
    landmarks: { mev: 4, mav: 10, mrv: 18 },
    lastTrained: '4 days ago',
    weeklyHistory: [2, 3, 3, 3],
  },
  {
    muscleGroup: MuscleGroup.ABS,
    displayName: 'Abs',
    side: 'front',
    intensity: 0.4,
    volumeStatus: 'maintenance',
    weeklySets: 6,
    landmarks: { mev: 0, mav: 8, mrv: 16 },
    lastTrained: '1 day ago',
  },
  {
    muscleGroup: MuscleGroup.QUADS,
    displayName: 'Quads',
    side: 'front',
    intensity: 0.95,
    volumeStatus: 'over',
    weeklySets: 20,
    landmarks: { mev: 6, mav: 12, mrv: 18 },
    lastTrained: 'today',
    weeklyHistory: [12, 14, 16, 18, 20],
    contributingExercises: [
      { name: 'Back Squat', sets: 5, contributionWeight: 1 },
      { name: 'Leg Press', sets: 4, contributionWeight: 0.85 },
    ],
  },
  {
    muscleGroup: MuscleGroup.LATS,
    displayName: 'Lats',
    side: 'back',
    intensity: 0.58,
    volumeStatus: 'productive',
    weeklySets: 11,
    landmarks: { mev: 8, mav: 14, mrv: 20 },
    lastTrained: '3 days ago',
    weeklyHistory: [7, 8, 9, 10, 11],
    contributingExercises: [
      { name: 'Pull-Up', sets: 4, contributionWeight: 1 },
      { name: 'Barbell Row', sets: 4, contributionWeight: 0.9 },
    ],
  },
  {
    muscleGroup: MuscleGroup.UPPER_BACK,
    displayName: 'Upper Back',
    side: 'back',
    intensity: 0.5,
    volumeStatus: 'maintenance',
    weeklySets: 8,
    landmarks: { mev: 6, mav: 12, mrv: 18 },
    lastTrained: '3 days ago',
  },
  {
    muscleGroup: MuscleGroup.REAR_DELTS,
    displayName: 'Rear Delts',
    side: 'back',
    intensity: 0.28,
    volumeStatus: 'under',
    weeklySets: 4,
    landmarks: { mev: 6, mav: 12, mrv: 18 },
    lastTrained: '5 days ago',
    weeklyHistory: [2, 3, 3, 4],
  },
  {
    muscleGroup: MuscleGroup.TRICEPS,
    displayName: 'Triceps',
    side: 'back',
    intensity: 0.65,
    volumeStatus: 'productive',
    weeklySets: 9,
    landmarks: { mev: 4, mav: 8, mrv: 14 },
    lastTrained: '2 days ago',
    weeklyHistory: [6, 7, 8, 9],
  },
  {
    muscleGroup: MuscleGroup.GLUTES,
    displayName: 'Glutes',
    side: 'back',
    intensity: 0.7,
    volumeStatus: 'productive',
    weeklySets: 10,
    landmarks: { mev: 4, mav: 10, mrv: 16 },
    lastTrained: 'today',
  },
  {
    muscleGroup: MuscleGroup.HAMSTRINGS,
    displayName: 'Hamstrings',
    side: 'back',
    intensity: 0.55,
    volumeStatus: 'productive',
    weeklySets: 9,
    landmarks: { mev: 4, mav: 10, mrv: 16 },
    lastTrained: 'today',
    weeklyHistory: [6, 7, 8, 9],
  },
  {
    muscleGroup: MuscleGroup.CALVES,
    displayName: 'Calves',
    side: 'back',
    intensity: 0.2,
    volumeStatus: 'under',
    weeklySets: 3,
    landmarks: { mev: 6, mav: 10, mrv: 16 },
    lastTrained: '6 days ago',
  },
]

const meta: Meta<typeof TrainingStatusPage> = {
  title: 'Pages/Training Status',
  component: TrainingStatusPage,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { title: 'Training Status', meso, muscles },
}

export default meta
type Story = StoryObj<typeof TrainingStatusPage>

export const Default: Story = {}

export const NeedsAttention: Story = {
  args: {
    meso: {
      ...meso,
      statusBadge: { label: 'Behind', variant: 'warning' },
      coaching: {
        text: 'Volume is trailing target — add a pulling session this week.',
        highlights: ['add a pulling session'],
      },
    },
    muscles: muscles.map((m) =>
      m.side === 'back'
        ? { ...m, volumeStatus: 'under', weeklySets: Math.max(2, m.weeklySets - 4) }
        : m
    ),
  },
}
