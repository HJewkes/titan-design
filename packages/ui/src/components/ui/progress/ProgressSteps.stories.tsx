import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ProgressSteps } from './ProgressSteps'

const meta: Meta<typeof ProgressSteps> = {
  title: 'Components/Molecules/ProgressSteps',
  component: ProgressSteps,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    variant: 'rail',
    currentStep: 0,
    progress: 1.5,
    totalSteps: 4,
    labels: ['Plan', 'Build', 'Ship', 'Learn'],
    color: 'success',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'select', options: ['dots', 'rail'] },
    progress: { control: { type: 'range', min: 0, max: 5, step: 0.05 } },
    currentStep: { control: { type: 'number', min: 0 } },
    totalSteps: { control: { type: 'number', min: 1, max: 6 } },
    labels: { control: 'object' },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  decorators: [
    (Story) => (
      <View className="w-96">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule**. The `rail` variant draws each step as a done / active / pending chip, the ' +
          'state chips of [Pill](?path=/docs/components-atoms-pill--docs) re-expressed in tokens so a ' +
          'connector can fill part-way. Labels use the [Typography](?path=/docs/foundations-typography--docs) ' +
          'text tokens; the `dots` variant is [Progress](?path=/docs/components-molecules-progress--docs)’s ' +
          'step indicator. `progress` is a fractional position (0..totalSteps-1, clamped) that overrides ' +
          '`currentStep`. Over the half step after the position leaves a step, its chip fills while its ' +
          'colour turns from the brand colour to the done colour in OKLCH; the last step runs the same turn ' +
          'just before the end, so a finished rail reads done. Drag `progress` from 1 to 1.5 to see ' +
          'it. Under reduced motion the position snaps to the step it is heading for. No loading, empty ' +
          'or error state: it displays a position the consumer already has. No disabled state: it is ' +
          'not interactive.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProgressSteps>

export const Default: Story = {}
