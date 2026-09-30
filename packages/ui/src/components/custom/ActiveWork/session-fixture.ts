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
    id: '34db5555',
    filename: '2026-07-12-1347-34db5555-1.md',
    started: '2026-07-12T13:47:56Z',
    ended: '2026-07-12T14:52:21Z',
    track: 'canonical',
    title:
      'Shipped AW-17 + AW-18 + AW-19 + AW-20 — folder→project lookup, shared-list registration, mid-session reminder refresh, and quick-note framing',
    body: '# Shipped AW-17 + AW-18 + AW-19 + AW-20 — folder→project lookup, shared-list registration, mid-session reminder refresh, and quick-note framing\n\n## Goal\n\nClose out the four small planner tasks queued behind **AW-17**, so the next session can start on sync.\n\n## What shipped\n\n- **AW-17** (#51): `planner open` now finds the project from the current folder when no slug is given. It walks up from `/home/example/projects/alpha-workspace` until it meets a `planner.yml`.\n- **AW-18** (#52): `planner list add` registers a shared list on an existing project instead of creating a second one.\n- **AW-19** (#53): `planner remind` reprints the current goal and the three oldest open tasks, for a mid-session refresh.\n- **AW-20** (#54): `planner open --quick` frames the prompt as a quick note, not a handoff continuation.\n\n## Decisions\n\n- Lookup stops at the first `planner.yml` it meets; a nested project wins over its parent.\n- `--quick` never writes a handoff file. A quick note that grows into real work gets promoted with `planner promote`.\n\n## Verification\n\n- `pnpm test` green: 212 passing, 0 skipped.\n- Ran `planner open` from `/home/example/projects/alpha-workspace/docs` and got the right project.\n- `planner remind` output checked against the sample project in `fixtures/sample-home`.\n\n## Follow-ups\n\n- **AW-1** still needs a Linux service file before the Linux build is usable (#55 tracks the draft).\n- **AW-13** (first public release) waits on the release checklist; see #56.\n\n## Notes\n\nThe folder walk reads `stat` once per level, so a deep tree costs a few milliseconds. Fine for a CLI.\n',
  },
  {
    id: 'adhoc-9f3c2a10',
    filename: '2026-07-10-1602-9f3c2a10-adhoc-doc-pass.md',
    started: '2026-07-10T16:02:00Z',
    ended: '2026-07-10T16:31:00Z',
    track: 'adhoc',
    title: 'Ad-hoc: README pass while AW-17 was in review',
    body: '# Ad-hoc: README pass while AW-17 was in review\n\nTightened the install section and re-linked [[setup-walkthrough]]. No task moved; AW-17 stays with its reviewer.\n\n- `planner setup` copy now names the login-item step\n- Dropped a stale reference to #42',
  },
  {
    id: '1c51749e',
    filename: '2026-07-02-0453-1c51749e-1.md',
    started: '2026-07-02T04:53:48Z',
    ended: '2026-07-02T20:09:05Z',
    track: 'canonical',
    title: 'Shipped AW-3 + AW-5, aligned repo config, reworked merge permissions',
    body: '# Shipped AW-3 + AW-5, aligned repo config, reworked merge permissions\n\n## Summary\n\nA long day. **AW-3** and **AW-5** both landed, and the repo settings now match the sample template.\n\n## AW-3 — live change feed\n\n- The background helper now pushes change events to the web view over a socket (#31).\n- Events carry the task id and the changed field only; the view refetches the row.\n- `planner serve --port 4100` is the new default; `--port 0` picks a free one.\n\n## AW-5 — sync between two laptops\n\n- `planner sync` wraps a plain git remote (#32). Conflicts stop the sync and print both versions.\n- **Decision:** no automatic merge of task notes. A human picks.\n\n## Repo config\n\n- Branch rules: one approving review, required checks `lint`, `test`, `build`.\n- Merge permissions reworked so only squash merges are allowed (#33).\n\n## Touched along the way\n\n- **AW-11**: dropped an unused UI dependency.\n- **AW-13**: release checklist drafted, not run.\n- **AW-1**, **AW-7** and **AW-6** reprioritised; none started.\n\n## Next\n\n- Write the Linux service file for **AW-1**.\n- Run `planner doctor` on a clean machine.\n',
  },
  {
    id: '151ef7a2',
    filename: '2026-07-01-1833-151ef7a2.md',
    started: '2026-07-01T18:33:01Z',
    ended: '2026-07-02T04:45:35Z',
    track: 'canonical',
    title: 'Backlog blitz — shipped 10 tasks, cleared PR backlog, prepped npm publish',
    body: "# Backlog blitz — shipped 10 tasks, cleared PR backlog, prepped npm publish\n\n## Shipped\n\n- **AW-16** (#20): `note add --body-file` no longer fails when `--body` is missing.\n- **AW-15** (#21): `lists.yml` now stores list names only; state is read live.\n- **AW-1** (#22): Linux service file drafted.\n- **AW-9** (#23): tests mock the home folder with `vi.spyOn(os, 'homedir')` only.\n- **AW-2** (#24): the setup wizard installs and removes the macOS login item.\n- **AW-4** (#25): `planner doctor` checks dependencies, the helper and the plugin install.\n- **AW-11** (#26): removed an unused UI dependency.\n- **AW-14** (#27): `gen:reference` wired into `package.json`.\n- **AW-12** (#28): the flaky `cli.test.ts` run traced to a shared temp folder.\n- **AW-8** (#29): done tasks older than 30 days archive during start-up.\n\n## Cleared\n\n- Merged **#14** through **#19**, the open review queue.\n- Closed #12 and #13 as duplicates of **AW-10**.\n\n## Prepped\n\n- **AW-13**: `release.yml` ready; the first publish waits on a clean install check.\n\n## Not started\n\n- **AW-3**, **AW-5**, **AW-6** and **AW-7** stay queued for next session.\n",
  },
  {
    id: '874f2d4e',
    filename: '2026-07-01-1617-874f2d4e.md',
    started: '2026-07-01T16:17:40.917Z',
    ended: '2026-07-01T16:51:35Z',
    track: 'canonical',
    title: 'Fix: channels flag swallowing the bootstrap prompt',
    body: '# Fix: channels flag swallowing the bootstrap prompt\n\n## Symptom\n\nWith `--channels` set, `planner open` started a session but the first prompt never arrived. The session sat idle.\n\n## Cause\n\n- The launcher built its argument list as `[...flags, prompt]`.\n- `--channels` takes a **variadic** value, so it read the prompt as one more channel name.\n\n## Fix\n\n- Put the prompt before the flags: `[prompt, ...flags]` (#18).\n- Added a regression test that runs `planner open --channels a b` and checks the prompt arrives.\n- `--channels` now warns when a value looks like a sentence.\n\n## Related\n\n- **AW-15** touches the same launcher; rebased it on the fix.\n- Opened #19 to document variadic flags in `docs/cli.md`.\n\n## Checked\n\n- `pnpm test` green.\n- Manual run in `/home/example/projects/alpha-workspace` with two channels.\n',
  },
  {
    id: 'aw-1-sys',
    filename: '2026-05-13-1927-aw-1-sys.md',
    started: '2026-05-13T19:27:21Z',
    ended: '2026-05-13T19:33:13Z',
    track: 'canonical',
    title: 'AW-1 — Linux systemd supervision (engineering complete)',
    body: '# AW-1 — Linux systemd supervision (engineering complete)\n\n## Done\n\n- `planner service install` writes a user unit to `~/.config/systemd/user/planner.service`.\n- `planner service remove` stops and deletes it.\n- The unit restarts the helper on failure, with a 5 second back-off.\n\n## Left\n\n- **AW-2** covers the macOS side; nothing shared beyond `service.ts`.\n- Needs a run on a real Linux machine before it closes.\n',
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
    title: 'Add Linux support: systemd unit for helper supervision',
    priority: 1,
    severity: 'medium',
    estimate: 5,
    updated: '2026-07-12',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-2',
    title: 'Add macOS login-item install/remove to the setup wizard',
    priority: 2,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-3',
    title: 'Live change feed from the helper to the web view',
    priority: 3,
    severity: 'low',
    estimate: 5,
    updated: '2026-07-02',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-4',
    title: 'planner doctor: health-check command (verify deps, helper, plugin install)',
    priority: 4,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-5',
    title: 'Two-laptop git-backed sync wrapper (planner sync)',
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
    title: 'Auto-archive done tasks older than N days during start-up',
    priority: 8,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-9',
    title: "Audit tests for unsafe home-folder mocking; ensure all use vi.spyOn(os, 'homedir')",
    priority: 9,
    severity: 'high',
    estimate: 2,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-10',
    title: 'Clean up readRawFrontmatter workarounds now that the parser coerces dates',
    priority: 10,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-11',
    title: 'Remove the unused UI dependency \u2014 the web view ended up not using it',
    priority: 11,
    severity: 'low',
    estimate: 1,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-12',
    title:
      'Investigate occasional integration-test flakes (cli.test.ts had 5 failures on first merged run, clean on retry)',
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
    title:
      'Add gen:reference script entry to package.json (generator exists; just needs npm-run wiring)',
    priority: 14,
    severity: 'low',
    estimate: 1,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-15',
    title: 'Simplify lists.yml: list names only; read list state live',
    priority: 1,
    severity: 'medium',
    estimate: 8,
    updated: '2026-07-01',
  },
  {
    slug: 'alpha-workspace',
    id: 'AW-16',
    title: 'note add --body-file passes validation when --body is omitted',
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
