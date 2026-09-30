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
  body: "# alpha-workspace — sample project planner\n\n## Why this exists\n\nProjects span weeks; a single sitting doesn't. Every handoff between sittings, laptops or helpers loses context unless something durable holds it. `planner` is that something: plain files per project (brief, handoff, tasks, sessions, notes) under `/home/example/.local/share/planner/<slug>/`, read and written through one small CLI.\n\n## v0.1 architecture (what shipped this session)\n\n- **Storage:** one folder per project, markdown with front matter. No database.\n- **CLI:** `planner open`, `planner task add`, `planner note add`, `planner wrap`.\n- **Helper:** a small background process that watches the folders and feeds the web view.\n- **Web view:** read-only, served on `localhost:4100`.\n\n## Major decisions made this session\n\n- Plain files over a database, so any editor can fix a broken record.\n- Task ids are per project (`AW-1`, `AW-2`, ...) and never reused.\n- The CLI is the only writer; the web view reads.\n\n## What got cut from v0.1\n\n- Import from calendars, email and notes apps (**AW-6**).\n- Editing in the web view (**AW-7**).\n- Sync between laptops; plain git works for now.\n\n## Stakeholders\n\n- Owner: @example-owner (sample account).\n- Early users: two sample testers on the `planner-beta` list.\n\n## Open questions / risks\n\n- How large can one project's task file grow before the web view slows down?\n- Should done tasks archive automatically, and after how many days?\n- Is a background helper worth its install cost on a laptop that sleeps?\n",
}

export const INITIATIVE_LOOPS_FIXTURE: OpenLoop[] = [
  {
    ref: '2026-08-28-1244-sample-branch-sweep#n1',
    kind: 'prose',
    text: 'Decide the fate of the 5 unmerged lines of work in the sample repo: feat/AW-import-sources (29 commits, subsumes 3 branches), feat/AW-web-view-edit (47 commits), lab/planner-dashboard (10 commits, worktree-backed), chore/AW-docs-refresh (1 commit), fix/AW-date-parsing (1 commit, PR #102 closed). Each needs a merge, a rebase, or a deliberate close, and the order matters because the first two overlap.',
    sessionFile: '2026-08-28-1244-sample-branch-sweep',
    openedAt: '2026-08-28T13:21:27Z',
  },
  {
    ref: '2026-08-28-1244-sample-branch-sweep#n3',
    kind: 'pr',
    text: 'Four other sample PRs sit open and unreviewed: #100 AW-task-archive, #101 AW-mobile-layout, #103 AW-reminder-copy, #116 web-view-empty-states. All mergeable, all waiting on review.',
    sessionFile: '2026-08-28-1244-sample-branch-sweep',
    openedAt: '2026-08-28T13:21:27Z',
  },
  {
    ref: '2026-08-28-1244-sample-branch-sweep#n4',
    kind: 'task',
    targetRef: 'AW-116',
    text: 'AW-116: notes.yml still lists a folder that note status reports missing, and no CLI command can remove it.',
    sessionFile: '2026-08-28-1244-sample-branch-sweep',
    openedAt: '2026-08-28T13:21:27Z',
  },
  {
    ref: '2026-08-29-0850-sample-web-view-merge#n1',
    kind: 'task',
    targetRef: 'AW-22',
    text: 'AW-22 needs the task list, session reader and project reader prototypes hardened before it can close. The portfolio and file-history views have landed; the other three are still prototypes.',
    sessionFile: '2026-08-29-0850-sample-web-view-merge',
    openedAt: '2026-08-29T12:59:33Z',
  },
  {
    ref: '2026-08-29-0850-sample-web-view-merge#n2',
    kind: 'task',
    targetRef: 'AW-117',
    text: 'AW-117: the sample repo has 194 files that fail the format check, and its CI format step is allowed to fail. Sequence the reformat after the branch triage, since it will collide with every open branch.',
    sessionFile: '2026-08-29-0850-sample-web-view-merge',
    openedAt: '2026-08-29T12:59:33Z',
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
