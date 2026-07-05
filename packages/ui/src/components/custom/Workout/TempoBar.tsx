// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'

const t = getSemanticColors('dark')

/**
 * Titan-local phase key. Consumers map their own movement-phase enum onto this
 * presentational key at the call site — TempoBar owns rendering only.
 */
export type TempoPhaseKey = 'concentric' | 'hold' | 'eccentric'

/** Pacing tuning shared with the fill/pacing helpers below. */
export const TEMPO_PACING = {
  behindThresholdPct: 0.15,
  minPhaseDurationMs: 500,
} as const

export type TempoPacingState = 'none' | 'on-pace' | 'behind'

/**
 * Classify how a phase's elapsed time tracks against its target duration.
 * `none` when there is no meaningful target; `behind` once elapsed exceeds the
 * target by more than the behind threshold; `on-pace` otherwise.
 */
export function getTempoPacingState(
  elapsedMs: number,
  targetMs: number | null,
): TempoPacingState {
  if (!targetMs || targetMs < TEMPO_PACING.minPhaseDurationMs) return 'none'
  const ratio = elapsedMs / targetMs
  if (ratio > 1 + TEMPO_PACING.behindThresholdPct) return 'behind'
  return 'on-pace'
}

/** Fill percentage (0–100) for the active phase; full when no target is set. */
export function getTempoFillPct(elapsedMs: number, targetMs: number | null): number {
  if (!targetMs) return 100
  return Math.min(100, (elapsedMs / targetMs) * 100)
}

interface PhaseConfig {
  label: string
  color: string
  flex: number
}

const PHASE_ORDER: TempoPhaseKey[] = ['concentric', 'hold', 'eccentric']

const PHASE_CONFIG: Record<TempoPhaseKey, PhaseConfig> = {
  concentric: { label: 'Con', color: t['status-success'], flex: 2 },
  hold: { label: 'Hold', color: t['brand-primary'], flex: 1 },
  eccentric: { label: 'Ecc', color: t['status-warning'], flex: 3 },
}

export interface TempoBarProps extends ViewProps {
  /** Phase currently in progress, or null when idle/at rest. */
  activePhase: TempoPhaseKey | null
  /** Elapsed time (ms) within the active phase. */
  phaseElapsedMs: number
  /** Completed phase durations (ms) for the current rep, keyed by phase. */
  completed?: Partial<Record<TempoPhaseKey, number>>
  /** Optional per-phase target durations (seconds) for pacing feedback. */
  target?: Partial<Record<TempoPhaseKey, number>>
  className?: string
}

/**
 * TempoBar — live rep phase progression indicator.
 *
 * Renders a segmented bar (Con → Hold → Ecc) where the active phase fills in
 * real time and completed phases show their duration with a ✓/✗ pacing mark.
 * Presentational only: the consumer derives which phase is active, its elapsed
 * time, and completed durations, then feeds them in.
 */
export function TempoBar({
  activePhase,
  phaseElapsedMs,
  completed,
  target,
  className,
  ...props
}: TempoBarProps) {
  return (
    <View className={className} testID="tempo-bar" {...props}>
      {/* Phase labels */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {PHASE_ORDER.map((phase) => {
          const config = PHASE_CONFIG[phase]
          return (
            <View key={phase} style={{ flex: config.flex, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: t['text-disabled'] }}>{config.label}</Text>
            </View>
          )
        })}
      </View>

      {/* Segmented bar */}
      <View style={{ flexDirection: 'row', gap: 2, height: 20 }}>
        {PHASE_ORDER.map((phase) => {
          const config = PHASE_CONFIG[phase]
          const isActive = activePhase === phase
          const completedMs = completed?.[phase]
          const targetSec = target?.[phase]
          const targetMs = targetSec != null ? targetSec * 1000 : null

          return (
            <View
              key={phase}
              style={{
                flex: config.flex,
                backgroundColor: alpha('#ffffff', 0.06),
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {isActive ? (
                <ActiveSegment
                  config={config}
                  phaseElapsedMs={phaseElapsedMs}
                  targetMs={targetMs}
                />
              ) : completedMs != null ? (
                <CompletedSegment config={config} completedMs={completedMs} targetMs={targetMs} />
              ) : null}
            </View>
          )
        })}
      </View>
    </View>
  )
}

function ActiveSegment({
  config,
  phaseElapsedMs,
  targetMs,
}: {
  config: PhaseConfig
  phaseElapsedMs: number
  targetMs: number | null
}) {
  const pacing = getTempoPacingState(phaseElapsedMs, targetMs)
  const barColor = pacing === 'behind' ? t['status-error'] : config.color
  const fillPct = getTempoFillPct(phaseElapsedMs, targetMs)

  const label = targetMs
    ? `${formatDuration(phaseElapsedMs)} / ${formatDuration(targetMs)}`
    : formatDuration(phaseElapsedMs)

  return (
    <View style={{ height: '100%', position: 'relative' }} testID={`tempo-segment-active-${config.label}`}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${fillPct}%`,
          backgroundColor: alpha(barColor, 0.3),
          borderRadius: 4,
        }}
      />
      <View
        style={{
          height: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: barColor }}>{label}</Text>
      </View>
    </View>
  )
}

function CompletedSegment({
  config,
  completedMs,
  targetMs,
}: {
  config: PhaseConfig
  completedMs: number
  targetMs: number | null
}) {
  const pacing = getTempoPacingState(completedMs, targetMs)
  const hitTarget = pacing !== 'behind'
  const indicator =
    targetMs && targetMs >= TEMPO_PACING.minPhaseDurationMs ? (hitTarget ? ' ✓' : ' ✗') : ''

  return (
    <View
      style={{
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: alpha(config.color, 0.15),
      }}
      testID={`tempo-segment-completed-${config.label}`}
    >
      <Text style={{ fontSize: 12, fontWeight: '500', color: alpha(config.color, 0.7) }}>
        {formatDuration(completedMs)}
        {indicator}
      </Text>
    </View>
  )
}

function formatDuration(ms: number): string {
  const s = ms / 1000
  return s < 10 ? s.toFixed(1) : Math.round(s).toString()
}
