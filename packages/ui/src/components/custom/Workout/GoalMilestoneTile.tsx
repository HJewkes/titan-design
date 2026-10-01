// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { alpha } from '../../../utils/colors'
import { LIFT_RIM_ALPHA } from '../../../theme/lift'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Indicator } from '../../ui/indicator'
import { StatCard, StatCardHeader } from '../../ui/stat-card'
import { Surface, useSurfaceMode } from '../../ui/surface'
import { useMeasuredWidth } from '../Table/column-fit'
import { Typography } from '../../ui/typography'
import {
  GoalMilestoneSummary,
  MilestoneFacts,
  MilestoneHero,
  MilestoneWeekStrip,
  SCALE,
  WALL_MIN_WIDTH,
  accessibleSummary,
  milestoneToneToken,
  resolveTile,
  type GoalMilestoneSummaryProps,
  type GoalMilestoneTileScale,
  type ResolvedTile,
} from './GoalMilestoneSummary'

export { WALL_MIN_WIDTH, milestoneToneToken }
export type { GoalMilestoneTileScale }

export type GoalMilestoneTileLayout = 'full' | 'compact'

export interface GoalMilestoneTileProps extends GoalMilestoneSummaryProps {
  /** `compact` drops the header; the week cells stay unless `showWeeks` says otherwise. */
  layout?: GoalMilestoneTileLayout
  /** Defaults to a raised card for `full` and the bare plane for `compact`. */
  framed?: boolean
  label?: string
}

function StateMark({ tile }: { tile: ResolvedTile }) {
  if (tile.state === 'upcoming') return null
  const hit = tile.state === 'hit'
  const dot = hit ? (tile.beyond ? 'info' : 'success') : 'default'
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      className="gap-inline-sm"
      testID="goal-milestone-state"
    >
      <Indicator color={dot} size="md" />
      {/* The hero's own colour, not a second mapping of the same verdict. */}
      <Typography variant="overline" color="inherit" style={{ color: tile.color }}>
        {hit ? 'Hit' : 'Missed'}
      </Typography>
    </View>
  )
}

/** The plane's bottom lip: the card rim's white, as the chart's inset plane wears it. */
function Plane({ children, pad }: { children: ReactNode; pad: string }) {
  const mode = useSurfaceMode()
  const lip = {
    borderBottomWidth: 1,
    borderBottomColor: alpha(primitiveColors.white, LIFT_RIM_ALPHA[mode]),
  }
  return (
    <Surface pressed className={pad} style={lip} testID="goal-milestone-plane">
      {children}
    </Surface>
  )
}

/**
 * The goal's meso target — the block's committed value, due in its last week —
 * in the frame the per-lift slot wants. Framed, it is a `StatCard` like its
 * siblings: the label and state mark as the header, the hero as the figure, the
 * facts under it and the week cells as the body. Unframed, it is
 * {@link GoalMilestoneSummary} on its own inset plane. Both read one resolved
 * milestone, so the maths behind the hero, the facts and the week cells has one home.
 *
 * @example
 * <GoalMilestoneTile
 *   target={{ metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' }}
 *   weekCount={6}
 *   currentWeek={4}
 *   latest={{ reps: 8, load: 100 }}
 *   status="on_track"
 *   weeks={[{ outcome: 'on_track', reading: { reps: 8, load: 97.5 } }]}
 * />
 */
export function GoalMilestoneTile(allProps: GoalMilestoneTileProps) {
  const { layout = 'full', framed = layout === 'full', label = 'Meso target', className } = allProps
  const t = getSemanticColors(useSurfaceMode())
  const measured = useMeasuredWidth()
  const scale = allProps.scale ?? ((measured.width ?? 0) >= WALL_MIN_WIDTH ? 'wall' : 'phone')
  const tile = resolveTile(allProps, t)
  const a11y = { role: 'article' as const, 'aria-label': accessibleSummary(tile) }
  if (!framed) {
    return (
      <View
        className={className}
        onLayout={measured.onLayout}
        testID="goal-milestone-tile"
        {...a11y}
      >
        <Plane pad={SCALE[scale].pad}>
          <GoalMilestoneSummary {...allProps} scale={scale} className={undefined} />
        </Plane>
      </View>
    )
  }
  return (
    <StatCard
      elevation={1}
      inset={scale === 'wall' ? 'lg' : 'md'}
      className={className}
      onLayout={measured.onLayout}
      testID="goal-milestone-tile"
      {...a11y}
      header={
        <StatCardHeader
          title={label}
          {...(tile.state === 'upcoming' ? {} : { trailing: <StateMark tile={tile} /> })}
        />
      }
      figure={<MilestoneHero tile={tile} scale={scale} />}
      caption={<MilestoneFacts tile={tile} />}
      captionPlacement="below"
      {...((allProps.showWeeks ?? true)
        ? { body: <MilestoneWeekStrip tile={tile} scale={scale} /> }
        : {})}
    />
  )
}
