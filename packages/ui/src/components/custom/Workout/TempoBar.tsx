// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, Text, Pressable, type ViewProps, type LayoutChangeEvent } from 'react-native'
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

/** Active-phase readout mode: elapsed/target `time`, or a `delta` countdown to the target. */
export type TempoActiveDisplay = 'time' | 'delta'

/** Signed seconds to one decimal — the delta countdown (`+` remaining, `-` over target). */
export function formatTempoDelta(remainingMs: number): string {
  const s = remainingMs / 1000
  // Guard `-0.0`; show a leading minus only once past target.
  const rounded = Math.abs(s) < 0.05 ? 0 : s
  return rounded.toFixed(1)
}

/**
 * Classify how a phase's elapsed time tracks against its target duration.
 * `none` when there is no meaningful target; `behind` once elapsed exceeds the
 * target by more than the behind threshold; `on-pace` otherwise.
 */
export function getTempoPacingState(elapsedMs: number, targetMs: number | null): TempoPacingState {
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
  /** Compact label + the stable testID suffix. */
  label: string
  /** Full phase word, spelled out at `wall` density where there's room to read it. */
  wallLabel: string
  color: string
  flex: number
}

const PHASE_ORDER: TempoPhaseKey[] = ['concentric', 'hold', 'eccentric']

const PHASE_CONFIG: Record<TempoPhaseKey, PhaseConfig> = {
  concentric: { label: 'Con', wallLabel: 'Concentric', color: t['status-success'], flex: 2 },
  hold: { label: 'Hold', wallLabel: 'Hold', color: t['brand-primary'], flex: 1 },
  eccentric: { label: 'Ecc', wallLabel: 'Eccentric', color: t['status-warning'], flex: 3 },
}

/** Density. `default` — the compact card/rail treatment. `wall` — the across-the-room dashboard scale. */
export type TempoBarSize = 'default' | 'wall'

interface TempoBarSizing {
  labelMargin: number
  labelFont: number
  barGap: number
  barHeight: number
  radius: number
  segFont: number
}

/** Per-density magnitudes. `default` reproduces the original compact values exactly. */
const TEMPO_SIZES: Record<TempoBarSize, TempoBarSizing> = {
  default: { labelMargin: 4, labelFont: 10, barGap: 2, barHeight: 20, radius: 4, segFont: 12 },
  wall: { labelMargin: 8, labelFont: 15, barGap: 4, barHeight: 40, radius: 6, segFont: 22 },
}

