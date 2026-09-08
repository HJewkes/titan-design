import type { InitiativeBriefData } from './InitiativeBrief'
import type { OpenLoop } from './OpenLoops'
import type { TaskListItem } from './TaskRow'
/**
 * Real initiative state for the reader stories and tests, with fixed values
 * (no `Date.now()`) so visual baselines stay deterministic; pair it with
 * {@link INITIATIVE_NOW}. The brief is this initiative's own v0.1 brief, the
 * open loops are the five it carried into 2026-09-03, and the tasks are the
 * open ones at the time of the export.
 */
export const INITIATIVE_BRIEF_FIXTURE: InitiativeBriefData = {
  slug: 'active-work',
  title: 'active-work \u2014 durable workspace state',
  state: 'focused',
  rank: 1,
  shipTarget: '2026-Q3',
  updated: '2026-07-12',
  body: "# active-work — durable workspace state\n\n## Why this exists\n\nEngineering work spans days; Claude Code sessions don't. Every handoff between sessions, machines, or agents loses context unless something durable holds it. `active-work` is that something — plain files per initiative (brief, handoff, tasks, sessions, artifacts) under `$XDG_DATA_HOME/active-work/<slug>/`, exposed through a CLI (`aw`), an MCP server, an HTTP daemon, and a Claude skill so any surface reads or writes the same source of truth.\n\n## v0.1 architecture (what shipped this session)\n\n- **Single npm package** `@hjewkes/active-work` (scoped, public, MIT)\n- **Shared zod-typed command registry** — CLI dispatcher (commander), MCP server (`@modelcontextprotocol/sdk`), and HTTP daemon (hono) all consume the same `src/registry/` module\n- **36 commands** across lifecycle / focus-pause / tasks / sessions / sources / artifacts / discover / open / edit / lint / mcp lifecycle / setup / uninstall\n- **Long-running daemon** (`aw mcp serve`) — REST `/rpc/:name`, MCP-over-HTTP `/mcp`, `/health`, `/version`, single-file React dashboard at `/ui` (203KB gzip 64KB), bound to `127.0.0.1:7400`\n- **Skill auto-installed** to `~/.claude/skills/active-work/` via `scripts/postinstall.js`\n- **Schemas** for brief / task / session / artifacts validated on every write; `coerceDates` at the gray-matter and yaml-io seams normalizes YAML 1.2 timestamp coercion\n\n## Major decisions made this session\n\n- **Drop INDEX.md** — picker enumerates `<activeRoot>/*/brief.md` directly; `aw list` formats on demand\n- **Split the old monolithic handoff** into brief.md (frontmatter + slow prose), handoff.md (current-state prose), tasks/*.yml (per-file structured), sessions/*.md (one per session), artifacts.yml (PRs/branches/stashes)\n- **Drop `kind`, `priority`, `health`, `depends_on`** — state enum collapsed to `focused (with rank) | backburner | paused | done`; severity is per-task; health surfaces via task notes; workstreams are independent\n- **Tasks are per-file YAML** with sequential per-initiative IDs (Jira-style: `AW-1`, `AW-2`)\n- **Sessions are per-file** in `sessions/`; bootstrap reads the most recent canonical\n- **Mixed edit policy** — prose docs editable directly; structured files (tasks, artifacts, brief frontmatter) CLI-only\n- **Discover non-interactive** — emits JSON list; Claude orchestrates triage via `aw fold/drop/track`\n- **Daemon supervision opt-in** — `--detach` for now; launchd plist deferred (AW-2)\n- **Concurrency** — atomic write + flock per-initiative; one Claude session per initiative\n\n## What got cut from v0.1\n\n- WebSocket file-event broadcasts to dashboard (AW-3)\n- launchd plist install/uninstall (AW-2)\n- Linux/Windows support (AW-1 covers Linux)\n- Auto-archive of done tasks (AW-8)\n\n## Stakeholders\n\n- @hjewkes — owner / sole user\n\n## Open questions / risks\n\n\n…",
}

