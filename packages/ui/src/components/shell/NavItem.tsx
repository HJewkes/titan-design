import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../../utils/cn'
import { Typography } from '../custom/Typography'

export interface NavItemProps {
  /** The nav glyph (an icon from `components/icons`, rendered ~20px via `currentColor`). */
  icon: ReactNode
  /** Short label shown under the glyph (uppercased for display; used as the accessible name). */
  label: string
  /** Active category → left accent bar + accent-colored glyph & label. */
  active?: boolean
  /**
   * A set is running for this category while it is NOT the active view
   * (live-elsewhere) → a quiet muted-green label tint. Ignored when `active`.
   */
  live?: boolean
  /** Semantic `text-*` token for the active glyph and label. Defaults to the Voltras brand. */
  accentClassName?: string
  /** Semantic `bg-*` token for the active bar. Pair it with `accentClassName`. */
  accentBarClassName?: string
  onPress?: () => void
  className?: string
}

/**
 * Shell S2 · NavItem — one category button in the {@link SideNav}: a 20px glyph
 * over an uppercase micro-label in a 46×46 target. The button spans the full 60px
 * rail so the active **left accent bar** sits flush to the rail's edge. States:
 * active = accent bar + the accent token; `live` (while not active) tints only the
 * label `status-success-dark` (the glyph stays dim); otherwise dim `text-tertiary`.
 *
 * The accent follows the mounting app's brand, so a Brain shell reads yellow
 * throughout rather than showing a Voltras-orange active item under its own lockup.
 */
export function NavItem({
  icon,
  label,
  active = false,
  live = false,
  accentClassName = 'text-brand-primary',
  accentBarClassName = 'bg-brand-primary',
  onPress,
  className,
}: NavItemProps) {
  const glyphColor = active ? accentClassName : 'text-text-tertiary'
  const labelColor = active
    ? accentClassName
    : live
      ? 'text-status-live-muted'
      : 'text-text-tertiary'

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      className={cn('relative h-[46px] w-[60px] items-center justify-center', className)}
    >
      {active ? (
        <View
          testID="nav-item-accent"
          className={cn(
            'absolute left-0 top-[13px] bottom-[13px] w-[3px] rounded-r-[3px]',
            accentBarClassName
          )}
        />
      ) : null}
      <View
        className={cn(
          'h-[46px] w-[46px] items-center justify-center gap-[3px] rounded-[11px]',
          glyphColor
        )}
      >
        {icon}
        <Typography
          variant="button"
          color="inherit"
          // fontSize inline, not `text-[8.5px]`: the `button` variant's `text-sm` (14px) and the
          // arbitrary `text-[8.5px]` are a same-property class conflict that the consumer's
          // Tailwind build resolved the wrong way (labels rendered ~14px on the wall). Inline
          // size wins unambiguously; className keeps weight/case/tracking.
          style={{ fontSize: 8.5, lineHeight: 11 }}
          className={cn('font-bold uppercase tracking-[0.4px]', labelColor)}
        >
          {label}
        </Typography>
      </View>
    </Pressable>
  )
}
