import type { SessionSummary } from './SessionListItem'
import type { TaskListItem } from './TaskRow'
/**
 * Synthetic session logs for the session reader stories and tests, written to
 * the shape of real active-work sessions for an invented `alpha-workspace`
 * project. Fixed values (no `Date.now()`) so visual baselines stay
 * deterministic; pair it with {@link SESSION_NOW}.
 *
 * Five canonical sessions of varied length (six minutes to fifteen hours), plus
 * one ad-hoc session (second in the list) so the track's other state renders.
 * Ids are 8-character prefixes like the session files use. The bodies are
 * markdown, so the auto-linker meets `AW-nn`, `[[name]]`, `#123`, bold and code
 * spans.
 */
export const SESSION_FIXTURE: SessionSummary[] = [
  {
    id: 'e1a2b3c4',
    filename: '2026-07-12-1321-e1a2b3c4-1.md',
    started: '2026-07-12T13:21:10Z',
    ended: '2026-07-12T14:25:30Z',
    track: 'canonical',
    title:
      'Closed AW-17 + AW-18 + AW-19 + AW-20 in one sitting — folder lookup, shared lists, the remind command and quick notes for the sample planner',
    body: '# Closed AW-17 + AW-18 + AW-19 + AW-20 in one sitting — folder lookup, shared lists, the remind command and quick notes for the sample planner\n\n## Goal\n\nClose out the four small planner tasks queued behind **AW-17**, so the next session can start on sync.\n\n## What shipped\n\n- **AW-17** (#51): `planner open` now finds the project from the current folder when no slug is given. It walks up from `/home/example/projects/alpha-workspace` until it meets a `planner.yml`.\n- **AW-18** (#52): `planner list add` registers a shared list on an existing project instead of creating a second one.\n- **AW-19** (#53): `planner remind` reprints the current goal and the three oldest open tasks, for a mid-session refresh.\n- **AW-20** (#54): `planner open --quick` frames the prompt as a quick note, not a handoff continuation.\n\n## Decisions\n\n- Lookup stops at the first `planner.yml` it meets; a nested project wins over its parent.\n- `--quick` never writes a handoff file. A quick note that grows into real work gets promoted with `planner promote`.\n\n## Checks run\n\n- `pnpm test` green: 212 passing, 0 skipped.\n- Ran `planner open` from `/home/example/projects/alpha-workspace/docs` and got the right project.\n- `planner remind` output checked against the sample project in `fixtures/sample-home`.\n\n## Follow-ups\n\n- **AW-1** still needs a Linux service file before the Linux build is usable (#55 tracks the draft).\n- **AW-13** (first public release) waits on the release checklist; see #56.\n\n## Notes\n\nThe folder walk reads `stat` once per level, so a deep tree costs a few milliseconds. Fine for a CLI.\n',
  },
  {
    id: 'adhoc-d4e5f6a7',
    filename: '2026-07-09-1115-d4e5f6a7-adhoc-help-pass.md',
    started: '2026-07-09T11:15:00Z',
    ended: '2026-07-09T11:44:00Z',
    track: 'adhoc',
    title: 'Quick note: help-text pass while AW-17 waited on review',
    body: '# Quick note: help-text pass while AW-17 waited on review\n\nTightened the install section and pointed it at [[setup-walkthrough]]. No task changed state; AW-17 is still in review.\n\n- `planner setup` copy now names the login-item step\n- Removed an outdated pointer to #42',
  },
  {
    id: 'b7c8d9e0',
    filename: '2026-07-03-0610-b7c8d9e0-1.md',
    started: '2026-07-03T06:10:05Z',
    ended: '2026-07-03T21:22:30Z',
    track: 'canonical',
    title: 'Landed AW-3 + AW-5, matched the sample repo settings, squash-only merges',
    body: '# Landed AW-3 + AW-5, matched the sample repo settings, squash-only merges\n\n## Summary\n\nA long day. **AW-3** and **AW-5** both landed, and the repo settings now match the sample template.\n\n## AW-3 — live change feed\n\n- The background helper now pushes change events to the web view over a socket (#31).\n- Events carry the task id and the changed field only; the view refetches the row.\n- `planner serve --port 4100` is the new default; `--port 0` picks a free one.\n\n## AW-5 — sync between two laptops\n\n- `planner sync` wraps a plain git remote (#32). Conflicts stop the sync and print both versions.\n- **Decision:** no automatic merge of task notes. A human picks.\n\n## Repo config\n\n- Branch rules: one approving review, required checks `lint`, `test`, `build`.\n- Merge permissions reworked so only squash merges are allowed (#33).\n\n## Touched along the way\n\n- **AW-11**: dropped an unused UI dependency.\n- **AW-13**: release checklist drafted, not run.\n- **AW-1**, **AW-7** and **AW-6** reprioritised; none started.\n\n## Next\n\n- Write the Linux service file for **AW-1**.\n- Run `planner doctor` on a clean machine.\n',
  },
  {
    id: 'f0a1b2c3',
    filename: '2026-07-02-1745-f0a1b2c3.md',
    started: '2026-07-02T17:45:12Z',
    ended: '2026-07-03T03:58:40Z',
    track: 'canonical',
    title: 'Sample sprint — closed ten small tasks, emptied the review queue, readied a release',
    body: "# Sample sprint — closed ten small tasks, emptied the review queue, readied a release\n\n## Shipped\n\n- **AW-16** (#20): `note add --body-file` no longer fails when `--body` is missing.\n- **AW-15** (#21): `lists.yml` now stores list names only; state is read live.\n- **AW-1** (#22): Linux service file drafted.\n- **AW-9** (#23): tests mock the home folder with `vi.spyOn(os, 'homedir')` only.\n- **AW-2** (#24): the setup wizard installs and removes the macOS login item.\n- **AW-4** (#25): `planner doctor` checks dependencies, the helper and the plugin install.\n- **AW-11** (#26): removed an unused UI dependency.\n- **AW-14** (#27): `gen:reference` wired into `package.json`.\n- **AW-12** (#28): the flaky `cli.test.ts` run traced to a shared temp folder.\n- **AW-8** (#29): done tasks older than 30 days archive during start-up.\n\n## Cleared\n\n- Merged **#14** through **#19**, the open review queue.\n- Closed #12 and #13 as duplicates of **AW-10**.\n\n## Prepped\n\n- **AW-13**: `release.yml` ready; the first publish waits on a clean install check.\n\n## Not started\n\n- **AW-3**, **AW-5**, **AW-6** and **AW-7** stay queued for next session.\n",
  },
  {
    id: 'c4d5e6f7',
    filename: '2026-07-02-1502-c4d5e6f7.md',
    started: '2026-07-02T15:02:20.500Z',
    ended: '2026-07-02T15:37:05Z',
    track: 'canonical',
    title: 'Fix: a list flag eating the first prompt in planner open',
    body: '# Fix: a list flag eating the first prompt in planner open\n\n## Symptom\n\nWith `--lists` set, `planner open` started a session but the first prompt never arrived. The session sat idle.\n\n## Cause\n\n- The launcher built its argument list as `[...flags, prompt]`.\n- `--lists` takes a **variadic** value, so it read the prompt as one more channel name.\n\n## Fix\n\n- Put the prompt before the flags: `[prompt, ...flags]` (#18).\n- Added a regression test that runs `planner open --lists a b` and checks the prompt arrives.\n- `--lists` now warns when a value looks like a sentence.\n\n## Related\n\n- **AW-15** touches the same launcher; rebased it on the fix.\n- Opened #19 to document variadic flags in `docs/cli.md`.\n\n## Checked\n\n- `pnpm test` green.\n- Manual run in `/home/example/projects/alpha-workspace` with two channels.\n',
  },
  {
    id: 'sample-svc',
    filename: '2026-05-20-0810-sample-svc.md',
    started: '2026-05-20T08:10:00Z',
    ended: '2026-05-20T08:16:00Z',
    track: 'canonical',
    title: 'AW-1 — Linux service file for the sample helper (code done)',
    body: '# AW-1 — Linux service file for the sample helper (code done)\n\n## Done\n\n- `planner service install` writes a user unit to `~/.config/systemd/user/planner.service`.\n- `planner service remove` stops and deletes it.\n- The unit restarts the helper on failure, with a 5 second back-off.\n\n## Left\n\n- **AW-2** covers the macOS side; nothing shared beyond `service.ts`.\n- Needs a run on a real Linux machine before it closes.\n',
  },
]

