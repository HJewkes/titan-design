import type { TaskListItem } from './TaskRow'

/**
 * Synthetic task-list data for the task-list stories and tests. Every
 * initiative, id and title is invented. Fixed values (no `Date.now()`, no randomness) so visual
 * baselines stay deterministic — pair it with {@link TASK_LIST_NOW}.
 *
 * Deliberately covers the awkward rows, not just the tidy ones: an unset
 * severity, an unset estimate, a task with more tags than the row shows, a
 * title long enough to clip, and two tasks sharing a priority so tie-breaks are
 * exercised.
 */
export const TASK_LIST_FIXTURE: TaskListItem[] = [
  {
    slug: 'lighthouse',
    id: 'LH-22',
    title: 'Repaint the lantern room (keeper notes): railings, gallery deck, stair landings',
    severity: 'low',
    priority: 20,
    estimate: 8,
    tags: ['paint', 'lantern'],
    updated: '2026-08-29T10:00:00Z',
  },
  {
    slug: 'lighthouse',
    id: 'LH-86',
    title: 'Survey spike: fog-signal timing (rescoped)',
    severity: 'low',
    priority: 20,
    tags: ['spike'],
    updated: '2026-08-11T09:00:00Z',
  },
  {
    slug: 'apiary',
    id: 'AP-14',
    title: 'Swarm alarm drops the hive number when the scale restarts mid-reading',
    severity: 'critical',
    priority: 3,
    estimate: 5,
    tags: ['swarm', 'scale', 'reliability', 'p0'],
    updated: '2026-08-30T07:30:00Z',
  },
  {
    slug: 'boatyard',
    id: 'B-92',
    title: 'Hull patch delivery, evidence-framed by the haul-out survey',
    severity: 'high',
    priority: 7,
    estimate: 13,
    tags: ['hull'],
    updated: '2026-07-30T12:00:00Z',
  },
  {
    slug: 'boatyard',
    id: 'B-6',
    title: 'Varnish the dinghy oars for launch day',
    severity: 'medium',
    priority: 11,
    estimate: 2,
    updated: '2026-06-18T16:20:00Z',
  },
  {
    slug: 'star-atlas-room',
    id: 'SA-16',
    title: 'Dust-free lens-only storage drawer',
    priority: 14,
    estimate: 3,
    tags: ['optics'],
    updated: '2026-08-01T04:01:00Z',
  },
  {
    slug: 'orchard-north',
    id: 'OR-3',
    title: 'Replant the north row of saplings after the irrigation pump swap',
    severity: 'medium',
    priority: 25,
    estimate: 5,
    tags: ['irrigation'],
    updated: '2026-05-12T00:00:00Z',
  },
  {
    slug: 'mill',
    id: 'ML-41',
    title: 'Collapse the duplicate grain chute',
    severity: 'high',
    priority: 9,
    estimate: 8,
    tags: ['grain', 'chute'],
    updated: '2026-08-27T18:45:00Z',
  },
]

/**
 * Fixed reference "now" for the fixture (2026-08-30T12:00:00Z). Pass to
 * `TaskTable`'s `now` so every age label is stable across runs.
 */
export const TASK_LIST_NOW = new Date('2026-08-30T12:00:00Z').getTime()
