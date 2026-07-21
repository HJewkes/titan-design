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
  /**
   * Dual (bilateral) SPLIT aura: one radial glow anchored at the panel CENTRE, its
   * TOP half colored by `split.top`'s category and its BOTTOM half by `split.bottom`'s
   * — matching the diverging dual chart (LEFT up / RIGHT down). When set it SUPERSEDES
   * the single-category flood. Single-category use ({@link category} alone) is unchanged.
   */
  split?: { top: LiveAuraCategory; bottom: LiveAuraCategory }
  className?: string
  children?: React.ReactNode
}

/**
 * One half of the split (dual) aura: a half-height overlay whose radial gradient is
 * anchored on the panel's CENTRE line (the shared boundary), so the two halves read
 * as a single radial glow emanating from the centre, split top/bottom by L/R color.
 */
function SplitFloodHalf({
  half,
  category,
  pulse,
}: {
  half: 'top' | 'bottom'
  category: LiveAuraCategory
  pulse: boolean
}) {
  const color = liveAuraColor(category)
  if (!color) return null
  const tint = alpha(color, floodOpacity[category])
  // Anchor the radial at this half's inner edge (the panel centre): bottom-centre for the
  // top half, top-centre for the bottom half — the glow is strongest at the centre seam.
  const at = half === 'top' ? '50% 100%' : '50% 0%'
  const style = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '50%',
    ...(half === 'top' ? { top: 0 } : { bottom: 0 }),
    ...(Platform.OS === 'web'
      ? { backgroundImage: `radial-gradient(120% 150% at ${at}, ${tint}, transparent 72%)` }
      : { backgroundColor: tint }),
  } as ViewStyle
  return (
    <View
      testID={`live-aura-flood-${half}`}
      accessibilityElementsHidden
      pointerEvents="none"
      className={category === 'stop' && pulse ? 'animate-pulse' : undefined}
      style={style}
    />
  )
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
 * on a charcoal base and layers a radial wash (amber at threshold, red at stop)
 * as a decorative, pointer-transparent overlay. The wash uses a solid
 * `backgroundColor` fallback (native) plus a web-only `backgroundImage` radial
 * gradient; both derive from the same semantic token via `alpha()`.
 */
export function LiveAuraFrame({
  category,
  pulse = true,
  split,
  className,
  children,
  style,
  ...props
}: LiveAuraFrameProps) {
  const color = liveAuraColor(category)
  const tint = color ? alpha(color, floodOpacity[category]) : 'transparent'

  // A radial wash flooding from the LEFT edge, fading to transparent by ~62% so
  // the charcoal base shows through the right of the panel. Left-origin (not
  // top-down) so stacked dual-voltra layers each flood sideways — no horizontal
  // seam where two top-down washes would meet. Web renders the gradient; native
  // has no gradient support, so it falls back to a solid tint.
  const floodStyle = {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web'
      ? // backgroundImage is a runtime RNW style, not in RN ViewStyle types.
        { backgroundImage: `radial-gradient(95% 130% at 0% 50%, ${tint}, transparent 62%)` }
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
          borderColor: t['border-default'],
        },
        style,
      ]}
      {...props}
    >
      {split ? (
        <>
          <SplitFloodHalf half="top" category={split.top} pulse={pulse} />
          <SplitFloodHalf half="bottom" category={split.bottom} pulse={pulse} />
        </>
      ) : (
        color && (
          <View
            testID="live-aura-flood"
            accessibilityElementsHidden
            pointerEvents="none"
            className={category === 'stop' && pulse ? 'animate-pulse' : undefined}
            style={floodStyle}
          />
        )
      )}
      {children}
    </View>
  )
}
