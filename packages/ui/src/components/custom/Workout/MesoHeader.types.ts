import type { ViewProps } from 'react-native'

import type { GoalPriorityIndexEntry } from './GoalPriorityIndex'

export type MesoHeaderState = 'upcoming' | 'current' | 'ended'

/**
 * Round-only, deleted in slice 4 of VW-466: `band` is shape A (one band), `cycle` is B (A plus
 * the program's blocks as a bar), `spine` is C (labelled week cells as the header).
 */
export type MesoHeaderShape = 'band' | 'cycle' | 'spine'

/** Round-only, for shape B: one of the program's blocks. Not on the goals payload today. */
export interface MesoHeaderCycleBlock {
  name: string
  weeks: number
}

export interface MesoHeaderWeek {
  index: number
  isDeload: boolean
  name?: string
  /** `hold` kept the calendar and skipped the plan week; `extend` added this week off. */
  skipped?: 'hold' | 'extend' | null
}

export interface MesoHeaderCurrentWeek {
  n: number
  of: number
  isDeload: boolean
  name?: string
}

/** Which block this is: its name, its program, what it is for and where it sits in the program. */
export interface MesoHeaderBlock {
  name: string
  programName?: string
  focus?: string | null
  /** The block's place in its program, counting from 1, and how many blocks the program has. */
  order?: { index: number; count: number }
}

/** When the block runs and where the lifter is in it. */
export interface MesoHeaderSchedule {
  /** ISO date of the block's first day. */
  startsOn: string
  /** ISO date of the block's last day, inclusive. */
  endsOn: string
  state: MesoHeaderState
  week?: MesoHeaderCurrentWeek | null
  weeks: readonly MesoHeaderWeek[]
  nextBlock?: { name: string; startsOn: string } | null
}

export interface MesoHeaderProps extends ViewProps {
  block: MesoHeaderBlock
  schedule: MesoHeaderSchedule
  priorities?: readonly GoalPriorityIndexEntry[]
  isPrioritiesOpen?: boolean
  onPrioritiesOpenChange?: (open: boolean) => void
  /** Pins the measured layout, for stories and tests. */
  layout?: 'wall' | 'phone'
  /** ISO date standing in for today, so "in 2 days" can be pinned; the header never reads the clock. */
  now?: string
  shape?: MesoHeaderShape
  /** Round-only, shape B: the program's blocks in order; `block.order.index` marks the current one. */
  cycle?: readonly MesoHeaderCycleBlock[]
  /** Round-only, shape C's phone form: the Priorities trigger on line 1 (P1, default) or line 2 (P2). */
  prioritiesLine?: 1 | 2
  className?: string
}

/** What every internal part reads: the header's data with its defaults applied. */
export interface MesoHeaderModel {
  block: MesoHeaderBlock
  schedule: MesoHeaderSchedule
  priorities: readonly GoalPriorityIndexEntry[]
  popover: { isOpen?: boolean; onOpenChange?: (open: boolean) => void }
  now?: string
  cycle: readonly MesoHeaderCycleBlock[]
  prioritiesLine: 1 | 2
}
