import type { TaskListItem } from './TaskRow'

/**
 * A hand-trimmed slice of a real active-work backlog, used by the task-list
 * stories and tests. Fixed values (no `Date.now()`, no randomness) so visual
 * baselines stay deterministic — pair it with {@link TASK_LIST_NOW}.
 *
 * Deliberately covers the awkward rows, not just the tidy ones: an unset
 * severity, an unset estimate, a task with more tags than the row shows, a
 * title long enough to clip, and two tasks sharing a priority so tie-breaks are
 * exercised.
 */
export const TASK_LIST_FIXTURE: TaskListItem[] = [
  {
    slug: 'active-work',
    id: 'AW-22',
    title: 'Read-only dashboard prototypes (titan specimens): portfolio, task list, session reader',
    severity: 'low',
    priority: 20,
    estimate: 8,
    tags: ['dashboard', 'titan'],
    updated: '2026-08-29T10:00:00Z',
  },
  {
    slug: 'active-work',
    id: 'AW-86',
    title: 'Design spike: notes-supersession (rescoped)',
    severity: 'low',
    priority: 20,
    tags: ['spike'],
    updated: '2026-08-11T09:00:00Z',
  },
  {
    slug: 'relay',
    id: 'RL-14',
    title: 'Voice dispatch drops the initiative when the daemon restarts mid-utterance',
    severity: 'critical',
    priority: 3,
    estimate: 5,
    tags: ['voice', 'daemon', 'reliability', 'p0'],
    updated: '2026-08-30T07:30:00Z',
  },
  {
    slug: 'codewatch',
    id: 'C-92',
    title: 'Plugin injection delivery, evidence-framed by the injection eval',
    severity: 'high',
    priority: 7,
    estimate: 13,
    tags: ['plugin'],
    updated: '2026-07-30T12:00:00Z',
  },
  {
    slug: 'codewatch',
    id: 'C-6',
    title: 'npm publish the packaged distribution',
    severity: 'medium',
    priority: 11,
    estimate: 2,
    updated: '2026-06-18T16:20:00Z',
  },
  {
    slug: 'titan-platform',
    id: 'TP-16',
    title: 'Nativewind-free token-only export subpath',
    priority: 14,
    estimate: 3,
    tags: ['tokens'],
    updated: '2026-08-01T04:01:00Z',
  },
  {
    slug: 'home-assistant',
    id: 'HA-3',
    title: 'Rebuild the bedroom automation after the Zigbee coordinator swap',
    severity: 'medium',
    priority: 25,
    estimate: 5,
    tags: ['zigbee'],
    updated: '2026-05-12T00:00:00Z',
  },
  {
    slug: 'brain',
    id: 'BR-41',
    title: 'Collapse the duplicate embedding path',
    severity: 'high',
    priority: 9,
    estimate: 8,
    tags: ['perf', 'index'],
    updated: '2026-08-27T18:45:00Z',
  },
]

/**
 * Fixed reference "now" for the fixture (2026-08-30T12:00:00Z). Pass to
 * `TaskTable`'s `now` so every age label is stable across runs.
 */
export const TASK_LIST_NOW = new Date('2026-08-30T12:00:00Z').getTime()
