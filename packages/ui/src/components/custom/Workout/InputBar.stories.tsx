import type { Meta, StoryObj } from '@storybook/react-vite'
import { InputBar } from './InputBar'
import { Surface } from '../../ui/surface'

const meta: Meta<typeof InputBar> = {
  title: 'Custom/Workout/InputBar',
  component: InputBar,
  tags: ['autodocs'],
  argTypes: {
    canRecord: {
      control: 'boolean',
      description: 'Whether the record button is enabled',
    },
    unit: {
      control: 'select',
      options: ['lbs', 'kg'],
      description: 'Weight unit',
    },
    visible: {
      control: 'boolean',
      description: 'Whether the input bar is visible',
    },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ width: 400 }}>
        <Story />
      </Surface>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof InputBar>

export const Default: Story = {
  args: {
    exerciseName: 'Bench Press',
    setNumber: 2,
    totalSets: 5,
    reps: '',
    weight: '',
    unit: 'lbs',
    onRepsChange: () => {},
    onWeightChange: () => {},
    onRecord: () => {},
    canRecord: true,
    visible: true,
  },
}

export const Disabled: Story = {
  args: {
    ...Default.args,
    canRecord: false,
  },
}

export const Kilograms: Story = {
  args: {
    ...Default.args,
    unit: 'kg',
    weight: '60',
    reps: '8',
  },
}

export const WithFilledValues: Story = {
  args: {
    ...Default.args,
    reps: '5',
    weight: '225',
  },
}
