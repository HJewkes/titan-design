import { describe, it, expect } from 'vitest'
import { BOARD_TONES } from '../../ui/board/types'
import {
  TASK_STAGE_META,
  TASK_STAGE_ORDER,
  isDoneStage,
  toTaskStage,
  type TaskStage,
} from './task-stage'

describe('task stage table', () => {
  it('maps every stage to exactly one row, with a tone the board can paint', () => {
    expect(new Set(TASK_STAGE_ORDER).size).toBe(5)
    expect(Object.keys(TASK_STAGE_META).sort()).toEqual([...TASK_STAGE_ORDER].sort())
    const boardTones: readonly string[] = BOARD_TONES
    for (const stage of TASK_STAGE_ORDER) {
      expect(boardTones).toContain(TASK_STAGE_META[stage].tone)
      expect(TASK_STAGE_META[stage].description).not.toBe('')
    }
  })

  it('gives every stage a non-empty, unique label', () => {
    const labels = TASK_STAGE_ORDER.map((stage) => TASK_STAGE_META[stage].label)
    expect(labels.every((label) => label.length > 0)).toBe(true)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('treats only the last stage as done', () => {
    const done = TASK_STAGE_ORDER.filter(isDoneStage)
    expect(done).toEqual([TASK_STAGE_ORDER[4]])
  })
})

describe('toTaskStage', () => {
  it('maps every wire spelling to its stage', () => {
    const cases: [string, TaskStage][] = [
      ['inprogress', 'in-progress'],
      ['in_progress', 'in-progress'],
      ['in progress', 'in-progress'],
      ['in-progress', 'in-progress'],
      ['pr', 'review'],
      ['Blocked', 'blocked'],
    ]
    for (const [raw, stage] of cases) expect(toTaskStage(raw)).toBe(stage)
  })

  it('returns undefined for an unknown name instead of a default stage', () => {
    for (const raw of ['archived', '', 'constructor', '__proto__']) {
      expect(toTaskStage(raw)).toBeUndefined()
    }
  })
})
