// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'

import { Card } from '../../ui/card'
import { Divider } from '../../ui/divider'
import { Pill } from '../../ui/pill'
import { Progress } from '../../ui/progress'
import { useSurfaceMode } from '../../ui/surface'
import { Metric } from '../Metric'
import { Typography } from '../Typography'
import { useMeasuredWidth } from '../Table/column-fit'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { cn } from '../../../utils/cn'
import { GOAL_STATUS_LABEL, GOAL_STATUS_TONE, type GoalLiftStatus } from './GoalCard'
import { BAND_OPACITY } from './GoalTrajectoryBand'
import { STATUS_TOKEN } from './GoalTrajectoryPlot'
import { SegmentedBar, type SegmentedBarSegment } from './SegmentedBar'
import { ZoneTrack, type ZoneTrackTick } from './ZoneTrack'
import {
  bandCaption,
  bandDomain,
  dueMarkerPosition,
  phaseLabel,
  rateCaption,
  sessionsCaption,
  sessionsVisualFor,
  weighInDate,
  wholeBodyScale,
  type WholeBodyScale,
  type WholeBodySessionsRow,
  type WholeBodySessionsVisual,
  type WholeBodyWeightRow,
} from './wholeBody'
import { formatBodyweight } from '../../../utils/workout-format'

export interface WholeBodyCardProps extends ViewProps {
  /** The bodyweight goal. Omitted or `null`, the row is not drawn. */
  bodyweight?: WholeBodyWeightRow | null
  /** The 28-day training-day goal. Omitted or `null`, the row is not drawn. */
  sessions?: WholeBodySessionsRow | null
  /** Pins the layout. Omitted, the card measures itself: side by side from 720px, stacked below. */
  scale?: WholeBodyScale
  /** How the sessions count is drawn. Round-1 comparison (VW-455); one survives the owner's pick. */
  sessionsVisual?: WholeBodySessionsVisual
  className?: string
}

/** A goal status as a resolved colour, the same one the goal chart draws its line in. */
function useStatusColor(status: GoalLiftStatus): string {
  return getSemanticColors(useSurfaceMode())[STATUS_TOKEN[status]]
}

function StatusPill({ status }: { status: GoalLiftStatus }) {
  return (
    <Pill tone={GOAL_STATUS_TONE[status]} variant="subtle" size="sm" leading="dot">
      {GOAL_STATUS_LABEL[status]}
    </Pill>
  )
}

/** Label, optional tag, and the status furthest right; wraps under the label when narrow. */
function RowHeader(props: { label: string; tag?: string; status: GoalLiftStatus; testID: string }) {
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}
      className="justify-between gap-x-inline-md gap-y-stack-sm"
      testID={props.testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <Typography variant="overline" color="tertiary">
          {props.label}
        </Typography>
        {props.tag !== undefined && (
          <Pill tone="neutral" variant="outline" size="sm">
            {props.tag}
          </Pill>
        )}
      </View>
      <StatusPill status={props.status} />
    </View>
  )
}

function Captions({ lines, testID }: { lines: string[]; testID: string }) {
  if (lines.length === 0) return null
  return (
    <View className="gap-stack-sm" testID={testID}>
      {lines.map((line) => (
        <Typography key={line} variant="caption" color="secondary">
          {line}
        </Typography>
      ))}
    </View>
  )
}

/** Tick labels at the band's edges; a zero-width band is one emphasised line instead. */
function bandTicks(row: WholeBodyWeightRow, lineColor: string): ZoneTrackTick[] {
  const lo = Math.min(row.week.low, row.week.high)
  const hi = Math.max(row.week.low, row.week.high)
  if (lo === hi)
    return [{ value: lo, label: formatBodyweight(lo), color: lineColor, emphasized: true }]
  return [
    { value: lo, label: formatBodyweight(lo) },
    { value: hi, label: formatBodyweight(hi) },
  ]
}

function WeightTrack({ row, scale }: { row: WholeBodyWeightRow; scale: WholeBodyScale }) {
  const t = getSemanticColors(useSurfaceMode())
  const needle = useStatusColor(row.status)
  const latest = row.latest?.value ?? null
  const { min, max } = bandDomain(row.week.low, row.week.high, latest)
  return (
    <ZoneTrack
      min={min}
      max={max}
      size={scale === 'wall' ? 'wall' : 'default'}
      zones={[{ upTo: max, color: 'transparent' }]}
      band={{
        from: Math.min(row.week.low, row.week.high),
        to: Math.max(row.week.low, row.week.high),
        color: alpha(t['brand-secondary'], BAND_OPACITY),
      }}
      ticks={bandTicks(row, t['brand-secondary'])}
      marker={latest === null ? null : { type: 'needle', value: latest, color: needle }}
      accessibilityLabel={`Bodyweight against this week's band. ${bandCaption(row)}`}
    />
  )
}

function WeightFigure({ row, scale }: { row: WholeBodyWeightRow; scale: WholeBodyScale }) {
  if (row.latest === null) return null
  return (
    <Metric
      size={scale === 'wall' ? 'lg' : 'md'}
      value={formatBodyweight(row.latest.value)}
      unit={row.unit}
      label={`Weighed ${weighInDate(row.latest.ts)}`}
      className="items-start"
      testID="whole-body-weight-value"
    />
  )
}

