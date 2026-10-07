# CI and scripts

Reference for what CI runs and how root scripts reach it. Source of truth: `.github/workflows/ci.yml`,
root `package.json`, `turbo.json`, `packages/ui/package.json`, `packages/ui/vitest.config.ts`,
`packages/ui/.size-limit.json`.

## CI jobs

`ci.yml` runs on every pull request and on pushes to `main`.

| Job              | Runs on                                  | What it runs                                                        |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| `build`          | Node 22 (single-entry matrix)            | Install, then the steps below                                       |
| `visual`         | Playwright container, Node 22            | Layer 3 parity, offline fonts, Layer 1 and 2 baselines, interaction |
| `storybook-play` | Playwright container, Node 22            | `pnpm test:storybook` (play functions in the `storybook` project)   |
| `stories-axe`    | Node 22                                  | `pnpm test:axe` (axe on every story under jsdom)                    |
| `audit`          | Node 22, no install                      | `scripts/audit-retry.sh` (`pnpm audit --audit-level=critical`)      |
| `check`          | Always runs; needs all of the jobs above | `HJewkes/ci/actions/all-green`; fails if any needed job failed      |

### `build` steps

| Step          | Command                                                    | Notes                                                                                                                                   |
| ------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Verify        | `pnpm verify:unit`                                         | See below                                                                                                                               |
| Release bump  | `node packages/ui/scripts/check-release-bump.mjs --base …` | Pull requests only. A version change must bump at least as far as the API report diff requires; skips when the version matches the base |
| Package shape | `pnpm check:package`                                       | publint `--strict` plus attw on the packed tarball                                                                                      |
| Bundle budget | `pnpm --filter @titan-design/react-ui size`                | Reads the `dist/` that Verify built                                                                                                     |
| Import cycles | `pnpm --filter @titan-design/react-ui check:cycles`        |                                                                                                                                         |

`verify:unit` (root `package.json`) runs in order: `format:check`, `lint`, `type-check`, `build`,
`api:check`, `docs:check`, `type-check:examples`, `turbo run test:unit -- --run --coverage`, `arch:check`.
`pnpm verify` is `verify:unit` plus `test:axe`.

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

| Script             | Calls                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| `catalog`          | `pnpm --filter @titan-design/react-ui catalog`                            |
| `arch:check`       | `pnpm --filter @titan-design/react-ui exec vitest run …freshness.test.ts` |
| `verify`           | `pnpm verify:unit && pnpm test:axe`                                       |
| `verify:unit`      | A chain of `pnpm` scripts and one direct `turbo run test:unit`            |
| `arch:graph`       | `node scripts/arch-graph.mjs`                                             |
| `arch:barrel-hash` | `node packages/ui/scripts/barrel-hash.mjs --write`                        |
| `review`           | `node packages/review-harness/src/cli.ts`                                 |
| `audit:stories`    | `node packages/ui/scripts/audit-stories.mjs`                              |

`arch:barrel-hash` is the fix the `arch:check` freshness test asks for after a component barrel
changes. It rewrites only `componentBarrelHash` in `packages/ui/src/arch/arch-graph.json`.

CI runs `arch:check` (inside `verify:unit`). It does not run `catalog`, `arch:graph`, `arch:barrel-hash`,
`review` or `audit:stories`. `size` and `check:cycles` have no root script or Turbo task; CI calls them with
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
