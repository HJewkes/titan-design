// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, useCallback } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { roundTempo } from '../../../utils/workout-format'
import { alpha } from '../../../utils/colors'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { getTempoFillPct, getTempoPacingState } from './TempoBar'

const t = getSemanticColors('dark')

/** The four tempo phases, in the order the display renders them. */
export type TempoLivePhase = 'eccentric' | 'pauseBottom' | 'concentric' | 'pauseTop'

/**
 * Live rep state driving the phase-fill overlay. Controlled by the consumer
 * (matching titan's `elapsedMs`-in convention) so the same real timer feeds
 * both web dashboard and native app — TempoDisplay owns rendering only.
 */
export interface TempoLiveState {
  /** Phase currently in progress, or null when idle/at rest. */
  activePhase: TempoLivePhase | null
  /** Elapsed time (ms) within the active phase. */
  phaseElapsedMs: number
}

export interface TempoDisplayProps extends ViewProps {
  /** Tempo values: [eccentric, pauseBottom, concentric, pauseTop] in seconds */
  tempo: [number, number, number, number]
  size?: 'sm' | 'md'
  /** Colored phases or mono (all gray) */
  colored?: boolean
  /** Show the "TEMPO" caption before the values. Default true. */
  showLabel?: boolean
  /** Show info tooltip on press */
  showInfo?: boolean
  /**
   * When set, renders a live phase-fill: the active phase digit fills against
   * its prescribed duration and inactive phases dim. Omit for the static
   * prescription string (default, backward compatible).
   */
  live?: TempoLiveState
  onPress?: () => void
  className?: string
}

const INTER = 'Inter, sans-serif'
const TEXT_TERTIARY = '#6B7280'
const STATUS_ERROR = t['status-error'] // shown when a phase runs behind pace

// Phase colors: [eccentric, pauseBottom, concentric, pauseTop]
const phaseColors = {
  eccentric: t['status-warning'],
  pauseBottom: TEXT_TERTIARY,
  concentric: t['status-success'],
  pauseTop: TEXT_TERTIARY,
  dash: TEXT_TERTIARY,
}

function TempoValue({
  value,
  color,
  fontSize,
}: {
  value: number
  color: string
  fontSize: number
}) {
  return (
    <Text
      style={{
        fontFamily: INTER,
        fontSize,
        color,
        fontWeight: '600',
        letterSpacing: 1,
      }}
    >
      {value}
    </Text>
  )
}

function TempoSeparator({ color, fontSize }: { color: string; fontSize: number }) {
  return (
    <Text
      style={{
        fontFamily: INTER,
        fontSize,
        color,
        fontWeight: '600',
        letterSpacing: 1,
      }}
    >
      -
    </Text>
  )
}

// Phase order + color matching the tempo tuple, for the live phase-fill row.
const LIVE_PHASES: { key: TempoLivePhase; color: string }[] = [
  { key: 'eccentric', color: phaseColors.eccentric },
  { key: 'pauseBottom', color: phaseColors.pauseBottom },
  { key: 'concentric', color: phaseColors.concentric },
  { key: 'pauseTop', color: phaseColors.pauseTop },
]

