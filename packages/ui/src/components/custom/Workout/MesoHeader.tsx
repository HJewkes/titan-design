// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { useMeasuredWidth } from '../../../hooks/useMeasuredWidth'
import { cn } from '../../../utils/cn'
import { Typography } from '../../ui/typography'
import {
  blockTitle,
  dayLabel,
  FocusTip,
  MESO_HEADER_PHONE_MAX,
  positionText,
  PrioritiesSlot,
  PhoneTitleRow,
  StatePill,
  WeekBar,
  type BandProps,
  type MesoHeaderProps,
} from './MesoHeader.parts'
import { CyclePhone, CycleWall, SpinePhone, SpineWall } from './MesoHeader.shapes'

export {
  dayLabel,
  MESO_HEADER_PHONE_MAX,
  positionText,
  weekCells,
  weeksLabel,
  type MesoHeaderCurrentWeek,
  type MesoHeaderCycleBlock,
  type MesoHeaderProps,
  type MesoHeaderShape,
  type MesoHeaderState,
  type MesoHeaderWeek,
} from './MesoHeader.parts'

const WALL_CELL_WIDTH = 24
const WALL_BAR_MAX_WIDTH = 320

function WallBand(props: BandProps) {
  const { blockName, block, focus, startsOn, endsOn, state, week, weeks, priorities } = props
  const barWidth = Math.min(weeks.length * WALL_CELL_WIDTH, WALL_BAR_MAX_WIDTH)
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}
      className="gap-x-section-sm gap-y-stack-sm"
      testID="meso-header-wall"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <Typography variant="overline">{blockTitle(blockName, block)}</Typography>
        {focus ? <FocusTip focus={focus} /> : null}
      </View>
      <Typography variant="body2" color="secondary">
        {`${dayLabel(startsOn)} - ${dayLabel(endsOn)}`}
      </Typography>
      <WeekBar weeks={weeks} state={state} current={week?.n} width={barWidth} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <Typography variant="body2" testID="meso-header-position">
          {positionText(props)}
        </Typography>
        <StatePill state={state} isDeload={week?.isDeload ?? false} />
      </View>
      <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
        <PrioritiesSlot priorities={priorities} />
      </View>
    </View>
  )
}

function PhoneBand(props: BandProps) {
  const { startsOn, endsOn, state, week, weeks } = props
  return (
    <View className="gap-stack-sm" testID="meso-header-phone">
      <PhoneTitleRow {...props} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-md">
        <WeekBar weeks={weeks} state={state} current={week?.n} />
        <Typography variant="caption" color="secondary" style={{ flexShrink: 0 }}>
          {`${dayLabel(startsOn, false)} - ${dayLabel(endsOn, false)}`}
        </Typography>
      </View>
    </View>
  )
}

const SHAPES = {
  band: { wall: WallBand, phone: PhoneBand },
  cycle: { wall: CycleWall, phone: CyclePhone },
  spine: { wall: SpineWall, phone: SpinePhone },
} as const

function ShapeBody({ band, form }: { band: BandProps; form: 'wall' | 'phone' }) {
  const Body = SHAPES[band.shape ?? 'spine'][form]
  return <Body {...band} />
}

/** The header's own data apart from the props its root View takes. */
function splitProps(
  props: MesoHeaderProps
): [BandProps, Pick<MesoHeaderProps, 'layout' | 'className'> & ViewProps] {
  const {
    programName,
    blockName,
    focus,
    block,
    startsOn,
    endsOn,
    state,
    week,
    weeks,
    nextBlock,
    priorities = [],
    isPrioritiesOpen,
    onPrioritiesOpenChange,
    now,
    shape,
    cycle,
    prioritiesLine,
    ...rest
  } = props
  const band = {
    ...{ programName, blockName, focus, block, startsOn, endsOn, state, week, weeks, nextBlock },
    ...{ priorities, isPrioritiesOpen, onPrioritiesOpenChange, now, shape, cycle, prioritiesLine },
  }
  return [band, rest]
}

/**
 * The pinned header of the goals page: which block, the dates it runs, where the lifter is in
 * it, and what it is for. One band on the wall; two lines on a phone with the priorities behind
 * a "Priorities · N" popover. Switches form by its own width, at the live strip's threshold.
 *
 * VW-466 round-1 specimen: `shape` picks A, B or C. No loading, error or disabled state: the page owns the
 * fetch, and with no dated block the consumer renders a note instead of this header.
 */
export function MesoHeader(props: MesoHeaderProps) {
  const [band, { layout, className, ...viewProps }] = splitProps(props)
  const { width, onLayout } = useMeasuredWidth()
  const measured = width !== null && width < MESO_HEADER_PHONE_MAX ? 'phone' : 'wall'
  const form = layout ?? measured
  return (
    <View
      onLayout={onLayout}
      className={cn('bg-surface-base px-inset-lg py-inset-md', className)}
      testID="meso-header"
      {...viewProps}
    >
      <ShapeBody band={band} form={form} />
    </View>
  )
}
