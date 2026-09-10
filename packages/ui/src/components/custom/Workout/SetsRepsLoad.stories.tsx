import type { Meta, StoryObj } from '@storybook/react-vite'
import { SetsRepsLoad } from './SetsRepsLoad'
import { Surface } from '../../ui/surface'

/**
 * `SetsRepsLoad` — the `sets × reps @ load` prescription line in the TempoDisplay
 * visual language (Inter · 600 · letter-spacing 1 · value cells with muted
 * separators).
 */
const meta: Meta<typeof SetsRepsLoad> = {
  title: 'Custom/Workout/SetsRepsLoad',
  component: SetsRepsLoad,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** The `sets × reps @ load` prescription line in the TempoDisplay visual ' +
          'language. Composes [MetricCell](?path=/docs/custom-workout-metriccell--docs) ' +
          '(shared with [TempoDisplay](?path=/docs/custom-workout-tempodisplay--docs)). ' +
          'Used-by ↑ [ExerciseHeading](?path=/docs/custom-workout-exerciseheading--docs).',
      },
    },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ padding: 16 }}>
        <Story />
      </Surface>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SetsRepsLoad>

export const Default: Story = {
  args: { sets: 5, reps: 8, load: 145, unit: 'lb' },
}

export const RepRange: Story = {
  args: { sets: 3, reps: '15-20', load: 40, unit: 'lb' },
}

export const Kilograms: Story = {
  args: { sets: 4, reps: 6, load: 84, unit: 'kg' },
}
