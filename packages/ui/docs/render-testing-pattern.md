# Render tests and the visual-baseline layers

What a render test proves in this library, what it doesn't, and when to reach for one of
the three visual layers instead.

## What a render test is

Every component ships a `Component.test.tsx` next to it — 149 of them today, one per
component, each importing `render`/`screen` from `@testing-library/react`
(`grep -l "from '@testing-library/react'" src -r --include="*.test.tsx" | wc -l`). A
render test mounts the component with React Testing Library and asserts against the DOM
it produces: text is present, a role exists, a prop toggles an attribute, `jest-axe`
finds no violations. `src/components/ui/button/Button.test.tsx` is the reference shape —
mount variants, fire events, assert on `screen`, then an `accessibility` block running
`axe(container)`.

Coverage thresholds are enforced by Vitest, scoped to components only
(`vitest.config.ts:26-31`):

```ts
coverage: {
  include: ['src/components/**/*.{ts,tsx}'],
  exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx', 'src/**/index.ts'],
  thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
}
```

## What it does NOT prove

**A render test that asserts a component mounts and toggles does not prove it renders
correctly.** Testing Library's queries only see whatever the test environment's DOM
diffing actually produced — and that instrumentation can miss a real defect even when a
component is visibly broken. VW-100's fix for `AdvancedAccordion` hit this directly: a
deliberately-broken control produced **zero warnings** under the (React Native) jest-expo
harness, because the strict-mode instrumentation needed a real React fiber render pass
that harness wasn't doing. The render test only proved the component mounted and
toggled — not that it looked right. Titan's own render tests use a real browser DOM via
jsdom + RTL rather than jest-expo, which is a stronger environment, but the underlying
limit is the same: **DOM assertions do not check pixels.** Nothing in this suite is
visual proof. That's what the three layers below are for. Don't read a green render
suite, or green coverage numbers, as evidence a component looks correct — only that its
DOM/behavior contract holds.

## The three visual layers, and when to reach for each

Titan runs `@playwright/test` `^1.58.2` (`packages/ui/package.json`) against four
configs. Three are wired into `.github/workflows/visual.yml`; the fourth is a local-only
dev harness (see below).

| Layer                              | Config                               | Script                 | What it actually checks                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — component screenshot baselines | `playwright.baseline.config.ts`      | `test:visual:baseline` | Boots the specimen dev server (`pnpm specimen`, port 5200) and runs `specimen/baseline/**/*.screenshot.test.ts` against committed `*-chromium-linux.png` baselines, `maxDiffPixelRatio: 0.01`. 68 baselines exist today, generated from the pinned `mcr.microsoft.com/playwright:v1.58.2-noble` container so they're byte-comparable to CI.                                                          |
| 2 — Storybook story baselines      | `playwright.config.ts` (the default) | `test:visual:stories`  | Boots Storybook (`pnpm storybook --ci`, port 6006) and runs `tests/visual/stories.spec.ts`, which enumerates `index.json` and screenshots every story matching `SCOPE = /^(shell-\|icons-\|icons--)/` — today that's the shell family plus the icon primitive, not the whole library. The clock is frozen and CSS animations disabled so control-driven/animated stories snapshot deterministically. |
| 3 — HTML-vs-React parity           | `playwright.comparison.config.ts`    | `test:visual:compare`  | Boots the specimen dev server and runs `specimen/**/*.visual.test.ts`: a computed-style comparison between a hand-written HTML reference and the React/NativeWind render of the same component, to catch NativeWind/RNW output drifting from the intended CSS.                                                                                                                                       |
| — token-resolution harness         | `playwright.tokens.config.ts`        | `test:visual:tokens`   | Runs `specimen/token-resolution.spec.ts` against the specimen server. Not referenced anywhere in `.github/workflows/`, so it is a **local-only dev tool** — it does not gate anything today.                                                                                                                                                                                                         |

Two files under `tests/visual/` — `visual.spec.ts` (a bare "storybook loads" smoke check)
and `validation.spec.ts` (ad hoc, assertion-free screenshot capture to
`tests/visual/validation/`) — exist but aren't targeted by any `package.json` script or
CI step. They're leftover/manual tooling, not part of the gated pattern; don't treat them
as covering anything.

**When to reach for which:** a render test for behavior/a11y on every component, always.
Layer 3 when you're worried NativeWind's web output has drifted from what the class names
should compute to. Layer 1 when you want a pixel-exact regression gate on a specific
component in isolation. Layer 2 when the thing you're worried about only shows up in a
real Storybook story (composition, controls, live/animated state) rather than the
specimen harness.

## Do the visual layers actually run on pull requests?

**Partially.** `.github/workflows/visual.yml` triggers on `push`/`pull_request` to
`main`, and Layers 1 and 3 run their real gating scripts (`test:visual:baseline`,
`test:visual:compare`) — a pixel or computed-style mismatch fails the PR. **Layer 2 does
not currently gate anything**: the CI step runs `test:visual:stories:update` (the
`--update-snapshots` seed variant), not the gate, because baselines for it aren't
committed yet — the workflow's own comment calls this out as a bootstrap step and
documents the two-line change (commit the seeded PNGs, swap the script to
`test:visual:stories`) that would turn it into a real gate. Until that happens, a story
visual regression in the shell/icons scope will not fail your PR.

## Where a new component's test goes, and its minimal shape

`Component.test.tsx` sits beside `Component.tsx` in `src/components/ui/<name>/` (or
`custom/<Family>/`), per the file-structure convention in the repo's `CLAUDE.md`.
Minimal shape, following `Button.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Component } from './Component'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />)
    // assert on screen.getBy...
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Component />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

A new component does not automatically get a Layer 1/2/3 visual test — those are opted
into per-component (Layer 1) or per-story-scope (Layer 2), and per hand-written reference
(Layer 3). Nothing in the current config auto-enrolls a new component into any of them.

## How the visual baselines are updated, and what a moved baseline means in review

- **Layer 1** (`test:visual:baseline:update`) regenerates `*-chromium-linux.png` under
  `specimen/baseline/**/*.screenshot.test.ts-snapshots/`. `visual.yml` always runs this
  step (`if: always()`) in the same pinned container as the gate and uploads the result
  as the `component-visual-baselines` artifact, so a genuinely-changed component's
  baseline comes back different while every unchanged one is byte-identical — no local
  rendering noise. Refreshing means: download that artifact, commit the changed PNGs.
- **Layer 2** (`test:visual:stories:update`) regenerates
  `tests/visual/reference/stories.spec.ts-snapshots/` the same way, uploaded as
  `storybook-visual-baselines`; per the previous section this currently runs
  unconditionally (it's the seed step, not a gate).
- **Layer 3** has no baseline images to move — it's a computed-style comparison, not a
  screenshot diff.

**A moved baseline in review is a rendering change, not a rubber stamp.** Because Layer 1
baselines are only ever regenerated in the pinned container, a diff limited to the
changed component's PNG(s) is a real signal that its markup or styles moved — reviewers
should ask what changed and why, the same as any other diff, rather than treating "CI
regenerated it" as self-justifying.
