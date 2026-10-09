# Test layers

Each layer answers one question and runs in one CI step. Put a test in the cheapest layer that can
fail for the reason you care about.

| Layer              | Question it answers                                                                                                                          | File pattern                                                    | Runs in                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Unit and component | Does the component render and behave, with no axe violation?                                                                                 | `packages/ui/src/**/*.test.{ts,tsx}`                            | `build` job, `pnpm verify:unit` (`pnpm test:unit:ci`)                                                    |
| Stories axe        | Does every composed story pass axe, or match its shrinking baseline?                                                                         | `packages/ui/src/test/stories-axe{,.*}.test.tsx`                | `check` job, `pnpm test:axe` (path-gated)                                                                |
| Property (logic)   | Does a pure function hold its invariant for any input?                                                                                       | `*Math.test.ts`, `*-model.test.ts`, hook tests using `fcAssert` | same Vitest run                                                                                          |
| Scale              | Does a windowed component mount a bounded number of nodes?                                                                                   | `*.test.tsx` calling `expectBoundedMount`                       | same Vitest run                                                                                          |
| Source guards      | Does the source obey a lint-like rule (raw colour, raw spacing, tier imports)?                                                               | `packages/ui/src/test/no-*.test.ts`                             | same Vitest run                                                                                          |
| Arch graph         | Is `src/arch/arch-graph.json` fresh?                                                                                                         | `src/arch/arch-graph.freshness.test.ts`                         | `pnpm arch:check`, inside `pnpm verify:unit`                                                             |
| Package shape      | Do the export map and packed tarball resolve for ESM and CJS?                                                                                | `packages/ui/scripts/check-package.sh`                          | `build` job, "Package shape" step                                                                        |
| Visual, layer 1    | Do specimen components match their screenshot baselines?                                                                                     | `packages/ui/specimen/baseline/**/*-chromium-linux.png`         | `visual` job, `test:visual:baseline`                                                                     |
| Visual, layer 2    | Do Storybook stories match their screenshot baselines?                                                                                       | `packages/ui/tests/visual/stories.spec.ts`                      | `visual` job, `test:visual:stories`                                                                      |
| Visual, layer 3    | Does the React render match the HTML specimen's computed styles?                                                                             | `packages/ui/specimen/comparison.visual.test.ts`                | `visual` job, `test:visual:compare`                                                                      |
| Story contrast     | Does every story, dark and light, pass axe `color-contrast` in Chromium, or match its shrinking baseline (`contrast-stories-baseline.json`)? | `packages/ui/tests/visual/contrast.spec.ts`                     | `contrast` job (three shards), `test:visual:contrast` (path-gated); `pnpm contrast:baseline` regenerates |
| Interaction        | Does keyboard and pointer behaviour work in a real browser?                                                                                  | `packages/ui/tests/interaction/*.spec.ts`                       | `visual` job, `interaction` project of `playwright.config.ts`                                            |
| Storybook play     | Does every `play`-tagged story's play function pass? Not an a11y gate (see below).                                                           | `packages/ui/src/**/*.stories.tsx` tagged `play`                | `check` job, "Storybook play functions" step, `pnpm test:storybook` (path-gated)                         |
| Offline fonts      | Does a single-file consumer load every font face with no network?                                                                            | `packages/ui/tests/offline-fonts/*.spec.ts`                     | `visual` job, `test:offline-fonts`                                                                       |
| Dependency audit   | Does the lockfile carry a known advisory?                                                                                                    | `scripts/audit-retry.sh`                                        | `check` job, "Audit" step                                                                                |

The `check` job first fails unless `build`, `visual` and `contrast` passed, then runs audit, stories
axe and the Storybook play functions. On a pull request, `packages/ui/scripts/visual-paths.mjs` skips
stories axe, play, the `visual` layers and the `contrast` shards when no changed path is rendered UI. Layer-1 baselines exist only as
`*-chromium-linux.png`, so run the visual layers only in the pinned Playwright container.

