# Titan Design System

Cross-platform React + React Native design system built on Gluestack UI, NativeWind v4, and Tailwind CSS.

## Quick Reference

- **Package**: `@titan-design/react-ui` (in `packages/ui/`); pnpm (v9.15.0) workspaces + Turborepo
- **Build**: `pnpm build` (tsup, ESM + CJS + DTS to `dist/`). **Lint**: `pnpm lint`
- **Test**: `pnpm test` (Vitest + Testing Library + jest-axe, jsdom). In `packages/ui` it watches; for one
  run use `pnpm exec vitest run --project threads [path]` there, or `pnpm test -- -- --run` from the root
  (second `--` passes through Turbo). `pnpm test:unit` skips `stories-axe`; `pnpm test:axe` runs only it;
  `pnpm test:storybook` runs play functions in headless Chromium. Bare `vitest` also starts the browser project.
- **Storybook**: `pnpm storybook` (Storybook 10, port 6006 locked)

## Hard constraints

- **Storybook ports**: `storybook dev` silently moves off a busy port, so screenshots can come from another
  worktree's server. Verify provenance by something unique to your tree, never by story IDs. Stop only
  servers you started, by PID; never `pkill -f storybook` / `killall node`. Use `pnpm storybook:isolated`
  beside other sessions. Details: `docs/storybook-ports.md`.
- **Cross-platform**: React Native primitives only (`View`, `Text`, `Pressable`, `TextInput`, `Image`,
  `ScrollView`), never `div`/`span`/`button`/`input`/`img`.
- **Styling**: Tailwind via `className` + `cn()` from `@/utils/cn`; semantic token classes, not raw
  colours; no inline styles except dynamic values. Tailwind is **v3**. Never add a colour, hue or primitive
  inline; raise it with the owner.
- **Dark mode** is default (`:root`), light via `.light`; declare both explicitly.
- **Props**: `isDisabled`/`isLoading`/`isSelected`, `onPress` (not `onClick`), `variant`, `size`, `color`.
- **A11y**: WCAG 2.1 AA; every component test file includes a jest-axe test.
- **One `Default` story** per component, driven by `args`/`argTypes`; Storybook needs
  `jsxImportSource: 'nativewind'`.
- **Releases** publish from CI on a `v*` tag; never `npm publish` locally.
- **Tier imports**: a lower tier never imports a higher one (`titan/no-upward-tier-import`).
- **Token edits**: never run prettier over a whole token file; edit `semantic.ts` additively.
- **Exports/barrels**: after changing an export run `pnpm --filter @titan-design/react-ui api:update`; after
  a barrel exports a new component run `pnpm arch:graph -- --add <file>` then `pnpm catalog`; never
  `arch-graph.mjs --reindex` in a feature PR.

## Moved to docs (read when the task touches it)

- Storybook port policy, reap scopes, PID rules → `docs/storybook-ports.md`
- Architecture (cross-platform table, styling, dark mode, compound components) → `docs/component-development.md`
- Component file structure, placement tiers and decision table, slots, props table, accessibility, state
  coverage, testing pattern, Storybook pattern → `docs/component-development.md`
- Design tokens (two tiers, categories, adding tokens, spacing/sizing tokens, elevation) → `docs/design-tokens.md`
- CI jobs, argument passthrough, registering scripts, coverage, API reports, bundle budget → `docs/ci-and-scripts.md`
- Key files, exports, gotchas → `docs/package-reference.md`
