import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Dumbbell } from 'lucide-react'
import { BaseBadge } from './BaseBadge'

const meta: Meta<typeof BaseBadge> = {
  title: 'Custom/Workout/BaseBadge',
  component: BaseBadge,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['plain', 'pr'], description: 'Visual variant' },
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Badge size' },
    onPress: { action: 'pressed', description: 'Callback when tapped' },
  },
}

export default meta
type Story = StoryObj<typeof BaseBadge>

const Label = ({ children, color = '#9CA3AF' }: { children: string; color?: string }) => (
  <Text
    style={{
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: '600',
      fontSize: 10,
      color,
    }}
  >
    {children}
  </Text>
)

export const Plain: Story = {
  args: {
    variant: 'plain',
    children: <Label>225 lbs</Label>,
  },
}

export const Pr: Story = {
  args: {
    variant: 'pr',
    children: <Label color="#FF7900">PR</Label>,
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'plain',
    icon: <Dumbbell size={12} color="#9CA3AF" strokeWidth={2} />,
    children: <Label>225 lbs</Label>,
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <BaseBadge size="sm"><Label>225 lbs</Label></BaseBadge>
        <BaseBadge size="md"><Label>225 lbs</Label></BaseBadge>
        <BaseBadge size="lg"><Label>225 lbs</Label></BaseBadge>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <BaseBadge variant="pr" size="sm"><Label color="#FF7900">PR</Label></BaseBadge>
        <BaseBadge variant="pr" size="md"><Label color="#FF7900">PR</Label></BaseBadge>
        <BaseBadge variant="pr" size="lg"><Label color="#FF7900">PR</Label></BaseBadge>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <BaseBadge icon={<Dumbbell size={12} color="#9CA3AF" strokeWidth={2} />}>
          <Label>225 lbs</Label>
        </BaseBadge>
      </View>
    </View>
  ),
}
