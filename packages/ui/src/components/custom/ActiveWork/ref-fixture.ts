import type { EntityRef } from './ref-kind'
import { TASK_PR_STATE_META } from './task-pr'

/**
 * Synthetic refs for an invented `alpha-workspace` project: the related panel of
 * one task, every kind present, unsorted so grouping has work to do.
 */
export const REF_FIXTURE: EntityRef[] = [
  { kind: 'session', id: 'session:e1a2b3c4', label: 'e1a2b3c4', href: '#/sessions/e1a2b3c4' },
  { kind: 'task', id: 'task:PL-18', label: 'PL-18', href: '#/tasks/PL-18' },
  { kind: 'pr', id: 'pr:52', label: '#52', status: TASK_PR_STATE_META.merged, href: '#/prs/52' },
  { kind: 'task', id: 'task:PL-20', label: 'PL-20', href: '#/tasks/PL-20' },
  { kind: 'agent', id: 'agent:planner-impl', label: 'planner-impl' },
  { kind: 'pr', id: 'pr:54', label: '#54', status: TASK_PR_STATE_META.open, href: '#/prs/54' },
  { kind: 'session', id: 'session:f5d6e7a8', label: 'f5d6e7a8', href: '#/sessions/f5d6e7a8' },
  { kind: 'note', id: 'note:alpha/sync-design.md', label: 'sync-design.md' },
  { kind: 'file', id: 'file:src/commands/open.ts', label: 'src/commands/open.ts' },
  { kind: 'initiative', id: 'initiative:alpha', label: 'alpha-workspace' },
]
