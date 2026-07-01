# Component Implementation Checklist (TD-06 Pipeline)

The per-component "done" gate for the HTML-to-React extraction pipeline. Walk
this list once per component (or per component in a batch) before considering
it complete. Every box must be checked and every gate green.

This checklist is the **definition of done**; it does not restate _how_ to
implement. For the implementation prompt and its DO/DO NOT rules use the agent
prompt template, `docs/agent-prompts/component-implementation.md` (TD-06.03).
For the sign-off/design-freeze process that follows a green checklist, see the
design-freeze workflow (TD-06.04).

Unless noted, run commands from `packages/ui/` (the scripts live in that
package). From the repo root, the same targets run through Turborepo:
`pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, `pnpm build-storybook`.

Component files follow the convention in `CLAUDE.md` → _Component Development_:

```
src/components/{ui|custom}/{ComponentName}/
  ComponentName.tsx          # implementation (React Native primitives)
  ComponentName.test.tsx     # Vitest + jest-axe + computed-style assertions
  ComponentName.stories.tsx  # Storybook stories
  index.ts                   # barrel export
```

---

## 1. CSS property manifest — extracted + validated (TD-06.01 / TD-06.02)

- [ ] A manifest exists for the component under
      `packages/ui/src/theme/manifest/`, or is generated from the frozen HTML
      prototype:
      `pnpm extract-css <html> <selector> <ComponentName> --out src/theme/manifest/<component>.json`
      (wraps `node scripts/extract-css-properties.mjs`; repeat `--variant axis=value`
      per variant axis).
- [ ] The manifest is **schema-valid**: it conforms to
      `src/theme/manifest/css-property-manifest.schema.json` and passes
      `validateCssPropertyManifest` (see `css-property-manifest.validate.ts`).
      `pnpm test` exercises the manifest suite
      (`css-property-manifest.test.ts`); a fresh manifest with
      `errors.length === 0` is the pass condition.
- [ ] Every `resolvedValue` is a literal `getComputedStyle` value (exact px /
      hex / rgb / font-family), and each tokenized property carries its
      `token` + `cssVariable` (annotated after extraction; extraction emits
      `token: null`).

## 2. React component renders

- [ ] Component built with React Native primitives (`View`, `Text`,
      `Pressable`, …) styled via NativeWind — never raw `div`/`span`/`button`
      (see the cross-platform table in `CLAUDE.md`).
- [ ] Every manifest property is styled from its semantic **token**
      (`src/theme/tokens/semantic.ts` → `src/theme/global.css`), falling back
      to a literal only where the manifest has `token: null`.
- [ ] No bare `border` class (defaults to 1px black on web). Verify with
      `pnpm lint:borders` (`scripts/check-border-classes.sh`).
- [ ] Barrel `index.ts` exports the component and its public types.

## 3. Layer 1 — specimen entry (HTML ground truth + React)

- [ ] A `ComparisonPair` for each variant is added to
      `packages/ui/specimen/comparison.tsx`, with a stable `testId`
      (`compare-<component>-<variant>`), the verbatim `htmlContent` ground
      truth, and the React component rendered beside it.
- [ ] The pair renders in the specimen dev server: `pnpm specimen:compare`
      (opens `/comparison.html`).

## 4. Layer 2 — computed-style assertions (unit test)

- [ ] `ComponentName.test.tsx` asserts the component's own computed/inline
      styles against the manifest's `resolvedValue`s for the pinned
      properties (e.g. border style/width, box-shadow, colors — as in
      `src/components/custom/Workout/StatusDot.test.tsx`).
- [ ] Rendering, props, and each variant are covered (Arrange-Act-Assert).

## 5. Layer 3 — HTML vs React parity test

- [ ] A parity test per variant is added to
      `packages/ui/specimen/comparison.visual.test.ts`, calling
      `assertStyleMatch(page, '<testId>', '<htmlSelector>', '<reactSelector>')`
      so both columns' `getComputedStyle` values are compared for the tracked
      `STYLE_PROPS`.
- [ ] Parity passes with zero mismatches: `pnpm test:visual:compare`
      (Playwright, `playwright.comparison.config.ts`; boots the specimen
      server automatically).

## 6. Storybook story — all variants

- [ ] `ComponentName.stories.tsx` uses `Meta`/`StoryObj` from
      `@storybook/react-vite`, `tags: ['autodocs']`, and `argTypes` controls
      for every prop.
- [ ] One named story per variant **plus** an `AllVariants` story covering the
      full matrix (see `StatusDot.stories.tsx`).
- [ ] Storybook compiles: `pnpm build-storybook`.

## 7. Accessibility

- [ ] Component sets `accessibilityRole` / `accessibilityLabel` /
      `accessibilityState` as applicable.
- [ ] The test file includes a `jest-axe` check with
      `toHaveNoViolations()` (required for every component per `CLAUDE.md`).

## 8. Quality gates — all green, zero new warnings

- [ ] `pnpm lint` (ESLint) clean, including `pnpm lint:borders`.
- [ ] `pnpm type-check` (`tsc --noEmit`) clean.
- [ ] `pnpm format:check` (Prettier) clean on touched files.
- [ ] `pnpm test` — all Vitest suites pass (Layer 2 + manifest + a11y).
- [ ] `pnpm test:visual:compare` — Layer 3 parity passes.
- [ ] `pnpm build` succeeds (tsup ESM + CJS + DTS).
- [ ] `pnpm build-storybook` compiles.

A component is **done** only when sections 1–8 are fully checked. Any red gate
or unchecked box means not done.
