# CI and scripts

Reference for what CI runs and how root scripts reach it. Source of truth: `.github/workflows/ci.yml`,
root `package.json`, `turbo.json`, `packages/ui/package.json`, `packages/ui/vitest.config.ts`,
`packages/ui/.size-limit.json`.

## CI jobs

`ci.yml` runs on every pull request and on pushes to `main`.

| Job        | Runs on                                                                                 | What it runs                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`    | Node 22 (single-entry matrix)                                                           | Install, then the steps below                                                                                                                             |
| `visual`   | Playwright container, Node 22                                                           | Layer 3 parity, offline fonts, Layer 1 and 2 baselines, interaction                                                                                       |
| `contrast` | Playwright container, Node 22; three `contrast-shard` jobs plus an all-green aggregator | axe `color-contrast` on every story in both themes (`test:visual:contrast --shard=i/3`), path-gated; each shard uploads `contrast-report-<i>` (see below) |
| `check`    | Playwright container, Node 22; always runs; needs `build` and `visual`                  | all-green over `needs`, then audit, stories axe and play functions (see below)                                                                            |

### `build` steps

| Step          | Command                                                    | Notes                                                                                                                                   |
| ------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Verify        | `pnpm verify:unit`                                         | See below                                                                                                                               |
| Release bump  | `node packages/ui/scripts/check-release-bump.mjs --base …` | Pull requests only. A version change must bump at least as far as the API report diff requires; skips when the version matches the base |
| Package shape | `pnpm check:package`                                       | publint `--strict` plus attw on the packed tarball                                                                                      |
| Bundle budget | `pnpm --filter @titan-design/react-ui size`                | Reads the `dist/` that Verify built                                                                                                     |
| Import cycles | `pnpm --filter @titan-design/react-ui check:cycles`        |                                                                                                                                         |

`verify:unit` (root `package.json`) runs in order: `format:check`, `lint`, `type-check`, `build`,
`api:check`, `docs:check`, `type-check:examples`, `test:unit:ci`, `arch:check`.
`pnpm verify` is `verify:unit` plus `test:axe`.

### Turbo cache

A pull request restores `.turbo/cache` from the newest entry a push to `main` saved for the same
lockfile and Node version, so a task whose inputs match replays instead of running. Only a push to
`main` saves, and it never restores, so every merged tree runs in full. A replay is as strong as a run
only while turbo hashes every file a task reads: a task that reads files outside its package lists
them in `inputs` with `$TURBO_ROOT$` (as `test:unit` and `test:unit:ci` do in `turbo.json`).

### `visual` steps

| Step                         | Script (package `@titan-design/react-ui`) |
| ---------------------------- | ----------------------------------------- |
| Layer 3 HTML vs React parity | `test:visual:compare`                     |
| Offline fonts                | `test:offline-fonts`                      |
| Layer 1 component baselines  | `test:visual:baseline`                    |
| Layer 2 story baselines      | `test:visual:stories`                     |
| Interaction                  | `playwright test --project=interaction`   |

On failure the job regenerates the Layer 1 and Layer 2 baselines and uploads them as the
`component-visual-baselines` and `storybook-visual-baselines` artifacts, plus
`layer2-failure-results` and `playwright-failure-diagnostics`. Refresh committed `*-chromium-linux.png`
baselines from those artifacts. See `docs/test-layers.md`.

### `contrast` job

`contrast-shard` runs `packages/ui/tests/visual/contrast.spec.ts` through `playwright.contrast.config.ts`
in three Playwright shards, each on its own static Storybook build: one test per story and theme, axe
`color-contrast` in Chromium, compared with `packages/ui/tests/visual/contrast-stories-baseline.json`.
The baseline may only shrink: a pair or count above it fails, and a pair or count that no longer
occurs fails as stale. `contrast` is the all-green aggregator over the shards, so a ruleset can require
it by that one name. It is path-gated like `visual`.

Each shard uploads its report (`contrast-report-<i>`, one JSON line per story-theme) whether it
passed or failed. Local Chromium can disagree with the container's, so regenerate the committed
baseline from those artifacts: download the three files and run
`node packages/ui/scripts/update-contrast-stories-baseline.mjs <files> --allow-increase`.
`pnpm contrast:baseline` with no files runs the suite locally first. Without `--allow-increase` the
script refuses to add an entry or raise a count.

### `check` steps

The ruleset requires `check`. Its first step fails the job when `build` or `visual` failed, was
cancelled or is missing from `needs`, and every later step then skips.

| Step                 | Command                                     | Notes                                  |
| -------------------- | ------------------------------------------- | -------------------------------------- |
| all-green            | `HJewkes/ci/actions/all-green`              | Over `needs`                           |
| Rendered UI changed? | `node packages/ui/scripts/visual-paths.mjs` | Pull requests only                     |
| Audit                | `scripts/audit-retry.sh`                    | Always; reads the lockfile, no install |
| Stories axe          | `pnpm test:axe`                             | Skipped when the classifier says no    |
| Storybook play       | `pnpm test:storybook`                       | Skipped when the classifier says no    |

### Path gate

On a pull request, `visual` and `check` each run `packages/ui/scripts/visual-paths.mjs`. When none of
the PR's changed paths matches `RENDERED_UI_PATTERNS`, `visual` skips its layers and `check` skips
stories axe and play; both still report green. If the changed paths cannot be listed, everything runs.
A push to `main` always runs everything. A new input to any gated step needs a pattern there.

## Argument passthrough

Root scripts are `turbo run <task>`. Arguments need a second `--`: the first is consumed by pnpm, the
second by Turbo.

```sh
pnpm test -- -- --run --coverage
```

## Registering a script

| Step | File                                                          |
| ---- | ------------------------------------------------------------- |
| 1    | Add the script to the package's `package.json`                |
| 2    | Add `"<task>": "turbo run <task>"` to the root `package.json` |
| 3    | Add a `<task>` entry under `tasks` in `turbo.json`            |

A root `turbo run <task>` script without a `turbo.json` task fails. `packages/ui/src/arch/turbo-tasks.test.ts`
catches it in `pnpm test`: it fails for every task a root script runs through `turbo run` that `turbo.json`
does not declare.

### Root scripts that bypass Turbo

| Script              | Calls                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `catalog`           | `pnpm --filter @titan-design/react-ui catalog`                                             |
| `arch:check`        | `pnpm --filter @titan-design/react-ui exec vitest run …freshness.test.ts`                  |
| `verify`            | `pnpm verify:unit && pnpm test:axe`                                                        |
| `verify:unit`       | A chain of `pnpm` scripts; `test:unit:ci` is the root `turbo run test:unit:ci` passthrough |
| `arch:graph`        | `node scripts/arch-graph.mjs`                                                              |
| `arch:barrel-hash`  | `node packages/ui/scripts/barrel-hash.mjs --write`                                         |
| `review`            | `node packages/review-harness/src/cli.ts`                                                  |
| `audit:stories`     | `node packages/ui/scripts/audit-stories.mjs`                                               |
| `contrast:baseline` | `pnpm --filter @titan-design/react-ui test:visual:contrast:update`                         |

`arch:barrel-hash` is the fix the `arch:check` freshness test asks for after a component barrel
changes. It rewrites only `componentBarrelHash` in `packages/ui/src/arch/arch-graph.json`.

CI runs `arch:check` (inside `verify:unit`). It does not run `catalog`, `arch:graph`, `arch:barrel-hash`,
`review`, `audit:stories` or `contrast:baseline`. `size` and `check:cycles` have no root script or Turbo task; CI calls them with
`pnpm --filter`.

## Coverage thresholds

Set in `packages/ui/vitest.config.ts` under `coverage.thresholds`: 80% statements, branches, functions
and lines, over `src/components/**` (stories, tests and `index.ts` excluded). Set a threshold from measured
coverage (`pnpm exec vitest run --coverage` in `packages/ui`), not from a target, and raise it as coverage
grows.

## Bundle budget

`pnpm --filter @titan-design/react-ui size` runs `size-limit` against `packages/ui/.size-limit.json`,
after a build. Each entry is a brotli size limit for one built file: the ESM entries `index`, `bodymap`,
`pages`, `theme`, `theme/tokens`, `theme/tokens-css`, and `tokens.css`.

| Rule                                                                  |
| --------------------------------------------------------------------- |
| A limit is the measured size plus 5%, rounded up to the next whole kB |
| A PR that shrinks an entry by more than 10% lowers its limit          |
| A PR that raises a limit states why in its body                       |
