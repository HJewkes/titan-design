import { Pill, type PillSize } from '../../ui/pill'

export interface UnreadBadgeProps {
  /** Unread messages. Renders nothing at zero. */
  count: number
  /** Counts above this read as `max+`. */
  max?: number
  /**
   * With a press handler the badge becomes the "jump to newest" affordance and
   * spells out its count; without one it is a bare counter for a thread row or tab.
   */
  onPress?: () => void
  size?: PillSize
  /** Replaces any of the built-in strings; the rest keep their defaults. */
  labels?: Partial<UnreadBadgeLabels>
  className?: string
  testID?: string
}

export interface UnreadBadgeLabels {
  /** The jump affordance's text and name: `shown` is the capped count, `count` the real one. */
  newMessages: (shown: string, count: number) => string
}

export function unreadCountLabel(count: number, max: number): string {
  return count > max ? `${max}+` : String(count)
}

function defaultNewMessages(shown: string, count: number): string {
  return `${shown} new ${count === 1 ? 'message' : 'messages'}`
}

/** Unread count as a brand capsule. A preset over Pill. */
export function UnreadBadge({
  count,
  max = 99,
  onPress,
  size = 'sm',
  labels,
  className,
  testID = 'chat-unread-badge',
}: UnreadBadgeProps) {
  if (count <= 0) return null
  const shown = unreadCountLabel(count, max)
  const label = (labels?.newMessages ?? defaultNewMessages)(shown, count)
  return (
    <Pill
      variant="solid"
      tone="brand"
      size={size}
      onPress={onPress}
      className={className}
      testID={testID}
      accessibilityLabel={label}
    >
      {onPress ? label : shown}
    </Pill>
  )
}
