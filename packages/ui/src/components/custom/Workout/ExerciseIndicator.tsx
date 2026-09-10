// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ComponentType } from 'react'
import { View, Pressable, type ViewProps } from 'react-native'
import { resolveColor } from '../../../theme/resolve-color'
import {
  ScaleIcon,
  AlertTriangleIcon,
  TrendingDownIcon,
  CircleSlashIcon,
  AwardIcon,
  InfoIcon,
  type IconProps,
} from '../../icons'

/**
 * The LOCKED 6-kind indicator taxonomy (TD-03.51). One precedence-ranked slot is
 * ever shown per exercise, resolved by {@link resolveIndicator}. Glyph = the
 * specific signal; color = the severity tier (danger/warning/success/info, bound
 * to titan status tokens). Outlined (border + glyph, no fill) so a chip never
 * collides with the filled velocity strip beside it.
 */
export type ExerciseIndicatorKind =
  | 'imbalance'
  | 'overshoot'
  | 'velocity-loss'
  | 'missed-reps'
  | 'pr'
  | 'info'

type StatusToken = 'status-error' | 'status-warning' | 'status-success' | 'status-info'

interface IndicatorConfig {
  Icon: ComponentType<IconProps>
  /** Tier token — resolved per theme by {@link resolveColor} at render. */
  token: StatusToken
  /** Accessible description (also the intended tooltip subject). */
  label: string
}

const INDICATOR_CONFIG: Record<ExerciseIndicatorKind, IndicatorConfig> = {
  imbalance: { Icon: ScaleIcon, token: 'status-error', label: 'Left/right imbalance' },
  overshoot: { Icon: AlertTriangleIcon, token: 'status-error', label: 'Load overshoot' },
  'velocity-loss': { Icon: TrendingDownIcon, token: 'status-warning', label: 'Velocity loss' },
  'missed-reps': { Icon: CircleSlashIcon, token: 'status-warning', label: 'Missed reps' },
  pr: { Icon: AwardIcon, token: 'status-success', label: 'Personal record' },
  info: { Icon: InfoIcon, token: 'status-info', label: 'More info' },
}

/**
 * Precedence order (1=highest → last=lowest). A single chip is shown, so when
 * several signals are true the highest-ranked wins. Alerts outrank `pr`; `info`
 * is the floor. This ordering is LOCKED — do not reshuffle.
 */
export const INDICATOR_PRECEDENCE: readonly ExerciseIndicatorKind[] = [
  'imbalance',
  'overshoot',
  'velocity-loss',
  'missed-reps',
  'pr',
  'info',
]

/**
 * Given the signals currently true for an exercise, pick the single
 * highest-precedence kind to surface (or `undefined` when none apply). Order and
 * duplicates in `candidates` don't matter — {@link INDICATOR_PRECEDENCE} decides.
 */
export function resolveIndicator(
  candidates: ExerciseIndicatorKind[]
): ExerciseIndicatorKind | undefined {
  return INDICATOR_PRECEDENCE.find((kind) => candidates.includes(kind))
}

export interface ExerciseIndicatorProps extends Omit<ViewProps, 'children'> {
  kind: ExerciseIndicatorKind
  /** Optional tap handler (surfaces detail — PR history / alert / info). */
  onPress?: () => void
  className?: string
}

/**
 * A small circular outlined chip for an exercise heading. Presentational and
 * static (chips are chrome — no pulse); the tap detail (tooltip/sheet) is wired
 * by the consumer.
 */
export function ExerciseIndicator({ kind, onPress, className, ...props }: ExerciseIndicatorProps) {
  const { Icon, token, label } = INDICATOR_CONFIG[kind]
  const color = resolveColor(token)

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
      <Icon size={11} color={color} />
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
