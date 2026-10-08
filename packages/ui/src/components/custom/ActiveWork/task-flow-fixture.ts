import { seededRandom } from '../../ui/charts/kit/seededRandom'
import { SESSION_FIXTURE } from './session-fixture'
import type { SessionSummary } from './SessionListItem'
import type { TaskSeverity } from './SeverityLabel'
import type { TaskDetailItem, TaskFlowItem } from './task-flow'
import type { TaskPullRequest } from './task-pr'
import type { TaskStage } from './task-stage'

/**
 * Synthetic task-flow data for the board and detail stories and tests. Written
 * from nothing: every initiative, id, title, note, agent and branch is
 * invented, and it imports no other task fixture. Fixed values (no `Date.now()`,
 * seeded generation) so baselines stay deterministic; pair it with
 * {@link TASK_FLOW_NOW}.
 */
export const TASK_FLOW_NOW = new Date('2026-09-20T09:00:00Z').getTime()

type Extras = Partial<Omit<TaskFlowItem, 'slug' | 'id' | 'title' | 'stage'>>

function task(
  slug: string,
  id: string,
  title: string,
  stage: TaskStage,
  extras: Extras = {}
): TaskFlowItem {
  return { slug, id, title, stage, priority: 10, updated: '2026-09-18T10:00:00Z', ...extras }
}

function pr(number: number, rawState: string, checks?: string): TaskPullRequest {
  return { number, rawState, title: `Change for pull request ${number}`, ...(checks && { checks }) }
}

