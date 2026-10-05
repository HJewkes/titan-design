import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import { GoalMilestoneSummary, type GoalMilestoneSummaryProps } from './GoalMilestoneSummary'
import { GoalMilestoneTile } from './GoalMilestoneTile'
import { GOAL_MILESTONE_SCENARIOS } from './goalMilestone-fixture'
import { capturedClassNames } from '../../../test/classname-capture'

const load = { metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' } as const
const repsGoal = { metric: 'reps_at_load', reps: 12, load: 185, unit: 'lb' } as const
const cut = { metric: 'bodyweight', value: 189, unit: 'lb' } as const

const base = { weekCount: 6, currentWeek: 4, status: 'on_track' } as const

const cases: Record<string, GoalMilestoneSummaryProps> = {}
for (const [name, latest] of Object.entries({
  short: { reps: 8, load: 100 },
  repsShort: { reps: 6, load: 105 },
  met: { reps: 8, load: 105 },
  beyondLoad: { reps: 8, load: 110 },
  beyondReps: { reps: 10, load: 105 },
})) {
  cases[`load-${name}`] = { ...base, target: load, latest }
}
for (const [name, latest] of Object.entries({
  short: { reps: 10, load: 185 },
  met: { reps: 12, load: 185 },
  beyond: { reps: 14, load: 185 },
})) {
  cases[`reps-${name}`] = { ...base, target: repsGoal, latest }
}
for (const direction of ['up', 'down'] as const) {
  for (const [name, value] of Object.entries({ below: 185, exact: 189, above: 193 })) {
    cases[`value-${direction}-${name}`] = {
      ...base,
      target: cut,
      latest: { value },
      direction,
    }
  }
}
for (const reach of ['short', 'met', 'beyond'] as const) {
  cases[`explicit-${reach}`] = { ...base, target: load, latest: { reps: 8, load: 100 }, reach }
}
cases['no-latest'] = { ...base, target: load }
cases['missed'] = { ...base, target: load, latest: { reps: 8, load: 100 }, currentWeek: 7 }

function snapshotOf(ui: React.ReactElement) {
  const { container, unmount } = render(ui)
  const html = container.innerHTML
  const classes = [...capturedClassNames.entries()].sort(([a], [b]) => a.localeCompare(b))
  unmount()
  return { html, classes }
}

describe('characterisation (TD-528), deleted after the refactor', () => {
  it.each(Object.entries(cases))('summary %s', (_name, props) => {
    expect(snapshotOf(<GoalMilestoneSummary {...props} />)).toMatchSnapshot()
  })

  it.each(Object.entries(GOAL_MILESTONE_SCENARIOS))('tile scenario %s', (_name, props) => {
    expect(snapshotOf(<GoalMilestoneTile {...props} />)).toMatchSnapshot()
  })

  it.each(Object.entries(cases))('tile %s', (_name, props) => {
    expect(snapshotOf(<GoalMilestoneTile {...props} />)).toMatchSnapshot()
  })
})
