import { View, Text } from 'react-native'
import { alpha } from '../../../utils/colors'
import { useSurfaceMode } from '../../ui/surface'
import { MetricCell } from './metricText'
import {
  liveReadoutText,
  pacingNumberTone,
  phaseFillPercent,
  type TempoLiveReadout,
} from '../Fatigue/tempo-pacing'
import {
  numberPalette,
  tempoColors,
  type TempoLivePhase,
  type TempoLiveState,
} from './tempoDisplayModel'

export function TempoValue({
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

export function TempoSeparator({ color, fontSize }: { color: string; fontSize: number }) {
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
    const finalTone =
      targetMs != null ? pacingNumberTone(finalMs, targetMs, numberPalette(mode)) : color
    return (
      <View style={wrap} testID="tempo-live-done">
        <CellFill color={color} pct={100} />
        {num(finalTone, finalText)}
      </View>
    )
  }

  // Active: the phase-hued fill grows with the phase; the number reads the live time
  // (countdown/countup) to 0.1s, coloured SEMANTICALLY by pacing (neutral/on-target/behind).
  const numberTone = pacingNumberTone(phaseElapsedMs, targetMs, numberPalette(mode))
  const fillPct = phaseFillPercent(phaseElapsedMs, targetMs)
  const activeText =
    targetMs != null ? liveReadoutText(phaseElapsedMs, targetMs, readout) : String(value)
  return (
    <View style={wrap} testID="tempo-live-active">
      <CellFill color={color} pct={fillPct} />
      {num(numberTone, activeText)}
    </View>
  )
}

export function LiveTempoRow({
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