/** The reference instant the stories and tests measure ages from (2026-07-14 09:00Z). */
export const SESSION_NOW = new Date('2026-07-14T09:00:00Z').getTime()

/**
 * The task rows behind every id the fixture sessions mention, for the
 * detail pane's tasks-touched table. A host resolves these from its task store;
 * the story does the same lookup against this list.
 */
export const SESSION_TASK_FIXTURE: TaskListItem[] = [
  {
    slug: 'alpha-workspace',
    id: 'AW-1',
    title: 'Linux: a user service file that keeps the sample helper running',
    priority: 1,
    severity: 'medium',
    estimate: 5,
    updated: '2026-07-12',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-2',
    title: 'macOS: add and remove the login item from the setup wizard',
    priority: 2,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-3',
    title: 'Push live changes from the helper to the web view',
    priority: 3,
    severity: 'low',
    estimate: 5,
    updated: '2026-07-02',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-4',
    title: 'planner doctor: one command that checks dependencies, the helper and the plugin',
    priority: 4,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-5',
    title: 'Sync two laptops through a plain git remote (planner sync)',
    priority: 5,
    severity: 'low',
    estimate: 8,
    updated: '2026-07-02',
  },
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
    id: 'AW-8',
    title: 'Archive finished tasks after N days when the planner starts',
    priority: 8,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-9',
    title: 'Make every test fake the home folder the same way',
    priority: 9,
    severity: 'high',
    estimate: 2,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-10',
    title: 'Drop the date workarounds now that the parser handles dates',
    priority: 10,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-11',
    title: 'Remove the UI dependency the web view never used',
    priority: 11,
    severity: 'low',
    estimate: 1,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-12',
    title:
      'Find why two CLI tests fail now and then on a fresh checkout (a long title that wraps in the task table)',
    priority: 12,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-01',
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
    id: 'AW-14',
    title: 'Wire the reference generator into package.json as gen:reference',
    priority: 14,
    severity: 'low',
    estimate: 1,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-15',
    title: 'Store list names only in lists.yml and read list state live',
    priority: 1,
    severity: 'medium',
    estimate: 8,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-16',
    title: 'note add: accept --body-file without --body',
    priority: 6,
    severity: 'low',
    estimate: 1,
    tags: ['polish', 'cli'],
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-17',
    title: 'planner open: resolve project from the current folder when no slug given',
    priority: 15,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-12',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-18',
    title: 'planner list add: register a shared list on an existing project',
    priority: 16,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-12',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-19',
    title: 'planner remind + /remind slash command for a mid-session refresh',
    priority: 17,
    severity: 'low',
    estimate: 3,
    updated: '2026-07-12',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-20',
    title: 'planner open --quick: frame the prompt as a quick note, not a handoff continuation',
    priority: 18,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-12',
  },
]
