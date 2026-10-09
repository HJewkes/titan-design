import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { formatDurationMs } from '../../../utils/time-format'
import { DateTime, formatDateTime } from '../../ui/date-time'
import { Divider } from '../../ui/divider'
import { Typography } from '../../ui/typography'

export interface GapIndicatorProps {
  /** The idle span. A negative or non-finite value prints the placeholder. */
  durationMs: number
  /** When activity resumed. Shown, as a date, only when `showDate` is set. */
  resumedAtMs?: number | null
  /** Set on the first gap after a day change, so the reader sees the new day. */
  showDate?: boolean
  isUTC?: boolean
  className?: string
}

/**
 * A hairline with the idle time in the middle: "32m idle". It marks a stretch of 10 minutes or
 * more with no activity between two turns. The host decides where gaps go; this only draws one.
 */
export function GapIndicator({
  durationMs,
  resumedAtMs,
  showDate = false,
  isUTC,
  className,
}: GapIndicatorProps) {
  const idle = `${formatDurationMs(durationMs)} idle`
  const resumed =
    showDate && resumedAtMs != null && Number.isFinite(resumedAtMs) ? resumedAtMs : null
  const name = resumed === null ? idle : `${idle}, ${formatDateTime(resumed, 'medium', { isUTC })}`
  return (
    <View
      role="separator"
      aria-label={name}
      testID="gap-indicator"
      className={cn('flex-row items-center gap-inline-md py-stack-sm', className)}
    >
      <Divider className="flex-1" />
      <Typography variant="caption" color="secondary">
        {idle}
      </Typography>
      {resumed === null ? null : (
        <DateTime
          value={resumed}
          format="medium"
          isUTC={isUTC}
          variant="caption"
          color="secondary"
        />
      )}
      <Divider className="flex-1" />
    </View>
  )
}
