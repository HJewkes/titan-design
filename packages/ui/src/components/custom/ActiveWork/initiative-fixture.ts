import type { InitiativeBriefData } from './InitiativeBrief'
import type { OpenLoop } from './OpenLoops'
import type { TaskListItem } from './TaskRow'
/**
 * Synthetic initiative state for the reader stories and tests, for an invented
 * `alpha-workspace` project. Fixed values (no `Date.now()`) so visual baselines
 * stay deterministic; pair it with {@link INITIATIVE_NOW}. Five open loops
 * cover every kind, and the tasks are the open ones the loops and brief name.
 */
export const INITIATIVE_BRIEF_FIXTURE: InitiativeBriefData = {
  slug: 'alpha-workspace',
  title: 'alpha-workspace — sample project planner',
  state: 'focused',
  rank: 1,
  shipTarget: '2026-Q3',
  updated: '2026-07-12',
  body: "# alpha-workspace — sample project planner\n\n## Purpose\n\nProjects span weeks; a single sitting doesn't. Every handoff between sittings, laptops or helpers loses context unless something durable holds it. `planner` is that something: plain files per project (brief, handoff, tasks, sessions, notes) under `/home/example/.local/share/planner/<slug>/`, read and written through one small CLI.\n\n## First version\n\n- **Storage:** one folder per project, markdown with front matter. No database.\n- **CLI:** `planner open`, `planner task add`, `planner note add`, `planner wrap`.\n- **Helper:** a small background process that watches the folders and feeds the web view.\n- **Web view:** read-only, served on `localhost:4100`.\n\n## Decisions\n\n- Plain files over a database, so any editor can fix a broken record.\n- Task ids are per project (`AW-1`, `AW-2`, ...) and never reused.\n- The CLI is the only writer; the web view reads.\n\n## Left for later\n\n- Import from calendars, email and notes apps (**AW-6**).\n- Editing in the web view (**AW-7**).\n- Sync between laptops; plain git works for now.\n\n## People\n\n- Owner: @example-owner (sample account).\n- Early users: two sample testers on the `planner-beta` list.\n\n## Questions\n\n- How large can one project's task file grow before the web view slows down?\n- Should done tasks archive automatically, and after how many days?\n- Is a background helper worth its install cost on a laptop that sleeps?\n",
}

export const INITIATIVE_LOOPS_FIXTURE: OpenLoop[] = [
  {
    ref: '2026-08-27-0930-sample-branch-review#n1',
    kind: 'prose',
    text: 'Choose what happens to the four sample branches nobody has merged: feat/import-sources (12 commits, overlaps two others), feat/web-view-edit (21 commits), lab/planner-board (6 commits) and fix/date-parsing (1 commit, PR #88 closed). Each needs a merge, a rebase or a deliberate close, and the first two must land in order because they touch the same files.',
    sessionFile: '2026-08-27-0930-sample-branch-review',
    openedAt: '2026-08-27T10:05:00Z',
  },
  {
    ref: '2026-08-27-0930-sample-branch-review#n3',
    kind: 'pr',
    text: 'Three sample PRs wait for a reviewer: #90 task-archive, #91 narrow-layout and #95 reminder-wording. All three merge cleanly.',
    sessionFile: '2026-08-27-0930-sample-branch-review',
    openedAt: '2026-08-27T10:05:00Z',
  },
  {
    ref: '2026-08-27-0930-sample-branch-review#n4',
    kind: 'task',
    targetRef: 'AW-116',
    text: 'AW-116: the notes index keeps a folder the planner reports as missing, and no command removes it.',
    sessionFile: '2026-08-27-0930-sample-branch-review',
    openedAt: '2026-08-27T10:05:00Z',
  },
  {
    ref: '2026-08-30-1410-sample-web-view-check#n1',
    kind: 'task',
    targetRef: 'AW-22',
    text: 'AW-22 waits on three web view prototypes (task list, session reader, project reader); the portfolio and file-history views are done.',
    sessionFile: '2026-08-30-1410-sample-web-view-check',
    openedAt: '2026-08-30T14:40:00Z',
  },
  {
    ref: '2026-08-30-1410-sample-web-view-check#n2',
    kind: 'task',
    targetRef: 'AW-117',
    text: 'AW-117: 60 files in the sample repo fail the format check. Reformat after the branch decisions, because the reformat conflicts with every open branch.',
    sessionFile: '2026-08-30-1410-sample-web-view-check',
    openedAt: '2026-08-30T14:40:00Z',
  },
]

export const INITIATIVE_TASKS_FIXTURE: TaskListItem[] = [
  {
    slug: 'alpha-workspace',
    id: 'AW-6',
    title: 'Calendar / email / notes import sources',
    priority: 6,
    severity: 'low',
    estimate: 13,
    updated: '2026-05-12',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-7',
    title: 'Editable web view (mark tasks done, reorder via drag)',
    priority: 7,
    severity: 'low',
    estimate: 8,
    updated: '2026-05-12',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-13',
    title:
      'First public release: trigger release.yml; verify example-planner@0.1.0 installs via npm i -g',
    priority: 13,
    severity: 'high',
    estimate: 1,
    updated: '2026-07-02',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-22',
    title:
      'Read-only web view prototypes: portfolio, task list, session reader, project reader, file-history explorer',
    priority: 20,
    severity: 'low',
    estimate: 8,
    updated: '2026-07-12',
  },
]

/** The reference instant the stories and tests measure ages from (2026-09-03 12:00Z). */
export const INITIATIVE_NOW = new Date('2026-09-03T12:00:00Z').getTime()
