import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DumbbellIcon } from './icons'
import { BaseBadge } from './BaseBadge'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

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

const Label = ({ children, color = greyRamp[400] }: { children: string; color?: string }) => (
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
    children: <Label color={t['brand-primary']}>PR</Label>,
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'plain',
    icon: <DumbbellIcon size={12} color={greyRamp[400]} strokeWidth={2} />,
    children: <Label>225 lbs</Label>,
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <BaseBadge size="sm">
          <Label>225 lbs</Label>
        </BaseBadge>
        <BaseBadge size="md">
          <Label>225 lbs</Label>
        </BaseBadge>
        <BaseBadge size="lg">
          <Label>225 lbs</Label>
        </BaseBadge>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <BaseBadge variant="pr" size="sm">
          <Label color={t['brand-primary']}>PR</Label>
        </BaseBadge>
        <BaseBadge variant="pr" size="md">
          <Label color={t['brand-primary']}>PR</Label>
        </BaseBadge>
        <BaseBadge variant="pr" size="lg">
          <Label color={t['brand-primary']}>PR</Label>
        </BaseBadge>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <BaseBadge icon={<DumbbellIcon size={12} color={greyRamp[400]} strokeWidth={2} />}>
          <Label>225 lbs</Label>
        </BaseBadge>
      </View>
    </View>
  ),
}
