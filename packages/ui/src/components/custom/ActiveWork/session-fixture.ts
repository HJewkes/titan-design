import type { SessionSummary } from './SessionListItem'
import type { TaskListItem } from './TaskRow'
/**
 * A hand-trimmed slice of real active-work session logs, used by the session
 * reader stories and tests. Fixed values (no `Date.now()`) so visual baselines
 * stay deterministic; pair it with {@link SESSION_NOW}.
 *
 * Five canonical sessions of varied length (six minutes to fifteen hours), plus
 * one synthesized ad-hoc session so the track pill's second state renders. Ids
 * are the 8-character prefixes the session files use. The bodies are the real
 * markdown, so the auto-linker meets real `AW-nn`, `[[name]]`, `#123`, bold and
 * code spans.
 */
export const SESSION_FIXTURE: SessionSummary[] = [
  {
    id: '34db5555-aw17-cwd-resolve',
    filename: '2026-07-12-1347-34db5555-aw17-cwd-resolve-1.md',
    started: '2026-07-12T13:47:56Z',
    ended: '2026-07-12T14:52:21Z',
    track: 'canonical',
    title:
      'Shipped AW-17 + AW-18 + AW-19 + AW-20 \u2014 cwd\u2192initiative resolution, worktree registration, mid-session prompt re-seed,',
    body: "# Shipped AW-17 + AW-18 + AW-19 + AW-20 \u2014 cwd\u2192initiative resolution, worktree registration, mid-session prompt re-seed, and ad-hoc session framing\n\nUser redirected from the owner-gated backlog (AW-1 Ubuntu smoke-test, AW-13 npm\npublish) to a new feature: make `aw` / `active-work open` figure out which\ninitiative to bootstrap from the current directory instead of always showing the\npicker. Built, reviewed, fixed, merged (#49). Then closed the follow-up gap it\nexposed (no CLI to register a worktree on an existing initiative) with AW-18\n(#50), and dogfooded it on this initiative. `main` green (535/535), no open PRs.\n\n## What shipped (AW-17, PR #49)\nThe inverse of the existing `resolveCwdHint` (initiative \u2192 cwd): now cwd \u2192\ninitiative. With no slug, `open` matches the caller's cwd against every brief's\n`worktrees[*].path` and bootstraps the containing initiative; nested worktrees\nresolve to the deepest match; no match or a cross-initiative tie falls back to\nthe picker.\n\n- `open --cwd <dir>` sets the resolution dir; `--pick` (on both `open` and `aw`)\n  forces the picker. Result carries `resolved_from: \"slug\" | \"cwd\"`; `aw` prints\n  a dim \"matched current directory\" note.\n\n## Review-driven fixes (2nd commit, before merge)\nAn Explore-agent review of the diff caught four real issues, all fixed:\n1. **`aw --pick` was documented but errored** \u2014 the launcher rejects any\n   `-`-prefixed arg and `runOpen` never forwarded flags. Launcher now parses\n   `--pick` and forwards it.\n2. **Daemon/MCP footgun** \u2014 the command read ambient `process.cwd()`, so a no-arg\n   MCP `open` would match against the *daemon's* cwd. Moved the cwd source to\n   `CommandContext.cwd`, populated only by the CLI dispatcher and `aw` launcher\n   (the user's shell cwd). Daemon/http leave it undefined \u2192 no-arg reverts to\n   picker; MCP callers opt in by passing `cwd`.\n3. **Symlinks** \u2014 `process.cwd()` returns the realpath on macOS (`/var` \u2192\n   `/private/var`) while briefs store the un-resolved form, so lexical matching\n   missed (caught in my own E2E). Now `canonicalize()` (realpath, lexical\n   fallback for nonexistent paths) runs on both sides.\n4. **Wrong launch dir** \u2014 a cwd-resolved open still used the brief's *default*\n   worktree as `cwd_hint`. Now it launches in the matched worktree.\n   Also: relative worktree paths are skipped (can't compare to an absolute cwd).\n\nConfirmed sound by the review: deepest-match/tie logic (`canonical.length` depth\nproxy is valid since all matches are ancestors of cwd), `isInside` (no\n`/foo/bar` vs `/foo/barbaz` false positive), `'picker' in result` narrowing.\n\n## Tests / verification\n9 new `open` tests (auto-resolve, ctx-cwd path, nested subdir, symlink, no-match\n+ daemon-no-cwd fallbacks, `--pick`, slug tagging, deepest-match, ambiguous-tie).\nFull suite 531 green. Verified E2E against the built CLI: cwd-through-symlink\nresolves, unrelated cwd \u2192 picker, `--pick` \u2192 picker.\n\n## AW-18 (PR #50) \u2014 `active-work worktree set`\nThe dogfood exposed a real gap: worktrees could only be recorded at creation\n(`new --worktree`) or via `track --worktree` \u2014 no way to add one to an existing\ninitiative. New command: `worktree set <slug> <path> [--label <label>]\n[--default]`. First worktree \u2192 default automatically; updating a\nalready-default label keeps it default (no silent demote); `--default` promotes\nand clears others. 4 tests, E2E-verified. Registered as `worktreeSet` in the\ncommand index; dotted name \u2192 `active-work worktree set` on the CLI.\n\n## Dogfood done\nRegistered this initiative's worktree:\n`active-work worktree set active-work /Users/hjewkes/Documents/projects/active-work`.\nVerified: `active-work open` (no slug) from inside the repo (even a subdir) now\nresolves `slug: active-work, resolved_from: cwd`. So `aw` from anywhere in\n`~/Documents/projects/active-work` auto-opens this initiative. The installed\n`~/.local/bin/active-work` is a symlink to the repo `dist/cli.js`, so a local\n`npm run build` is enough to pick up new commands.\n\n## AW-19 (PR #51) \u2014 `active-work prompt` + `/aw-prompt` slash command\nUser asked for a short command to print the startup prompt inside a running\nsession. `open` was unfit (JSON envelope + archive side effect). New:\n- `active-work prompt [slug]` \u2014 prints the bootstrap prompt as PLAIN TEXT,\n  cwd-resolved, side-effect-free (no archiveStaleTasks). Needed a `cli.ts` tweak:\n  a bare-string command result prints raw in human mode (only `prompt` returns a\n  string, verified). `--json` wraps it in the envelope.\n- `/aw-prompt` slash command (`claude-commands/aw-prompt.md`, `!`active-work\n  prompt $ARGUMENTS`` + `disable-model-invocation`) installs to\n  `~/.claude/commands/` via postinstall + `setup` (stepInstallCommand), removed\n  by `uninstall` (uninstallCommand). Bundled in package `files`.\n- Refactor: extracted resolveSlug/resolveSlugFromCwd/listInitiativeSlugs from\n  open.ts into `src/commands/_open-helpers.ts` so open + prompt share one impl.\n7 tests (incl. side-effect guard). Explore review: sound; fixed the flagged\npostinstall skill-source gate that also blocked command install, commented the\ndeliberate overwrite policy. Dogfood: ran postinstall \u2192 `/aw-prompt` live at\n`~/.claude/commands/aw-prompt.md`, skill refreshed. NOTE: a new slash command\nmay need a session reload to appear.\n\nSlash-command spec (for future reference): `.claude/commands/<name>.md` \u2192\n`/<name>`; frontmatter `allowed-tools: Bash(cmd:*)`, `disable-model-invocation`;\n`` !`cmd` `` injects stdout at expansion time.\n\n## AW-20 (PR #52) \u2014 `--adhoc` session framing\n\n\u2026",
  },
  {
    id: '1c51749e-aw3-live-reload',
    filename: '2026-07-02-0453-1c51749e-aw3-live-reload-1.md',
    started: '2026-07-02T04:53:48Z',
    ended: '2026-07-02T20:09:05Z',
    track: 'canonical',
    title: 'Shipped AW-3 + AW-5, aligned repo config, reworked merge permissions',
    body: '# Shipped AW-3 + AW-5, aligned repo config, reworked merge permissions\n\nA long session: two backlog features merged, plus a chunk of GitHub/harness\nworkflow setup. `main` clean, 521/521 green, no open PRs.\n\n## Features shipped\n- **AW-3 (#47) \u2014 live-reload dashboard.** SSE (`GET /events`) over raw WebSockets\n  \u2014 one-way push, zero new deps, native `EventSource` reconnect (keeps AW-11\'s\n  dep trim). Daemon `EventHub` fans `watchTree` (portable manual-recursive\n  `fs.watch`, sync initial attach) file events to `/ui`, which refetches within\n  ~1s; sidebar live dot. **Bonus fix:** `dashboardDir` assumed a `dist/server/`\n  layout `tsup` never emits, so packaged installs had *always* served the "not\n  built" placeholder \u2014 `/ui` never rendered the real dashboard. Now probes\n  bundled/legacy/dev layouts. Verified via integration test + manual prod run.\n- **AW-5 (#48) \u2014 `active-work sync`.** Auto-commit dirty tree \u2192 `git pull\n  --rebase` \u2192 `git push`. Guards not-a-repo/no-upstream/detached-HEAD; conflicts\n  surface with file list + continue/abort commands, left in place (local work\n  committed first). `rebased` derived from HEAD movement, not git wording.\n  Verified end-to-end with a bare remote + two clones (commit+push, clean\n  rebase-integrate, conflict + `rebase --abort` recovery). Also de-flaked the\n  AW-3 file-watch late-created-dir test (fixed sleeps \u2192 poll-until-observed; 8\n  clean full-suite runs after).\n\nBoth merged via `gh pr merge --squash --admin --delete-branch` (owner authorized;\n#47 was blocked by the auto-mode classifier first, then merged on explicit ask).\n\n## GitHub repo config aligned to `brain`\nBranch protection on `active-work` main now matches the house policy: required\nstrict `check`, no required reviews, admins overridable, no force-push (only diff\nwas a redundant 0-approval review block, removed). Workflow perms were already\nuniform (read / no-PR-creation) across all repos. Saved\n`github-repo-config-standard` memory (template repo: brain).\n\n## Merge permissions + mode rework\n- Root-caused the self-merge block: `permissions.allow` already had `Bash(*)`, so\n  the block was the **auto-mode classifier** (`defaultMode: auto`), not the\n  permission layer.\n- Owner then chose to **turn auto mode OFF**: `~/.claude/settings.json` now\n  `defaultMode: "default"` with a broadened allow list (`Bash(*)`, Edit, Write,\n  Read, WebFetch, WebSearch, active-work + brain MCP). Removed the dead\n  snake_case `default_mode: bypassPermissions` key.\n- **"Only when green" is now structural** \u2014 branch protection\'s required strict\n  `check` means a plain `gh pr merge --squash --delete-branch` is rejected unless\n  CI is green, independent of mode. `--admin` bypasses it \u2192 behavioral restraint\n  only (use on explicit request). Tradeoff flagged: with the classifier off,\n  `Bash(*)` is fully unguarded.\n- `autoMode.allow` merge rules kept but now only apply in plan mode\n  (`useAutoModeDuringPlan` defaults true).\n\n## AW-13 decision\nOwner chose to keep Actions perms at the house default (no auto-PR-creation), so\nthe changesets Version PR won\'t auto-create. Publish path = **local one-time\nbootstrap** (`npm login` \u2192 `pnpm build` \u2192 `npm publish`), then configure the\nnpmjs.com trusted publisher for future OIDC. Task note + handoff updated.\n\n## State for next session\n- AW-3, AW-5 **done**. main clean, 521 green.\n- Open: AW-13 (owner bootstrap publish), AW-1 (Ubuntu smoke-test \u2014 can\'t do on\n  macOS), AW-7 (read-write dashboard), AW-6 (external discovery, needs tokens).\n- Reload Claude Code (or `/config`) for the permission-mode change to fully take.',
  },
  {
    id: '151ef7a2-backlog-blitz',
    filename: '2026-07-01-1833-151ef7a2-backlog-blitz.md',
    started: '2026-07-01T18:33:01Z',
    ended: '2026-07-02T04:45:35Z',
    track: 'canonical',
    title: 'Backlog blitz \u2014 shipped 10 tasks, cleared PR backlog, prepped npm publish',
    body: '# Backlog blitz \u2014 shipped 10 tasks, cleared PR backlog, prepped npm publish\n\nA long, high-throughput session: cleared the open-PR backlog, then shipped the\nbulk of the backlog. 13 PRs merged (#34\u2013#46); main is clean, no open PRs or\nstray branches. Tests grew 440 \u2192 498.\n\n## Merged / closed this session\n- **Backlog PRs**: #34 (session.record --body-file) and #35 (channels flag) reviewed + merged.\n- **AW-16** closed \u2014 resolved by #34 (reject-both instead of the spec\'s "body-file wins"; deliberate).\n- **AW-15** (#36) \u2014 live PR/branch artifact state; dropped stale `prs[]`; v1\u2192v2 migrator logs dropped PRs to `.migrations.log` (does NOT fold into notes \u2014 deliberate divergence from done_when, flagged).\n- **AW-1** (#37) \u2014 Linux systemd user-unit supervision. Engineering LANDED but task stays OPEN pending Ubuntu 24.04 smoke-test (can\'t run on macOS). CI caught a Linux-only bug: supervision failure was aborting `setup`; fixed to degrade to a non-fatal warning.\n- **AW-9** (#38) \u2014 HOME sandbox setupFile + CI sandbox so no test can touch the real home. Key gotcha: under Vitest\'s threads pool a runtime `process.env.HOME` write does NOT reach libuv\'s `os.homedir()`; fixed by overriding `os.homedir()` to read `process.env.HOME` dynamically.\n- **AW-2** (#39) \u2014 macOS launchd supervision, mirroring AW-1. Added a `getSupervisor(platform)` dispatcher (systemd | launchd). Smoke-tested end-to-end on this Mac (launchctl loads agent \u2192 daemon serves /health \u2192 uninstall clean). NOTE: the HOME sandbox does NOT cover the per-user launchd domain, so all launchd tests inject a fake spawn and the setup E2E is pinned to a supervisor-less platform.\n- **AW-4** (#40) \u2014 `active-work doctor` health-check (node/active-root/daemon/mcp-registration/skill/supervision). Smoke test caught a false "not registered" \u2014 the check now accepts both `@hjewkes/active-work` and `active-work` mcpServers keys.\n- **AW-11** (#41) \u2014 trimmed runtime deps 23 \u2192 13 (moved react/react-dom/react-native-web to devDeps; removed @titan-design/react-ui, lucide-react, mustache, uuid, chokidar, @commander-js/extra-typings, zod-to-json-schema). Verified via `--omit=dev` tarball install.\n- **AW-14** (#43) \u2014 `gen:cli-reference` npm script.\n- **AW-12** (#44) \u2014 root-caused the "cli.test.ts flaky on first CI run" as tsx cold-start (CI ran Test before Build \u2192 pickRunner fell back to tsx). Fixed: build the CLI before the integration suite in CI so it uses dist deterministically.\n- **AW-8** (#45) \u2014 bootstrap auto-archives done tasks older than 30 days into `tasks/archive/` (preserved, out of active list); ids surfaced as a housekeeping note. Inert until tasks age.\n- **AW-10** (#46) \u2014 removed redundant `normalizeDates`/`normalizeDateFields` workarounds (readRawFrontmatter already coerces); migrated audit/_focus-helpers/worktree-set-default to `readFrontmatter`. `readRawFrontmatter` kept for lint/set/touch/task-add.\n\n## AW-13 (npm publish) \u2014 PREPPED, owner actions remain\nSwitched to **npm OIDC trusted publishing** (PR #42) instead of an NPM_TOKEN secret. `release.yml` now drops NPM_TOKEN, adds `npm install -g npm@latest` (needs npm \u2265 11.5.1), and `publishConfig.provenance` removed (automatic under trusted publishing; also unblocks local bootstrap). Artifact verified: build clean, tarball 17 files/240kB, clean `--omit=dev` install runs the CLI.\n\nOwner actions (in AW-13 notes):\n1. Bootstrap once \u2014 a trusted publisher can\'t be registered for a package that doesn\'t exist yet: `npm login` \u2192 `pnpm build` \u2192 `npm publish`.\n2. Configure trusted publisher on npmjs.com (org HJewkes, repo active-work, workflow release.yml, action `npm publish`).\n3. Enable Settings \u2192 Actions \u2192 General \u2192 "Allow GitHub Actions to create and approve pull requests" (the changesets Version PR step currently fails without it \u2014 independent of publishing).\nThen push to main \u2192 auto "Version Packages" PR \u2192 merge publishes via OIDC. Version will be 0.2.0 (three pending changesets from 0.1.0), unless a local bootstrap publishes 0.1.0 first.\n\n## Open tasks remaining\n- AW-1 (smoke-test gate), AW-13 (owner actions), and four large low-priority features: AW-3 (WebSocket broadcasts), AW-5 (aw sync), AW-6 (Linear/Jira/Slack discovery), AW-7 (read-write dashboard).\n\n## Method note\nManual review + smoke tests repeatedly caught defects that green CI alone missed: the AW-15 migration mismatch, the AW-1 Linux-only setup abort, launchd test-hygiene (real launchd domain), the doctor false-negative, and the dependency bloat.',
  },
  {
    id: '874f2d4e',
    filename: '2026-07-01-1617-874f2d4e.md',
    started: '2026-07-01T16:17:40.917Z',
    ended: '2026-07-01T16:51:35Z',
    track: 'canonical',
    title: 'Fix: channels flag swallowing the bootstrap prompt',
    body: '# Fix: channels flag swallowing the bootstrap prompt\n\nDebugged and fixed the broken "channels" support in the `aw` launcher.\n\n## Symptom\n`aw voltras-workspace` collided the channel name with the bootstrap prompt and\nfailed to start Claude Code.\n\n## Root cause\n`aw` spawned `claude --dangerously-load-development-channels <target> <prompt>`.\nThe flag is real but hidden from `--help`; its value is **variadic**\n(`<servers...>`), confirmed in the v2.1.197 binary strings. A variadic option\ngreedily consumes every following non-`-` token, so it ate the channel target\n*and the trailing prompt* as channel targets \u2014 leaving the real `[prompt]`\npositional empty and treating the prompt text as a bogus channel name.\n\nAn earlier `-p` probe appeared to "work" only because `-p` (leading `-`) halted\nthe variadic before the prompt; real interactive launches have no such stop.\n\n## Fix (branch `fix/aw-channels-prompt-collision`, commit 3ab6d4e \u2192 rebased to fcca639; PR #35)\n- Assemble argv as `[<flag> ...targets, \'--\', prompt]` \u2014 the `--` terminator\n  stops the variadic so the prompt is parsed as the positional `[prompt]`.\n- Collapse to a single variadic flag carrying all targets.\n- Extracted argv assembly into side-effect-free `src/launcher-args.ts`\n  (`buildChannelArgs`, `buildClaudeArgs`) \u2014 `aw.ts` runs `main()` on import, so\n  importing it in a test would fire the launcher.\n- Committed the previously-uncommitted channels wiring too: brief schema\n  `channelTarget` + `open` command emitting `channels`.\n\n## Verification\n- New regression test `__tests__/aw-launcher.test.ts` (7 cases, incl. the\n  `--`-terminator regression).\n- `typecheck` clean; `eslint` clean on changed files; full unit suite 420 passed.\n- `build:cli` rebuilt `dist/aw.js` (installed binary) \u2014 fix confirmed present.\n- Verified `claude ... -- "<prompt>"` honors `--` as an option terminator.\n\n## Session-record bugs \u2014 already fixed elsewhere\nWhile recording this session, `active-work session record` rejected `--body-file`\n(advertised but never wired; schema required `body`) and required an explicit\n`--track` (help claimed a `canonical` default the schema lacked). I re-derived a\nfix, then found the identical fix already existed on branch\n`fix/session-record-body-file-and-track-default` (commit 83e1fa1) with more tests\n\u2014 so I **discarded my duplicate** rather than commit it.\n\n## PR reshuffle (Approach B \u2014 drop-gate)\nDiscovered local `main` was 2 commits ahead of `origin/main`, unpushed:\n`80634b0` (aw launcher split \u2014 a real dependency of the channels fix) and\n`9cf1165` (always invoke main / drop isDirectRun gate). `9cf1165` was a\n*competing* resolution of the direct-run problem vs open PR #33\n(`fix/cli-direct-run-symlinks`, `2bcb071`, bin-shim symlink detection) \u2014 both\ntouch `src/cli.ts`; only one can land. Owner chose **Approach B (drop-gate)**.\n\nActions taken:\n- Owner pushed local `main` \u2192 `origin/main` (`b727b6b..9cf1165`). Safety\n  classifier blocks me from pushing the default branch, so this was manual.\n- **PR #35** \u2014 channels fix. Rebased off the AW-15 stack onto `main`\n  (`3ab6d4e` \u2192 `fcca639`); cherry-picked cleanly (open.ts auto-merged). Now a\n  single clean commit, no AW-15 baggage. base=main, MERGEABLE.\n- **PR #34** \u2014 session-record fix. Rebased onto `main`, dropping the superseded\n  `2bcb071` symlink commit (`83e1fa1` \u2192 `9a65e31`), force-pushed, base switched\n  from the #33 branch to `main`. Single commit, MERGEABLE. 12 session tests green.\n- **PR #33** \u2014 closed as superseded by `9cf1165` (drop-gate), with a comment.\n\n## Not done / follow-up\n- **Live smoke-test:** after #35 merges, owner should run `aw voltras-workspace`\n  \u2014 I can\'t execute `--dangerously-load-development-channels` (safety classifier).\n- **CI gate:** required status check `check` must go green on #34 and #35 before\n  merge (branch protection).\n- The AW-15 launcher commits `80634b0`/`9cf1165` are now on `main` outside of a\n  PR (pushed directly, bypassing review) \u2014 noted for the record.',
  },
  {
    id: 'aw-1-systemd-supervision-2026-05-13',
    filename: '2026-05-13-1927-aw-1-systemd-supervision-2026-05-13.md',
    started: '2026-05-13T19:27:21Z',
    ended: '2026-05-13T19:33:13Z',
    track: 'canonical',
    title: 'AW-1 \u2014 Linux systemd supervision (engineering complete)',
    body: '# AW-1 \u2014 Linux systemd supervision (engineering complete)\n\nImplemented user-level systemd supervision for the `active-work` daemon. All\nunit tests pass; Ubuntu 24.04 smoke-test is the only remaining gate before\nclosing AW-1.\n\n## What changed\n\n- **New module `src/setup/supervision-systemd.ts`** \u2014 single home for the\n  unit template, install/uninstall steps, and the `isUnitActive` probe.\n  - `renderUnit({ cliEntry, port?, nodeBin? })` emits a `Type=simple` unit\n    (`[Unit]/[Service]/[Install]`) with `Restart=on-failure`,\n    `RestartSec=5`, `WantedBy=default.target`, and `ExecStart=<node>\n    <cli> mcp serve [--port N]`. Paths with whitespace get quoted.\n  - `stepInstallSupervision` writes the unit to\n    `~/.config/systemd/user/active-work.service`, then runs\n    `systemctl --user daemon-reload` + `systemctl --user enable --now\n    active-work.service`. Idempotent: same content \u2192 `done:false /\n    refreshed`. systemctl-missing returns a soft-skip with manual\n    instructions; daemon-reload exit \u2260 0 is a hard failure.\n  - `uninstallSupervision` runs `disable --now`, removes the unit file,\n    then `daemon-reload`. Tolerates systemctl missing.\n  - `isUnitActive` probes `systemctl --user is-active --quiet`. Returns\n    false on non-Linux without spawning anything.\n\n- **Wired into `src/setup/steps.ts`**:\n  - New `stepSupervision` wraps the install with the `--yes`/confirm\n    prompt pattern other setup steps use; on non-Linux returns a\n    platform-aware skip.\n  - Inserted into `runSetup` between MCP register and daemon start.\n  - `stepStartDaemon` now first checks `isUnitActive(deps)` on Linux and\n    skips the `--detach` spawn when systemd already owns the daemon.\n  - `runUninstall` calls `uninstallSupervision` (Linux-gated) before the\n    daemon-stop step, with its own confirm prompt.\n  - `STEP_NAMES.SUPERVISION` exported alongside the other step names.\n\n- **Tests**:\n  - New `__tests__/setup/supervision-systemd.test.ts` (16 tests):\n    `renderUnit` shape + port + space-quoting, `getUnitPath`,\n    `stepInstallSupervision` darwin no-op / linux write+reload+enable /\n    idempotent refresh / systemctl-missing fallback / daemon-reload\n    failure, `uninstallSupervision` darwin no-op / absent / disable+remove,\n    `isUnitActive` non-linux / 0 / non-zero.\n  - Extended `__tests__/setup-steps.test.ts` with `stepSupervision` darwin\n    no-op + linux cancel paths, and a `stepStartDaemon` test confirming\n    it issues only the `systemctl is-active` probe (and no execPath spawn)\n    when the unit is active.\n\n- **Run shape**: full suite 448/448 pass, lint clean, typecheck clean\n  (`pnpm test`, `pnpm lint`, `pnpm typecheck`).\n\n## What\'s still gating AW-1\n\n- **Ubuntu 24.04 smoke-test of `active-work setup` end-to-end.** AW-1\'s\n  `done_when` calls for "smoke-tested on Ubuntu 24.04"; that requires a\n  Linux box and was not exercised from this macOS dev host. The unit\n  template was modelled after the standard user-unit spec but should be\n  verified with `systemd-analyze verify ~/.config/systemd/user/active-work.service`\n  on a real Ubuntu 24.04 install before closing the task.\n\n## Design notes worth remembering\n\n- The unit runs the daemon in the **foreground** (`mcp serve`, not\n  `mcp serve --detach`) because `Type=simple` expects the main process\n  to stay alive \u2014 `--detach` would immediately exit and systemd would\n  mark the service failed.\n- Decision: keep AW-2 (launchd plist for macOS) as a separate task even\n  though the install/uninstall shape is symmetric. AW-1 doesn\'t drag in\n  the plist work; the supervision module is namespaced\n  `supervision-systemd.ts` so a future `supervision-launchd.ts` slots in\n  alongside.\n- `stepStartDaemon` checking `isUnitActive` is the right seam (rather\n  than threading a flag through `runSetup`) because the question\n  "should we manually spawn?" is exactly "is the daemon already\n  managed?" \u2014 the probe answers it regardless of which step earlier\n  in the wizard installed the supervision.\n\n## Files touched\n\n- `src/setup/supervision-systemd.ts` (new)\n- `src/setup/steps.ts` (added `stepSupervision`, wired into\n  `runSetup`/`runUninstall`, taught `stepStartDaemon` about systemd)\n- `__tests__/setup/supervision-systemd.test.ts` (new)\n- `__tests__/setup-steps.test.ts` (added supervision + daemon-detection\n  describes)',
  },
  {
    id: 'adhoc-9f3c2a10',
    filename: '2026-07-12-1602-9f3c2a10-adhoc-doc-pass.md',
    started: '2026-07-12T16:02:00Z',
    ended: '2026-07-12T16:31:00Z',
    track: 'adhoc',
    title: 'Ad-hoc: README pass while AW-17 was in review',
    body: '# Ad-hoc: README pass while AW-17 was in review\n\nTightened the install section and re-linked [[setup-walkthrough]]. No task moved; AW-17 stays with its reviewer.\n\n- `active-work setup` copy now names the launchd step\n- Dropped a stale reference to #42',
  },
]

