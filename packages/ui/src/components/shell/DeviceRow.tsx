import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../utils/cn'
import { Indicator, type IndicatorColor } from '../ui/indicator'

export type DeviceRowState = 'connected' | 'available' | 'degraded' | 'lost'

export interface Device {
  /** Stable device id (e.g. "Voltra-A3F2"). */
  id: string
  /** User-assigned slot/device name (e.g. "Left Cable"). */
  nickname: string
  /** Bound slot, or null when unbound/available (used for the menu's bound/available tally). */
  slot?: 'L' | 'R' | null
  /** Connection/availability state → the status dot color. */
  state: DeviceRowState
}

export interface DeviceRowProps extends ViewProps {
  device: Device
  onPress?: () => void
  className?: string
}

const stateColor: Record<DeviceRowState, IndicatorColor> = {
  connected: 'success-vivid',
  available: 'info',
  degraded: 'warning',
  lost: 'error-vivid',
}

/**
 * One device in the DeviceMenu: status dot · name · Bluetooth id. The dot color
 * carries the connection state (no redundant status text); the name is the one
 * slot label (no duplicate slot badge). S1 · DeviceRow.
 */
export function DeviceRow({ device, onPress, className, ...props }: DeviceRowProps) {
  const Wrapper = onPress ? Pressable : View
  return (
    <Wrapper
      {...(onPress ? { onPress, accessibilityRole: 'button' } : {})}
      className={cn('flex-row items-center gap-[10px] px-2 py-[9px] rounded-[7px]', className)}
      {...props}
    >
      <Indicator size="md" color={stateColor[device.state]} />
      <Text
        className={cn(
          'flex-1 font-bold text-[12px]',
          device.slot ? 'text-text-primary' : 'text-text-secondary'
        )}
      >
        {device.nickname}
      </Text>
      <Text className="font-mono text-[10px] text-text-tertiary">{device.id}</Text>
    </Wrapper>
  )
}