function LiveTempoCell({
  value,
  color,
  isActive,
  phaseElapsedMs,
  fontSize,
}: {
  value: number
  color: string
  isActive: boolean
  phaseElapsedMs: number
  fontSize: number
}) {
  if (!isActive) {
    return <TempoValue value={value} color={alpha(color, 0.35)} fontSize={fontSize} />
  }
  const targetMs = value > 0 ? value * 1000 : null
  const barColor = getTempoPacingState(phaseElapsedMs, targetMs) === 'behind' ? STATUS_ERROR : color
  const fillPct = getTempoFillPct(phaseElapsedMs, targetMs)
  return (
    <View style={{ position: 'relative' }} testID="tempo-live-active">
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${fillPct}%`,
          backgroundColor: alpha(barColor, 0.3),
          borderRadius: 2,
        }}
      />
      <TempoValue value={value} color={barColor} fontSize={fontSize} />
    </View>
  )
}

function LiveTempoRow({
  values,
  live,
  fontSize,
}: {
  values: [number, number, number, number]
  live: TempoLiveState
  fontSize: number
}) {
  return (
    <>
      {LIVE_PHASES.map((phase, i) => (
        <View key={phase.key} style={{ flexDirection: 'row' }}>
          {i > 0 && <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />}
          <LiveTempoCell
            value={values[i]}
            color={phase.color}
            isActive={live.activePhase === phase.key}
            phaseElapsedMs={live.phaseElapsedMs}
            fontSize={fontSize}
          />
        </View>
      ))}
    </>
  )
}

export function TempoDisplay({
  tempo,
  size = 'md',
  colored = true,
  showLabel = true,
  showInfo = true,
  live,
  onPress,
  className,
  ...props
}: TempoDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  // Round exact (unrounded) tempo seconds to the 1-dp display granularity.
  const [eccentric, pauseBottom, concentric, pauseTop] = roundTempo(tempo)
  const isSm = size === 'sm'
  const fontSize = isSm ? 9 : 11
  const monoColor = TEXT_TERTIARY

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress()
    }
    if (showInfo) {
      setShowTooltip((prev) => !prev)
    }
  }, [onPress, showInfo])

  const content = (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C',
        paddingHorizontal: isSm ? 6 : 8,
        paddingVertical: 3,
        borderRadius: 4,
      }}
      {...props}
    >
      {showLabel && (
        <Text
          style={{
            fontFamily: INTER,
            fontSize: 9,
            fontWeight: '500',
            color: TEXT_TERTIARY,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginRight: 6,
          }}
        >
          TEMPO
        </Text>
      )}
      <View style={{ flexDirection: 'row' }} testID="tempo-value">
        {live ? (
          <LiveTempoRow
            values={[eccentric, pauseBottom, concentric, pauseTop]}
            live={live}
            fontSize={fontSize}
          />
        ) : colored ? (
          <>
            <TempoValue value={eccentric} color={phaseColors.eccentric} fontSize={fontSize} />
            <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />
            <TempoValue value={pauseBottom} color={phaseColors.pauseBottom} fontSize={fontSize} />
            <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />
            <TempoValue value={concentric} color={phaseColors.concentric} fontSize={fontSize} />
            <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />
            <TempoValue value={pauseTop} color={phaseColors.pauseTop} fontSize={fontSize} />
          </>
        ) : (
          <Text
            style={{
              fontFamily: INTER,
              fontSize,
              color: monoColor,
              fontWeight: '600',
              letterSpacing: 1,
            }}
          >
            {eccentric}-{pauseBottom}-{concentric}-{pauseTop}
          </Text>
        )}
      </View>
    </View>
  )

  return (
    <Pressable
      accessibilityLabel={`Tempo: ${eccentric} second eccentric, ${pauseBottom} second pause, ${concentric} second concentric, ${pauseTop} second pause`}
      accessibilityRole="button"
      onPress={handlePress}
      testID="tempo-display"
    >
      {content}
      {showTooltip && (
        <View
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: [{ translateX: '-50%' as unknown as number }],
            marginBottom: 8,
            zIndex: 20,
            alignItems: 'center',
          }}
          testID="tempo-tooltip"
        >
          <View
            style={{
              backgroundColor: '#191919',
              borderRadius: 6,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#2C2C2C',
            }}
          >
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: INTER }}>
              Eccentric: {eccentric}s
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: INTER }}>
              Pause (bottom): {pauseBottom}s
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: INTER }}>
              Concentric: {concentric}s
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: INTER }}>
              Pause (top): {pauseTop}s
            </Text>
          </View>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 5,
              borderRightWidth: 5,
              borderTopWidth: 5,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#2C2C2C',
            }}
          />
        </View>
      )}
    </Pressable>
  )
}
