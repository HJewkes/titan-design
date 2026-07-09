// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text } from 'react-native'
import { VelocityStrip, type VelocityZoneBandProp } from './VelocityStrip'
import { PrBadge, type PRType } from './PrBadge'
import { roundRpe, rpeColor, roundWeight } from '../../../utils/workout-format'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'

export type SetRowMode = 'active' | 'completed' | 'history'

export interface SetRowProps {
  mode: SetRowMode
  setNumber: number
  previous?: { reps: number; weight: number } | null
  reps: number | null
  weight: number | null
  rpe?: number | null
  unit: 'lbs' | 'kg'
  /** Per-rep MEAN concentric velocities (m/s). */
  velocities?: number[]
  /** Optional velocity-zone bands (WA `VelocityZones.bands`); default scale when absent. */
  velocityZones?: readonly VelocityZoneBandProp[]
  /** Live mode: index of the newest rep bar to animate (pop / new-peak bounce). */
  velocityLiveRepIndex?: number
  velocityExpanded?: boolean
  onVelocityToggle?: () => void
  setType?: string
  prBadges?: Array<{ type: PRType; label: string }>
  isNextSet?: boolean
  targets?: { reps: number; weight: number }
  /**
   * The set is being performed RIGHT NOW. Shows reps-done / target (e.g. "5/8") with a live green
   * treatment; `velocities.length` is the reps-done count. Distinct from `isNextSet` (queued next).
   */
  isLive?: boolean
}

function formatAccessibilityLabel(
  setNumber: number,
  reps: number | null,
  weight: number | null,
  unit: string,
): string {
  const repsText = reps != null ? `${reps} reps` : 'no reps'
  const weightText = weight != null ? `at ${roundWeight(weight)} ${unit}` : ''
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
  velocityZones,
  velocityLiveRepIndex,
  velocityExpanded,
  onVelocityToggle,
  setType,
  prBadges,
  isNextSet,
  targets,
  isLive,
}: SetRowProps) {
  const isActive = mode === 'active'
  const isCompleted = mode === 'completed'
  const liveRepsDone = velocities?.length ?? 0

  const rowStyle: Record<string, unknown> = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 7,
    paddingHorizontal: 8,
    gap: 8,
    borderRadius: 8,
  }

  if (isLive) {
    rowStyle.backgroundColor = 'rgba(46,213,115,0.08)'
    rowStyle.borderWidth = 1
    rowStyle.borderColor = 'rgba(46,213,115,0.35)'
  } else if (isActive && isNextSet) {
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
        style={{ width: 36, flexShrink: 1, alignItems: 'center', justifyContent: 'center' }}
        testID="set-row-set-number"
      >
        {setType ? (
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              color: WORKOUT_TOKENS.scale.orange,
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
            className="text-text-secondary"
            style={{
              fontSize: 13,
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {setNumber}
          </Text>
        )}
      </View>

      <View
        className="flex-1"
        style={{ minWidth: 44 }}
        testID="set-row-previous"
      >
        <Text
          className="text-text-secondary"
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {previous
            ? `${previous.reps} x ${roundWeight(previous.weight)}`
            : '\u2014'}
        </Text>
      </View>

      <View
        style={{ width: 44, flexShrink: 1, alignItems: 'center', justifyContent: 'center' }}
        testID="set-row-reps"
      >
        {isLive ? (
          <Text
            className="text-status-live"
            style={{
              fontSize: 14,
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
            }}
            testID="set-row-live-reps"
          >
            {liveRepsDone}/{targets?.reps ?? '\u2014'}
          </Text>
        ) : isActive && reps == null && targets ? (
          <Text
            className="text-text-tertiary"
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              fontFamily: 'Inter, sans-serif',
            }}
            testID="set-row-target-reps"
          >
            {targets.reps}
          </Text>
        ) : (
          <Text
            className={reps != null ? 'text-text-primary' : 'text-text-tertiary'}
            style={{
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {reps != null ? reps : '\u2014'}
          </Text>
        )}
      </View>

      <View
        style={{ width: 56, flexShrink: 1, alignItems: 'center', justifyContent: 'center' }}
        testID="set-row-weight"
      >
        {isLive && targets ? (
          <Text
            className="text-text-primary"
            style={{
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {roundWeight(targets.weight)}
          </Text>
        ) : isActive && weight == null && targets ? (
          <Text
            className="text-text-tertiary"
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              fontFamily: 'Inter, sans-serif',
            }}
            testID="set-row-target-weight"
          >
            {roundWeight(targets.weight)}
          </Text>
        ) : (
          <Text
            className={weight != null ? 'text-text-primary' : 'text-text-tertiary'}
            style={{
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {weight != null ? roundWeight(weight) : '\u2014'}
          </Text>
        )}
      </View>

      <View
        style={{ width: 36, flexShrink: 1, alignItems: 'center', justifyContent: 'center' }}
        testID="set-row-rpe"
      >
        <Text
          className={rpe != null ? undefined : 'text-text-tertiary'}
          style={{
            fontSize: 13,
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            // rpeColor returns a concrete hex (native-safe); only the tertiary
            // fallback needs the className token.
            color: rpe != null ? rpeColor(rpe) : undefined,
          }}
        >
          {rpe != null ? roundRpe(rpe) : '\u2014'}
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
            zones={velocityZones}
            liveRepIndex={velocityLiveRepIndex}
            expanded={velocityExpanded}
            onToggle={onVelocityToggle}
            variant={onVelocityToggle ? 'full' : 'mini'}
          />
        </View>
      )}
    </View>
  )
}
