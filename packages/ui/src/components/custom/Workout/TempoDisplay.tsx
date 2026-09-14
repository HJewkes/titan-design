// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, useCallback } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { roundTempo } from '../../../utils/workout-format'
import { alpha } from '../../../utils/colors'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { MetricCell } from './metricText'

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
  /**
   * Actual completed durations (ms) for phases finished earlier THIS rep. A done cell
   * freezes at its final readout (not the target) until the next rep resets the row.
   * Omit a phase to fall back to its target (assume it completed on pace).
   */
  completed?: Partial<Record<TempoLivePhase, number>>
}

export interface TempoDisplayProps extends ViewProps {
  /** Tempo values: [eccentric, pauseBottom, concentric, pauseTop] in seconds */
  tempo: [number, number, number, number]
  size?: 'sm' | 'md'
  /** Override the digit font size (px). Defaults from `size` (9 sm / 11 md); raise for a wall read-out. */
  fontSize?: number
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
  /** Active-phase readout when `live`: `countdown` remaining to 0.0 (default), or `countup` elapsed. */
  liveReadout?: TempoLiveReadout
  onPress?: () => void
  className?: string
}

const INTER = 'Inter, sans-serif'

/**
 * Every colour the display paints, for one theme mode. A function rather than module
 * constants so the tempo row follows the enclosing Surface instead of freezing the dark
 * palette at import (VW-316). Phase hues stay non-semantic ramp pins.
 */
function tempoColors(mode: ThemeMode) {
  const t = getSemanticColors(mode)
  const neutral = t['result-neutral']
  return {
    neutral,
    surface: t['surface-raised'],
    liveLabel: t['status-live-muted'],
    textPrimary: t['text-primary'],
    textSecondary: t['text-secondary'],
    overlay: t['surface-overlay'],
    overlayEdge: t['surface-elevated'],
    slow: t['status-error'], // slow — over the target time
    onTarget: t['status-success'], // on target (within the band of 0.0)
    ahead: t['status-warning'], // ahead — still time left to the target
    // Phase IDENTITY colours — deliberately NON-semantic (magenta ecc / cyan con) so the
    // phase hue never collides with the semantic pacing tones the active number carries.
    phase: {
      eccentric: primitiveRamps.magenta[400],
      pauseBottom: neutral,
      concentric: primitiveRamps.cyan[300],
      pauseTop: neutral,
      dash: neutral,
    },
  }
}

/** Live active-phase readout: `countdown` remaining to 0.0, or `countup` elapsed to target. */
export type TempoLiveReadout = 'countdown' | 'countup'

/** ± this window (ms) around the target still counts as on target (0.0 ± 0.1s). */
const ON_TARGET_MS = 100

/** Phase-progress fill percent (0–100): how far the active phase has run toward its target. */
function getTempoFillPct(elapsedMs: number, targetMs: number | null): number {
  if (!targetMs) return 100
  return Math.min(100, (elapsedMs / targetMs) * 100)
}

/**
 * Semantic pacing tone for the active/completed phase's NUMBER (the fill bar carries phase
 * identity, so the number is free to carry pacing). Keyed on time remaining to target:
 * ahead of target (still counting) → warning; within ±0.1s of 0.0 → success; over → error.
 */
function activeNumberTone(elapsedMs: number, targetMs: number | null, mode: ThemeMode): string {
  const c = tempoColors(mode)
  if (targetMs == null) return c.textPrimary
  const remainingMs = targetMs - elapsedMs
  if (remainingMs > ON_TARGET_MS) return c.ahead
  if (remainingMs >= -ON_TARGET_MS) return c.onTarget
  return c.slow
}

/** The active number: `countup` elapsed (→ target) or `countdown` remaining (→ 0.0, then −). */
function liveReadoutText(elapsedMs: number, targetMs: number, readout: TempoLiveReadout): string {
  const seconds = readout === 'countup' ? elapsedMs / 1000 : (targetMs - elapsedMs) / 1000
  return seconds.toFixed(1)
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
    <MetricCell color={color} fontSize={fontSize}>
      {value}
    </MetricCell>
  )
}

