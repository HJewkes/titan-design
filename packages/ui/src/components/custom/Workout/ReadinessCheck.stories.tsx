import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { ReadinessCheck, type ReadinessFactor } from './ReadinessCheck'

const FACTOR_SEED: Array<{ id: string; label: string; value: number }> = [
  { id: 'sleep', label: 'Sleep', value: 4 },
  { id: 'soreness', label: 'Soreness', value: 3 },
  { id: 'motivation', label: 'Motivation', value: 5 },
  { id: 'stress', label: 'Stress', value: 3 },
]

const staticFactors: ReadinessFactor[] = FACTOR_SEED.map((f) => ({
  ...f,
  onChange: () => {},
}))

const meta: Meta<typeof ReadinessCheck> = {
  title: 'Workout/ReadinessCheck',
  component: ReadinessCheck,
  tags: ['autodocs'],
  argTypes: {
    score: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Computed overall readiness score (0-100), colors the gauge',
    },
    warmUpCompleted: {
      control: 'boolean',
      description: 'Whether the VBT warm-up set has been performed',
    },
    onConfirm: {
      description: 'Called when the assessment is confirmed and the workout begins',
    },
  },
}

export default meta
type Story = StoryObj<typeof ReadinessCheck>

export const Default: Story = {
  args: {
    factors: staticFactors,
    score: 78,
    warmUpCompleted: false,
    onConfirm: () => {},
  },
}

export const HighReadiness: Story = {
  args: {
    ...Default.args,
    score: 92,
  },
}

export const LowReadiness: Story = {
  args: {
    ...Default.args,
    factors: FACTOR_SEED.map((f) => ({ ...f, value: 2, onChange: () => {} })),
    score: 34,
  },
}

export const WithWarmUpGood: Story = {
  args: {
    ...Default.args,
    score: 81,
    warmUpCompleted: true,
    warmUpValidation: {
      velocityDeficit: 3,
      recommendation: 'Velocity on target — proceed with the planned loads.',
      status: 'good',
    },
  },
}

export const WithWarmUpCaution: Story = {
  args: {
    ...Default.args,
    score: 52,
    warmUpCompleted: true,
    warmUpValidation: {
      velocityDeficit: 18,
      recommendation: 'Significant velocity loss — consider reducing load 5-10% today.',
      status: 'caution',
    },
  },
}

function InteractiveReadinessCheck() {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(FACTOR_SEED.map((f) => [f.id, f.value]))
  )

  const factors: ReadinessFactor[] = FACTOR_SEED.map((f) => ({
    id: f.id,
    label: f.label,
    value: values[f.id],
    onChange: (value) => setValues((prev) => ({ ...prev, [f.id]: value })),
  }))

  const score = useMemo(() => {
    const total = FACTOR_SEED.reduce((sum, f) => sum + values[f.id], 0)
    return Math.round((total / (FACTOR_SEED.length * 5)) * 100)
  }, [values])

  return (
    <View style={{ maxWidth: 420, padding: 16 }}>
      <ReadinessCheck
        factors={factors}
        score={score}
        warmUpCompleted
        warmUpValidation={{
          velocityDeficit: 6,
          recommendation: 'Velocity slightly down — warm up thoroughly before top sets.',
          status: 'moderate',
        }}
        onConfirm={() => {}}
      />
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveReadinessCheck />,
}
