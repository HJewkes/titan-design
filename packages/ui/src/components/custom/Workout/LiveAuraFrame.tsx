// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, StyleSheet, Platform, type ViewProps, type ViewStyle } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'

const t = getSemanticColors('dark')

/**
 * Coaching-category flood level for the live surface. Mirrors {@link StatusPill}:
 * - `productive` — quiet, no flood
 * - `threshold`  — amber wash at VL20
 * - `stop`       — red wash at VL28+ (optionally pulsing)
 */
export type LiveAuraCategory = 'productive' | 'threshold' | 'stop'

export interface LiveAuraFrameProps extends ViewProps {
  category: LiveAuraCategory
  /**
   * Pulse the flood on `stop`. Uses the nativewind `animate-pulse` utility so
   * it stays static-friendly under test (className→style, no live clock).
   * Defaults to true.
   */
  pulse?: boolean
  className?: string
  children?: React.ReactNode
}

const categoryToken: Record<LiveAuraCategory, 'status-warning' | 'status-error' | null> = {
  productive: null,
  threshold: 'status-warning',
  stop: 'status-error',
}

const floodOpacity: Record<LiveAuraCategory, number> = {
  productive: 0,
  threshold: 0.12,
  stop: 0.18,
}

/** Resolved flood color for a category, or `null` when there is no flood. */
export function liveAuraColor(category: LiveAuraCategory): string | null {
  const token = categoryToken[category]
  return token ? t[token] : null
}

/**
 * Full-surface color-flood frame tied to a coaching category. Wraps `children`
 * on a grey base and layers a radial wash (amber at threshold, red at stop)
 * as a decorative, pointer-transparent overlay. The wash uses a solid
 * `backgroundColor` fallback (native) plus a web-only `backgroundImage` radial
 * gradient; both derive from the same semantic token via `alpha()`.
 */
export function LiveAuraFrame({
  category,
  pulse = true,
  className,
  children,
  style,
  ...props
}: LiveAuraFrameProps) {
  const color = liveAuraColor(category)
  const tint = color ? alpha(color, floodOpacity[category]) : 'transparent'

  // Match R2's canonical aura: a top-down radial wash that FADES TO TRANSPARENT
  // by ~62%, so the grey base shows through the lower panel — NOT a flat
  // full-surface tint. On web (the target: MCP dashboard + Storybook) render the
  // gradient only; native has no gradient support, so fall back to a solid tint.
  const floodStyle = {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web'
      ? // backgroundImage is a runtime RNW style, not in RN ViewStyle types.
        { backgroundImage: `radial-gradient(130% 95% at 50% 0%, ${tint}, transparent 62%)` }
      : { backgroundColor: tint }),
  } as ViewStyle

  return (
    <View
      testID="live-aura-frame"
      className={className}
      style={[
        {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 10,
          backgroundColor: t['background-base'],
          borderWidth: 1,
          borderColor: t['hairline-default'],
        },
        style,
      ]}
      {...props}
    >
      {color && (
        <View
          testID="live-aura-flood"
          accessibilityElementsHidden
          pointerEvents="none"
          className={category === 'stop' && pulse ? 'animate-pulse' : undefined}
          style={floodStyle}
        />
      )}
      {children}
    </View>
  )
}
