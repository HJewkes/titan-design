import { View, Text } from 'react-native'
import { cn } from '../../utils/cn'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { DeviceIndicator, type DeviceConnState } from './DeviceIndicator'
import { DeviceRow, type Device } from './DeviceRow'

export interface DeviceMenuProps {
  devices: Device[]
  /** Controlled open state (optional — uncontrolled otherwise). */
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onSelectDevice?: (device: Device) => void
  className?: string
}

/** Aggregate the bound devices into a single glyph state (worst-of). */
function aggregateStatus(devices: Device[]): { status: DeviceConnState; alert: boolean } {
  const bound = devices.filter((d) => d.slot)
  if (bound.some((d) => d.state === 'lost')) return { status: 'lost', alert: true }
  if (bound.some((d) => d.state === 'degraded')) return { status: 'degraded', alert: false }
  return { status: 'connected', alert: false }
}

/**
 * The device glyph + its dropdown of individual devices (availability, slot
 * binding, id, connection state). Composes Popover + DeviceIndicator +
 * DeviceRow. S1 · DeviceMenu.
 */
export function DeviceMenu({
  devices,
  isOpen,
  onOpenChange,
  onSelectDevice,
  className,
}: DeviceMenuProps) {
  const { status, alert } = aggregateStatus(devices)
  const boundCount = devices.filter((d) => d.slot).length
  const availCount = devices.filter((d) => !d.slot).length

  return (
    <Popover placement="bottom" isOpen={isOpen} onOpenChange={onOpenChange} className={className}>
      <PopoverTrigger>
        <DeviceIndicator status={status} alert={alert} />
      </PopoverTrigger>
      <PopoverContent className="right-0 left-auto mt-[10px] w-[326px] bg-surface-elevated border border-border-strong rounded-[10px] p-[7px]">
        <Text className="font-mono text-[9px] tracking-[0.8px] uppercase text-text-tertiary px-2 pt-[6px] pb-2">
          Devices — {boundCount} bound · {availCount} available
        </Text>
        {devices.map((device, i) => (
          <View key={device.id} className={cn(i > 0 && 'border-t border-border')}>
            <DeviceRow
              device={device}
              onPress={onSelectDevice ? () => onSelectDevice(device) : undefined}
            />
          </View>
        ))}
      </PopoverContent>
    </Popover>
  )
}
