import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RestTimer } from './RestTimer'

const meta: Meta<typeof RestTimer> = {
  title: 'Custom/Workout/RestTimer',
  component: RestTimer,
  tags: ['autodocs'],
  argTypes: {
    totalSeconds: {
      control: 'number',
      description: 'Total rest duration in seconds',
    },
    elapsedMs: {
      control: 'number',
      description: 'Elapsed time in milliseconds',
    },
    visible: {
      control: 'boolean',
      description: 'Whether the timer is visible',
    },
    nextSetInfo: {
      control: 'text',
      description: 'Context about the next set',
    },
  },
}

export default meta
type Story = StoryObj<typeof RestTimer>

export const Default: Story = {
  args: {
    totalSeconds: 150,
    elapsedMs: 30000,
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
}

export const NearlyComplete: Story = {
  args: {
    totalSeconds: 150,
    elapsedMs: 145000,
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
}

export const WithNextSetInfo: Story = {
  args: {
    totalSeconds: 150,
    elapsedMs: 30000,
    onSkip: () => {},
    onAddTime: () => {},
    nextSetInfo: 'Bench Press — Set 3 of 4',
    visible: true,
  },
}

export const JustStarted: Story = {
  args: {
    totalSeconds: 150,
    elapsedMs: 0,
    onSkip: () => {},
    onAddTime: () => {},
    visible: true,
  },
}
