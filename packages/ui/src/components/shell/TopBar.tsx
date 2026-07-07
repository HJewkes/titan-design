import { useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { cn } from '../../utils/cn'
import { surfaceGradient } from '../../theme/gradients'
import { Divider } from '../ui/divider'
import { DateTime } from '../custom/DateTime'
import { BrandLockup } from './BrandLockup'
import { SessionStatePill, type SessionState } from './SessionStatePill'
import { DeviceMenu } from './DeviceMenu'
import { type Device } from './DeviceRow'

export interface TopBarProps {
  /** Global session state → the status pill. */
  state: SessionState
  /** Devices for the connection glyph + dropdown. */
  devices: Device[]
  /** The moment to display in the clock (Date/timestamp). Omit for a live ticking clock. */
  time?: number | Date
  /** Brand subtitle. Default "wall dashboard". */
  subtitle?: string
  /** Force the subtitle on/off; defaults to container-responsive (hidden below ~1024px). */
  showSubtitle?: boolean
  /** Force the clock on/off; defaults to container-responsive (hidden below ~720px). */
  showClock?: boolean
  onSelectDevice?: (device: Device) => void
  className?: string
}

// SIZE-D01: responsiveness is container-driven (measured width), not a fixed size prop.
const SUBTITLE_MIN = 1024
const CLOCK_MIN = 720

/**
 * S1 · TopBar — the persistent shell chrome band. Brand (left) + a right cluster
 * of session state · device glyph · clock (clock edge-pinned so spacing stays
 * stable as the state text changes). Collapses subtitle then clock as its
 * container narrows.
 */
export function TopBar({
  state,
  devices,
  time,
  subtitle = 'wall dashboard',
  showSubtitle,
  showClock,
  onSelectDevice,
  className,
}: TopBarProps) {
  const [width, setWidth] = useState(SUBTITLE_MIN)
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)

  const subtitleVisible = showSubtitle ?? width >= SUBTITLE_MIN
  const clockVisible = showClock ?? width >= CLOCK_MIN

  return (
    <View
      onLayout={onLayout}
      // shared chrome gradient (web); solid bg-surface-elevated is the native fallback
      style={surfaceGradient.chrome() as object}
      className={cn(
        'h-[46px] flex-row items-center gap-[14px] px-4 bg-surface-elevated border-b border-border',
        className
      )}
    >
      <BrandLockup subtitle={subtitle} showSubtitle={subtitleVisible} />

      {/* right cluster — order: state · device · time (time pinned to the edge) */}
      <View className="ml-auto flex-row items-center gap-[12px]">
        <SessionStatePill state={state} />
        <Divider orientation="vertical" className="h-4 bg-border-prominent" />
        <DeviceMenu devices={devices} onSelectDevice={onSelectDevice} />
        {clockVisible ? (
          <>
            <Divider orientation="vertical" className="h-4 bg-border-prominent" />
            <DateTime
              value={time}
              live={time == null}
              format="time"
              hour12={false}
              variant="mono"
              color="secondary"
              className="text-[11px] min-w-[38px] text-right"
            />
          </>
        ) : null}
      </View>
    </View>
  )
}