To run the interaction project locally, use
`pnpm --filter @titan-design/react-ui exec playwright test --project=interaction`.
`test:visual` and `test:visual:update` run only the `chromium` visual project.

## Accessibility gates

Two gates cover accessibility, and they are the permanent ones:

| Gate           | What it checks                                                                                                                                 | Command                                                     | CI                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| jest-axe       | Every axe rule jsdom can decide (names, roles, labels, ARIA), per component test and per composed story against `stories-axe-baseline.json`.   | `pnpm test:unit:ci`, `pnpm test:axe`                        | `build` job ("Verify"), `check` job ("Stories axe") |
| Story contrast | axe `color-contrast` in real Chromium on every story in both themes, against `contrast-stories-baseline.json`. jsdom has no layout to measure. | `pnpm --filter @titan-design/react-ui test:visual:contrast` | `contrast` job, shards `contrast 1/3` to `3/3`      |

The Storybook Vitest addon's a11y test in the `storybook` Vitest project is a deliberate no-go
(TD-94). `.storybook/vitest.setup.ts` sets `a11y: { test: 'off' }`, and it stays off, for two
reasons:

- **jest-axe is the rules gate** (VW-481 Q2). The browser project only runs play functions; a second
  axe pass over the same stories would need a second baseline kept in step with stories axe.
- **The project renders without NativeWind classes.** A play story that renders
  `<View className="bg-surface-elevated p-4" />` in the `storybook` project gets
  `class="css-view-175oi2r"`, a transparent background and `0px` padding; real Storybook paints the
  token. Colour contrast measured there would measure unstyled pixels. The story contrast gate runs
  against built Storybook, where the classes apply.

Until that gap is fixed, a play function in the `storybook` project cannot prove anything that
depends on a class (colour, spacing, state styling).

## Logic in pure hooks so Stryker can reach it

Mutation testing (planned) mutates `src/utils/**/*.ts`, `src/hooks/**/*.ts`, `**/*Math.ts` and
`**/*-model.ts`, and skips `.tsx`. Logic that lives inside a component body is out of reach. Put the
decision in a pure function or a hook, keep the `.tsx` a thin binding, and test the logic with
properties.

## Shared helpers

Both live in `packages/ui/src/test/`.

### `fcAssert` (`property.ts`)

Use it in place of `fc.assert`. It applies one run config to every property test.

- `FC_NUM_RUNS` sets the run count. The default is 100. Set it only to an integer of 1 or more.
- `FC_SEED` pins the seed to any 32-bit integer. It applies to every property in the run, so use it
  with a path filter to replay one failing file.
- Unset means the default. Any other value must be a canonical integer, or `fcAssert` throws naming
  the variable. `0`, negatives, blank, whitespace, `1.5`, `abc` and `1e3` are all rejected, so the
  environment can make a check stricter but never vacuous.
- A failure ends with `Replay with FC_SEED=<seed>`. Set it and rerun to get the same counterexample.
- A per-call `fc.Parameters` argument overrides both.

Worked example: `src/components/ui/carousel/carouselMath.test.ts`.

```sh
FC_SEED=542894212 pnpm exec vitest run src/components/ui/carousel/carouselMath.test.ts
```

### `expectBoundedMount` (`scale.tsx`)

```tsx
expectBoundedMount({
  render: () => <Feed items={items} />,
  selector: '[data-testid="row"]',
  max: 40,
});
```

It renders, counts nodes matching `selector`, and fails above `max`. It never measures time, so it
does not flake. It throws on a `max` that is negative or not finite. It also fails when the selector matches nothing, since a bound on zero nodes proves
nothing. Feed it a list large enough that an unwindowed render would blow the bound (1,000 items
against a bound of a few dozen). `src/test/scale.test.tsx` proves the helper on a synthetic list.
No windowed component is on `main` yet.