export const TASK_FLOW_DEFAULT: TaskFlowItem[] = [
  task('garden', 'GDN-4', 'Sieve the compost before the spring bed is dug', 'blocked', {
    severity: 'high',
    priority: 10,
    estimate: 3,
    tags: ['compost', 'beds'],
    blockedBy: ['GDN-2', 'KLN-1'],
  }),
  task('kiln', 'KLN-5', 'Replace the thermocouple lead', 'blocked', {
    severity: 'critical',
    priority: 5,
    estimate: 2,
    tags: ['hardware'],
    blockedBy: ['KLN-3'],
  }),
  task('orrery', 'ORR-3', 'Calibrate the outer ring against the almanac', 'blocked', {
    severity: 'medium',
    priority: 30,
    tags: ['calibration', 'almanac', 'rings', 'gears'],
    blockedBy: ['ORR-1', 'TDP-2', 'GDN-6'],
  }),
  task('garden', 'GDN-5', 'Label the seed trays by sowing date', 'ready', {
    severity: 'low',
    priority: 40,
    estimate: 1,
    tags: ['seeds'],
  }),
  task('garden', 'GDN-6', 'Draft the watering rota for the dry month', 'ready', {
    severity: 'medium',
    priority: 20,
    estimate: 2,
    tags: ['rota', 'water'],
  }),
  task('kiln', 'KLN-4', 'Write down the glaze recipe that worked', 'ready', {
    severity: 'high',
    priority: 12,
    estimate: 1,
    tags: ['glaze'],
  }),
  task('tidepool', 'TDP-3', 'Photograph each pool at the lowest tide', 'ready', {
    priority: 25,
    estimate: 5,
    tags: ['survey', 'photos', 'tides'],
  }),
  task('tidepool', 'TDP-4', 'Replace the cracked sample jars', 'ready', {
    severity: 'low',
    priority: 50,
    estimate: 1,
  }),
  task('orrery', 'ORR-4', 'Sketch a stand that does not wobble', 'ready', {
    severity: 'medium',
    priority: 35,
    estimate: 3,
    tags: ['stand'],
  }),
  task('garden', 'GDN-3', 'Build the cold frame from salvaged windows', 'in-progress', {
    severity: 'high',
    priority: 8,
    estimate: 5,
    tags: ['frame', 'wood'],
    agent: 'Alder',
    branch: 'alder/gdn-3-cold-frame',
    stageReason: 'Branch alder/gdn-3-cold-frame carries the id.',
  }),
  task('kiln', 'KLN-3', 'Rebuild the damper linkage', 'in-progress', {
    severity: 'critical',
    priority: 3,
    estimate: 8,
    tags: ['hardware', 'linkage'],
    agent: 'Birch',
    branch: 'birch/kln-3-damper',
  }),
  task('kiln', 'KLN-6', 'Test the new shelf spacing with a half load', 'in-progress', {
    severity: 'medium',
    priority: 18,
    estimate: 2,
    tags: ['firing'],
    agent: 'Birch',
    branch: 'birch/kln-6-shelves',
  }),
  task('tidepool', 'TDP-2', 'Tag the anemone colony on the north rock', 'in-progress', {
    severity: 'low',
    priority: 15,
    estimate: 3,
    tags: ['survey'],
    agent: 'Cedar',
    branch: 'cedar/tdp-2-anemones',
  }),
  task('orrery', 'ORR-2', 'Cut the new brass gear for the inner ring', 'in-progress', {
    priority: 6,
    estimate: 5,
    tags: ['gears', 'brass'],
    agent: 'Alder',
    branch: 'alder/orr-2-inner-gear',
  }),
  task('garden', 'GDN-2', 'Mulch the raspberry canes', 'review', {
    severity: 'low',
    priority: 14,
    estimate: 1,
    tags: ['mulch'],
    agent: 'Cedar',
    branch: 'cedar/gdn-2-mulch',
    pullRequest: pr(41, 'OPEN', '5 of 5 checks passed'),
  }),
  task('kiln', 'KLN-2', 'Add a cooling-rate chart to the firing log', 'review', {
    severity: 'medium',
    priority: 9,
    estimate: 3,
    tags: ['log', 'chart'],
    agent: 'Birch',
    branch: 'birch/kln-2-cooling',
    pullRequest: pr(42, 'DRAFT'),
  }),
  task('tidepool', 'TDP-1', 'Record the water temperature every hour', 'review', {
    severity: 'high',
    priority: 4,
    estimate: 2,
    tags: ['sensor', 'water'],
    agent: 'Cedar',
    branch: 'cedar/tdp-1-temperature',
    pullRequest: pr(43, 'OPEN', '4 of 5 checks passed'),
  }),
  task('orrery', 'ORR-1', 'Set the epoch of the planet dials', 'review', {
    severity: 'critical',
    priority: 2,
    estimate: 2,
    tags: ['dials'],
    agent: 'Alder',
    branch: 'alder/orr-1-epoch',
    pullRequest: pr(44, 'OPEN'),
  }),
  ...doneTasks(),
]

function doneTasks(): TaskFlowItem[] {
  const rows: [string, string, string, TaskSeverity | undefined][] = [
    ['garden', 'GDN-1', 'Map the shade across the plot', 'medium'],
    ['kiln', 'KLN-1', 'Order a second box of cones', 'low'],
    ['tidepool', 'TDP-0', 'Agree the survey transect lines', 'high'],
    ['orrery', 'ORR-0', 'Measure the brass stock on hand', undefined],
    ['garden', 'GDN-0', 'Clear the old bean frames', 'low'],
    ['kiln', 'KLN-0', 'Clean the kiln floor', 'medium'],
  ]
  return rows.map(([slug, id, title, severity], index) =>
    task(slug, id, title, 'done', {
      severity,
      priority: index,
      estimate: 1 + (index % 3),
      updated: `2026-09-${String(10 + index).padStart(2, '0')}T12:00:00Z`,
    })
  )
}

export const TASK_FLOW_EMPTY: TaskFlowItem[] = []

export const TASK_FLOW_ONE: TaskFlowItem[] = [
  {
    slug: 'garden',
    id: 'GDN-1',
    title: 'Water the greenhouse',
    stage: 'ready',
    priority: 1,
    updated: '2026-09-19T08:00:00Z',
  },
]

