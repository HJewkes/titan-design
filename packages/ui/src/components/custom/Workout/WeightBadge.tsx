// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { Text } from 'react-native'
import { DumbbellIcon } from './icons'
import {
  BaseBadge,
  baseBadgeSizeConfig,
  type BaseBadgeSize,
  type BaseBadgeProps,
} from './BaseBadge'

export type WeightBadgeSize = BaseBadgeSize

export interface WeightBadgeProps
  extends Omit<BaseBadgeProps, 'variant' | 'icon' | 'children'> {
  value: number
  unit?: 'lbs' | 'kg'
  /**
   * When given, this is an N-rep max (e.g. "5RM"). When omitted, it is an
   * estimated 1RM / e1RM.
   */
  reps?: number
  /** Percentage delta from previous mesocycle */
  delta?: number
  isPr?: boolean
  /** Show the weight icon */
  showIcon?: boolean
  size?: WeightBadgeSize
  onPress?: () => void
  className?: string
}

export function WeightBadge({
  value,
  unit = 'lbs',
  reps,
  delta,
  isPr,
  showIcon = true,
  size = 'md',
  onPress,
  className,
  ...props
}: WeightBadgeProps) {
  const config = baseBadgeSizeConfig[size]
  const textColor = isPr ? '#FF7900' : '#9CA3AF'
  // Dumbbell reads clearly as a weight/strength metric and is unit-agnostic
  // across estimated-1RM and N-rep-max contexts (vs. TrendingUp which implies
  // change/trend rather than a load value).
  const iconColor = textColor

  const repMaxClause = reps != null ? `${reps} rep max` : 'Estimated one rep max'
  const deltaLabel =
    delta != null ? `, ${delta >= 0 ? '+' : ''}${delta}% change` : ''
  const fullLabel = `${repMaxClause}: ${value} ${unit}${deltaLabel}`

  return (
    <BaseBadge
      variant={isPr ? 'pr' : 'plain'}
      size={size}
      onPress={onPress}
      className={className}
      icon={
        showIcon ? (
          <DumbbellIcon size={config.iconSize} color={iconColor} strokeWidth={2} />
        ) : undefined
      }
      accessibilityLabel={fullLabel}
      testID="weight-badge"
      {...props}
    >
      <Text
        style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: '600',
          fontSize: config.fontSize,
          color: textColor,
        }}
      >
        {isPr ? '✳ ' : ''}
        {value} {unit}
      </Text>
      {reps != null && (
        <Text
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '600',
            fontSize: config.fontSize,
            marginLeft: 2,
            color: textColor,
            opacity: 0.7,
          }}
          testID="weight-badge-repmax"
        >
          {reps}RM
        </Text>
      )}
      {delta != null && (
        <Text
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: config.fontSize,
            marginLeft: 4,
            color: delta >= 0 ? '#4caf50' : '#ef5350',
          }}
          testID="weight-badge-delta"
        >
          {delta >= 0 ? '+' : ''}
          {delta}%
        </Text>
      )}
    </BaseBadge>
  )
}