export const INITIATIVE_LOOPS_FIXTURE: OpenLoop[] = [
  {
    ref: '2026-08-28-1244-2026-08-28-loop-verification-and-branch-sweep#n1',
    kind: 'prose',
    text: 'Decide the fate of the 7 independent unmerged titan-design lines of work: feat/TD-velocity-primitives (29 commits, subsumes 7 branches), feat/TD-unified-lab (47, subsumes surface-exploration-stories), lab/active-work-dashboard (10 / 39k lines, worktree-backed), chore/TD-arch-graph-refresh (1), feat/TD-velocity-strip-set-types (1), fix/TD-color-stories-current-system (1, PR #102 closed), agent/TD-07/design-pass (7, PR #135 closed). The 8 contained branches can be deleted losing nothing.',
    sessionFile: '2026-08-28-1244-2026-08-28-loop-verification-and-branch-sweep',
    openedAt: '2026-08-28T13:21:27Z',
  },
  {
    ref: '2026-08-28-1244-2026-08-28-loop-verification-and-branch-sweep#n3',
    kind: 'pr',
    text: 'Four other titan-design PRs sit open and unreviewed: #100 TD-maturity-taxonomy, #101 TD-mobile-candidates, #103 TD-r2-s4s5-candidates, #116 live-wall-empty-states. All MERGEABLE, all REVIEW_REQUIRED.',
    sessionFile: '2026-08-28-1244-2026-08-28-loop-verification-and-branch-sweep',
    openedAt: '2026-08-28T13:21:27Z',
  },
  {
    ref: '2026-08-28-1244-2026-08-28-loop-verification-and-branch-sweep#n4',
    kind: 'task',
    targetRef: 'AW-116',
    text: 'AW-116: artifacts.yml still carries a worktree path that artifact status reports present:false and no CLI command can remove.',
    sessionFile: '2026-08-28-1244-2026-08-28-loop-verification-and-branch-sweep',
    openedAt: '2026-08-28T13:21:27Z',
  },
  {
    ref: '2026-08-29-0850-2026-08-29-aw22-f1-pr157-merge#n1',
    kind: 'task',
    targetRef: 'AW-22',
    text: 'AW-22 needs T2 Task List, M1 Session Reader and M2 Initiative Reader hardened into packages/ui before it can close — F1 and T1 have landed, the other three specimens are still lab-only.',
    sessionFile: '2026-08-29-0850-2026-08-29-aw22-f1-pr157-merge',
    openedAt: '2026-08-29T12:59:33Z',
  },
  {
    ref: '2026-08-29-0850-2026-08-29-aw22-f1-pr157-merge#n2',
    kind: 'task',
    targetRef: 'AW-117',
    text: 'AW-117: titan-design main is 194 files prettier-unclean and its ci.yml Format Check is continue-on-error:true. Sequence the reformat after the unmerged-branch triage, since it will collide with every open branch.',
    sessionFile: '2026-08-29-0850-2026-08-29-aw22-f1-pr157-merge',
    openedAt: '2026-08-29T12:59:33Z',
  },
]

export const INITIATIVE_TASKS_FIXTURE: TaskListItem[] = [
  {
    slug: 'active-work',
    id: 'AW-6',
    title: 'Linear / Jira / Slack discovery sources',
    priority: 6,
    severity: 'low',
    estimate: 13,
    updated: '2026-05-12',
  },
  {
    slug: 'active-work',
    id: 'AW-7',
    title: 'Read-write dashboard (mark tasks done from /ui, reorder via drag)',
    priority: 7,
    severity: 'low',
    estimate: 8,
    updated: '2026-05-12',
  },
  {
    slug: 'active-work',
    id: 'AW-13',
    title:
      'First npm publish: trigger release.yml; verify @hjewkes/active-work@0.1.0 installable via npm i -g',
    priority: 13,
    severity: 'high',
    estimate: 1,
    updated: '2026-07-02',
  },
  {
    slug: 'active-work',
    id: 'AW-22',
    title:
      'Read-only dashboard prototypes (titan specimens): portfolio, task list, session reader, initiative reader, file-history explorer',
    priority: 20,
    severity: 'low',
    estimate: 8,
    updated: '2026-07-12',
  },
]

/** The reference instant the stories and tests measure ages from (2026-09-03 12:00Z). */
export const INITIATIVE_NOW = new Date('2026-09-03T12:00:00Z').getTime()
