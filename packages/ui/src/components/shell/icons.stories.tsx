import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { VoltrasMark, BluetoothIcon } from './icons'

const meta: Meta = {
  title: 'Shell/TopBar/Icons',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atoms (leaf SVG icons).** No dependencies — these are composed by the shell molecules. ' +
          'Both inherit `currentColor`, so a wrapper text-color token drives their color.',
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
          <VoltrasMark size={28} color="currentColor" />
        </View>
      </Swatch>
      <Swatch label="BluetoothIcon">
        <View className="text-status-success-vivid">
          <BluetoothIcon size={28} color="currentColor" />
        </View>
      </Swatch>
    </View>
  ),
}
