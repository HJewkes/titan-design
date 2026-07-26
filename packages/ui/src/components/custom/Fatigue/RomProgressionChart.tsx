// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * RomProgressionChart — the per-rep depth progression on the shared silver/red scheme:
 * silver bars at-or-above the working range, light red below it, deep red below the
 * short threshold — with dashed working-standard (silver) + short-threshold (red)
 * reference lines and a faint red short-zone. Every rep reads at full colour.
 * The bars carry the whole read — no caption strip (the card's own hierarchy names it).
 *
 * Composes the shared {@link SetBarChart}: SetBarChart owns the geometry (value→height
 * scaling, the plot-width-driven adaptive bar width / gap — the same rhythm as the velocity
 * hero) and paints the reference overlay this chart hands it. When `plannedReps` exceeds the
 * performed count the remaining reps draw as dashed to-do placeholders (the velocity "N of M"
 * read). Bars scale to the tallest of {bars, working standard, short threshold} so the
 * reference lines always sit on-chart; when no working standard is established yet (< 3 reps)
 * the lines drop and every bar reads silver — the bars alone carry the shape.
 */
import { View } from 'react-native'
import { alpha } from '../../../utils/colors'
import { SetBarChart, type SetSlot, type SetBarGeometry } from '../charts/SetBarChart'
import { SILVER, RED_LIGHT, RED_DEEP } from './fatigue-tokens'
import type { RepRomPoint } from './fatigue-model'

export interface RomProgressionChartProps {
  /** Per-rep ROM points (metres), ordered by rep. */
  points: RepRomPoint[]
  /** Working-range standard (metres) — the silver dashed line. `null` = not yet established. */
  workingStandardM: number | null
  /** Short threshold (metres) — the red dashed line + short-zone. `null` = not yet established. */
  shortThresholdM: number | null
  /** Height of the bar plot in px. Default 44. */
  barHeight?: number
  /** Keep the chart to a legible recent tail. Default 12. */
  maxReps?: number
  /**
   * Planned rep count. Reps beyond the performed count draw as dashed to-do placeholders (the
   * velocity "3 of 8 done" read). Ignored when absent or ≤ the performed-rep count.
   */
  plannedReps?: number
}

/** A per-rep bar's colour (silver/red): deep red below short, light red below working, else silver. */
function barColor(romM: number, working: number | null, short: number | null): string {
  if (short != null && romM < short) return RED_DEEP
  if (working != null && romM < working) return RED_LIGHT
  return SILVER
}

/** The dashed working-standard + short-threshold lines and the faint short-zone fill, painted from chart geometry. */
function romReferenceOverlay(
  g: SetBarGeometry,
  workingStandardM: number | null,
  shortThresholdM: number | null
) {
  return (
    <>
      {shortThresholdM != null && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: g.yOf(shortThresholdM),
            backgroundColor: alpha(RED_DEEP, 0.06),
          }}
        />
      )}
      {workingStandardM != null && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: g.yOf(workingStandardM),
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderColor: alpha(SILVER, 0.4),
          }}
        />
      )}
      {shortThresholdM != null && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: g.yOf(shortThresholdM),
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderColor: alpha(RED_DEEP, 0.4),
          }}
        />
      )}
    </>
  )
}

export function RomProgressionChart({
  points,
  workingStandardM,
  shortThresholdM,
  barHeight = 44,
  maxReps = 12,
  plannedReps,
}: RomProgressionChartProps) {
  const shown = points.slice(-maxReps)
  const slots: SetSlot[] = shown.map((p) => ({ kind: 'rep', value: p.romM }))
  // Scale to the tallest of {bars, working, short} so the reference lines always sit on-chart
  // (SetBarChart's own peak scale reads only the bar values). `0` → let SetBarChart use peak.
  const scaleMax =
    Math.max(...shown.map((p) => p.romM), workingStandardM ?? 0, shortThresholdM ?? 0) || undefined

  return (
    <View testID="rom-progression">
      <SetBarChart
        slots={slots}
        colorFor={(romM) => barColor(romM, workingStandardM, shortThresholdM)}
        height={barHeight}
        scaleMax={scaleMax}
        barRadius={2}
        hideBaseline
        todoVariant="dashed"
        targetReps={plannedReps}
        renderReference={(g) => romReferenceOverlay(g, workingStandardM, shortThresholdM)}
        testIDPrefix="rom"
      />
    </View>
  )
}
