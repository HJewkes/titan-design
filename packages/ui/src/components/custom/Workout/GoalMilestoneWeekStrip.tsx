// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { SET_LEVEL_FLAT_BAR } from '../charts/flatBarGeometry'
import { WEEK_COLUMN_GAP } from './GoalTrajectoryChartGeometry'
import { Pill, type PillTone } from '../../ui/pill'
import { useSurfaceMode } from '../../ui/surface'
import { TipTrigger } from '../../ui/tooltip'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Typography } from '../Typography'
import { SegmentedBar, type SegmentedBarSegment } from './SegmentedBar'
import { STATUS_TOKEN } from './GoalTrajectoryPlot'
import {
  weekStripCells,
  type GoalWeekCell,
  type GoalWeekEntry,
  type GoalWeekOutcome,
} from './goalMilestone'

/** Where a week's column sits, when the strip has to line up with a chart. */
export interface GoalMilestoneWeekAxis {
  /** Centre x of a week's column, in the chart's coordinate space. */
  x: (week: number) => number
  /** Column width in px. */
  span: number
  /** The plot's edges. The strip sits between them and clips there, as the plot does. */
  left: number
  right: number
}

export interface GoalMilestoneWeekStripProps {
  weekCount: number
  currentWeek?: number
  /** One entry per week, aligned to week 1; only past weeks read theirs. */
  weeks?: readonly GoalWeekEntry[]
  /** Renders each week's reading in the tip card. */
  readingText: (entry: GoalWeekEntry) => string
  /** Height of the current week's cell in px; every other week sits shorter. */
  cellHeight?: number
  /**
   * Pins each cell to a chart column instead of sharing the width evenly. The
   * folded card puts the strip directly above the plot, where a cell is the
   * header of its week's column and has to sit exactly over it.
   */
  axis?: GoalMilestoneWeekAxis
}

type Palette = ReturnType<typeof getSemanticColors>

export const WEEK_OUTCOME_LABEL: Record<GoalWeekOutcome, string> = {
  ahead: 'Ahead',
  on_track: 'On track',
  missed: 'Missed',
  none: 'No data',
}

const OUTCOME_PILL_TONE: Record<GoalWeekOutcome, PillTone> = {
  ahead: 'info',
  on_track: 'success',
  missed: 'neutral',
  none: 'neutral',
}

/**
 * Missed is an outlined cell, never red: failure is not scored. No data is the
 * faintest fill, and a week still to come is the neutral track.
 */
/** Every other week sits at this share of the current week's height. */
const PAST_WEEK_HEIGHT = 0.7

/**
 * A cell is its whole column less the shared gap — the same relationship a
 * `SegmentedBar` slot has to its pitch. A 60% cell was tried in round 4 and
 * rejected: "lets go back to how they were before". The number lives with the
 * axis maths, which insets by half of it so the end cells are not left with half
 * the air their neighbours have.
 */
export const CELL_GAP = WEEK_COLUMN_GAP

export function weekSegments(cells: GoalWeekCell[], t: Palette): SegmentedBarSegment[] {
  return cells.map((cell) => ({
    ...paint(cell, t),
    heightFraction: cell.phase === 'current' ? 1 : PAST_WEEK_HEIGHT,
  }))
}

function paint(cell: GoalWeekCell, t: Palette): SegmentedBarSegment {
  if (cell.phase === 'current') return { color: t['hairline-strong'], ringColor: t['text-primary'] }
  if (cell.outcome === 'ahead') return { color: t[STATUS_TOKEN.ahead] }
  if (cell.outcome === 'on_track') return { color: t[STATUS_TOKEN.on_track] }
  if (cell.outcome === 'missed') return { color: t['text-tertiary'], outline: true }
  if (cell.outcome === 'none') return { color: t['hairline-subtle'] }
  return { color: t['hairline-strong'] }
}

/** The tip card: the week, its reading, and the verdict as a chip. */
function TipBody({
  cell,
  readingText,
}: {
  cell: GoalWeekCell
  readingText: (entry: GoalWeekEntry) => string
}) {
  const outcome = cell.outcome ?? 'none'
  return (
    <View className="gap-stack-sm">
      <Typography variant="overline" color="tertiary">
        {`Week ${cell.week}`}
      </Typography>
      <Typography variant="body2">
        {cell.entry?.reading ? readingText(cell.entry) : 'No matched set'}
      </Typography>
      <View style={{ alignItems: 'center' }}>
        <Pill tone={OUTCOME_PILL_TONE[outcome]} variant="subtle" size="sm" leading="dot">
          {WEEK_OUTCOME_LABEL[outcome]}
        </Pill>
      </View>
    </View>
  )
}

