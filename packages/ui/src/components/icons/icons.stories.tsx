import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import {
  VoltrasMark,
  BluetoothIcon,
  DumbbellIcon,
  StarIcon,
  ActivityIcon,
  HistoryIcon,
  LayersIcon,
  PersonStandingIcon,
} from './icons'

const meta: Meta = {
  title: 'Foundations/Icons',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The shared icon primitive — 24×24 web-`<svg>` glyphs on a common `SvgIcon` base ' +
          '(a11y contract: titled → `role="img"`, untitled → `aria-hidden`; `currentColor` inheritance). ' +
          'Reusable design-system-wide (the shell, Workout badges, etc. compose these).',
      },
    },
  },
}
export default meta
type Story = StoryObj

function Swatch({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="items-center gap-2">
      {children}
      <Text className="font-mono text-[10px] text-text-tertiary">{label}</Text>
    </View>
  )
}

export const All: Story = {
  render: () => (
    <View className="flex-row gap-8 p-4 items-start">
      <Swatch label="VoltrasMark">
        <View className="text-brand-primary">
          <VoltrasMark size={28} />
        </View>
      </Swatch>
      <Swatch label="BluetoothIcon">
        <View className="text-status-success">
          <BluetoothIcon size={28} />
        </View>
      </Swatch>
      <Swatch label="DumbbellIcon">
        <View className="text-text-primary">
          <DumbbellIcon size={28} />
        </View>
      </Swatch>
      <Swatch label="StarIcon (fill)">
        <View className="text-brand-primary">
          <StarIcon size={28} fill="currentColor" />
        </View>
      </Swatch>
      <Swatch label="ActivityIcon">
        <View className="text-text-primary">
          <ActivityIcon size={28} />
        </View>
      </Swatch>
      <Swatch label="HistoryIcon">
        <View className="text-text-primary">
          <HistoryIcon size={28} />
        </View>
      </Swatch>
      <Swatch label="LayersIcon">
        <View className="text-text-primary">
          <LayersIcon size={28} />
        </View>
      </Swatch>
      <Swatch label="PersonStandingIcon">
        <View className="text-text-primary">
          <PersonStandingIcon size={28} />
        </View>
      </Swatch>
    </View>
  ),
}
