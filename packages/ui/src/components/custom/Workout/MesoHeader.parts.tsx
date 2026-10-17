// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
// The MesoHeader parts every shape shares: the week bar, the state tag, the focus tip, the priorities.
import { View } from 'react-native'

import { getSemanticColors } from '../../../theme/tokens/semantic'
import { InfoIcon } from '../../icons'
import { Pill } from '../../ui/pill'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { useSurfaceMode } from '../../ui/surface'
import { TipTrigger } from '../../ui/tooltip'
import { Typography } from '../../ui/typography'
import { GoalPriorityIndex, type GoalPriorityIndexEntry } from './GoalPriorityIndex'
import { BAR_HEIGHT, blockTitle, positionText, weekCells, weeksLabel } from './MesoHeader.model'
import type {
  MesoHeaderModel,
  MesoHeaderSchedule,
  MesoHeaderState,
  MesoHeaderWeek,
} from './MesoHeader.types'
import { SegmentedBar } from './SegmentedBar'

export const ROW = { flexDirection: 'row', alignItems: 'center' } as const
export const WRAPPING_ROW = { ...ROW, flexWrap: 'wrap' } as const
export const TOP_ROW = { flexDirection: 'row', alignItems: 'flex-start' } as const
export const FLEX_CELL = { flex: 1, minWidth: 0 } as const

/** Every part reads the one header model. */
export interface PartProps {
  model: MesoHeaderModel
}

interface WeekBarProps {
  weeks: readonly MesoHeaderWeek[]
  state: MesoHeaderState
  current: number | undefined
  width?: number
  gap?: number
  /** Shape C's "today" line, as a fraction of the block. */
  marker?: { position: number; color: string } | null
}

export function WeekBar({ weeks, state, current, width, gap, marker }: WeekBarProps) {
  const t = getSemanticColors(useSurfaceMode())
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={weeksLabel(weeks, current)}
      style={{ width, flexGrow: width === undefined ? 1 : 0, minWidth: 0 }}
      testID="meso-header-weeks"
    >
      {/* Without a renderSegment the slot flexes to full height and ignores heightFraction. */}
      <SegmentedBar
        segments={weekCells(weeks, state, current, t)}
        height={BAR_HEIGHT}
        gap={gap}
        marker={marker}
        renderSegment={(slot) => slot}
      />
    </View>
  )
}

/** The neutral pill's own label misses 4.5:1 on the header plane, so the label takes primary text. */
function StateTag({ label }: { label: string }) {
  return (
    <Pill size="xs" textClassName="text-text-primary">
      {label}
    </Pill>
  )
}

export function StatePill({ schedule }: { schedule: MesoHeaderSchedule }) {
  if (schedule.state === 'upcoming') return <StateTag label="Upcoming" />
  if (schedule.state === 'ended') return <StateTag label="Ended" />
  return schedule.week?.isDeload ? <StateTag label="Deload" /> : null
}

export function FocusTip({ focus }: { focus: string }) {
  return (
    <TipTrigger
      label="Block focus"
      content={<Typography variant="body2">{focus}</Typography>}
      placement="bottom"
      testID="meso-header-focus"
    >
      <InfoIcon size={14} />
    </TipTrigger>
  )
}

export function PrioritiesSlot({ priorities }: { priorities: readonly GoalPriorityIndexEntry[] }) {
  if (priorities.length === 0) {
    return (
      <Typography variant="body2" color="tertiary" testID="meso-header-no-priorities">
        No priorities declared
      </Typography>
    )
  }
  return <GoalPriorityIndex priorities={priorities} />
}

export function PrioritiesTrigger({ model }: PartProps) {
  const { priorities, popover } = model
  if (priorities.length === 0) return null
  return (
    <Popover isOpen={popover.isOpen} onOpenChange={popover.onOpenChange} placement="bottom">
      <PopoverTrigger>
        <Pill size="sm" variant="outline" testID="meso-header-priorities-trigger">
          {`Priorities · ${priorities.length}`}
        </Pill>
      </PopoverTrigger>
      <PopoverContent className="left-auto right-0 max-w-[280px]">
        <GoalPriorityIndex priorities={priorities} />
      </PopoverContent>
    </Popover>
  )
}

export interface SegmentLabel {
  text: string
  weight: number
  isCurrent: boolean
}

/** One label under each bar segment, on the same flex weights and gap, so each sits under its cell. */
export function SegmentLabels({ labels, gap }: { labels: readonly SegmentLabel[]; gap: number }) {
  return (
    <View style={{ flexDirection: 'row', gap }} testID="meso-header-segment-labels">
      {labels.map((label, i) => (
        <View key={i} style={{ flex: label.weight, minWidth: 0 }}>
          <Typography variant="caption" color={label.isCurrent ? 'primary' : 'secondary'}>
            {label.text}
          </Typography>
        </View>
      ))}
    </View>
  )
}

/** The phone form's first line in shapes A and B: block name, the compact position, the trigger. */
export function PhoneTitleRow({ model }: PartProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
      <View style={{ flexShrink: 1, minWidth: 0 }}>
        <Typography variant="overline">{model.block.name}</Typography>
      </View>
      <Typography variant="body2" testID="meso-header-position" style={{ flexShrink: 0 }}>
        {positionText(model.schedule, model.now, true)}
      </Typography>
      <StatePill schedule={model.schedule} />
      <View style={{ marginLeft: 'auto' }}>
        <PrioritiesTrigger model={model} />
      </View>
    </View>
  )
}

/** The week text and its state tag, as shapes B and C show them on the wall. */
export function PositionGroup({ model }: PartProps) {
  return (
    <View style={ROW} className="gap-inline-sm">
      <Typography variant="body2" testID="meso-header-position">
        {positionText(model.schedule, model.now)}
      </Typography>
      <StatePill schedule={model.schedule} />
    </View>
  )
}

/** The block title with its focus tip; shape B leads it with the program's name. */
export function TitleGroup({ model, withProgram }: PartProps & { withProgram?: boolean }) {
  const { programName, focus } = model.block
  const title = blockTitle(model.block)
  return (
    <View style={ROW} className="gap-inline-sm">
      <Typography variant="overline">
        {withProgram && programName ? `${programName} › ${title}` : title}
      </Typography>
      {focus ? <FocusTip focus={focus} /> : null}
    </View>
  )
}
