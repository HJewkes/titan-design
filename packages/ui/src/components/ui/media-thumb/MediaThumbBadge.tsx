import type { ComponentType } from 'react'
import { Text, View } from 'react-native'
import { cn } from '../../../utils/cn'
import type { IconProps } from '../../icons'

export interface MediaThumbBadgeProps {
  /** What the badge means, read in place of its glyph or short text (e.g. "Length 4:12", "No sound"). */
  accessibilityLabel: string
  /** A glyph drawn before the text, or alone. */
  icon?: ComponentType<IconProps>
  /** Short visible text, such as a length in `m:ss`. */
  children?: string
  className?: string
}

/**
 * A small dark badge for a `MediaThumb` corner. Its ground is `scrim-strong`, which keeps white ink
 * above AA over any frame, light or dark.
 */
export function MediaThumbBadge({
  accessibilityLabel,
  icon: Icon,
  children,
  className,
}: MediaThumbBadgeProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        'flex-row items-center gap-inline-sm rounded-sm bg-scrim-strong px-squish-x-xs py-squish-y-xs text-on-scrim',
        className
      )}
    >
      {Icon ? <Icon size={14} /> : null}
      {children ? (
        <Text className="text-xs font-bold tabular-nums text-on-scrim">{children}</Text>
      ) : null}
    </View>
  )
}