export const TASK_FLOW_ALL_READY: TaskFlowItem[] = Array.from({ length: 12 }, (_, index) =>
  task('tidepool', `TDP-${index + 1}`, `Survey rock pool number ${index + 1}`, 'ready', {
    priority: 10,
    severity: 'medium',
    estimate: 2,
  })
)

export const TASK_FLOW_OVER_LIMIT: TaskFlowItem[] = Array.from({ length: 6 }, (_, index) =>
  task('kiln', `KLN-${index + 1}`, `Fire test tile batch ${index + 1}`, 'in-progress', {
    priority: index + 1,
    agent: index % 2 ? 'Birch' : 'Alder',
    branch: `kiln/batch-${index + 1}`,
  })
)

export const TASK_FLOW_UNASSIGNED: TaskFlowItem[] = Array.from({ length: 4 }, (_, index) =>
  task('orrery', `ORR-${index + 1}`, `Polish gear ${index + 1}`, 'in-progress', {
    priority: index + 1,
  })
)

export const TASK_FLOW_SAME_ID: TaskFlowItem[] = [
  task('garden', 'GDN-1', 'Prune the apple tree', 'ready', { severity: 'high', priority: 5 }),
  task('kiln', 'GDN-1', 'Same id, different initiative', 'ready', {
    severity: 'high',
    priority: 5,
  }),
  task('garden', 'GDN-2', 'Twin of the next task', 'ready', { severity: 'low', priority: 7 }),
  task('garden', 'GDN-3', 'Twin of the previous task', 'ready', { severity: 'low', priority: 7 }),
]

const LONG_TITLE = 'Overlong'.padEnd(254, 'x')

export const TASK_FLOW_HOSTILE: TaskFlowItem[] = [
  task('garden', 'GDN-1', LONG_TITLE, 'ready', {
    estimate: Number.NaN,
    tags: Array.from({ length: 14 }, (_, i) => `tag-${i}`),
  }),
  task('garden', 'GDN-2', '<script>alert(1)</script> **bold** [link](x) {{template}}', 'ready', {
    estimate: -1,
  }),
  task('kiln', 'KLN-1', 'Long branch and agent names', 'in-progress', {
    estimate: 0.5,
    branch: `kiln/${'b'.repeat(115)}`,
    agent: 'A'.repeat(80),
  }),
  task('kiln', 'KLN-2', 'Unknown stage', 'purgatory' as TaskStage),
  task('kiln', 'KLN-3', 'Unknown severity', 'ready', { severity: 'catastrophic' as TaskSeverity }),
  task('orrery', 'ORR-1', 'Unparseable date', 'done', { updated: 'not-a-date' }),
  task('orrery', 'ORR-1', 'Duplicate key, second occurrence', 'ready'),
  task('orrery', 'ORR-2', 'Twenty blockers', 'blocked', {
    blockedBy: Array.from({ length: 20 }, (_, i) => `TDP-${i + 1}`),
  }),
  task('tidepool', 'TDP-1', 'Pull request with an unknown state', 'review', {
    pullRequest: pr(0, 'WEIRD'),
  }),
]

const OPEN_STAGES: TaskStage[] = ['blocked', 'ready', 'in-progress', 'review']
const LARGE_SLUGS = ['garden', 'kiln', 'tidepool', 'orrery']
const LARGE_SEVERITIES: (TaskSeverity | undefined)[] = [
  'critical',
  'high',
  'medium',
  'low',
  undefined,
]

function largeFlow(): TaskFlowItem[] {
  const random = seededRandom(860)
  return Array.from({ length: 900 }, (_, index) => {
    const slug = LARGE_SLUGS[index % LARGE_SLUGS.length]
    const stage = index < 432 ? 'done' : OPEN_STAGES[Math.floor(random() * OPEN_STAGES.length)]
    return task(
      slug,
      `${slug.slice(0, 3).toUpperCase()}-${Math.floor(index / 4) + 1}`,
      `Generated task number ${index + 1}`,
      stage,
      {
        priority: Math.floor(random() * 50),
        severity: LARGE_SEVERITIES[Math.floor(random() * LARGE_SEVERITIES.length)],
        estimate: Math.floor(random() * 8),
        updated: new Date(Date.UTC(2026, 0, 1) + (index * 86_400_000) / 3).toISOString(),
      }
    )
  })
}

