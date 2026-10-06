import type { PillTone } from '../../ui/pill'

export type TaskPrState = 'open' | 'draft' | 'merged' | 'closed'

export const TASK_PR_STATE_META: Record<TaskPrState, { label: string; tone: PillTone }> = {
  open: { label: 'Open', tone: 'success' },
  draft: { label: 'Draft', tone: 'neutral' },
  merged: { label: 'Merged', tone: 'brand' },
  closed: { label: 'Closed', tone: 'error' },
}

/** Accepts the wire state in any case; undefined if unknown, never a default. */
export function toTaskPrState(raw: string): TaskPrState | undefined {
  const key = raw.trim().toLowerCase()
  return Object.prototype.hasOwnProperty.call(TASK_PR_STATE_META, key)
    ? (key as TaskPrState)
    : undefined
}

export interface TaskPullRequest {
  number: number
  /** The wire state, kept for an unknown value. */
  rawState: string
  title?: string
  /** A one-line check summary as the source words it. */
  checks?: string
}
