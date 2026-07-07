import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { TopBar } from './TopBar'
import { SessionStatePill } from './SessionStatePill'
import { DeviceMenu } from './DeviceMenu'
import { DeviceRow, type Device } from './DeviceRow'
import { BrandLockup } from './BrandLockup'

const DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]
const DEVICES_LOST: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'lost' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]

const meta: Meta<typeof TopBar> = {
  title: 'Shell/TopBar',
  component: TopBar,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof TopBar>

/** The resolved shipping bar — Live, set active. Click the device glyph to open the menu. */
export const Live: Story = {
  args: { state: 'live', devices: DEVICES, time: '16:12' },
}

/** All session states, plus a device-lost fault (glyph red + alert badge, state stays LIVE). */
export const States: Story = {
  render: () => (
    <View className="gap-2 bg-background-base p-3">
      <TopBar state="live" devices={DEVICES} time="16:12" />
      <TopBar state="rest" devices={DEVICES} time="16:14" />
      <TopBar state="idle" devices={DEVICES} time="16:31" />
      <TopBar state="live" devices={DEVICES_LOST} time="16:12" />
    </View>
  ),
}

/** Container-responsive (SIZE-D01): wall → tablet drops subtitle → phone drops clock. */
export const Responsive: Story = {
  render: () => (
    <View className="gap-3 bg-background-base p-3">
      <View style={{ width: 1280 }}>
        <TopBar state="live" devices={DEVICES} time="16:12" />
      </View>
      <View style={{ width: 820 }}>
        <TopBar state="live" devices={DEVICES} time="16:12" />
      </View>
      <View style={{ width: 390 }}>
        <TopBar state="live" devices={DEVICES} time="16:12" />
      </View>
    </View>
  ),
}

/** The sub-components S1 decomposes into (each shippable on its own). */
export const Parts: Story = {
  render: () => (
    <View className="gap-4 bg-background-base p-4">
      <View className="gap-1">
        <Text className="font-mono text-[10px] text-text-tertiary">BrandLockup</Text>
        <BrandLockup />
      </View>
      <View className="gap-1">
        <Text className="font-mono text-[10px] text-text-tertiary">
          SessionStatePill (= StatusPill)
        </Text>
        <View className="flex-row gap-4">
          <SessionStatePill state="live" />
          <SessionStatePill state="rest" />
          <SessionStatePill state="idle" />
        </View>
      </View>
      <View className="gap-1">
        <Text className="font-mono text-[10px] text-text-tertiary">DeviceMenu (click to open)</Text>
        <View className="flex-row">
          <DeviceMenu devices={DEVICES} />
        </View>
      </View>
      <View className="gap-1">
        <Text className="font-mono text-[10px] text-text-tertiary">DeviceRow</Text>
        <View className="w-[320px] bg-surface-elevated rounded-lg p-1">
          {DEVICES.map((d) => (
            <DeviceRow key={d.id} device={d} />
          ))}
        </View>
      </View>
    </View>
  ),
}
