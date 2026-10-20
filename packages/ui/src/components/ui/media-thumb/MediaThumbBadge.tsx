import type { ComponentType } from 'react'
import { Text, View } from 'react-native'
import { cn } from '../../../utils/cn'
import type { IconProps } from '../../icons'

/** Props for {@link MediaThumbBadge}. */
export interface MediaThumbBadgeProps {
  /** What the badge means, read in place of its glyph or short text (e.g. "Length 4:12", "No sound"). */
  accessibilityLabel: string
  /** A glyph drawn before the text, or alone. */
  icon?: ComponentType<IconProps>
  /** Short visible text, such as a length in `m:ss`. */
  children?: string
  /** Tailwind overrides via `cn()`. */
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
      {Icon ? (
        // One text-xs line tall, so an icon-only badge matches a text badge beside it.
        <View className="h-4 justify-center">
          <Icon size={14} />
        </View>
      ) : null}
      {children ? (
        <Text className="text-xs font-bold tabular-nums text-on-scrim">{children}</Text>
      ) : null}
    </View>
  )
}
