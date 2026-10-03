import { SEVERITY_META, severityRank, type TaskSeverity } from './SeverityLabel'
import type { TaskListItem } from './TaskRow'
import type { TaskPullRequest } from './task-pr'
import { TASK_STAGE_ORDER, isDoneStage, type TaskStage } from './task-stage'

export interface TaskFlowItem extends TaskListItem {
  stage: TaskStage
  /** Why this task is in this stage, in words, when the read model supplies it. */
  stageReason?: string
  /** Inferred from the branch or worktree holder. Rendered as text. */
  agent?: string
  branch?: string
  pullRequest?: TaskPullRequest
  /** Ids of open tasks the notes name as dependencies. Display only. */
  blockedBy?: string[]
}

export interface TaskDetailItem extends TaskFlowItem {
  doneWhen?: string
  /** Markdown. */
  notes?: string
  created?: string
  doneAt?: string | null
}

export interface TaskFlowFilters {
  query: string
  initiatives: string[]
  severities: TaskSeverity[]
  stages: TaskStage[]
}

export const EMPTY_TASK_FLOW_FILTERS: TaskFlowFilters = {
  query: '',
  initiatives: [],
  severities: [],
  stages: [],
}

/** Ids are unique inside one initiative only, so the key carries the slug. */
export function taskKey(task: Pick<TaskListItem, 'slug' | 'id'>): string {
  return `${task.slug}/${task.id}`
}

/** Splits on the last `/`, so a slug may contain one. */
export function parseTaskKey(key: string): { slug: string; id: string } | undefined {
  const at = key.lastIndexOf('/')
  if (at < 1 || at === key.length - 1) return undefined
  return { slug: key.slice(0, at), id: key.slice(at + 1) }
}

function compareNumbers(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

function compareText(a: string, b: string): number {
  const collated = a.localeCompare(b, 'en', { numeric: true })
  return collated || (a < b ? -1 : a > b ? 1 : 0)
}

function updatedTime(task: TaskFlowItem): number {
  const time = Date.parse(task.updated)
  return Number.isNaN(time) ? -Infinity : time
}

/**
 * Stage in flow order, then severity rank, priority, slug and id (numeric
 * collation; unset severity last). The done stage orders by `updated`, newest
 * first. Priority never leads: it is comparable inside one initiative only.
 */
export function compareTaskFlow(a: TaskFlowItem, b: TaskFlowItem): number {
  const byStage = compareNumbers(
    TASK_STAGE_ORDER.indexOf(a.stage),
    TASK_STAGE_ORDER.indexOf(b.stage)
  )
  if (byStage) return byStage
  if (isDoneStage(a.stage)) {
    const byUpdated = compareNumbers(updatedTime(b), updatedTime(a))
    if (byUpdated) return byUpdated
  }
  return (
    compareNumbers(severityRank(a.severity), severityRank(b.severity)) ||
    compareNumbers(finiteOr(a.priority, Infinity), finiteOr(b.priority, Infinity)) ||
    compareText(a.slug, b.slug) ||
    compareText(a.id, b.id)
  )
}

function matchesQuery(task: TaskFlowItem, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [task.id, task.title, task.slug, task.agent, ...(task.tags ?? [])]
  return haystack.some((text) => text?.toLowerCase().includes(needle))
}

/** Keeps order. An empty facet matches everything. */
export function filterTaskFlow(tasks: TaskFlowItem[], filters: TaskFlowFilters): TaskFlowItem[] {
  return tasks.filter(
    (task) =>
      matchesQuery(task, filters.query) &&
      (!filters.initiatives.length || filters.initiatives.includes(task.slug)) &&
      (!filters.severities.length ||
        (task.severity !== undefined && filters.severities.includes(task.severity))) &&
      (!filters.stages.length || filters.stages.includes(task.stage))
  )
}

function pointsPhrase(estimate: number | undefined): string | undefined {
  if (estimate === undefined || !Number.isFinite(estimate) || estimate <= 0) return undefined
  return `estimate ${estimate} ${estimate === 1 ? 'point' : 'points'}`
}

/** Id, title, then severity, estimate, agent and blockers in words; absent fields are omitted. */
export function taskAccessibleSummary(task: TaskFlowItem): string {
  const severity = task.severity ? SEVERITY_META[task.severity]?.label : undefined
  const parts = [
    task.id,
    task.title,
    severity && `${severity} severity`,
    pointsPhrase(task.estimate),
    task.agent && `agent ${task.agent}`,
    task.blockedBy?.length ? `blocked by ${task.blockedBy.join(', ')}` : undefined,
  ]
  return parts.filter(Boolean).join(', ')
}
