import type { ReactNode } from 'react'
import { useId } from 'react'
import { View, type ViewStyle } from 'react-native'
import { resolveColor, type ColorToken } from '../../../theme/resolve-color'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { roundWeight, formatVelocityLoss } from '../../../utils/workout-format'
import { TriangleDownIcon, TriangleUpIcon } from '../../icons'
import { Indicator } from '../../ui/indicator'
import { STATUS_GLYPH_FILL, StatusGlyph } from '../../ui/status-glyph'
import { useSurfaceMode } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { HatchPattern } from './GoalTrajectoryCalibrating'
import { DashedReferenceLine } from './VelocityLossBands'
import {
  MUTED_BAR_WIDTH_RATIO,
  barHeightPx,
  lossToPx,
  type SetLossMarkTone,
  type SetLossStripSet,
} from './setLossStripModel'

/** The ring's stroke and the gap it keeps from the bar, in px. */
const RING_WIDTH = 2
const RING_GAP = 2
const RING_INSET = RING_WIDTH + RING_GAP
const HOLLOW_BORDER = 1.5
/** Half the gutter label's line box, so the label centres on its line. */
const LABEL_HALF_HEIGHT = 6
const REP_MARK_SIZE = 10

/** The height bars scale into: the plot cell less the ring inset above and below. */
export function innerPlotPx(plot: number): number {
  return plot - 2 * RING_INSET
}

/** Where a loss sits, in px up from the plot row's bottom edge (the bars' baseline plus the inset). */
export function lossOffsetPx(lossPct: number, ceiling: number, plot: number): number {
  return RING_INSET + lossToPx(lossPct, ceiling, innerPlotPx(plot))
}

/** Working sets draw in the first categorical hue; warm-up, other and unscored sets in grey. */
const WORKING_FILL: ColorToken = 'dataviz-categorical-0'
const MUTED_FILL: ColorToken = 'text-tertiary'

/** One fixed-width cell of a row; every row lays its cells out the same way, so columns align. */
export function Cell({ width, children }: { width: number; children?: ReactNode }) {
  return <View style={{ width, alignItems: 'center' }}>{children}</View>
}

function barWidthFor(set: SetLossStripSet, column: number): number {
  const full = column - 2 * RING_INSET
  return set.purpose === 'working' ? full : full * MUTED_BAR_WIDTH_RATIO
}

function LossBar({ set, column, ceiling, plot }: BarProps & { set: { lossPct: number } }) {
  const hollow = set.scored === false
  const color = resolveColor(set.purpose === 'working' && !hollow ? WORKING_FILL : MUTED_FILL)
  const style: ViewStyle = {
    width: barWidthFor(set, column),
    height: barHeightPx(set.lossPct, ceiling, innerPlotPx(plot)),
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    ...(hollow ? { borderWidth: HOLLOW_BORDER, borderColor: color } : { backgroundColor: color }),
  }
  return <View style={style} testID={`set-loss-bar-${String(set.index)}`} />
}

