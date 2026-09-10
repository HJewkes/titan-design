// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { Typography } from '../Typography'
import { resolveColor } from '../../../theme/resolve-color'
import { semanticColorsDark } from '../../../theme/tokens/semantic'
import { greyRamp } from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'
import { getGlowShadow } from '../../../theme/elevation'

export type StatusDotVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'on-track'
  | 'deviation'
  | 'future'

export interface StatusDotProps extends ViewProps {
  variant: StatusDotVariant
  /** Center glyph. Only rendered at size="md"; the 8px "sm" dot is too small to fit one. */
  icon?: 'check' | 'exclamation' | 'dash'
  size?: 'sm' | 'md'
  /** Adds a subtle glow effect in the variant color */
  glow?: boolean
  label?: string
  className?: string
}

type SolidVariant = 'success' | 'warning' | 'error' | 'neutral'

/** Solid variants: a filled dot. `neutral` takes `text-tertiary`, as Indicator's `default` does. */
const solidFillToken = {
  success: 'status-success',
  warning: 'status-warning',
  error: 'status-error',
  neutral: 'text-tertiary',
} as const

/** Ring variants: a `-subtle` wash inside a `-muted` rim, both off the same role. */
const ringWashToken = {
  'on-track': { fill: 'status-success-subtle', border: 'status-success-muted' },
  deviation: { fill: 'status-warning-subtle', border: 'status-warning-muted' },
} as const

// The neutral ring has no wash rungs: `-subtle`/`-muted`/`-strong` were published for
// the seven status and brand roles, and `text-tertiary` is not one of them. Derived
// from the same ramp step the token resolves to, at the frozen alphas, rather than
// mixed independently. FINDING for E3: the neutral role needs the wash ladder too.
const FUTURE_FILL = alpha(greyRamp[500], 0.1)
const FUTURE_BORDER = alpha(greyRamp[500], 0.2)

/** Glyph colour: dark on a solid fill, the role's own colour inside a ring. */
const glyphToken = {
  success: 'text-inverse',
  warning: 'text-inverse',
  error: 'text-inverse',
  neutral: 'text-inverse',
  'on-track': 'status-success',
  deviation: 'status-warning',
  future: 'text-tertiary',
} as const

// Glow is EMPHASIS, not depth: one shared builder, one token colour per variant.
// Literal hex (not `resolveColor`) because getGlowShadow does colour maths on it —
// the same exception Indicator documents.
const glowColors: Record<StatusDotVariant, string> = {
  success: semanticColorsDark['status-success'],
  warning: semanticColorsDark['status-warning'],
  error: semanticColorsDark['status-error'],
  neutral: greyRamp[500],
  'on-track': semanticColorsDark['status-success'],
  deviation: semanticColorsDark['status-warning'],
  future: greyRamp[500],
}

const glowStyles: Record<StatusDotVariant, ViewStyle> = Object.fromEntries(
  Object.entries(glowColors).map(([variant, color]) => [variant, getGlowShadow(color, 'subtle')])
) as Record<StatusDotVariant, ViewStyle>

const iconChars: Record<string, string> = {
  check: '\u2713',
  exclamation: '!',
  dash: '\u2014',
}

const sizeDimensions = {
  sm: { size: 8, showIcon: false },
  md: { size: 18, showIcon: true },
}

function isSolidVariant(variant: StatusDotVariant): variant is SolidVariant {
  return variant in solidFillToken
}

/** The ring variants' wash + rim, resolved per theme. `future` adds the dashed rim. */
function ringStyle(variant: StatusDotVariant): ViewStyle | undefined {
  if (variant === 'future') {
    return {
      backgroundColor: FUTURE_FILL,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: FUTURE_BORDER,
    }
  }
  if (variant === 'on-track' || variant === 'deviation') {
    const tokens = ringWashToken[variant]
    return {
      backgroundColor: resolveColor(tokens.fill),
      borderWidth: 1,
      borderColor: resolveColor(tokens.border),
    }
  }
  return undefined
}

export function StatusDot({
  variant,
  icon,
  size = 'sm',
  glow,
  label,
  className,
  ...props
}: StatusDotProps) {
  const config = sizeDimensions[size]
  const solid = isSolidVariant(variant)
  const ring = ringStyle(variant)

  const glowStyle = glow ? glowStyles[variant] : null

  const dot = (
    <View
      style={[
        {
          width: config.size,
          height: config.size,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        solid ? { backgroundColor: resolveColor(solidFillToken[variant]) } : undefined,
        ring,
        glowStyle ? (glowStyle as Record<string, unknown>) : undefined,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`${variant} status`}
      testID="status-dot"
    >
      {config.showIcon && icon && (
        // The glyph was 11px/900, off the type scale (TOKENS.md §4); `boldLabel` is
        // the 12px sans label step and `font-black` keeps the original weight.
        <Typography
          variant="boldLabel"
          color="inherit"
          className="font-black leading-none"
          style={{ color: resolveColor(glyphToken[variant]) }}
          accessibilityElementsHidden
        >
          {iconChars[icon]}
        </Typography>
      )}
    </View>
  )

  if (label) {
    return (
      <View
        className={className}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        accessibilityLabel={`${variant} status: ${label}`}
        {...props}
      >
        <View accessibilityElementsHidden>{dot}</View>
        {/* 12px/16 is `caption` at the 4-unit leading step; its colour is `text-secondary`. */}
        <Typography
          variant="caption"
          color="secondary"
          className="leading-4"
          accessibilityElementsHidden
        >
          {label}
        </Typography>
      </View>
    )
  }

  return (
    <View className={className} {...props}>
      {dot}
    </View>
  )
}
