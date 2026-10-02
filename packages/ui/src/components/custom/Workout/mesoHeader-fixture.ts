// VW-466 Round 0 fixtures for MesoHeader. Names and dates are synthetic; the shapes follow the
// contract's M-cases. Each case is the `mesocycle` field of the goals payload plus the priorities.
import type { GoalPriorityIndexEntry } from './GoalPriorityIndex'
import { NINE_PRIORITIES, THREE_PRIORITIES } from './goalPriorityIndex-fixture'
import type { MesoHeaderProps } from './MesoHeader'

/** The `mesocycle` field of `GET /api/goals`, field for field. */
export interface GoalsPayloadMesocycle {
  programName: string
  blockId: string
  blockName: string
  focus: string | null
  blockIndex: number
  blockCount: number
  startsOn: string
  endsOn: string
  state: 'upcoming' | 'current' | 'ended'
  week: { n: number; of: number; isDeload: boolean; name?: string } | null
  weeks: {
    index: number
    isDeload: boolean
    name?: string
    skipped: 'hold' | 'extend' | null
  }[]
  nextBlock: { id: string; name: string; startsOn: string } | null
}

export interface MesoHeaderFixture {
  /** What the case shows, in the contract's words. */
  title: string
  mesocycle: GoalsPayloadMesocycle
  priorities: GoalPriorityIndexEntry[]
  now: string
}

/** The pick the consumer makes from the payload; stories use it so they read the payload too. */
export function mesoHeaderPropsFrom(fixture: MesoHeaderFixture): MesoHeaderProps {
  const { mesocycle: m, priorities, now } = fixture
  return {
    programName: m.programName,
    blockName: m.blockName,
    focus: m.focus,
    block: { index: m.blockIndex, count: m.blockCount },
    startsOn: m.startsOn,
    endsOn: m.endsOn,
    state: m.state,
    week: m.week,
    weeks: m.weeks,
    nextBlock: m.nextBlock,
    priorities,
    now,
  }
}

function plainWeeks(
  count: number,
  deloads: readonly number[] = []
): GoalsPayloadMesocycle['weeks'] {
  return Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    isDeload: deloads.includes(i + 1),
    skipped: null,
  }))
}

const TWO_WEEK_BLOCK: GoalsPayloadMesocycle = {
  programName: 'Spring Strength',
  blockId: 'block-2',
  blockName: 'Foundation',
  focus: 'Find working weights',
  blockIndex: 2,
  blockCount: 3,
  startsOn: '2026-09-21',
  endsOn: '2026-10-04',
  state: 'current',
  week: { n: 2, of: 2, isDeload: false, name: 'Confirm' },
  weeks: [
    { index: 1, isDeload: false, name: 'Load finding', skipped: null },
    { index: 2, isDeload: false, name: 'Confirm', skipped: null },
  ],
  nextBlock: null,
}

const SIX_WEEKS_DELOAD_LAST: GoalsPayloadMesocycle = {
  ...TWO_WEEK_BLOCK,
  blockName: 'Accumulation',
  startsOn: '2026-08-24',
  endsOn: '2026-10-04',
  week: { n: 6, of: 6, isDeload: true },
  weeks: plainWeeks(6, [6]),
}

const ENDED: GoalsPayloadMesocycle = { ...TWO_WEEK_BLOCK, state: 'ended', week: null }

export const MESO_HEADER_FIXTURES = {
  m2Upcoming: {
    title: 'M2 upcoming: starts Mon 21 Sep, in 2 days',
    mesocycle: { ...TWO_WEEK_BLOCK, state: 'upcoming', week: null },
    priorities: THREE_PRIORITIES,
    now: '2026-09-19',
  },
  m3Current: {
    title: 'M3 current: week 2 of 2, three priorities',
    mesocycle: TWO_WEEK_BLOCK,
    priorities: THREE_PRIORITIES,
    now: '2026-09-30',
  },
  m5LongFocus: {
    title: 'M5 long focus: the full text sits in the tip',
    mesocycle: {
      ...TWO_WEEK_BLOCK,
      blockName: 'Foundation and load finding for the main lifts',
      focus:
        'Load finding: settle current working weights on the main upper and lower lifts before any periodized block',
    },
    priorities: THREE_PRIORITIES,
    now: '2026-09-30',
  },
  m8Deload: {
    title: 'M8 deload: week 6 of 6',
    mesocycle: SIX_WEEKS_DELOAD_LAST,
    priorities: THREE_PRIORITIES,
    now: '2026-09-30',
  },
  m9EndedNoNext: {
    title: 'M9 ended, next block not planned',
    mesocycle: ENDED,
    priorities: THREE_PRIORITIES,
    now: '2026-10-07',
  },
  m10EndedNextDated: {
    title: 'M10 between blocks, next dated',
    mesocycle: {
      ...ENDED,
      nextBlock: { id: 'block-3', name: 'Intensification', startsOn: '2026-10-12' },
    },
    priorities: THREE_PRIORITIES,
    now: '2026-10-07',
  },
  m11OneWeek: {
    title: 'M11 one-week block',
    mesocycle: {
      ...TWO_WEEK_BLOCK,
      blockName: 'Discovery',
      startsOn: '2026-09-28',
      endsOn: '2026-10-04',
      week: { n: 1, of: 1, isDeload: false },
      weeks: plainWeeks(1),
    },
    priorities: THREE_PRIORITIES,
    now: '2026-09-30',
  },
  m12SixteenWeeks: {
    title: 'M12 sixteen weeks, week 12',
    mesocycle: {
      ...TWO_WEEK_BLOCK,
      blockName: 'Long build',
      startsOn: '2026-07-13',
      endsOn: '2026-11-01',
      week: { n: 12, of: 16, isDeload: false },
      weeks: plainWeeks(16, [8, 16]),
    },
    priorities: THREE_PRIORITIES,
    now: '2026-09-30',
  },
  m13NinePriorities: {
    title: 'M13 nine priorities, one with no target',
    mesocycle: TWO_WEEK_BLOCK,
    priorities: NINE_PRIORITIES,
    now: '2026-09-30',
  },
  m15NoPriorities: {
    title: 'M15 dated block, no priorities',
    mesocycle: TWO_WEEK_BLOCK,
    priorities: [],
    now: '2026-09-30',
  },
  m16SkippedWeeks: {
    title: 'M16 skipped weeks: week 3 held, week 4 extended',
    mesocycle: {
      ...SIX_WEEKS_DELOAD_LAST,
      startsOn: '2026-08-31',
      endsOn: '2026-10-11',
      week: { n: 5, of: 6, isDeload: false },
      weeks: plainWeeks(6, [6]).map((week) => ({
        ...week,
        skipped: week.index === 3 ? 'hold' : week.index === 4 ? 'extend' : null,
      })),
    },
    priorities: THREE_PRIORITIES,
    now: '2026-09-30',
  },
} satisfies Record<string, MesoHeaderFixture>

export type MesoHeaderFixtureKey = keyof typeof MESO_HEADER_FIXTURES
