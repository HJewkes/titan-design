import { expectTypeOf, test } from 'vitest'
import type { PillTone } from '../../ui/pill'
import type { BoardTone } from '../../ui/board/types'
import {
  TASK_STAGE_META,
  type TaskStage,
  type TaskStageMeta,
  type TaskStageTone,
} from './task-stage'

test('a stage tone is assignable to the board tone and the pill tone', () => {
  expectTypeOf<TaskStageTone>().toExtend<BoardTone>()
  expectTypeOf<TaskStageTone>().toExtend<PillTone>()
})

test('the stage table keeps a narrow tone, not string', () => {
  expectTypeOf(TASK_STAGE_META.done.tone).not.toEqualTypeOf<string>()
  expectTypeOf<TaskStageMeta['tone']>().toEqualTypeOf<TaskStageTone>()
})

test('the stage table rejects a missing or extra key', () => {
  type Table = Record<TaskStage, TaskStageMeta>
  expectTypeOf(TASK_STAGE_META).toExtend<Table>()
  // @ts-expect-error a stage with no row
  const missing: Table = { blocked: TASK_STAGE_META.blocked }
  // @ts-expect-error a row for a stage that does not exist
  const extra: Table = { ...TASK_STAGE_META, archived: TASK_STAGE_META.done }
  void missing
  void extra
})
