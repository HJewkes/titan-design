import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  EMPTY_TASK_FLOW_FILTERS,
  compareTaskFlow,
  filterTaskFlow,
  parseTaskKey,
  taskAccessibleSummary,
  taskKey,
  type TaskFlowItem,
} from './task-flow'
import { TASK_STAGE_ORDER, type TaskStage } from './task-stage'
import type { TaskSeverity } from './SeverityLabel'
import { TASK_FLOW_DEFAULT, TASK_FLOW_HOSTILE, TASK_FLOW_ONE } from './task-flow-fixture'

const taskArb: fc.Arbitrary<TaskFlowItem> = fc.record(
  {
    slug: fc.constantFrom('garden', 'kiln', 'a/b'),
    id: fc.constantFrom('GDN-2', 'GDN-10', 'GDN-1', 'KLN-1'),
    title: fc.string(),
    stage: fc.oneof(fc.constantFrom(...TASK_STAGE_ORDER), fc.constant('purgatory' as TaskStage)),
    severity: fc.oneof(
      fc.constantFrom('critical', 'high', 'medium', 'low'),
      fc.constant('catastrophic' as TaskSeverity)
    ),
    priority: fc.oneof(fc.integer({ min: 0, max: 3 }), fc.constant(Number.NaN)),
    updated: fc.oneof(
      fc
        .date({ min: new Date('2026-01-01'), max: new Date('2026-12-31'), noInvalidDate: true })
        .map((d) => d.toISOString()),
      fc.constant('not-a-date')
    ),
  },
  { requiredKeys: ['slug', 'id', 'title', 'stage', 'priority', 'updated'] }
)

const sign = (n: number) => Math.sign(n)

describe('compareTaskFlow', () => {
  it('is antisymmetric and never NaN', () => {
    fc.assert(
      fc.property(taskArb, taskArb, (a, b) => {
        const ab = compareTaskFlow(a, b)
        expect(Number.isNaN(ab)).toBe(false)
        expect(sign(ab)).toBe(-sign(compareTaskFlow(b, a)) || 0)
      })
    )
  })

  it('is transitive', () => {
    fc.assert(
      fc.property(taskArb, taskArb, taskArb, (a, b, c) => {
        if (compareTaskFlow(a, b) <= 0 && compareTaskFlow(b, c) <= 0) {
          expect(compareTaskFlow(a, c)).toBeLessThanOrEqual(0)
        }
      })
    )
  })

  it('orders an unknown severity as unset, so mixed severities cannot form a cycle', () => {
    const base = { ...TASK_FLOW_ONE[0], stage: 'ready' as const }
    const a = { ...base, id: 'A-1', severity: 'critical' as const, priority: 5 }
    const c = { ...base, id: 'C-1', severity: 'low' as const, priority: 1 }
    const b = { ...base, id: 'B-1', severity: 'catastrophic' as TaskSeverity, priority: 3 }
    expect(compareTaskFlow(a, c)).toBeLessThan(0)
    expect(compareTaskFlow(c, b)).toBeLessThan(0)
    expect(compareTaskFlow(a, b)).toBeLessThan(0)
  })

  it('ranks severity before priority and collates ids numerically', () => {
    const base = TASK_FLOW_ONE[0]
    const high = { ...base, id: 'GDN-9', severity: 'high' as const, priority: 99 }
    const low = { ...base, id: 'GDN-1', severity: 'low' as const, priority: 1 }
    expect(compareTaskFlow(high, low)).toBeLessThan(0)
    const two = { ...base, id: 'GDN-2' }
    const ten = { ...base, id: 'GDN-10' }
    expect(compareTaskFlow(two, ten)).toBeLessThan(0)
  })

  it('puts an unset severity last and the newest done task first', () => {
    const base = { ...TASK_FLOW_ONE[0], stage: 'ready' as const }
    expect(compareTaskFlow({ ...base, severity: 'low' }, base)).toBeLessThan(0)
    const done = { ...base, stage: 'done' as const }
    const newer = { ...done, id: 'GDN-9', updated: '2026-09-02T00:00:00Z' }
    const older = { ...done, id: 'GDN-1', updated: '2026-09-01T00:00:00Z' }
    expect(compareTaskFlow(newer, older)).toBeLessThan(0)
  })
})

describe('taskKey and parseTaskKey', () => {
  it('round-trips any slug and id, including a slug with a slash', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }).filter((id) => !id.includes('/')),
        (slug, id) => {
          expect(parseTaskKey(taskKey({ slug, id }))).toEqual({ slug, id })
        }
      )
    )
  })

  it('rejects a key with no slug or no id', () => {
    for (const key of ['', 'GDN-1', '/GDN-1', 'garden/']) expect(parseTaskKey(key)).toBeUndefined()
  })
})

describe('filterTaskFlow', () => {
  it('returns every task for empty filters', () => {
    expect(filterTaskFlow(TASK_FLOW_DEFAULT, EMPTY_TASK_FLOW_FILTERS)).toEqual(TASK_FLOW_DEFAULT)
  })

  it('returns a subsequence of the input, in input order', () => {
    fc.assert(
      fc.property(
        fc.array(taskArb),
        fc.constantFrom('', 'a', 'gdn'),
        fc.subarray(['garden', 'kiln', 'a/b']),
        (tasks, query, initiatives) => {
          const out = filterTaskFlow(tasks, { ...EMPTY_TASK_FLOW_FILTERS, query, initiatives })
          let cursor = 0
          for (const task of out) {
            cursor = tasks.indexOf(task, cursor)
            expect(cursor).toBeGreaterThanOrEqual(0)
          }
        }
      )
    )
  })

  it('narrows by severity and leaves unset-severity tasks out of a severity facet', () => {
    const out = filterTaskFlow(TASK_FLOW_DEFAULT, {
      ...EMPTY_TASK_FLOW_FILTERS,
      severities: ['critical'],
    })
    expect(out.length).toBeGreaterThan(0)
    expect(out.every((task) => task.severity === 'critical')).toBe(true)
  })

  it('matches the query against id, title and tags without regard to case', () => {
    const out = filterTaskFlow(TASK_FLOW_DEFAULT, { ...EMPTY_TASK_FLOW_FILTERS, query: 'GLAZE' })
    expect(out.map((task) => task.id)).toContain('KLN-4')
  })
})

describe('taskAccessibleSummary', () => {
  it('names severity, estimate, agent and blockers in words', () => {
    const full = TASK_FLOW_DEFAULT.find((task) => task.id === 'ORR-3')!
    expect(taskAccessibleSummary(full)).toBe(
      'ORR-3, Calibrate the outer ring against the almanac, Medium severity, blocked by ORR-1, TDP-2, GDN-6'
    )
    const active = TASK_FLOW_DEFAULT.find((task) => task.id === 'GDN-3')!
    expect(taskAccessibleSummary(active)).toBe(
      'GDN-3, Build the cold frame from salvaged windows, High severity, estimate 5 points, agent Alder'
    )
  })

  it('omits absent fields', () => {
    expect(taskAccessibleSummary(TASK_FLOW_ONE[0])).toBe('GDN-1, Water the greenhouse')
  })

  it('never prints NaN, undefined or a negative estimate for hostile tasks', () => {
    for (const task of TASK_FLOW_HOSTILE) {
      expect(taskAccessibleSummary(task)).not.toMatch(/NaN|undefined|estimate -/)
    }
  })
})
