import { useState } from 'react'
import { type ViewProps } from 'react-native'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { HStack } from '../../ui/stack'
import { Tile } from '../../ui/tile/Tile'
import { formatDateTime } from '../DateTime/DateTime'

const DAY_MS = 24 * 60 * 60 * 1000

/** Accent applied to the Until value when the session is < 1 day away. */
const SOON_ACCENT = primitiveRamps.orange[400]

type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

export interface ScheduleTilesProps extends ViewProps {
  /** The scheduled moment (timestamp in ms or Date object). */
  when: number | Date
  /** Reference "now"; injectable so the until/accent calc is deterministic in tests. Defaults to the mount time. */
  now?: number
  /** Gap between the tiles (default 1). */
  gap?: Gap
}

/**
 * ScheduleTiles — Date / Time / Until row for an upcoming session.
 *
 * An HStack of three {@link Tile}s derived from a single scheduled moment. The
 * Until value reuses {@link formatDateTime} relative formatting and turns
 * accent-orange only when the session is less than a day away.
 *
 * @example
 * <ScheduleTiles when={Date.now() + 5 * 60 * 60 * 1000} />
 */
export function ScheduleTiles({ when, now, gap = 1, ...props }: ScheduleTilesProps) {
  // Capture a stable mount-time "now" when the prop is omitted (Date.now() is
  // impure, so it lives in a hook initializer per the render-purity rule).
  const [mountNow] = useState(() => Date.now())
  const reference = now ?? mountNow
  const whenMs = when instanceof Date ? when.getTime() : when
  const soon = whenMs - reference < DAY_MS
  const time = new Date(whenMs).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <HStack gap={gap} {...props}>
      <Tile label="Date" value={formatDateTime(when, 'short')} />
      <Tile label="Time" value={time} />
      <Tile
        label="Until"
        value={formatDateTime(when, 'relative')}
        valueColor={soon ? SOON_ACCENT : undefined}
      />
    </HStack>
  )
}
