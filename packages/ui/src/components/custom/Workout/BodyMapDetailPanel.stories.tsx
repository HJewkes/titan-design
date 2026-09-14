import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import {
  BodyMapDetailPanel,
  type ContributingExercise,
  type UpcomingExercise,
} from './BodyMapDetailPanel'
import { BodyMap, type BodyMapData } from './BodyMap'
import { MuscleGroup } from './muscleTaxonomy'
import {
  bilateralStrength,
  emptyPlan,
  emptyStrength,
  singleExercisePlan,
  singleExerciseStrength,
} from './muscle-sections-fixture'
import { Surface } from '../../ui/surface'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

/** Story frames. `frame` in a story's parameters overrides the phone default. */
const PHONE_FRAME = { height: 640, width: 380 }
const WALL_FRAME = { height: 800, width: 1200 }

const contributing: ContributingExercise[] = [
  { name: 'Barbell Bench Press', sets: 4, contributionWeight: 1 },
  { name: 'Incline Dumbbell Press', sets: 3, contributionWeight: 1 },
  { name: 'Cable Fly', sets: 3, contributionWeight: 0.75 },
  { name: 'Overhead Press', sets: 2, contributionWeight: 0.33 },
]

const upcoming: UpcomingExercise[] = [
  { name: 'Dips', workoutName: 'Push B', sets: 3 },
  { name: 'Machine Chest Press', workoutName: 'Push B', sets: 3 },
]

