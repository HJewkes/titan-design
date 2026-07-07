import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../utils/cn'
import { Indicator, type IndicatorColor } from '../ui/indicator'
import { Pill } from '../ui/pill'

export type DeviceRowState = 'connected' | 'available' | 'degraded' | 'lost'

export interface Device {
  /** Stable device id (e.g. "Voltra-A3F2"). */
  id: string
  /** User-assigned nickname/label (e.g. "Left Cable"). */
  nickname: string
  /** Bound slot, or null when unbound/available. */
  slot?: 'L' | 'R' | null
  /** Connection/availability state. */
  state: DeviceRowState
}

export interface DeviceRowProps extends ViewProps {
  device: Device
  onPress?: () => void
  className?: string
}

const stateColor: Record<DeviceRowState, IndicatorColor> = {
  connected: 'success',
  available: 'info',
  degraded: 'warning',
  lost: 'error',
}
const stateLabel: Record<DeviceRowState, string> = {
  connected: 'connected',
  available: 'available',
  degraded: 'degraded',
  lost: 'lost',
}
const stateTextClass: Record<DeviceRowState, string> = {
  connected: 'text-status-success',
  available: 'text-status-info',
  degraded: 'text-status-warning',
  lost: 'text-status-error',
}

/**
 * One device in the DeviceMenu: status dot · nickname + slot badge · id ·
 * connection state. Composes Indicator + Pill. S1 · DeviceRow.
 */
export function DeviceRow({ device, onPress, className, ...props }: DeviceRowProps) {
  const Wrapper = onPress ? Pressable : View
  const bound = device.slot ? `SLOT ${device.slot}` : 'unbound'
  return (
    <Wrapper
      {...(onPress ? { onPress, accessibilityRole: 'button' } : {})}
      className={cn('flex-row items-center gap-[10px] px-2 py-[9px] rounded-[7px]', className)}
      {...props}
    >
      <Indicator size="md" color={stateColor[device.state]} />
      <View className="flex-1">
        <View className="flex-row items-center gap-[6px]">
          <Text
            className={cn(
              'font-bold text-[12px]',
              device.slot ? 'text-text-primary' : 'text-text-secondary'
            )}
          >
            {device.nickname}
          </Text>
          <Pill size="xs" variant="outline" color="default">
            {bound}
          </Pill>
        </View>
        <Text className="font-mono text-[10px] text-text-tertiary">{device.id}</Text>
      </View>
      <Text className={cn('font-mono text-[10px]', stateTextClass[device.state])}>
        {stateLabel[device.state]}
      </Text>
    </Wrapper>
  )
}