function TempoSeparator({ color, fontSize }: { color: string; fontSize: number }) {
  return (
    <MetricCell color={color} fontSize={fontSize}>
      -
    </MetricCell>
  )
}

// Phase order matching the tempo tuple, for the live phase-fill row. The colour comes
// from `tempoColors(mode).phase` at render time, keyed by this order.
const LIVE_PHASE_KEYS: TempoLivePhase[] = ['eccentric', 'pauseBottom', 'concentric', 'pauseTop']

/** A phase's place in the current rep: already done (locked full), filling now, or still to come. */
type LiveCellStatus = 'done' | 'active' | 'upcoming'

/** A bottom-anchored vertical fill behind the number (the phase-progress bar). */
function CellFill({ color, pct }: { color: string; pct: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 2,
        right: 2,
        bottom: 0,
        height: `${pct}%`,
        backgroundColor: alpha(color, 0.28),
        borderRadius: 3,
      }}
    />
  )
}

/** Monospace stack for the live readout so digit widths never shift. */
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
/** Widest readout the cell must hold: sign · two whole digits · point · tenths, e.g. "-12.3". */
const READOUT_MAX_CHARS = 5

function LiveTempoCell({
  value,
  color,
  status,
  phaseElapsedMs,
  completedMs,
  fontSize,
  readout,
}: {
  value: number
  color: string
  status: LiveCellStatus
  phaseElapsedMs: number
  completedMs: number | undefined
  fontSize: number
  readout: TempoLiveReadout
}) {
  const mode = useSurfaceMode()
  const targetMs = value > 0 ? value * 1000 : null
  // Fixed, monospace-width cell sized to the widest readout — a phase activating or its
  // number changing never shifts the layout (the fill bar stays put too).
  const cellW = Math.ceil(fontSize * 0.62 * READOUT_MAX_CHARS)
  const wrap = {
    position: 'relative' as const,
    width: cellW,
    minHeight: Math.round(fontSize * 1.25),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }
  const num = (c: string, text: string) => (
    <Text style={{ fontFamily: MONO, fontSize, color: c, fontWeight: '700' }}>{text}</Text>
  )

  // Upcoming / idle: the phase's prescribed time in the FULL phase colour, no fill — so a
  // not-yet-started (or fully idle) row just reads as the base tempo lockup, not a dim mode.
  if (status === 'upcoming') {
    const targetText = targetMs != null ? (targetMs / 1000).toFixed(1) : String(value)
    return <View style={wrap}>{num(color, targetText)}</View>
  }

  // Done: FROZEN at the phase's final readout (its actual completed time, not the target),
  // fill locked full in the phase colour. The number keeps its SEMANTIC pacing tone (it is
  // showing the final time, not the target) — banked progress until the next rep resets.
  if (status === 'done') {
    const finalMs = completedMs ?? targetMs ?? 0
    const finalText = targetMs != null ? liveReadoutText(finalMs, targetMs, readout) : String(value)
    const finalTone = targetMs != null ? activeNumberTone(finalMs, targetMs, mode) : color
    return (
      <View style={wrap} testID="tempo-live-done">
        <CellFill color={color} pct={100} />
        {num(finalTone, finalText)}
      </View>
    )
  }

  // Active: the phase-hued fill grows with the phase; the number reads the live time
  // (countdown/countup) to 0.1s, coloured SEMANTICALLY by pacing (neutral/on-target/behind).
  const numberTone = activeNumberTone(phaseElapsedMs, targetMs, mode)
  const fillPct = getTempoFillPct(phaseElapsedMs, targetMs)
  const activeText =
    targetMs != null ? liveReadoutText(phaseElapsedMs, targetMs, readout) : String(value)
  return (
    <View style={wrap} testID="tempo-live-active">
      <CellFill color={color} pct={fillPct} />
      {num(numberTone, activeText)}
    </View>
  )
}

