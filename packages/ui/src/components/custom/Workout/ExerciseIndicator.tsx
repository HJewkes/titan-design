// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { primitiveRamps } from '../../../theme/tokens/primitives'

/**
 * Indicator kinds surfaced in an exercise heading. A taxonomy expansion is being
 * designed separately, so `kind` is an open union backed by a config record —
 * adding a kind is one entry + one union member, no call-site changes.
 */
export type ExerciseIndicatorKind = 'pr' | 'issue' | 'info'

interface IndicatorConfig {
  glyph: string
  color: string
  /** Accessible description (also the intended tooltip subject). */
  label: string
}

const INDICATOR_CONFIG: Record<ExerciseIndicatorKind, IndicatorConfig> = {
  pr: { glyph: '★', color: primitiveRamps.orange[400], label: 'Personal record' },
  issue: { glyph: '!', color: primitiveRamps.red[600], label: 'Form issue' },
  info: { glyph: 'i', color: primitiveRamps.blue[500], label: 'More info' },
}

export interface ExerciseIndicatorProps extends Omit<ViewProps, 'children'> {
  kind: ExerciseIndicatorKind
  /** Optional tap handler (surfaces detail — PR history / issue / info). */
  onPress?: () => void
  className?: string
}

/**
 * A small circular indicator chip for an exercise heading (PR / issue / info).
 * Presentational; the tap detail (tooltip/sheet) is wired by the consumer.
 */
export function ExerciseIndicator({ kind, onPress, className, ...props }: ExerciseIndicatorProps) {
  const { glyph, color, label } = INDICATOR_CONFIG[kind]

  const chip = (
    <View
      className={className}
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="exercise-indicator"
      {...props}
    >
      <Text
        style={{ fontSize: 10, fontWeight: '800', color, lineHeight: 14 }}
        accessibilityElementsHidden
      >
        {glyph}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        {chip}
      </Pressable>
    )
  }
  return chip
}
