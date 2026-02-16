import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonListItem,
} from './Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circle', 'rect', 'rounded'],
    },
    animation: {
      control: 'select',
      options: ['pulse', 'shimmer', 'none'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  args: {
    variant: 'text',
    width: 200,
  },
}

export const TextVariant: Story = {
  render: () => (
    <View style={{ gap: 8, width: 300 }}>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
    </View>
  ),
}

export const CircleVariant: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Skeleton variant="circle" width={32} height={32} />
      <Skeleton variant="circle" width={48} height={48} />
      <Skeleton variant="circle" width={64} height={64} />
    </View>
  ),
}

export const RectVariant: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Skeleton variant="rect" width={200} height={100} />
      <Skeleton variant="rect" width={200} height={100} borderRadius={8} />
    </View>
  ),
}

export const RoundedVariant: Story = {
  render: () => (
    <Skeleton variant="rounded" width={300} height={200} />
  ),
}

export const TextBlock: Story = {
  render: () => (
    <View style={{ width: 300 }}>
      <SkeletonText lines={4} />
    </View>
  ),
}

export const Avatar: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <SkeletonCircle size={40} />
      <SkeletonCircle size={48} />
      <SkeletonCircle size={56} />
    </View>
  ),
}

export const CardSkeleton: Story = {
  render: () => (
    <View style={{ width: 300 }}>
      <SkeletonCard />
    </View>
  ),
}

export const CardWithoutImage: Story = {
  render: () => (
    <View style={{ width: 300 }}>
      <SkeletonCard hasImage={false} />
    </View>
  ),
}

export const ListItemSkeleton: Story = {
  render: () => (
    <View style={{ width: 350 }}>
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
    </View>
  ),
}

export const ListWithoutAvatar: Story = {
  render: () => (
    <View style={{ width: 350 }}>
      <SkeletonListItem hasAvatar={false} />
      <SkeletonListItem hasAvatar={false} />
      <SkeletonListItem hasAvatar={false} />
    </View>
  ),
}

export const NoAnimation: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Skeleton variant="text" width={200} animation="none" />
      <SkeletonCircle size={48} animation="none" />
      <Skeleton variant="rounded" width={200} height={100} animation="none" />
    </View>
  ),
}

export const ComposedExample: Story = {
  render: () => (
    <View className="w-[400px] p-4 bg-surface-elevated rounded-xl">
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <SkeletonCircle size={56} />
        <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </View>
      </View>
      <SkeletonText lines={3} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <Skeleton variant="rounded" width={80} height={36} />
        <Skeleton variant="rounded" width={80} height={36} />
      </View>
    </View>
  ),
}
