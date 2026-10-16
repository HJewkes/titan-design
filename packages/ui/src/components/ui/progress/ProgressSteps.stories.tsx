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
          '`currentStep`. The bar into a step is the work on it: as the bar starts, the step turns from a ' +
          'grey ring to an orange one; its core fills with the bar; once the bar is full, the step completes, ' +
          'its colour turning from the brand colour to the done colour in OKLCH. Drag `progress` from 1 to 2 ' +
          'to see one step. Under reduced motion the position snaps to the end of the step being worked on. No loading, empty ' +
          'or error state: it displays a position the consumer already has. No disabled state: it is ' +
          'not interactive.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProgressSteps>

export const Default: Story = {}
