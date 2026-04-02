import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { SupersetWrapper } from './SupersetWrapper'
import { ExerciseCard } from './ExerciseCard'

const meta: Meta<typeof SupersetWrapper> = {
  title: 'Custom/Workout/SupersetWrapper',
  component: SupersetWrapper,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <View style={{ maxWidth: 400, padding: 16, backgroundColor: '#121212' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SupersetWrapper>

export const Default: Story = {
  args: {
    children: (
      <>
        <View
          style={{
            padding: 12,
            backgroundColor: '#1C1C1C',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
            Exercise A
          </Text>
        </View>
        <View
          style={{
            padding: 12,
            backgroundColor: '#1C1C1C',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
            Exercise B
          </Text>
        </View>
      </>
    ),
  },
}

export const CustomLabel: Story = {
  args: {
    label: 'A1/A2',
    children: (
      <>
        <View
          style={{
            padding: 12,
            backgroundColor: '#1C1C1C',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
            Exercise A1
          </Text>
        </View>
        <View
          style={{
            padding: 12,
            backgroundColor: '#1C1C1C',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
            Exercise A2
          </Text>
        </View>
      </>
    ),
  },
}

export const CustomColor: Story = {
  args: {
    color: '#22C55E',
    children: (
      <>
        <View
          style={{
            padding: 12,
            backgroundColor: '#1C1C1C',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
            Exercise A
          </Text>
        </View>
        <View
          style={{
            padding: 12,
            backgroundColor: '#1C1C1C',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
            Exercise B
          </Text>
        </View>
      </>
    ),
  },
}

const exerciseA = {
  name: 'Bench Press',
  state: 'collapsed' as const,
  onToggle: () => {},
  summary: { sets: 3, reps: 8, weight: 185, unit: 'lbs' as const },
  supersetPosition: 'first' as const,
  supersetColor: '#FF7900',
}

const exerciseB = {
  name: 'Bent Over Row',
  state: 'collapsed' as const,
  onToggle: () => {},
  summary: { sets: 3, reps: 8, weight: 155, unit: 'lbs' as const },
  supersetPosition: 'last' as const,
  supersetColor: '#FF7900',
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
