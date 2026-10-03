import type { PillTone } from '../../ui/pill'

/** Where a task sits in the flow. Inferred by the read model, never stored on the task. */
export type TaskStage = 'blocked' | 'ready' | 'in-progress' | 'review' | 'done'

/** The tones a stage may take: PillTone without the accent, which the board cannot paint. */
export type TaskStageTone = Exclude<PillTone, 'brand-secondary'>

export interface TaskStageMeta {
  label: string
  tone: TaskStageTone
  /** How the read model derives the stage; the column header's tooltip. */
  description: string
}

/** Stages in flow order, left to right on a board. */
export const TASK_STAGE_ORDER = [
  'blocked',
  'ready',
  'in-progress',
  'review',
  'done',
] as const satisfies readonly TaskStage[]

/**
 * The one stage table. Exactly two readers: `buildTaskBoard` (columns) and
 * {@link TaskStagePill} (every other surface). Neither takes a tone prop.
 */
export const TASK_STAGE_META = {
  blocked: {
    label: 'Blocked',
    tone: 'error',
    description: 'The notes name an open task this one depends on.',
  },
  ready: {
    label: 'Ready',
    tone: 'neutral',
    description: 'Open, with no branch, worktree or pull request yet. Not a verified state.',
  },
  'in-progress': {
    label: 'In progress',
    tone: 'info',
    description: 'A branch or worktree carries the task id.',
  },
  review: {
    label: 'Review',
    tone: 'brand',
    description: 'An open pull request carries the task id.',
  },
  done: {
    label: 'Done',
    tone: 'success',
    description: 'The task status is done.',
  },
} as const satisfies Record<TaskStage, TaskStageMeta>

const WIRE_SPELLINGS: Record<string, TaskStage> = {
  blocked: 'blocked',
  ready: 'ready',
  inprogress: 'in-progress',
  review: 'review',
  pr: 'review',
  done: 'done',
}

/** Accepts the wire spellings (`inprogress`, `in_progress`, `in progress`, `pr`); undefined if unknown. */
export function toTaskStage(raw: string): TaskStage | undefined {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
  return Object.prototype.hasOwnProperty.call(WIRE_SPELLINGS, key) ? WIRE_SPELLINGS[key] : undefined
}

/** True for the terminal stage, so no other file has to name it. */
export function isDoneStage(stage: TaskStage): boolean {
  return stage === TASK_STAGE_ORDER[TASK_STAGE_ORDER.length - 1]
}