const meta: Meta<typeof BodyMapDetailPanel> = {
  title: 'Custom/Workout/DataViz/BodyMapDetailPanel',
  component: BodyMapDetailPanel,
  parameters: {
    docs: {
      description: {
        component:
          'Composes **Badge** · **DataRow** · **Sparkline** · **StrengthTrendChart** · ' +
          '**PrBadge** · **MuscleGroup**.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const frame = (context.parameters.frame ?? PHONE_FRAME) as typeof PHONE_FRAME
      return (
        <Surface level="base" style={{ position: 'relative', ...frame }}>
          <Story />
        </Surface>
      )
    },
  ],
  argTypes: {
    displayName: { control: 'text', description: 'Human-readable muscle name' },
    weeklySets: { control: 'number', description: 'Weekly effective sets logged' },
    volumeStatus: {
      control: 'select',
      options: ['untrained', 'behind', 'ontrack', 'target', 'approaching', 'over'],
      description: 'Volume status relative to landmarks',
    },
    placement: {
      control: 'inline-radio',
      options: ['bottom', 'right'],
      description: 'Bottom slide-up sheet (phone) or right side-sheet (wall)',
    },
    isOpen: { control: 'boolean', description: 'Whether the sheet is visible' },
    lastTrained: { control: 'text', description: 'Last trained label' },
  },
}

export default meta
type Story = StoryObj<typeof BodyMapDetailPanel>

export const Default: Story = {
  args: {
    muscleGroup: MuscleGroup.CHEST,
    displayName: 'Chest',
    weeklySets: 14,
    landmarks: { mev: 8, mav: 14, mrv: 20 },
    volumeStatus: 'target',
    lastTrained: '2 days ago',
    weeklyHistory: [8, 10, 12, 11, 13, 14],
    contributingExercises: contributing,
    upcomingExercises: upcoming,
    isOpen: true,
    onClose: () => {},
    onViewExercises: () => {},
  },
}

export const UnderTrained: Story = {
  args: {
    ...Default.args,
    displayName: 'Rear Delts',
    muscleGroup: MuscleGroup.REAR_DELTS,
    weeklySets: 4,
    landmarks: { mev: 6, mav: 12, mrv: 18 },
    volumeStatus: 'behind',
    weeklyHistory: [2, 3, 3, 4],
  },
}

export const Maintenance: Story = {
  args: {
    ...Default.args,
    displayName: 'Biceps',
    muscleGroup: MuscleGroup.BICEPS,
    weeklySets: 8,
    landmarks: { mev: 4, mav: 10, mrv: 18 },
    volumeStatus: 'ontrack',
  },
}

export const Productive: Story = {
  args: { ...Default.args },
}

export const OverReaching: Story = {
  args: {
    ...Default.args,
    displayName: 'Quads',
    muscleGroup: MuscleGroup.QUADS,
    weeklySets: 20,
    landmarks: { mev: 6, mav: 12, mrv: 18 },
    volumeStatus: 'over',
    weeklyHistory: [12, 14, 16, 18, 20],
  },
}

export const Minimal: Story = {
  args: {
    muscleGroup: MuscleGroup.CALVES,
    displayName: 'Calves',
    weeklySets: 10,
    landmarks: { mev: 6, mav: 10, mrv: 16 },
    volumeStatus: 'ontrack',
    isOpen: true,
    onClose: () => {},
  },
}

export const WithoutHistory: Story = {
  args: {
    ...Default.args,
    weeklyHistory: undefined,
  },
}

export const WithoutUpcoming: Story = {
  args: {
    ...Default.args,
    upcomingExercises: [],
  },
}

function InteractiveBodyMapDetailPanel() {
  const [open, setOpen] = useState(false)
  return (
    <View
      style={{
        position: 'relative',
        height: 640,
        width: 380,
        backgroundColor: t['background-frame'],
        padding: 16,
      }}
    >
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={{
          alignSelf: 'flex-start',
          backgroundColor: t['brand-primary'],
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 8,
        }}
      >
        <Text
          style={{
            color: primitiveColors.white,
            fontWeight: '700',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Tap Chest
        </Text>
      </Pressable>
      <BodyMapDetailPanel
        muscleGroup={MuscleGroup.CHEST}
        displayName="Chest"
        weeklySets={14}
        landmarks={{ mev: 8, mav: 14, mrv: 20 }}
        volumeStatus="target"
        lastTrained="2 days ago"
        weeklyHistory={[8, 10, 12, 11, 13, 14]}
        contributingExercises={contributing}
        upcomingExercises={upcoming}
        isOpen={open}
        onClose={() => setOpen(false)}
        onViewExercises={() => {}}
      />
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveBodyMapDetailPanel />,
}

const wallFigures: BodyMapData[] = [
  { muscleGroup: MuscleGroup.CHEST, intensity: 0.7, volumeStatus: 'target', weeklySets: 14 },
  { muscleGroup: MuscleGroup.LATS, intensity: 0.45, volumeStatus: 'behind', weeklySets: 6 },
  { muscleGroup: MuscleGroup.QUADS, intensity: 0.95, volumeStatus: 'over', weeklySets: 20 },
  { muscleGroup: MuscleGroup.BICEPS, intensity: 0.5, volumeStatus: 'ontrack', weeklySets: 8 },
]

/** The W1 glance: two figures in a row, which the side-sheet must never displace. */
function WallFigures() {
  return (
    <View style={{ flexDirection: 'row', gap: 24, padding: 24 }} testID="wall-figures">
      <BodyMap data={wallFigures} view="front" size="wall" mode="detailed" />
      <BodyMap data={wallFigures} view="back" size="wall" mode="detailed" />
    </View>
  )
}

export const RightSideSheetAtWall: Story = {
  parameters: {
    frame: WALL_FRAME,
    docs: {
      description: {
        story:
          'Family E winner: the drill arrives as a right side-sheet over a 1200-wide wall. ' +
          'The overlay is absolutely positioned, so the two figures keep the exact layout ' +
          'they have with the sheet closed.',
      },
    },
  },
  render: (args) => (
    <>
      <WallFigures />
      <BodyMapDetailPanel {...args} />
    </>
  ),
  args: {
    ...Default.args,
    displayName: 'Lats',
    muscleGroup: MuscleGroup.LATS,
    weeklySets: 6,
    landmarks: { mev: 8, mav: 14, mrv: 20 },
    volumeStatus: 'behind',
    lastTrained: '4 days ago',
    weeklyHistory: [9, 8, 7, 6],
    placement: 'right',
  },
}

export const RightSideSheetClosedAtWall: Story = {
  ...RightSideSheetAtWall,
  parameters: {
    frame: WALL_FRAME,
    docs: {
      description: {
        story:
          'The same wall with the sheet closed — the reference for "the figure does not move".',
      },
    },
  },
  args: { ...RightSideSheetAtWall.args, isOpen: false },
}

/**
 * The T4 sections at wall width, one data scenario per row of stories and both
 * placements per scenario. Everything else is held constant so the only thing
 * that varies between two stories is the payload or the dock.
 */
const sectionArgs = {
  ...Default.args,
  displayName: 'Lats',
  muscleGroup: MuscleGroup.LATS,
  weeklySets: 6,
  landmarks: { mev: 8, mav: 14, mrv: 20 },
  volumeStatus: 'behind' as const,
  lastTrained: '4 days ago',
  weeklyHistory: [9, 8, 7, 6],
  contributingExercises: undefined,
  upcomingExercises: undefined,
}

const wallStory = (args: Partial<Story['args']>, story: string): Story => ({
  parameters: { frame: WALL_FRAME, docs: { description: { story } } },
  args: { ...sectionArgs, ...args },
})

export const SectionsEmptyAtWall: Story = wallStory(
  { placement: 'bottom', strength: emptyStrength, plan: emptyPlan },
  'Empty state: no exercise has trained this muscle, so the strength and PR blocks ' +
    'drop out entirely and the plan block states the zero rather than hiding it.'
)

export const SectionsEmptyRightAtWall: Story = wallStory(
  { placement: 'right', strength: emptyStrength, plan: emptyPlan },
  'The same empty payload docked as the wall side-sheet.'
)

export const SectionsSingleExerciseAtWall: Story = wallStory(
  { placement: 'bottom', strength: singleExerciseStrength, plan: singleExercisePlan },
  'One exercise, side unknown: a mini StrengthTrendChart, its band caption, and a PR row. ' +
    'A single exercise can never reach agreement — one exercise has nothing to agree with.'
)

export const SectionsSingleExerciseRightAtWall: Story = wallStory(
  { placement: 'right', strength: singleExerciseStrength, plan: singleExercisePlan },
  'The single-exercise payload docked as the wall side-sheet.'
)

export const SectionsBilateralAtWall: Story = wallStory(
  { placement: 'bottom', strength: bilateralStrength, plan: singleExercisePlan },
  'A bilateral exercise renders ONE ROW PER SIDE. Pooling left and right into one ' +
    'strength number hides exactly the finding a per-side read exists to surface.'
)

export const SectionsBilateralRightAtWall: Story = wallStory(
  { placement: 'right', strength: bilateralStrength, plan: singleExercisePlan },
  'The bilateral payload docked as the wall side-sheet — the W2 wireframe as specified.'
)

export const RightSideSheetAtPhone: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'What `placement="right"` degrades to at 390: the 320px minimum width swallows most ' +
          'of the screen. The component does NOT auto-switch — the plan puts the breakpoint in ' +
          'the caller ("the phone keeps the bottom sheet"), and a design-system sheet that ' +
          'sniffs the viewport would fight the shell that owns the stack. Phone callers pass ' +
          '`placement="bottom"`; see **Default**.',
      },
    },
  },
  args: { ...Default.args, placement: 'right' },
}
