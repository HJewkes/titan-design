import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DateTime } from './DateTime'

const meta: Meta<typeof DateTime> = {
  title: 'Custom/DateTime',
  component: DateTime,
  tags: ['autodocs'],
  argTypes: {
    format: {
      control: 'select',
      options: ['date', 'time', 'datetime', 'relative', 'short', 'medium', 'long', 'full'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'inherit'],
    },
    isUTC: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof DateTime>

const now = Date.now()
const yesterday = now - 24 * 60 * 60 * 1000
const lastWeek = now - 7 * 24 * 60 * 60 * 1000
const nextWeek = now + 7 * 24 * 60 * 60 * 1000

export const Default: Story = {
  args: {
    value: now,
    format: 'datetime',
  },
}

export const AllFormats: Story = {
  render: () => {
    const date = new Date('2024-06-15T14:30:00')
    return (
      <View className="gap-3">
        <Row label="date" value={date} format="date" />
        <Row label="time" value={date} format="time" />
        <Row label="datetime" value={date} format="datetime" />
        <Row label="short" value={date} format="short" />
        <Row label="medium" value={date} format="medium" />
        <Row label="long" value={date} format="long" />
        <Row label="full" value={date} format="full" />
      </View>
    )
  },
}

function Row({ label, value, format }: { label: string; value: any; format: any }) {
  return (
    <View className="flex-row items-center">
      <Text className="w-24 text-text-secondary text-sm">{label}:</Text>
      <DateTime value={value} format={format} className="text-text-primary" />
    </View>
  )
}

export const RelativeTime: Story = {
  render: () => {
    const now = Date.now()
    const dates = [
      { label: '30 seconds ago', value: now - 30 * 1000 },
      { label: '5 minutes ago', value: now - 5 * 60 * 1000 },
      { label: '2 hours ago', value: now - 2 * 60 * 60 * 1000 },
      { label: 'Yesterday', value: now - 24 * 60 * 60 * 1000 },
      { label: 'Last week', value: now - 7 * 24 * 60 * 60 * 1000 },
      { label: 'Last month', value: now - 30 * 24 * 60 * 60 * 1000 },
      { label: 'Last year', value: now - 365 * 24 * 60 * 60 * 1000 },
      { label: 'In 2 hours', value: now + 2 * 60 * 60 * 1000 },
      { label: 'Tomorrow', value: now + 24 * 60 * 60 * 1000 },
      { label: 'Next week', value: now + 7 * 24 * 60 * 60 * 1000 },
    ]

    return (
      <View className="gap-2">
        {dates.map(({ label, value }) => (
          <View key={label} className="flex-row items-center">
            <Text className="w-32 text-text-secondary text-sm">{label}:</Text>
            <DateTime value={value} format="relative" className="text-text-primary" />
          </View>
        ))}
      </View>
    )
  },
}

export const Colors: Story = {
  render: () => (
    <View className="gap-2">
      <DateTime value={now} color="primary" />
      <DateTime value={now} color="secondary" />
      <DateTime value={now} color="tertiary" />
    </View>
  ),
}

export const UTCTime: Story = {
  render: () => (
    <View className="gap-3">
      <View>
        <Text className="text-text-secondary text-sm mb-1">Local Time:</Text>
        <DateTime value={now} format="datetime" className="text-text-primary" />
      </View>
      <View>
        <Text className="text-text-secondary text-sm mb-1">UTC Time:</Text>
        <DateTime value={now} format="datetime" isUTC className="text-text-primary" />
      </View>
    </View>
  ),
}

export const NullValue: Story = {
  render: () => (
    <View className="gap-2">
      <View className="flex-row items-center">
        <Text className="w-32 text-text-secondary text-sm">Default fallback:</Text>
        <DateTime value={null} className="text-text-primary" />
      </View>
      <View className="flex-row items-center">
        <Text className="w-32 text-text-secondary text-sm">Custom fallback:</Text>
        <DateTime value={undefined} fallback="Not set" className="text-text-primary" />
      </View>
    </View>
  ),
}

export const DifferentInputTypes: Story = {
  render: () => {
    const timestamp = 1718450400000 // June 15, 2024
    const dateObject = new Date(timestamp)
    const isoString = dateObject.toISOString()

    return (
      <View className="gap-3">
        <View>
          <Text className="text-text-secondary text-sm mb-1">Timestamp (number):</Text>
          <DateTime value={timestamp} format="medium" className="text-text-primary" />
        </View>
        <View>
          <Text className="text-text-secondary text-sm mb-1">Date object:</Text>
          <DateTime value={dateObject} format="medium" className="text-text-primary" />
        </View>
        <View>
          <Text className="text-text-secondary text-sm mb-1">ISO string:</Text>
          <DateTime value={isoString} format="medium" className="text-text-primary" />
        </View>
      </View>
    )
  },
}

export const UsageExample: Story = {
  render: () => {
    const items = [
      { title: 'Project kickoff meeting', date: now - 3 * 24 * 60 * 60 * 1000 },
      { title: 'Design review', date: now - 1 * 24 * 60 * 60 * 1000 },
      { title: 'Sprint planning', date: now + 2 * 24 * 60 * 60 * 1000 },
      { title: 'Release deadline', date: now + 7 * 24 * 60 * 60 * 1000 },
    ]

    return (
      <View className="gap-2 p-4 bg-surface-elevated rounded-lg max-w-md">
        <Text className="text-lg font-semibold text-text-primary mb-2">Upcoming Events</Text>
        {items.map((item, index) => (
          <View key={index} className="flex-row justify-between items-center py-2 border-b border-border-default">
            <Text className="text-text-primary">{item.title}</Text>
            <DateTime value={item.date} format="relative" color="secondary" className="text-sm" />
          </View>
        ))}
      </View>
    )
  },
}
