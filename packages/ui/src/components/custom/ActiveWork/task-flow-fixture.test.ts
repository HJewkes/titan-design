import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { taskKey, type TaskFlowItem } from './task-flow'
import { TASK_STAGE_ORDER } from './task-stage'
import * as fixture from './task-flow-fixture'

const TASK_LISTS: Record<string, TaskFlowItem[]> = {
  TASK_FLOW_DEFAULT: fixture.TASK_FLOW_DEFAULT,
  TASK_FLOW_EMPTY: fixture.TASK_FLOW_EMPTY,
  TASK_FLOW_ONE: fixture.TASK_FLOW_ONE,
  TASK_FLOW_ALL_READY: fixture.TASK_FLOW_ALL_READY,
  TASK_FLOW_OVER_LIMIT: fixture.TASK_FLOW_OVER_LIMIT,
  TASK_FLOW_UNASSIGNED: fixture.TASK_FLOW_UNASSIGNED,
  TASK_FLOW_LARGE: fixture.TASK_FLOW_LARGE,
}
const SLUGS = ['garden', 'kiln', 'tidepool', 'orrery']

describe('task flow fixture', () => {
  it('has unique keys and known stages in every non-hostile list', () => {
    for (const [name, tasks] of Object.entries(TASK_LISTS)) {
      const keys = tasks.map(taskKey)
      expect(new Set(keys).size, name).toBe(keys.length)
      for (const task of tasks) expect(TASK_STAGE_ORDER, name).toContain(task.stage)
    }
  })

  it('spreads the default list over all five stages as 3, 6, 5, 4, 6', () => {
    const counts = TASK_STAGE_ORDER.map(
      (stage) => fixture.TASK_FLOW_DEFAULT.filter((task) => task.stage === stage).length
    )
    expect(counts).toEqual([3, 6, 5, 4, 6])
    expect(fixture.TASK_FLOW_DEFAULT).toHaveLength(24)
  })

  it('covers every severity and one unset in the default list', () => {
    const severities = new Set(fixture.TASK_FLOW_DEFAULT.map((task) => task.severity))
    expect(severities).toEqual(new Set(['critical', 'high', 'medium', 'low', undefined]))
  })

  it('holds 900 large tasks, 432 of them done', () => {
    expect(fixture.TASK_FLOW_LARGE).toHaveLength(900)
    expect(fixture.TASK_FLOW_LARGE.filter((task) => task.stage === 'done')).toHaveLength(432)
  })

  it('keeps the hostile list hostile', () => {
    const keys = fixture.TASK_FLOW_HOSTILE.map(taskKey)
    expect(new Set(keys).size).toBeLessThan(keys.length)
    expect(fixture.TASK_FLOW_HOSTILE.some((task) => task.title.length === 254)).toBe(true)
  })

  it('sizes the long notes at 8,500 characters', () => {
    expect(fixture.TASK_DETAIL_LONG_NOTES.notes).toHaveLength(8500)
  })

  it('uses only the four synthetic slugs, in every export and in the source', () => {
    const everyTask = [
      ...Object.values(TASK_LISTS).flat(),
      ...fixture.TASK_FLOW_SAME_ID,
      ...fixture.TASK_FLOW_HOSTILE,
      fixture.TASK_DETAIL_FULL,
      fixture.TASK_DETAIL_BARE,
      fixture.TASK_DETAIL_DONE,
    ]
    for (const task of everyTask) expect(SLUGS).toContain(task.slug)
    const source = readFileSync(join(__dirname, 'task-flow-fixture.ts'), 'utf8')
    expect(source).not.toMatch(/task-list-fixture|@[a-z]+\.[a-z]+/)
  })

  it('offers one pull request per state, with and without checks', () => {
    const states = fixture.TASK_PULL_REQUESTS.map((request) => request.rawState)
    expect(states).toEqual(['OPEN', 'DRAFT', 'MERGED', 'CLOSED', 'WEIRD'])
    expect(fixture.TASK_PULL_REQUESTS.some((request) => request.checks)).toBe(true)
    expect(fixture.TASK_PULL_REQUESTS.some((request) => !request.checks)).toBe(true)
  })
})