export const TASK_FLOW_LARGE: TaskFlowItem[] = largeFlow()

function detail(base: TaskFlowItem, extras: Partial<TaskDetailItem> = {}): TaskDetailItem {
  return { ...base, ...extras }
}

const FULL_NOTES =
  'Reuse the **cold frame** plan from GDN-3 and read [[window-salvage]] first.\n\n' +
  '- Measure every pane before cutting.\n- Keep the lid hinge on the north side.\n\n' +
  'The earlier attempt is in #41; do not repeat its mistake with the glazing bars.\n'

export const TASK_DETAIL_FULL: TaskDetailItem = detail(
  task('garden', 'GDN-2', 'Mulch the raspberry canes', 'review', {
    severity: 'high',
    priority: 14,
    estimate: 3,
    tags: ['mulch', 'canes', 'spring'],
    agent: 'Cedar',
    branch: 'cedar/gdn-2-mulch',
    pullRequest: pr(41, 'OPEN', '5 of 5 checks passed'),
    stageReason: 'An open pull request carries the id.',
    blockedBy: ['GDN-3'],
  }),
  {
    doneWhen: 'Every cane has a hand of mulch around it and the bed edge is clear.',
    notes: FULL_NOTES,
    created: '2026-09-01T08:00:00Z',
    doneAt: null,
  }
)

export const TASK_DETAIL_BARE: TaskDetailItem = detail(TASK_FLOW_ONE[0])

export const TASK_DETAIL_DONE: TaskDetailItem = detail(
  task('kiln', 'KLN-1', 'Order a second box of cones', 'done', {
    severity: 'low',
    estimate: 1,
    pullRequest: pr(37, 'MERGED'),
    updated: '2026-09-12T12:00:00Z',
  }),
  {
    doneWhen: 'The box is on the shelf.',
    notes: 'Cone 6, not cone 5.',
    created: '2026-09-02T08:00:00Z',
    doneAt: '2026-09-12T12:00:00Z',
  }
)

const LONG_NOTES_HEAD =
  '## Firing schedule\n\n```\nramp 1: 100 per hour to 600\nramp 2: 150 per hour to 1200\nhold: 15 minutes\n```\n\n' +
  '| Cone | Peak | Hold |\n| --- | --- | --- |\n| 5 | 1186 | 10 |\n| 6 | 1222 | 15 |\n\n'
const LONG_NOTES_FILLER =
  'The kiln log keeps one line per firing, with the load, the ramp and what came out. '

export const TASK_DETAIL_LONG_NOTES: TaskDetailItem = detail(TASK_DETAIL_FULL, {
  notes: (LONG_NOTES_HEAD + LONG_NOTES_FILLER.repeat(120)).slice(0, 8500),
})

export const TASK_DETAIL_HOSTILE: TaskDetailItem = detail(TASK_DETAIL_FULL, {
  doneWhen: 'Done '.repeat(332).slice(0, 1660),
  notes:
    '<img src=x onerror=alert(1)> <b>not bold</b> {{template}}\n\n' +
    '‮evil right-to-left text‬ and שלום\n\n' +
    'x'.repeat(4000),
})

export const TASK_SESSIONS: SessionSummary[] = SESSION_FIXTURE.slice(0, 3)
export const TASK_SESSIONS_NONE: SessionSummary[] = []

export const TASK_PULL_REQUESTS: TaskPullRequest[] = [
  pr(41, 'OPEN', '5 of 5 checks passed'),
  pr(42, 'DRAFT'),
  pr(43, 'MERGED', 'all checks passed'),
  pr(44, 'CLOSED'),
  pr(45, 'WEIRD', 'checks unknown'),
]
