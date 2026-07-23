// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * RomProgressionChart — the per-rep depth progression: silver bars that turn amber
 * (below the working range) then red (below the short threshold), with dashed
 * working-standard + short-threshold reference lines and a faint red short-zone. The
 * current (last) rep is emphasised. Labelled "depth vs working range · now N%".
 *
 * Data-driven from absolute metres: bars scale to the tallest of {bars, working
 * standard} with headroom, so the working line always sits on-chart. When no working
 * standard is established yet (< 3 reps) the reference lines drop and every bar reads
 * silver — the bars alone carry the shape.
 */
import { View, Text, type ViewStyle } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { FONT_MONO } from './fatigue-tokens'
import type { RepRomPoint } from './fatigue-model'

const t = getSemanticColors('dark')
const SILVER = t['text-primary']

export interface RomProgressionChartProps {
  /** Per-rep ROM points (metres), ordered by rep. */
  points: RepRomPoint[]
  /** Working-range standard (metres) — the silver dashed line. `null` = not yet established. */
  workingStandardM: number | null
  /** Short threshold (metres) — the red dashed line + short-zone. `null` = not yet established. */
  shortThresholdM: number | null
  /** Height of the bar plot in px (the caption row sits below it). Default 44. */
  barHeight?: number
  /** Keep the chart to a legible recent tail. Default 12. */
  maxReps?: number
}

/** A per-rep bar's colour: red below short, amber below working, else silver. */
function barColor(romM: number, working: number | null, short: number | null): string {
  if (short != null && romM < short) return t['status-error']
  if (working != null && romM < working) return t['status-warning']
  return SILVER
}

export function RomProgressionChart({
  points,
  workingStandardM,
  shortThresholdM,
  barHeight = 44,
  maxReps = 12,
}: RomProgressionChartProps) {
  const shown = points.slice(-maxReps)
  const lastIndex = shown.length - 1
  const denom = Math.max(0.01, ...shown.map((p) => p.romM), workingStandardM ?? 0) * 1.1
  // px UP from the baseline for a metre value.
  const yUp = (m: number) => (m / denom) * barHeight
  const current = shown[lastIndex]?.romM ?? 0
  const nowPct =
    workingStandardM != null
      ? Math.round((current / workingStandardM) * 100)
      : Math.round((current / Math.max(0.01, ...shown.map((p) => p.romM))) * 100)

  return (
    <View style={{ gap: 5 }} testID="rom-progression">
      <View
        style={{
          height: barHeight,
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 3,
        }}
      >
        {/* short-zone faint fill + the two dashed reference lines. */}
        {shortThresholdM != null && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: yUp(shortThresholdM),
              backgroundColor: alpha(t['status-error'], 0.06),
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
              bottom: yUp(workingStandardM),
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
              bottom: yUp(shortThresholdM),
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: alpha(t['status-error'], 0.4),
            }}
          />
        )}
        {shown.map((p, i) => {
          const isCurrent = i === lastIndex
          const color = barColor(p.romM, workingStandardM, shortThresholdM)
          return (
            <View
              key={p.repNumber}
              style={{
                flex: 1,
                minWidth: 6,
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: barHeight,
              }}
            >
              <View
                style={
                  {
                    width: '80%',
                    height: Math.max(3, yUp(p.romM)),
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    backgroundColor: isCurrent ? color : alpha(color, 0.5),
                  } as ViewStyle
                }
              />
            </View>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 9, color: t['text-tertiary'], fontFamily: FONT_MONO }}>
          ROM · depth vs working range
        </Text>
        <Text style={{ fontSize: 9, color: t['text-tertiary'], fontFamily: FONT_MONO }}>
          now {nowPct}%
        </Text>
      </View>
    </View>
  )
}
