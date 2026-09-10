import type { Meta, StoryObj } from '@storybook/react-vite'
import { SupersetWrapper } from './SupersetWrapper'
import { ExerciseCard } from './ExerciseCard'
import { Card } from '../../ui/card'
import { Typography } from '../Typography'
import { Surface } from '../../ui/surface'
import { resolveColor } from '../../../theme/resolve-color'

const meta: Meta<typeof SupersetWrapper> = {
  title: 'Custom/Workout/SupersetWrapper',
  component: SupersetWrapper,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Surface level="background" style={{ maxWidth: 400, padding: 16 }}>
        <Story />
      </Surface>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SupersetWrapper>

/** Stand-in for a real exercise row: a filled Card on the wrapper's own plane. */
function DemoExercise({ name }: { name: string }) {
  return (
    <Card variant="filled" elevation={1} className="p-3">
      <Typography variant="body2">{name}</Typography>
    </Card>
  )
}

export const Default: Story = {
  args: {
    children: (
      <>
        <DemoExercise name="Exercise A" />
        <DemoExercise name="Exercise B" />
      </>
    ),
  },
}

export const CustomLabel: Story = {
  args: {
    label: 'A1/A2',
    children: (
      <>
        <DemoExercise name="Exercise A1" />
        <DemoExercise name="Exercise A2" />
      </>
    ),
  },
}

export const CustomColor: Story = {
  args: {
    color: resolveColor('status-success'),
    children: (
      <>
        <DemoExercise name="Exercise A" />
        <DemoExercise name="Exercise B" />
      </>
    ),
  },
}

const supersetColor = resolveColor('brand-primary')

const exerciseA = {
  name: 'Bench Press',
  state: 'collapsed' as const,
  onToggle: () => {},
  summary: { sets: 3, reps: 8, weight: 185, unit: 'lbs' as const },
  supersetPosition: 'first' as const,
  supersetColor,
}

const exerciseB = {
  name: 'Bent Over Row',
  state: 'collapsed' as const,
  onToggle: () => {},
  summary: { sets: 3, reps: 8, weight: 155, unit: 'lbs' as const },
  supersetPosition: 'last' as const,
  supersetColor,
}

export const WithExerciseCards: Story = {
  args: {
    children: (
      <>
        <ExerciseCard {...exerciseA} />
        <ExerciseCard {...exerciseB} />
      </>
    ),
  },
}