/** The reference instant the stories and tests measure ages from (2026-07-14 09:00Z). */
export const SESSION_NOW = new Date('2026-07-14T09:00:00Z').getTime()

/**
 * The real task rows behind every id the fixture sessions mention, for the
 * detail pane's tasks-touched table. A host resolves these from its task store;
 * the story does the same lookup against this list.
 */
export const SESSION_TASK_FIXTURE: TaskListItem[] = [
  {
    slug: 'active-work',
    id: 'AW-1',
    title: 'Add Linux support: systemd unit for daemon supervision',
    priority: 1,
    severity: 'medium',
    estimate: 5,
    updated: '2026-07-12',
  },
  {
    slug: 'active-work',
    id: 'AW-2',
    title: 'Add launchd plist install/uninstall to setup wizard (macOS)',
    priority: 2,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-01',
  },
  {
    slug: 'active-work',
    id: 'AW-3',
    title: 'WebSocket file-event broadcasts from daemon to dashboard',
    priority: 3,
    severity: 'low',
    estimate: 5,
    updated: '2026-07-02',
  },
  {
    slug: 'active-work',
    id: 'AW-4',
    title: 'aw doctor: health-check command (verify deps, daemon, MCP registration, skill install)',
    priority: 4,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-01',
  },
  {
    slug: 'active-work',
    id: 'AW-5',
    title: 'Multi-machine git-backed sync wrapper (aw sync)',
    priority: 5,
    severity: 'low',
    estimate: 8,
    updated: '2026-07-02',
  },
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
    id: 'AW-8',
    title: 'Auto-archive done tasks older than N days during bootstrap',
    priority: 8,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-01',
  },
  {
    slug: 'active-work',
    id: 'AW-9',
    title: "Audit tests for unsafe HOME/filesystem mocking; ensure all use vi.spyOn(os, 'homedir')",
    priority: 9,
    severity: 'high',
    estimate: 2,
    updated: '2026-07-01',
  },
  {
    slug: 'active-work',
    id: 'AW-10',
    title:
      'Clean up readRawFrontmatter workarounds in commands now that gray-matter-io coerces dates',
    priority: 10,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-01',
  },
  {
    slug: 'active-work',
    id: 'AW-11',
    title: 'Remove @titan-design/react-ui dep — dashboard agent ended up not using it',
    priority: 11,
    severity: 'low',
    estimate: 1,
    updated: '2026-07-01',
  },
  {
    slug: 'active-work',
    id: 'AW-12',
    title:
      'Investigate occasional integration-test flakes (cli.test.ts had 5 failures on first merged run, clean on retry)',
    priority: 12,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-01',
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
    id: 'AW-14',
    title:
      'Add gen:cli-reference script entry to package.json (generator script exists; just needs npm-run wiring)',
    priority: 14,
    severity: 'low',
    estimate: 1,
    updated: '2026-07-01',
  },
  {
    slug: 'active-work',
    id: 'AW-15',
    title: 'Simplify artifacts.yml: branches/stashes only; live-pull PR + branch state',
    priority: 1,
    severity: 'medium',
    estimate: 8,
    updated: '2026-07-01',
  },
  {
    slug: 'active-work',
    id: 'AW-16',
    title: 'session record --body-file passes validation when --body is omitted',
    priority: 6,
    severity: 'low',
    estimate: 1,
    tags: ['polish', 'cli'],
    updated: '2026-07-01',
  },
  {
    slug: 'active-work',
    id: 'AW-17',
    title: 'open/aw: resolve initiative from cwd when no slug given',
    priority: 15,
    severity: 'medium',
    estimate: 3,
    updated: '2026-07-12',
  },
  {
    slug: 'active-work',
    id: 'AW-18',
    title: 'worktree.set: register/update a worktree on an existing initiative',
    priority: 16,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-12',
  },
  {
    slug: 'active-work',
    id: 'AW-19',
    title: 'active-work prompt + /aw-prompt slash command for mid-session context re-seed',
    priority: 17,
    severity: 'low',
    estimate: 3,
    updated: '2026-07-12',
  },
  {
    slug: 'active-work',
    id: 'AW-20',
    title: 'aw/open --adhoc: frame bootstrap prompt as ad-hoc work, not handoff continuation',
    priority: 18,
    severity: 'low',
    estimate: 2,
    updated: '2026-07-12',
  },
]
