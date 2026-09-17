// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import { Pill, type PillTone } from '../../ui/pill'
import { useSurfaceMode } from '../../ui/surface'
import { Tooltip } from '../../ui/tooltip'
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

/** How a week's tip card is laid out. Both carry the same three facts. */
export type GoalWeekTipStyle = 'one-line' | 'stacked'

export interface GoalMilestoneWeekStripProps {
  weekCount: number
  currentWeek?: number
  /** One entry per week, aligned to week 1; only past weeks read theirs. */
  weeks?: readonly GoalWeekEntry[]
  /** Renders each week's reading in the tip card. */
  readingText: (entry: GoalWeekEntry) => string
  tipStyle?: GoalWeekTipStyle
  /** Cell height in px. Matches the rep and set cells this composes. */
  cellHeight?: number
  /** Overrides the `ahead` cell colour, so a decision story can hold a candidate hue. */
  aheadColor?: string
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
function paint(cell: GoalWeekCell, t: Palette, aheadColor?: string): SegmentedBarSegment {
  if (cell.phase === 'current') return { color: t['hairline-strong'], ringColor: t['text-primary'] }
  if (cell.outcome === 'ahead') return { color: aheadColor ?? t[STATUS_TOKEN.ahead] }
  if (cell.outcome === 'on_track') return { color: t[STATUS_TOKEN.on_track] }
  if (cell.outcome === 'missed') return { color: t['text-tertiary'], outline: true }
  if (cell.outcome === 'none') return { color: t['hairline-subtle'] }
  return { color: t['hairline-strong'] }
}

function TipBody({
  cell,
  readingText,
  style,
}: {
  cell: GoalWeekCell
  readingText: (entry: GoalWeekEntry) => string
  style: GoalWeekTipStyle
}) {
  const outcome = cell.outcome ?? 'none'
  const reading = cell.entry?.reading ? readingText(cell.entry) : 'No matched set'
  const pill = (
    <Pill tone={OUTCOME_PILL_TONE[outcome]} variant="subtle" size="sm" leading="dot">
      {WEEK_OUTCOME_LABEL[outcome]}
    </Pill>
  )
  if (style === 'one-line') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <Typography variant="boldLabel">{`w${cell.week}`}</Typography>
        <Typography variant="body2" color="secondary">
          {reading}
        </Typography>
        {pill}
      </View>
    )
  }
  return (
    <View className="gap-stack-sm">
      <Typography variant="overline" color="tertiary">
        {`Week ${cell.week}`}
      </Typography>
      <Typography variant="body2">{reading}</Typography>
      {pill}
    </View>
  )
}

/** Hover on web, focus for the keyboard, press on native — one open state for all three. */
function WeekCellTrigger({
  cell,
  children,
  readingText,
  tipStyle,
}: {
  cell: GoalWeekCell
  children: ReactNode
  readingText: (entry: GoalWeekEntry) => string
  tipStyle: GoalWeekTipStyle
}) {
  const [open, setOpen] = useState(false)
  const label = `Week ${cell.week}, ${WEEK_OUTCOME_LABEL[cell.outcome ?? 'none']}`
  return (
    <Tooltip
      isOpen={open}
      placement="top"
      usePortal
      // The tooltip's own wrapper sits between the row and the cell; without a
      // size it collapses to zero height and the cell disappears.
      style={{ flex: 1, height: '100%' }}
      content={<TipBody cell={cell} readingText={readingText} style={tipStyle} />}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onHoverIn={() => setOpen(true)}
        onHoverOut={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onPress={() => setOpen((wasOpen) => !wasOpen)}
        style={{ flex: 1, height: '100%' }}
        testID={`goal-milestone-week-${cell.week}`}
      >
        {children}
      </Pressable>
    </Tooltip>
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
 * wears the ring, and every cell opens a tip card with its reading.
 *
 * No week labels: the week count lives once, on the tile's summary line.
 */
export function GoalMilestoneWeekStrip({
  weekCount,
  currentWeek,
  weeks,
  readingText,
  tipStyle = 'one-line',
  cellHeight = 8,
  aheadColor,
}: GoalMilestoneWeekStripProps) {
  const t = getSemanticColors(useSurfaceMode())
  const cells = weekStripCells(weekCount, currentWeek, weeks)
  return (
    <View
      role="group"
      aria-label={stripSummary(cells)}
      testID="goal-milestone-week-strip"
      style={{ width: '100%' }}
    >
      <SegmentedBar
        height={cellHeight}
        segments={cells.map((cell) => paint(cell, t, aheadColor))}
        segmentTestID={(_seg, i) => `goal-milestone-week-fill-${i + 1}`}
        renderSegment={(slot, _seg, i) => (
          <WeekCellTrigger cell={cells[i]} readingText={readingText} tipStyle={tipStyle}>
            {slot}
          </WeekCellTrigger>
        )}
      />
    </View>
  )
}
