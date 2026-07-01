// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text } from 'react-native'
import { VelocityStrip } from './VelocityStrip'
import { PrBadge, type PRType } from './PrBadge'

export type SetRowMode = 'active' | 'completed' | 'history'

export interface SetRowProps {
  mode: SetRowMode
  setNumber: number
  previous?: { reps: number; weight: number } | null
  reps: number | null
  weight: number | null
  rpe?: number | null
  unit: 'lbs' | 'kg'
  velocities?: number[]
  velocityExpanded?: boolean
  onVelocityToggle?: () => void
  setType?: string
  prBadges?: Array<{ type: PRType; label: string }>
  isNextSet?: boolean
  targets?: { reps: number; weight: number }
}

function getRPEColor(rpe: number): string {
  if (rpe >= 9.5) return '#ff4757'
  if (rpe >= 8.5) return '#ffa502'
  if (rpe >= 7) return '#ffd43b'
  return '#2ed573'
}

function formatAccessibilityLabel(
  setNumber: number,
  reps: number | null,
  weight: number | null,
  unit: string,
): string {
  const repsText = reps != null ? `${reps} reps` : 'no reps'
  const weightText = weight != null ? `at ${weight} ${unit}` : ''
  return `Set ${setNumber}: ${repsText}${weightText ? ` ${weightText}` : ''}`
}

export function SetRow({
  mode,
  setNumber,
  previous,
  reps,
  weight,
  rpe,
  unit,
  velocities,
  velocityExpanded,
  onVelocityToggle,
  setType,
  prBadges,
  isNextSet,
  targets,
}: SetRowProps) {
  const isActive = mode === 'active'
  const isCompleted = mode === 'completed'

  const rowStyle: Record<string, unknown> = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 7,
    paddingHorizontal: 8,
    gap: 8,
    borderRadius: 8,
  }

  if (isActive && isNextSet) {
    rowStyle.backgroundColor = 'rgba(255,121,0,0.06)'
    rowStyle.borderWidth = 1
    rowStyle.borderColor = 'rgba(255,121,0,0.15)'
  }

  if (isCompleted && !isNextSet) {
    rowStyle.opacity = 0.55
  }

  return (
    <View
      style={rowStyle}
      accessibilityLabel={formatAccessibilityLabel(
        setNumber,
        reps,
        weight,
        unit,
      )}
      testID="set-row"
    >
      <View
        style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}
        testID="set-row-set-number"
      >
        {setType ? (
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              color: '#ffa502',
              backgroundColor: 'rgba(255,165,2,0.12)',
              paddingVertical: 1,
              paddingHorizontal: 5,
              borderRadius: 3,
              overflow: 'hidden',
            }}
            testID="set-row-type-badge"
          >
            {setType}
          </Text>
        ) : (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              color: 'var(--color-text-secondary)',
            }}
          >
            {setNumber}
          </Text>
        )}
      </View>

      <View
        className="flex-1"
        testID="set-row-previous"
      >
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            color: 'var(--color-text-secondary)',
          }}
        >
          {previous
            ? `${previous.reps} x ${previous.weight}`
            : '\u2014'}
        </Text>
      </View>

      <View
        style={{ width: 44, alignItems: 'center', justifyContent: 'center' }}
        testID="set-row-reps"
      >
        {isActive && reps == null && targets ? (
          <Text
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              fontFamily: 'Inter, sans-serif',
              color: 'var(--color-text-tertiary)',
            }}
            testID="set-row-target-reps"
          >
            {targets.reps}
          </Text>
        ) : (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              color: reps != null ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            {reps != null ? reps : '\u2014'}
          </Text>
        )}
      </View>

      <View
        style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}
        testID="set-row-weight"
      >
        {isActive && weight == null && targets ? (
          <Text
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              fontFamily: 'Inter, sans-serif',
              color: 'var(--color-text-tertiary)',
            }}
            testID="set-row-target-weight"
          >
            {targets.weight}
          </Text>
        ) : (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              color: weight != null ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            {weight != null ? weight : '\u2014'}
          </Text>
        )}
      </View>

      <View
        style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}
        testID="set-row-rpe"
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            color: rpe != null ? getRPEColor(rpe) : 'var(--color-text-tertiary)',
          }}
        >
          {rpe != null ? rpe : '\u2014'}
        </Text>
      </View>

      {prBadges && prBadges.length > 0 && (
        <View
          className="flex-row items-center"
          style={{ gap: 4 }}
          testID="set-row-pr-badges"
        >
          {prBadges.map((badge, i) => (
            <PrBadge
              key={i}
              type={badge.type}
              label={badge.label}
              animate={false}
              compact
            />
          ))}
        </View>
      )}

      {velocities && velocities.length > 0 && (
        <View
          style={{ position: 'absolute', bottom: 0, left: 8, right: 8 }}
          testID="set-row-velocity-strip"
        >
          <VelocityStrip
            velocities={velocities}
            expanded={velocityExpanded}
            onToggle={onVelocityToggle}
            variant={onVelocityToggle ? 'full' : 'mini'}
          />
        </View>
      )}
    </View>
  )
}
