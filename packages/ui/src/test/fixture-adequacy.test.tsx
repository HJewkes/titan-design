import { describe, expect, it } from 'vitest'
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MuscleGroup } from '../components/custom/Workout/muscleTaxonomy'
import { BodyweightGoalCard } from '../components/custom/Workout/BodyweightGoalCard'
import {
  GoalCard,
  GoalLiftCard,
  type GoalLiftCardProps,
} from '../components/custom/Workout/GoalCard'
import { GoalMilestoneTile } from '../components/custom/Workout/GoalMilestoneTile'
import {
  GoalMuscleCard,
  type GoalMuscleCardProps,
} from '../components/custom/Workout/GoalMuscleCard'
import { PrimaryGoalCard } from '../components/custom/Workout/PrimaryGoalCard'
import { SessionsGoalCard } from '../components/custom/Workout/SessionsGoalCard'
import { GOAL_MILESTONE_SCENARIOS } from '../components/custom/Workout/goalMilestone-fixture'
import { PRIMARY_GOAL_SCENARIOS } from '../components/custom/Workout/primaryGoal-fixture'
import {
  WHOLE_BODY_SESSIONS,
  WHOLE_BODY_WEIGHT,
} from '../components/custom/Workout/wholeBody-fixture'
import { SessionListItem } from '../components/custom/ActiveWork/SessionListItem'
import { TaskRow, type TaskListItem } from '../components/custom/ActiveWork/TaskRow'
import { SESSION_FIXTURE, SESSION_NOW } from '../components/custom/ActiveWork/session-fixture'
import { Table, TableBody } from '../components/ui/table'
import baseline from './fixture-adequacy-baseline.json'
import {
  adequacyProblems,
  admitsNull,
  admitsUndefined,
  garbageTokens,
  labelCases,
  missingValueCases,
  orphanBaselineKeys,
  renderedText,
  type AdequacyCase,
  type ManifestEntry,
} from './fixture-adequacy'

const FIRST_USE_SHOWS = 'Best \n—'
const CHART_WIDTH = 560
const FIRST_USE_NOTE =
  'N5 first-use: no numeric slot types a first-use marker, so the card cannot be told it.'

const primary = PRIMARY_GOAL_SCENARIOS.onTrack
const milestone = GOAL_MILESTONE_SCENARIOS.onTrack

const lift: GoalLiftCardProps = {
  name: 'Sample lift',
  status: 'on_track',
  milestone: { reps: 8, load: 105, unit: 'lb', goalWeek: 8 },
  committed: 102.5,
  stretch: 110,
  actuals: [
    { weekIndex: 1, value: 92.5 },
    { weekIndex: 3, value: 95 },
  ],
  currentWeek: 3,
  latest: { reps: 8, load: 95 },
  statusForm: 'pill',
}

const muscle: GoalMuscleCardProps = {
  name: 'Sample muscle',
  muscle: MuscleGroup.UPPER_BACK,
  side: 'back',
  status: 'on_track',
  liftsOnTrack: 1,
  liftsTotal: 2,
  commonGoalWeek: 5,
  lifts: [
    { name: 'Lift one', status: 'on_track', reps: 10, load: 100, unit: 'lb', goalWeek: 5 },
    { name: 'Lift two', status: 'behind', reps: 6, load: 30, unit: 'lb', goalWeek: 7 },
  ],
}

const task: TaskListItem = {
  slug: 'sample',
  id: 'SA-1',
  title: 'Sample task',
  severity: 'high',
  priority: 10,
  estimate: 3,
  updated: '2026-07-01T10:00:00Z',
}

function goalCard(props: Partial<Parameters<typeof GoalCard>[0]>) {
  return (
    <GoalCard
      title={primary.title}
      status={primary.status}
      size="compact"
      milestone={primary.milestone}
      trend={{
        committed: 185,
        stretch: 195,
        actuals: [{ weekIndex: 1, value: 175 }],
        goalWeek: 6,
        unit: 'lb',
      }}
      chartWidth={CHART_WIDTH}
      statusForm="pill"
      {...props}
    />
  )
}

function primaryCard(props: Partial<Parameters<typeof PrimaryGoalCard>[0]>) {
  return <PrimaryGoalCard {...primary} chartWidth={CHART_WIDTH} statusForm="pill" {...props} />
}

const firstUseMilestone = { ...primary.milestone, latest: undefined, currentWeek: undefined }
const firstUseTrend = { committed: 185, stretch: 195, actuals: [], goalWeek: 6, unit: 'lb' }

/** No readings yet: the cards fall back from `latest` to the last actual, so only `[]` shows the gap. */
function firstUseCase(component: string, element: () => ReactElement): AdequacyCase {
  return { id: `${component} actuals=first-use`, element, shows: FIRST_USE_SHOWS }
}

function taskRow(item: TaskListItem) {
  return (
    <Table density="dense">
      <TableBody>
        <TaskRow task={item} ageLabel="1d ago" />
      </TableBody>
    </Table>
  )
}