// The wall scale assumes a wide stage. Below this measured width the wall bar steps
// down to a compact scale + short phase labels (Con/Hold/Ecc) so nothing truncates.
const WALL_COMPACT_WIDTH = 380
const WALL_COMPACT_SIZE: TempoBarSizing = {
  labelMargin: 6,
  labelFont: 12,
  barGap: 3,
  barHeight: 30,
  radius: 5,
  segFont: 15,
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
  /** Density: `default` (compact) or `wall` (the across-the-room dashboard scale). */
  size?: TempoBarSize
  /**
   * Active-phase readout. `time` (default) — `elapsed / target`. `delta` — a countdown
   * of the remaining time to target (`1.5` → `0.0` → `-1.2` once over), colour-coded like
   * the bar. Tapping the active segment toggles between the two at runtime.
   */
  activeDisplay?: TempoActiveDisplay
  /**
   * Show the `✓`/`✗` pacing mark on completed phases. Default `true`. Set `false` to
   * let COLOUR alone carry hit/miss (red fill + red duration on a miss) — the
   * across-the-room treatment, where the glyphs read as noise.
   */
  showPacingMark?: boolean
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
  size = 'default',
  activeDisplay = 'time',
  showPacingMark = true,
  className,
  ...props
}: TempoBarProps) {
  // Measure so the wall scale can step down to a compact scale on a narrow stage
  // (idiomatic RN responsiveness — no CSS media queries). Width 0 (unmeasured) keeps
  // the full wall treatment, so server/test renders are unchanged.
  const [barW, setBarW] = useState(0)
  const onBarLayout = (e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width)
  const wallCompact = size === 'wall' && barW > 0 && barW < WALL_COMPACT_WIDTH
  const s = wallCompact ? WALL_COMPACT_SIZE : TEMPO_SIZES[size]
  // Full phase words only on a wide wall; abbreviate everywhere else so they never clip.
  const useWallLabels = size === 'wall' && !wallCompact
  // Runtime toggle of the active readout, seeded from `activeDisplay`.
  const [display, setDisplay] = useState<TempoActiveDisplay>(activeDisplay)
  const toggleDisplay = () => setDisplay((d) => (d === 'time' ? 'delta' : 'time'))
  return (
    <View className={className} testID="tempo-bar" onLayout={onBarLayout} {...props}>
      {/* Phase labels */}
      <View style={{ flexDirection: 'row', marginBottom: s.labelMargin }}>
        {PHASE_ORDER.map((phase) => {
          const config = PHASE_CONFIG[phase]
          return (
            <View key={phase} style={{ flex: config.flex, alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ fontSize: s.labelFont, color: t['text-disabled'] }}>
                {useWallLabels ? config.wallLabel : config.label}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Segmented bar */}
      <View style={{ flexDirection: 'row', gap: s.barGap, height: s.barHeight }}>
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
                borderRadius: s.radius,
                overflow: 'hidden',
              }}
            >
              {isActive ? (
                <ActiveSegment
                  config={config}
                  phaseElapsedMs={phaseElapsedMs}
                  targetMs={targetMs}
                  radius={s.radius}
                  font={s.segFont}
                  display={display}
                  onToggleDisplay={toggleDisplay}
                />
              ) : completedMs != null ? (
                <CompletedSegment
                  config={config}
                  completedMs={completedMs}
                  targetMs={targetMs}
                  font={s.segFont}
                  showPacingMark={showPacingMark}
                />
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
  radius,
  font,
  display,
  onToggleDisplay,
}: {
  config: PhaseConfig
  phaseElapsedMs: number
  targetMs: number | null
  radius: number
  font: number
  display: TempoActiveDisplay
  onToggleDisplay: () => void
}) {
  const pacing = getTempoPacingState(phaseElapsedMs, targetMs)
  const barColor = pacing === 'behind' ? t['status-error'] : config.color
  const fillPct = getTempoFillPct(phaseElapsedMs, targetMs)

  // `delta`: count the remaining time to target down to 0.0, then negative once over.
  // Falls back to elapsed when there's no target. `time`: the elapsed / target readout.
  const label =
    display === 'delta' && targetMs != null
      ? formatTempoDelta(targetMs - phaseElapsedMs)
      : targetMs != null
        ? `${formatDuration(phaseElapsedMs)} / ${formatDuration(targetMs)}`
        : formatDuration(phaseElapsedMs)

  return (
    <Pressable
      onPress={onToggleDisplay}
      style={{ height: '100%', position: 'relative' }}
      accessibilityRole="button"
      accessibilityLabel={`Tempo readout: ${display === 'delta' ? 'delta' : 'time'} — tap to switch`}
      testID={`tempo-segment-active-${config.label}`}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${fillPct}%`,
          backgroundColor: alpha(barColor, 0.3),
          borderRadius: radius,
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
        <Text style={{ fontSize: font, fontWeight: '700', color: barColor }}>{label}</Text>
      </View>
    </Pressable>
  )
}

function CompletedSegment({
  config,
  completedMs,
  targetMs,
  font,
  showPacingMark,
}: {
  config: PhaseConfig
  completedMs: number
  targetMs: number | null
  font: number
  showPacingMark: boolean
}) {
  const pacing = getTempoPacingState(completedMs, targetMs)
  const hitTarget = pacing !== 'behind'
  const indicator =
    showPacingMark && targetMs && targetMs >= TEMPO_PACING.minPhaseDurationMs
      ? hitTarget
        ? ' ✓'
        : ' ✗'
      : ''
  // A missed target reads by COLOUR first (red fill + red duration), the ✓/✗ second —
  // glanceable across a room; a hit keeps the phase's own colour.
  const cueColor = hitTarget ? config.color : t['status-error']

  return (
    <View
      style={{
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: alpha(cueColor, 0.15),
      }}
      testID={`tempo-segment-completed-${config.label}`}
    >
      <Text
        style={{
          fontSize: font,
          fontWeight: '500',
          color: hitTarget ? alpha(config.color, 0.7) : cueColor,
        }}
      >
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
