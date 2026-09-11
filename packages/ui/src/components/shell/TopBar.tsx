import { Fragment, useState, type ReactNode } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { cn } from '../../utils/cn'
import { surfaceGradient } from '../../theme/gradients'
import { Divider } from '../ui/divider'
import { DateTime } from '../custom/DateTime'
import { BrandLockup } from './BrandLockup'
import { type BrandKey } from './brands'

export interface TopBarProps {
  /** Which app identity the default {@link BrandLockup} renders. */
  brand?: BrandKey
  /** Brand subtitle. Defaults to the brand preset's own. */
  subtitle?: string
  /** Force the subtitle on/off; defaults to container-responsive (hidden below ~1024px). */
  showSubtitle?: boolean
  /**
   * Replace the whole brand region. Wins over `brand` / `subtitle`, and opts out
   * of the responsive subtitle collapse — the node owns its own behaviour.
   */
  leading?: ReactNode
  /**
   * App chrome for the right cluster, left → right. An array is rendered with the
   * bar's own vertical dividers between the items, so an app supplies its
   * controls and the shell keeps the divider rhythm.
   */
  trailing?: ReactNode | ReactNode[]
  /** The moment to display in the clock (Date/timestamp). Omit for a live ticking clock. */
  time?: number | Date
  /** Force the clock on/off; defaults to container-responsive (hidden below ~720px). */
  showClock?: boolean
  className?: string
}

// SIZE-D01: responsiveness is container-driven (measured width), not a fixed size prop.
const SUBTITLE_MIN = 1024
const CLOCK_MIN = 720

function ClusterDivider() {
  return <Divider orientation="vertical" className="h-4 bg-border-prominent" />
}

/** Interleave the bar's divider between slot items, skipping empty slots. */
function dividedCluster(items: ReactNode[]) {
  return items
    .filter((item) => item !== null && item !== undefined && item !== false)
    .map((item, i) => (
      <Fragment key={i}>
        {i > 0 ? <ClusterDivider /> : null}
        {item}
      </Fragment>
    ))
}

/**
 * S1 · TopBar — the persistent shell chrome band, generic over the app. Brand
 * (left) + a `trailing` cluster of app-supplied chrome and the wall clock (clock
 * edge-pinned so spacing stays stable as the items' text changes). Collapses
 * subtitle then clock as its container narrows.
 *
 * @example
 * <TopBar brand="brain" trailing={[<IndexStatus />, <SearchScope />]} />
 */
export function TopBar({
  brand = 'voltras',
  subtitle,
  showSubtitle,
  leading,
  trailing,
  time,
  showClock,
  className,
}: TopBarProps) {
  const [width, setWidth] = useState(SUBTITLE_MIN)
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)

  const subtitleVisible = showSubtitle ?? width >= SUBTITLE_MIN
  const clockVisible = showClock ?? width >= CLOCK_MIN

  const clock = clockVisible ? (
    <DateTime
      value={time}
      live={time == null}
      format="time"
      hour12={false}
      variant="mono"
      color="secondary"
      className="text-[11px] min-w-[38px] text-right"
    />
  ) : null

  return (
    <View
      onLayout={onLayout}
      // shared chrome gradient (web); solid bg-surface-elevated is the native fallback
      style={surfaceGradient.chrome() as object}
      className={cn(
        'h-[46px] flex-row items-center gap-[14px] px-4 bg-surface-elevated border-b border-hairline',
        className
      )}
    >
      {leading ?? <BrandLockup brand={brand} subtitle={subtitle} showSubtitle={subtitleVisible} />}

      {/* right cluster — app chrome then the clock, pinned to the edge */}
      <View className="ml-auto flex-row items-center gap-[12px]">
        {dividedCluster([...(Array.isArray(trailing) ? trailing : [trailing]), clock])}
      </View>
    </View>
  )
}