/** No velocity for the set: the calibrating hatch, full height, outlined in grey. */
function NoDataHatch({ width, height, index }: { width: number; height: number; index: number }) {
  const id = `set-loss-hatch-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const stroke = alpha(getSemanticColors(useSurfaceMode())['text-primary'], 0.12)
  return (
    <View
      style={{ width, height, borderWidth: 1, borderColor: resolveColor(MUTED_FILL) }}
      testID={`set-loss-nodata-${String(index)}`}
    >
      {/* eslint-disable titan/no-html-element -- the hatch is the web <svg> tile GoalTrajectoryCalibrating draws; charts move to react-native-svg together */}
      <svg width="100%" height="100%" aria-hidden="true">
        <HatchPattern id={id} stroke={stroke} />
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
      {/* eslint-enable titan/no-html-element */}
    </View>
  )
}

interface BarProps {
  set: SetLossStripSet
  column: number
  ceiling: number
  plot: number
}

/** The plot cell for one set: its bar or hatch, inside the ring when it is the marked set. */
export function PlotCell({ markTone, ...bar }: BarProps & { markTone?: SetLossMarkTone }) {
  const { set, column, plot } = bar
  const ring: ViewStyle = markTone
    ? { borderWidth: RING_WIDTH, borderColor: resolveColor(STATUS_GLYPH_FILL[markTone]) }
    : { borderWidth: RING_WIDTH, borderColor: 'transparent' }
  return (
    <View
      style={{ width: column, height: plot, padding: RING_GAP, borderRadius: 4, ...ring }}
      className="items-center justify-end"
      testID={markTone ? `set-loss-ring-${String(set.index)}` : undefined}
    >
      {set.lossPct == null ? (
        <NoDataHatch
          width={barWidthFor(set, column)}
          height={innerPlotPx(plot)}
          index={set.index}
        />
      ) : (
        <LossBar {...bar} set={{ ...set, lossPct: set.lossPct }} />
      )}
    </View>
  )
}

/** The value printed above a column: its loss, `No data`, and the marked set's glyph. */
export function ValueCell({ set, markTone, markLabel }: ValueCellProps) {
  return (
    <View className="items-center gap-1">
      {markTone ? <StatusGlyph tone={markTone} label={markLabel} size="sm" /> : null}
      <Typography variant="boldLabel" className="text-center tabular-nums">
        {set.lossPct == null ? 'No data' : formatVelocityLoss(set.lossPct)}
      </Typography>
    </View>
  )
}

interface ValueCellProps {
  set: SetLossStripSet
  markTone?: SetLossMarkTone
  markLabel: string
}

/** The dashed VL lines across the columns, each at its threshold on the fixed scale. */
export function ThresholdLines({ thresholds, ceiling, plot }: ThresholdProps) {
  return thresholds.map((t) => (
    <DashedReferenceLine
      key={t}
      anchor="bottom"
      offset={lossOffsetPx(t, ceiling, plot)}
      testID={`set-loss-vl-${String(t)}`}
    />
  ))
}

/** Each VL line's own label in the gutter, centred on its line. */
export function ThresholdLabels({ thresholds, ceiling, plot }: ThresholdProps) {
  return thresholds.map((t) => (
    <View
      key={t}
      accessibilityElementsHidden
      style={{
        position: 'absolute',
        right: 4,
        bottom: lossOffsetPx(t, ceiling, plot) - LABEL_HALF_HEIGHT,
      }}
    >
      <Typography variant="mono" color="secondary" className="leading-none">
        {`VL ${String(Math.round(t))}%`}
      </Typography>
    </View>
  ))
}

interface ThresholdProps {
  thresholds: readonly number[]
  ceiling: number
  plot: number
}

/** Reps, with an up or down triangle when the set ran over or under its target. */
export function RepsValue({ set }: { set: SetLossStripSet }) {
  const Icon = set.repMark === 'over' ? TriangleUpIcon : TriangleDownIcon
  const token: ColorToken = set.repMark === 'over' ? 'result-improve' : 'result-degrade'
  return (
    <View className="flex-row items-center gap-0.5">
      <Typography variant="mono" className="tabular-nums">
        {String(set.reps)}
      </Typography>
      {set.repMark ? (
        <View
          accessibilityRole="image"
          accessibilityLabel={set.repMark === 'over' ? 'Over target' : 'Under target'}
          testID={`set-loss-repmark-${set.repMark}-${String(set.index)}`}
        >
          <Icon size={REP_MARK_SIZE} color={resolveColor(token)} fill={resolveColor(token)} />
        </View>
      ) : null}
    </View>
  )
}

/** The set's e1RM, with the brand dot on the session's best. */
export function E1rmValue({ set, isBest }: { set: SetLossStripSet; isBest: boolean }) {
  if (set.e1rm == null) return null
  return (
    <View className="flex-row items-center gap-1">
      <Typography variant="mono" className="tabular-nums">
        {String(roundWeight(set.e1rm))}
      </Typography>
      {isBest ? (
        <Indicator
          color="primary"
          size="sm"
          accessibilityRole="image"
          accessibilityLabel="Session best"
          testID={`set-loss-best-${String(set.index)}`}
        />
      ) : null}
    </View>
  )
}