/** Weight first, then where it sits in this week's band, then the rate the Sunday review judges. */
function BodyweightRow({ row, scale }: { row: WholeBodyWeightRow; scale: WholeBodyScale }) {
  const rate = rateCaption(row)
  const captions = [bandCaption(row), ...(rate === null ? [] : [rate])]
  return (
    <View className="gap-stack-md" testID="whole-body-weight">
      <RowHeader
        label="Bodyweight"
        tag={phaseLabel(row.phase)}
        status={row.status}
        testID="whole-body-weight-header"
      />
      {row.latest === null ? (
        <Typography variant="body2" color="secondary" testID="whole-body-weight-empty">
          No weigh-in yet. Log one to start this goal.
        </Typography>
      ) : (
        <RowBody scale={scale} figure={<WeightFigure row={row} scale={scale} />}>
          <WeightTrack row={row} scale={scale} />
          <Captions lines={captions} testID="whole-body-weight-captions" />
        </RowBody>
      )}
    </View>
  )
}

/** The figure beside its detail on the wall, above it on the phone. */
function RowBody(props: { scale: WholeBodyScale; figure: ReactNode; children: ReactNode }) {
  const wall = props.scale === 'wall'
  return (
    <View
      style={{ flexDirection: wall ? 'row' : 'column', alignItems: wall ? 'center' : 'stretch' }}
      className={wall ? 'gap-inline-lg' : 'gap-stack-md'}
    >
      <View style={wall ? { width: 200 } : undefined}>{props.figure}</View>
      <View style={{ flex: wall ? 1 : undefined, minWidth: 0 }} className="gap-stack-sm">
        {props.children}
      </View>
    </View>
  )
}

function sessionSegments(
  row: WholeBodySessionsRow,
  fill: string,
  empty: string
): SegmentedBarSegment[] {
  return Array.from({ length: row.committed }, (_, i) =>
    i < row.counted ? { color: fill } : { color: empty, outline: true }
  )
}

function SessionsBar(props: {
  row: WholeBodySessionsRow
  visual: WholeBodySessionsVisual
  scale: WholeBodyScale
}) {
  const { row, visual, scale } = props
  const t = getSemanticColors(useSurfaceMode())
  const fill = useStatusColor(row.status)
  if (visual === 'number') return null
  if (visual === 'progress') {
    return (
      <Progress
        value={Math.min(row.counted, row.committed)}
        max={row.committed}
        size={scale === 'wall' ? 'lg' : 'md'}
        customColor={fill}
        accessibilityLabel={`${row.counted} of ${row.committed} training days`}
        testID="whole-body-sessions-progress"
      />
    )
  }
  const marker = dueMarkerPosition(row)
  return (
    <SegmentedBar
      segments={sessionSegments(row, fill, t['text-tertiary'])}
      height={scale === 'wall' ? 16 : 10}
      marker={marker === null ? null : { position: marker, color: t['text-primary'] }}
      testID="whole-body-sessions-segments"
    />
  )
}

function SessionsRow(props: {
  row: WholeBodySessionsRow
  visual: WholeBodySessionsVisual
  scale: WholeBodyScale
}) {
  const { row, scale } = props
  const visual = sessionsVisualFor(props.visual, row.committed)
  const figure = (
    <Metric
      size={scale === 'wall' ? 'lg' : 'md'}
      value={`${row.counted}`}
      unit={`of ${row.committed}`}
      label="Training days"
      className="items-start"
      testID="whole-body-sessions-value"
    />
  )
  return (
    <View className="gap-stack-md" testID="whole-body-sessions">
      <RowHeader
        label={`Sessions · ${row.windowDays} days`}
        status={row.status}
        testID="whole-body-sessions-header"
      />
      <RowBody scale={scale} figure={figure}>
        <SessionsBar row={row} visual={visual} scale={scale} />
        <Captions lines={sessionsCaption(row)} testID="whole-body-sessions-captions" />
      </RowBody>
    </View>
  )
}

/**
 * The two goals on `#/goals` that are not a lift: where the body is against the
 * diet phase's band, and whether the lifter is turning up. One row each; a row
 * with no goal behind it is not drawn, and with neither the card renders nothing
 * so the page drops the section (VW-455 Round 0, owner-confirmed).
 *
 * Bodyweight leads with the weight, then its place in this week's band (the
 * goal chart's own band colour), then the rate `goal.weekly_review` judges. A
 * hold draws its ±2 % corridor; slow-loss recomposition draws one line.
 * Sessions count training days in the rolling window, never a streak.
 *
 * No loading state: the page fetches before it renders. No error state: the page
 * shows the failed fetch. No disabled state: nothing here is pressable.
 */
export function WholeBodyCard({
  bodyweight,
  sessions,
  scale,
  sessionsVisual = 'segments',
  className,
  ...props
}: WholeBodyCardProps) {
  const measured = useMeasuredWidth()
  if (!bodyweight && !sessions) return null
  const resolved = wholeBodyScale(measured.width, scale)
  return (
    <Card
      elevation={1}
      className={cn('p-inset-lg', className)}
      role="article"
      aria-label="Whole body goals"
      testID="whole-body-card"
      {...props}
    >
      <View
        className={resolved === 'wall' ? 'gap-stack-lg' : 'gap-stack-md'}
        onLayout={measured.onLayout}
      >
        {bodyweight && <BodyweightRow row={bodyweight} scale={resolved} />}
        {bodyweight && sessions && <Divider />}
        {sessions && <SessionsRow row={sessions} visual={sessionsVisual} scale={resolved} />}
      </View>
    </Card>
  )
}