const weight = WHOLE_BODY_WEIGHT.cut
const bodyweightCard = (goal: typeof weight) => (
  <BodyweightGoalCard goal={goal} scale="wall" tagCollapsed isTagTipOpen isTipOpen />
)
const sessionsCard = (goal: typeof WHOLE_BODY_SESSIONS.underPace) => (
  <SessionsGoalCard goal={goal} scale="wall" isTipOpen />
)

const MANIFEST: ManifestEntry[] = [
  {
    component: 'GoalCard',
    path: 'custom/Workout/GoalCard.tsx',
    cases: [
      ...labelCases('GoalCard', 'title', (title) => goalCard({ title })),
      ...missingValueCases('GoalCard', 'milestone.latest', admitsUndefined, (latest) =>
        goalCard({ milestone: { ...primary.milestone, latest } })
      ),
      ...missingValueCases('GoalCard', 'milestone.currentWeek', admitsUndefined, (currentWeek) =>
        goalCard({ milestone: { ...primary.milestone, currentWeek } })
      ),
      firstUseCase('GoalCard', () =>
        goalCard({ milestone: firstUseMilestone, trend: firstUseTrend })
      ),
    ],
    notes: [
      'Rendered at size="compact"; PrimaryGoalCard covers size="full".',
      'N5 null: milestone.latest and milestone.currentWeek are optional, not nullable.',
      'trend numbers (committed, stretch, goalWeek, actuals) are required numbers.',
      FIRST_USE_NOTE,
    ],
  },
  {
    component: 'PrimaryGoalCard',
    path: 'custom/Workout/PrimaryGoalCard.tsx',
    cases: [
      ...labelCases('PrimaryGoalCard', 'title', (title) => primaryCard({ title })),
      ...missingValueCases('PrimaryGoalCard', 'milestone.latest', admitsUndefined, (latest) =>
        primaryCard({ milestone: { ...primary.milestone, latest } })
      ),
      ...missingValueCases(
        'PrimaryGoalCard',
        'milestone.currentWeek',
        admitsUndefined,
        (currentWeek) => primaryCard({ milestone: { ...primary.milestone, currentWeek } })
      ),
      ...missingValueCases('PrimaryGoalCard', 'goal.currentWeek', admitsUndefined, (currentWeek) =>
        primaryCard({ goal: { ...primary.goal, currentWeek } })
      ),
      firstUseCase('PrimaryGoalCard', () =>
        primaryCard({ milestone: firstUseMilestone, goal: { ...primary.goal, actuals: [] } })
      ),
    ],
    notes: [
      'N5 null: the optional numeric slots are not nullable.',
      'goal.committed, goal.stretch and the expected band are required numbers.',
      FIRST_USE_NOTE,
    ],
  },
  {
    component: 'GoalLiftCard',
    path: 'custom/Workout/GoalCard.tsx (export GoalLiftCard)',
    cases: [
      ...labelCases('GoalLiftCard', 'name', (name) => <GoalLiftCard {...lift} name={name} />),
      ...missingValueCases('GoalLiftCard', 'latest', admitsUndefined, (latest) => (
        <GoalLiftCard {...lift} latest={latest} />
      )),
      ...missingValueCases('GoalLiftCard', 'currentWeek', admitsUndefined, (currentWeek) => (
        <GoalLiftCard {...lift} currentWeek={currentWeek} />
      )),
      firstUseCase('GoalLiftCard', () => (
        <GoalLiftCard {...lift} actuals={[]} latest={undefined} currentWeek={undefined} />
      )),
    ],
    notes: [
      'N5 null: latest and currentWeek are optional, not nullable.',
      'latest and currentWeek fall back to the last reading; only actuals=first-use shows the gap.',
      'committed, stretch and milestone numbers are required numbers.',
      FIRST_USE_NOTE,
    ],
  },
  {
    component: 'GoalMuscleCard',
    path: 'custom/Workout/GoalMuscleCard.tsx',
    cases: labelCases('GoalMuscleCard', 'name', (name) => (
      <GoalMuscleCard {...muscle} name={name} />
    )),
    notes: [
      'No N5 cases: liftsOnTrack, liftsTotal, commonGoalWeek and every lift number are required.',
    ],
  },
  {
    component: 'BodyweightGoalCard',
    path: 'custom/Workout/BodyweightGoalCard.tsx',
    cases: [
      ...missingValueCases('BodyweightGoalCard', 'goal.latest', admitsNull, (latest) =>
        bodyweightCard({ ...weight, latest })
      ),
      ...missingValueCases('BodyweightGoalCard', 'goal.rate', admitsNull, (rate) =>
        bodyweightCard({ ...weight, rate })
      ),
    ],
    notes: [
      'No label cases: the card has no name slot; its heading is derived from goal.phase.',
      'goal.rate band rates are already null in the cut fixture, so goal.rate=N5:null covers both.',
      'N5 undefined: goal.latest and goal.rate are nullable, not optional.',
      FIRST_USE_NOTE,
    ],
  },
  {
    component: 'SessionsGoalCard',
    path: 'custom/Workout/SessionsGoalCard.tsx',
    cases: missingValueCases(
      'SessionsGoalCard',
      'goal.agingOutNext7d',
      admitsNull,
      (agingOutNext7d) => sessionsCard({ ...WHOLE_BODY_SESSIONS.underPace, agingOutNext7d })
    ),
    notes: [
      'No label cases: the card has no name slot.',
      'N5 undefined: agingOutNext7d is nullable, not optional; the other counts are required.',
      FIRST_USE_NOTE,
    ],
  },
  {
    component: 'GoalMilestoneTile',
    path: 'custom/Workout/GoalMilestoneTile.tsx',
    cases: [
      ...labelCases('GoalMilestoneTile', 'label', (label) => (
        <GoalMilestoneTile {...milestone} label={label} />
      )),
      ...missingValueCases('GoalMilestoneTile', 'latest', admitsUndefined, (latest) => (
        <GoalMilestoneTile {...milestone} label="Sample goal" latest={latest} />
      )),
      ...missingValueCases('GoalMilestoneTile', 'currentWeek', admitsUndefined, (currentWeek) => (
        <GoalMilestoneTile {...milestone} label="Sample goal" currentWeek={currentWeek} />
      )),
    ],
    notes: ['N5 null: latest and currentWeek are optional, not nullable.', FIRST_USE_NOTE],
  },
  {
    component: 'TaskRow',
    path: 'custom/ActiveWork/TaskRow.tsx',
    cases: [
      ...labelCases('TaskRow', 'task.title', (title) => taskRow({ ...task, title })),
      ...missingValueCases('TaskRow', 'task.estimate', admitsUndefined, (estimate) =>
        taskRow({ ...task, estimate })
      ),
    ],
    notes: [
      'N5 null: task.estimate is optional, not nullable; task.priority is a required number.',
      FIRST_USE_NOTE,
    ],
  },
  {
    component: 'SessionListItem',
    path: 'custom/ActiveWork/SessionListItem.tsx',
    cases: labelCases('SessionListItem', 'session.title', (title) => (
      <SessionListItem session={{ ...SESSION_FIXTURE[0]!, title }} now={SESSION_NOW} />
    )),
    notes: ['No N5 cases: SessionSummary has no numeric field, and now is a required number.'],
  },
]

