import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { getGlowShadow } from '../../../theme/elevation'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { greyRamp } from '../../../theme/tokens/primitives'

export type IndicatorSize = 'xs' | 'sm' | 'md' | 'lg'
export type IndicatorColor =
  | 'default'
  | 'primary'
  | 'success'
  | 'live'
  | 'error'
  | 'warning'
  | 'info'
  | 'error-vivid'

/** How a pulsing indicator animates: a subtle opacity fade, or an expanding ring. */
export type IndicatorPulse = 'opacity' | 'ping'

export interface IndicatorProps extends ViewProps {
  /** Dot size */
  size?: IndicatorSize
  /** Semantic color */
  color?: IndicatorColor
  /** Custom hex color (overrides color prop) */
  customColor?: string
  /** Add a glow shadow effect */
  glow?: boolean
  /** Add a ring border */
  ring?: boolean
  /** Animate for live/active status. `true` = opacity fade; `'ping'` = expanding ring. */
  pulse?: boolean | IndicatorPulse
  /** Additional className */
  className?: string
}

const sizeStyles: Record<IndicatorSize, string> = {
  xs: 'w-1 h-1',
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
}

const colorStyles: Record<IndicatorColor, string> = {
  default: 'bg-text-tertiary',
  primary: 'bg-brand-primary',
  success: 'bg-status-success',
  live: 'bg-status-live',
  error: 'bg-status-error',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
  'error-vivid': 'bg-status-error-vivid',
}

// Glow is EMPHASIS, not depth: the dot's own colour, through the shared builder.
// Literal hex (not `resolveColor`) because getGlowShadow does colour maths on it.
const t = getSemanticColors('dark')

const glowColors: Record<IndicatorColor, string> = {
  default: greyRamp[500],
  primary: t['brand-primary'],
  success: t['status-success'],
  live: t['status-live'],
  error: t['status-error'],
  warning: t['status-warning'],
  info: t['status-info'],
  'error-vivid': t['status-error-vivid'],
}

export function Indicator({
  size = 'sm',
  color = 'default',
  customColor,
  glow = false,
  ring = false,
  pulse = false,
  className,
  style,
  ...props
}: IndicatorProps) {
  const pulseMode: IndicatorPulse | false = pulse === true ? 'opacity' : pulse || false
  const colorClass = !customColor ? colorStyles[color] : undefined
  const colorStyle = customColor ? { backgroundColor: customColor } : undefined

  // Expanding-ring pulse: a ping layer behind the solid dot (for live/active status).
  if (pulseMode === 'ping') {
    return (
      <View className={cn('relative', sizeStyles[size], className)} style={style} {...props}>
        <View
          className={cn('absolute inset-0 rounded-full animate-ping', colorClass)}
          style={colorStyle}
        />
        <View
          className={cn(
            'relative rounded-full',
            sizeStyles[size],
            colorClass,
            ring && 'border-2 border-background-base'
          )}
          style={colorStyle}
        />
      </View>
    )
  }

  const glowStyle = glow ? getGlowShadow(customColor ?? glowColors[color], 'subtle') : null

  return (
    <View
      className={cn(
        'rounded-full shrink-0',
        sizeStyles[size],
        colorClass,
        pulseMode === 'opacity' && 'animate-pulse',
        ring && 'border-2 border-background-base',
        className
      )}
      style={[style, colorStyle, glowStyle]}
      {...props}
    />
  )
}