function WeekCellTrigger({
  cell,
  children,
  readingText,
}: {
  cell: GoalWeekCell
  children: ReactNode
  readingText: (entry: GoalWeekEntry) => string
}) {
  return (
    <TipTrigger
      label={`Week ${cell.week}, ${WEEK_OUTCOME_LABEL[cell.outcome ?? 'none']}`}
      content={<TipBody cell={cell} readingText={readingText} />}
      // The tooltip's own wrapper sits between the row and the cell; without a
      // size it collapses to zero height and the cell disappears.
      style={{ flex: 1, height: '100%' }}
      testID={`goal-milestone-week-${cell.week}`}
    >
      {children}
    </TipTrigger>
  )
}

/**
 * One column-aligned cell. Same paint as a `SegmentedBar` slot — fill, outline,
 * ring, short-for-a-past-week — laid out by absolute x rather than by flex,
 * because a flex gap drifts a cell off its column by half a gap per step.
 */
function AlignedCell({
  cell,
  segment,
  axis,
  cellHeight,
  readingText,
}: {
  cell: GoalWeekCell
  segment: SegmentedBarSegment
  axis: GoalMilestoneWeekAxis
  cellHeight: number
  readingText: (entry: GoalWeekEntry) => string
}) {
  const width = Math.max(2, axis.span - CELL_GAP)
  const height = cellHeight * (segment.heightFraction ?? 1)
  return (
    <View
      style={{
        position: 'absolute',
        // Chart coordinates, less the strip's own offset into them.
        left: axis.x(cell.week) - axis.left - width / 2,
        bottom: 0,
        width,
        height,
      }}
      testID={`goal-milestone-week-cell-${cell.week}`}
    >
      <WeekCellTrigger cell={cell} readingText={readingText}>
        <View
          style={{
            width: '100%',
            height: '100%',
            borderRadius: SET_LEVEL_FLAT_BAR.radius,
            backgroundColor: segment.outline ? 'transparent' : segment.color,
            borderWidth: segment.outline || segment.ringColor ? 1 : undefined,
            borderColor: segment.ringColor ?? segment.color,
          }}
          accessibilityElementsHidden
          testID={`goal-milestone-week-fill-${cell.week}`}
        />
      </WeekCellTrigger>
    </View>
  )
}

function stripSummary(cells: GoalWeekCell[]): string {
  const current = cells.find((c) => c.phase === 'current')
  const now = current ? `Week ${current.week} of ${cells.length}` : `${cells.length} weeks`
  const past = cells.flatMap((c) =>
    c.outcome ? [`week ${c.week} ${WEEK_OUTCOME_LABEL[c.outcome].toLowerCase()}`] : []
  )
  return [now, ...past].join(', ')
}

/**
 * The block's weeks as cells, on the same `SegmentedBar` atom the rep and set
 * strips are built from: each past week carries its verdict, the current week
 * stands taller and wears the ring, and every cell opens a tip card.
 *
 * No week labels: the week count lives once, on the tile's summary line.
 */
export function GoalMilestoneWeekStrip({
  weekCount,
  currentWeek,
  weeks,
  readingText,
  cellHeight = 8,
  axis,
}: GoalMilestoneWeekStripProps) {
  const t = getSemanticColors(useSurfaceMode())
  const cells = weekStripCells(weekCount, currentWeek, weeks)
  const segments = weekSegments(cells, t)
  if (axis) {
    return (
      <View
        role="group"
        aria-label={stripSummary(cells)}
        testID="goal-milestone-week-strip"
        // Inset to the plot. Nothing is clipped: the axis insets by half a
        // column, so the first and last cells sit whole inside the plane.
        style={{
          marginLeft: axis.left,
          width: axis.right - axis.left,
          height: cellHeight,
          position: 'relative',
        }}
      >
        {cells.map((cell, i) => (
          <AlignedCell
            key={cell.week}
            cell={cell}
            segment={segments[i]}
            axis={axis}
            cellHeight={cellHeight}
            readingText={readingText}
          />
        ))}
      </View>
    )
  }
  return (
    <View
      role="group"
      aria-label={stripSummary(cells)}
      testID="goal-milestone-week-strip"
      style={{ width: '100%' }}
    >
      <SegmentedBar
        height={cellHeight}
        segments={segments}
        segmentTestID={(_seg, i) => `goal-milestone-week-fill-${i + 1}`}
        renderSegment={(slot, _seg, i) => (
          <WeekCellTrigger cell={cells[i]} readingText={readingText}>
            {slot}
          </WeekCellTrigger>
        )}
      />
    </View>
  )
}
