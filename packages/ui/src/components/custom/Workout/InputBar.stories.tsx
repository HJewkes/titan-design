import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { InputBar } from './InputBar'

const meta: Meta<typeof InputBar> = {
  title: 'Workout/InputBar',
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
      <View style={{ width: 400, backgroundColor: '#111111' }}>
        <Story />
      </View>
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