function LiveTempoRow({
  values,
  live,
  fontSize,
  readout,
}: {
  values: [number, number, number, number]
  live: TempoLiveState
  fontSize: number
  readout: TempoLiveReadout
}) {
  // Phases run in a fixed order within a rep, so the active phase's position tells us which
  // phases are already done (locked). When it wraps back to the first phase, the row resets.
  const phase = tempoColors(useSurfaceMode()).phase
  const activeIndex = live.activePhase ? LIVE_PHASE_KEYS.indexOf(live.activePhase) : -1
  return (
    <>
      {LIVE_PHASE_KEYS.map((key, i) => {
        const status: LiveCellStatus =
          activeIndex < 0 || i > activeIndex ? 'upcoming' : i < activeIndex ? 'done' : 'active'
        return (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {i > 0 && <TempoSeparator color={phase.dash} fontSize={fontSize} />}
            <LiveTempoCell
              value={values[i]}
              color={phase[key]}
              status={status}
              phaseElapsedMs={live.phaseElapsedMs}
              completedMs={live.completed?.[key]}
              fontSize={fontSize}
              readout={readout}
            />
          </View>
        )
      })}
    </>
  )
}

export function TempoDisplay({
  tempo,
  size = 'md',
  fontSize: fontSizeProp,
  showLabel = true,
  showInfo = true,
  live,
  liveReadout = 'countdown',
  onPress,
  className,
  ...props
}: TempoDisplayProps) {
  const c = tempoColors(useSurfaceMode())
  const [showTooltip, setShowTooltip] = useState(false)
  // Round exact (unrounded) tempo seconds to the 1-dp display granularity.
  const [eccentric, pauseBottom, concentric, pauseTop] = roundTempo(tempo)
  const isSm = size === 'sm'
  const fontSize = fontSizeProp ?? (isSm ? 9 : 11)
  // The chrome (padding, radius, label) scales with the digit size so the whole view stays
  // proportional at any form factor — a compact rail chip up to a wall read-out.
  const chromePadX = Math.round(fontSize * 0.6)
  const chromePadY = Math.round(fontSize * 0.3)
  const chromeRadius = Math.round(fontSize * 0.4)
  const labelFont = Math.max(9, Math.round(fontSize * 0.5))

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
        backgroundColor: c.surface,
        paddingHorizontal: chromePadX,
        paddingVertical: chromePadY,
        borderRadius: chromeRadius,
      }}
      {...props}
    >
      {showLabel && (
        <Text
          style={{
            fontFamily: INTER,
            fontSize: labelFont,
            fontWeight: '500',
            // Live-muted green while a rep is running, tertiary at rest.
            color: live ? c.liveLabel : c.neutral,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginRight: Math.round(fontSize * 0.5),
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
            readout={liveReadout}
          />
        ) : (
          // Static prescription: the phase-coloured lockup (the same colours the live row rests at).
          <>
            <TempoValue value={eccentric} color={c.phase.eccentric} fontSize={fontSize} />
            <TempoSeparator color={c.phase.dash} fontSize={fontSize} />
            <TempoValue value={pauseBottom} color={c.phase.pauseBottom} fontSize={fontSize} />
            <TempoSeparator color={c.phase.dash} fontSize={fontSize} />
            <TempoValue value={concentric} color={c.phase.concentric} fontSize={fontSize} />
            <TempoSeparator color={c.phase.dash} fontSize={fontSize} />
            <TempoValue value={pauseTop} color={c.phase.pauseTop} fontSize={fontSize} />
          </>
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
              backgroundColor: c.overlay,
              borderRadius: 6,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: c.overlayEdge,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                lineHeight: 16,
                color: c.textSecondary,
                fontFamily: INTER,
              }}
            >
              Eccentric: {eccentric}s
            </Text>
            <Text
              style={{
                fontSize: 10,
                lineHeight: 16,
                color: c.textSecondary,
                fontFamily: INTER,
              }}
            >
              Pause (bottom): {pauseBottom}s
            </Text>
            <Text
              style={{
                fontSize: 10,
                lineHeight: 16,
                color: c.textSecondary,
                fontFamily: INTER,
              }}
            >
              Concentric: {concentric}s
            </Text>
            <Text
              style={{
                fontSize: 10,
                lineHeight: 16,
                color: c.textSecondary,
                fontFamily: INTER,
              }}
            >
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
              borderTopColor: c.overlayEdge,
            }}
          />
        </View>
      )}
    </Pressable>
  )
}