const BASELINE: Record<string, string[]> = baseline
const CASES = MANIFEST.flatMap((entry) => entry.cases)

describe('fixture adequacy: no garbage tokens under stress strings and missing values', () => {
  it.each(CASES.map((adequacyCase) => [adequacyCase.id, adequacyCase] as const))(
    '%s',
    (id, adequacyCase) => {
      const { unmount } = render(adequacyCase.element())
      // document.body, not the container: pinned-open tips render into portals.
      const text = renderedText(document.body)
      unmount()

      if (adequacyCase.shows) expect(text).toContain(adequacyCase.shows)
      expect(adequacyProblems(id, garbageTokens(text), BASELINE[id])).toEqual([])
    }
  )

  it('keeps no baseline entry for a case the manifest no longer runs', () => {
    expect(
      orphanBaselineKeys(
        BASELINE,
        CASES.map(({ id }) => id)
      )
    ).toEqual([])
  })

  it('gives every case a unique id', () => {
    const ids = CASES.map(({ id }) => id)

    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('garbageTokens', () => {
  it('finds each c04 token in a formatted value', () => {
    const text = 'NaN lb · undefined · null reps · Infinity% · [object Object] · 0×0 · 0x0'

    expect(garbageTokens(text)).toEqual([
      'NaN',
      'undefined',
      'null',
      'Infinity',
      '[object Object]',
      '0x0',
    ])
  })

  it('finds a token glued to the value or unit beside it', () => {
    expect(garbageTokens('1undefinedlb')).toEqual(['undefined'])
  })

  it('leaves the stress strings and ordinary set notation alone', () => {
    const text = 'synthetic-fixture-id-0f3a9c7e2b5d4a18 · 8 x 100 lb · 10x05 · 0.0x0.5 · nanny'

    expect(garbageTokens(text)).toEqual([])
  })
})

describe('renderedText', () => {
  it('keeps adjacent text nodes apart and reads accessible names', () => {
    const root = document.createElement('div')
    root.innerHTML = '<span>1</span><span>0</span><span aria-label="Estimate" title="Tip"></span>'

    expect(renderedText(root).split('\n')).toEqual(['1', '0', 'Estimate', 'Tip'])
  })
})

describe('adequacyProblems', () => {
  it('reports a token the baseline does not list', () => {
    expect(adequacyProblems('Card name=S1', ['NaN'], undefined)).toHaveLength(1)
  })

  it('reports a baselined token that no longer renders', () => {
    expect(adequacyProblems('Card name=S1', [], ['NaN'])).toHaveLength(1)
  })

  it('reports a baseline entry with an empty list as stale', () => {
    const problems = adequacyProblems('Card name=S1', [], [])

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('empty')
  })

  it('accepts a case with no baseline entry and no garbage', () => {
    expect(adequacyProblems('Card name=S1', [], undefined)).toEqual([])
  })

  it('accepts a failure the baseline lists', () => {
    expect(adequacyProblems('Card name=S1', ['NaN'], ['NaN'])).toEqual([])
  })
})
