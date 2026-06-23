// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'

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
  icon?: 'check' | 'exclamation' | 'dash'
  size?: 'sm' | 'md'
  /** Adds a subtle glow effect in the variant color */
  glow?: boolean
  label?: string
  className?: string
}

const solidVariantColors: Record<string, string> = {
  success: '#14B8A6',
  warning: '#FFB020',
  error: '#D14343',
  neutral: '#6B7280',
}

const ringVariantStyles: Record<string, Record<string, unknown>> = {
  'on-track': {
    backgroundColor: 'rgba(20,184,166,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
  },
  deviation: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  future: {
    backgroundColor: 'rgba(107,114,128,0.1)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(107,114,128,0.2)',
  },
}

const glowStyles: Record<StatusDotVariant, Record<string, unknown>> = {
  success: { boxShadow: '0 0 4px rgba(20,184,166,0.4)' },
  warning: { boxShadow: '0 0 4px rgba(245,158,11,0.4)' },
  error: { boxShadow: '0 0 4px rgba(239,68,68,0.4)' },
  neutral: { boxShadow: '0 0 4px rgba(107,114,128,0.4)' },
  'on-track': { boxShadow: '0 0 4px rgba(20,184,166,0.4)' },
  deviation: { boxShadow: '0 0 4px rgba(245,158,11,0.4)' },
  future: { boxShadow: '0 0 4px rgba(107,114,128,0.4)' },
}

const iconChars: Record<string, string> = {
  check: '\u2713',
  exclamation: '!',
  dash: '\u2014',
}

/** Color-matched icon colors: dark on solid bg, light on transparent bg */
const iconColors: Record<StatusDotVariant, string> = {
  success: '#0A5C52',
  warning: '#6B4000',
  error: '#5C1A1A',
  neutral: '#D1D5DB',
  'on-track': '#14B8A6',
  deviation: '#FFB020',
  future: '#6B7280',
}

const sizeDimensions = {
  sm: { size: 8, showIcon: false },
  md: { size: 18, showIcon: true },
}

function isSolidVariant(variant: StatusDotVariant): boolean {
  return variant in solidVariantColors
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
  const ring = ringVariantStyles[variant]

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
        solid ? { backgroundColor: solidVariantColors[variant] } : undefined,
        ring ? (ring as Record<string, unknown>) : undefined,
        glowStyle ? (glowStyle as Record<string, unknown>) : undefined,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`${variant} status`}
      testID="status-dot"
    >
      {config.showIcon && icon && (
        <Text
          style={{
            fontSize: 11,
            lineHeight: 11,
            fontWeight: '900',
            color: iconColors[variant],
          }}
          accessibilityElementsHidden
        >
          {iconChars[icon]}
        </Text>
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
        <Text
          style={{ fontSize: 12, lineHeight: 16, color: '#9CA3AF' }}
          accessibilityElementsHidden
        >
          {label}
        </Text>
      </View>
    )
  }

  return (
    <View className={className} {...props}>
      {dot}
    </View>
  )
}
