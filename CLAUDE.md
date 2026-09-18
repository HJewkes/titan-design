# Titan Design System

Cross-platform React + React Native design system built on Gluestack UI, NativeWind v4, and Tailwind CSS.

## Quick Reference

- **Package**: `@titan-design/react-ui` (in `packages/ui/`)
- **Monorepo**: pnpm workspaces + Turborepo
- **Node**: Use `pnpm` (v9.15.0) for all package management
- **Build**: `pnpm build` (tsup, outputs ESM + CJS + DTS to `dist/`)
- **Test**: `pnpm test` (Vitest + Testing Library + jest-axe). Inside `packages/ui` the script is
  bare `vitest`, which watches; for one run use `pnpm exec vitest run [path]` there, or
  `pnpm test -- -- --run` from the root (see _CI and scripts_)
- **Storybook**: `pnpm storybook` (Storybook 10, locked to port 6006 — see below)
- **Lint**: `pnpm lint` (ESLint 9)

### Storybook ports — read this before screenshotting anything

`storybook dev` **auto-increments off a busy port**. A launch on a port you believed was
free silently lands on a _different worktree's_ server, and every screenshot taken
afterwards is plausible and wrong. This has already invalidated a VW-85 evidence set, and
verifying `index.json` does not catch it — `importPath` is relative and identical across
worktrees.

Port 6006 is **locked**. `pnpm storybook` runs a launcher that owns the policy:

| command                   | behaviour                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `pnpm storybook`          | Locked port. Reuses ours; **kills a foreign server squatting 6006**; refuses if a non-Storybook holds it. |
| `pnpm storybook:isolated` | A private port from 6100–6199. Use when you _expect_ to run beside another instance.                      |
| `pnpm storybook:ports`    | Inventory only — every server, categorised, with the flag that would clear it.                            |
| `pnpm storybook:reap`     | Kill **orphans** (the default scope), then re-list.                                                       |
| `pnpm storybook:reap:all` | Kill orphans + foreign + dupes.                                                                           |
| `--restart`               | Replace our own server on the locked port.                                                                |

`pnpm storybook:ports` categorises every server, and the categories **are** the reap
scopes — so the inventory doubles as a menu of what each option would kill:

| category  | meaning                               | cleared by         |
| --------- | ------------------------------------- | ------------------ |
| `locked`  | ours, on 6006                         | `--restart`        |
| `orphan`  | its worktree no longer exists on disk | `--reap` (default) |
| `foreign` | a live server rooted in another tree  | `--reap=foreign`   |
| `dupe`    | ours, off the locked port             | `--reap=dupes`     |
| `other`   | not identifiable as Storybook         | never touched      |

Scopes combine: `--reap=foreign,dupes`. `--reap=all` is everything reapable.

**Orphans are the default because they are the only category that is unambiguously
dead** — nobody can be using a server whose tree has been deleted. A live `foreign`
server may belong to a parallel agent, and a `dupe` may be a deliberate `--isolated`
instance, so both are opt-in.

Every launch passes `--exact-port`, so a port conflict is a **loud failure** instead of a
silent move. Proof: on a busy port, `--exact-port` refuses to start; without it, Storybook
quietly comes up one port over.

**Verify provenance by something unique to the tree you meant to shoot** — a story that
only exists there, or a rendered detail only that commit produces. Never by story IDs alone.

**Stop only the servers you started, by PID.** Record the PID of any server you start (Storybook,
Vite, `pnpm review`) and stop that PID when you are done. Never kill by name pattern
(`pkill -f storybook`, `killall node`): other sessions run servers in this repo at the same time,
and in September 2026 a name-pattern kill took down the Storybook behind a live review round. To
list what is running, use `pnpm storybook:ports`; `pnpm storybook:reap` stops orphans only. Plain
`pnpm storybook` replaces a foreign server on 6006, so use `pnpm storybook:isolated` when another
session may be using 6006.

## Architecture

### Cross-Platform First

All components use React Native primitives - never HTML elements directly:

| Use          | Not              |
| ------------ | ---------------- |
| `View`       | `div`            |
| `Text`       | `span`, `p`      |
| `Pressable`  | `button`         |
| `TextInput`  | `input`          |
| `Image`      | `img`            |
| `ScrollView` | scrollable `div` |

### Styling: NativeWind v4 + Tailwind CSS

- Style with Tailwind classes via `className` prop (compiled by NativeWind)
- Use the `cn()` utility from `@/utils/cn` for all class merging (clsx + tailwind-merge)
- Never use inline styles except for dynamic values that can't be expressed in Tailwind
- Use semantic token classes (e.g., `bg-surface-elevated`) not raw colors (`bg-gray-800`)
- Platform modifiers: `web:`, `native:`, `ios:`, `android:` for platform-specific styles

### Dark Mode

- Dark mode is the **default** (`:root` styles)
- Light mode activated via `.light` class on `<html>`
- Always declare styles explicitly for both modes - don't rely on inheritance
- Light mode base is `#F3F4F6` (not pure white) to allow elevation system to work

### Compound Components (Gluestack Pattern)

Complex components use explicit compound structure:

```tsx
<Button variant="solid" color="primary" size="md">
  <ButtonIcon as={PlusIcon} />
  <ButtonText>Add Item</ButtonText>
</Button>
```

## Component Development

### File Structure

```
src/components/ui/{component-name}/
  ComponentName.tsx           # Implementation
  ComponentName.test.tsx      # Tests (Vitest + jest-axe)
  ComponentName.stories.tsx   # Storybook stories
  index.ts                    # Barrel export
```

Custom components go in `src/components/custom/` with PascalCase directories. Add the new export to
the family barrel (`src/components/ui/index.ts` or `src/components/custom/index.ts`) as well as the
component's own `index.ts`.

### Props Conventions

| Prop         | Type                                                                      | Notes                                   |
| ------------ | ------------------------------------------------------------------------- | --------------------------------------- |
| `variant`    | `'solid' \| 'outline' \| 'ghost' \| 'link'`                               | Visual style                            |
| `size`       | `'sm' \| 'md' \| 'lg'`                                                    | Size variant                            |
| `color`      | `'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'info'` | Color scheme                            |
| `isDisabled` | `boolean`                                                                 | Not `disabled`                          |
| `isLoading`  | `boolean`                                                                 | Not `loading`                           |
| `isSelected` | `boolean`                                                                 | Not `selected`                          |
| `onPress`    | `() => void`                                                              | Not `onClick` (React Native convention) |
| `className`  | `string`                                                                  | Tailwind overrides via cn()             |

### Accessibility Requirements

- All components must pass WCAG 2.1 AA (tested with jest-axe)
- Use `accessibilityRole`, `accessibilityLabel`, `accessibilityState` on custom components
- Gluestack components have accessibility built in - don't remove ARIA attributes
- Every component test file must include an accessibility test

### State Coverage

Every component documents and stories its loading, empty, error and disabled states, or says why a
state does not apply. The checklist is `docs/component-states.md`. A new line chart follows the
structure described under _Line charts_ in `src/components/custom/charts/README.md`.

### Testing Pattern

```tsx
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("ComponentName", () => {
  it("renders correctly", () => {
    /* ... */
  });
  it("has no accessibility violations", async () => {
    const { container } = render(<Component />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### Storybook Pattern

One `Default` story per component, driven by `args` and `argTypes`. Variants, colours, sizes and
states are controls on that story, not separate `AllVariants` / `AllColors` / `AllSizes` stories
(roadmap E4, `packages/ui/docs/library-roadmap.md`). Many older `ui/*` stories (Button, Input,
Chip, …) still export `AllVariants`-style stories until E4 thins them; do not copy them. From
`src/components/shell/workout/SessionStatePill.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"; // NOT @storybook/react
import { SessionStatePill } from "./SessionStatePill";

const meta: Meta<typeof SessionStatePill> = {
  title: "Shell/Workout/SessionStatePill",
  component: SessionStatePill,
  tags: ["autodocs", "status:candidate", "!status:review"],
  args: { state: "live" },
  argTypes: {
    state: { control: "select", options: ["live", "rest", "idle"] },
    label: { control: "text" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "**Molecule** (= the ledger’s reusable StatusPill — also used by the Live-view header). Composes " +
          "[Indicator](?path=/docs/components-atoms-indicator--docs) (pulse `ping` + vivid color for live) + " +
          "[Typography](?path=/docs/foundations-typography--docs) (`monoLabel`). Use the `state` control to switch.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof SessionStatePill>;

export const Default: Story = {};
```

`shell/workout/DeviceMenu.stories.tsx` shows the same shape for a component that takes data and
callbacks: an `object` control for the fixture, `control: false` for handlers, and a decorator on
`meta` that gives the component room to open.

- **Title** follows the six groups of roadmap decision 14: `Foundations/`,
  `Components/Atoms|Molecules|Organisms/` (`ui/*` only), `Custom/<Family>/`, `Shell/`, `Pages/`,
  and `Lab/<Family>/` (`src/lab` only).
- **Tags**: `autodocs`, plus a status tag derived by the rule in `packages/ui/MATURITY.md`. A
  story that sets a status also negates the inherited default with `!status:review`.
- **Composes line**: `parameters.docs.description.component` names the tier and links each story
  the component composes, so the docs pages navigate down the tree.
- **Hooks in `render`** need a named PascalCase function (`render: function Render(args) { … }`).
  An anonymous arrow fails `react-hooks/rules-of-hooks`.
- **JSX text** escapes quotes (`&apos;`, `&quot;`); `react/no-unescaped-entities` is on.

**Critical**: Storybook uses `@storybook/react-native-web-vite` with `jsxImportSource: 'nativewind'`. Without this NativeWind classes won't work.

## Design Tokens

### Two-Tier System (DTCG Standard)

1. **Primitives** (`src/theme/tokens/primitives.ts`) - Raw color scales, no semantic meaning
2. **Semantic** (`src/theme/tokens/semantic.ts`) - Meaningful names referencing primitives

### Token Categories

| Category    | Pattern               | Example Classes                                              |
| ----------- | --------------------- | ------------------------------------------------------------ |
| Brand       | `brand-{role}`        | `bg-brand-primary`, `text-brand-secondary`                   |
| Status      | `status-{type}`       | `bg-status-success`, `text-status-error`                     |
| Text        | `text-{role}`         | `text-text-primary`, `text-text-secondary`                   |
| Surface     | `surface-{level}`     | `bg-surface-base`, `bg-surface-elevated`                     |
| Background  | `background-{role}`   | `bg-background-base`, `bg-background-default`                |
| Border      | `border-{strength}`   | `border-border-default`, `border-border-subtle`              |
| Interactive | `interactive-{state}` | `hover:bg-interactive-hover`, `focus:ring-interactive-focus` |
| Result      | `result-{outcome}`    | `text-result-improve`, `text-result-degrade`                 |
| Data        | `data-{n}`            | `bg-data-1` through `bg-data-10`                             |
| Spacing     | `{situation}-{level}` | `p-inset-md`, `gap-stack-md`, `px-control-x-md`              |
| Sizing      | `control-{level}`     | `h-control-md`, `min-h-control-md`                           |

The 4px numeric scale (`p-3`, `gap-2`) stays legal everywhere. Spacing situations are `inset`,
`squish`, `stack`, `inline`, `control`, `section` and `gutter` — see `Foundations/Spacing` in
Storybook and TOKENS.md §5. `squish` and `control` carry an explicit axis (`squish-x-md`,
`control-y-md`) because `px-` and `py-` share one Tailwind namespace.

### Adding New Tokens

Four files must be updated in order:

1. `primitives.ts` - Add raw value (if new)
2. `semantic.ts` - Add semantic mapping (both dark and light)
3. `global.css` - Add CSS custom property (both `:root` and `.light`)
4. `tailwind.config.js` - Add Tailwind color reference

Colour properties are named `--color-{category}-{name}`, and the Tailwind entry is
`'var(--color-{category}-{name})'`. `theme/config.ts` lists every colour property by hand in
`darkThemeCSSVars` and `lightThemeCSSVars`; `config.completeness.test.ts` fails until the new
property is added there too. If `Foundations/Color/Palettes` lists the category's swatches by hand,
add the new one.

**Spacing and sizing tokens skip step 3's hand-editing.** Their numbers live once, in `space` /
`size` in `semantic.ts`; `tokens/spacing-vars.ts` derives the `--space-*` / `--size-*` properties,
`theme/config.ts` spreads them into both theme maps, and `tailwind.config.js` references the property
by name only. Add the number in `semantic.ts`, mirror the derived line into both `global.css` blocks,
and add the key name to `SEMANTIC_SPACING_KEYS`. `spacing-tokens.test.ts` and
`config.completeness.test.ts` fail if any of the three drifts.

### Elevation System

Levels -2 to +5 with calculated surface colors and shadows:

- **-2, -1**: Inset (inputs, pressed states)
- **0**: Base level
- **1-3**: Cards, panels
- **4-5**: Modals, overlays

## CI and scripts

`.github/workflows/ci.yml` runs one job on Node 20 and 22: install, `pnpm lint`, `pnpm type-check`,
`pnpm format:check`, the arch-graph freshness test, `pnpm build`, then
`pnpm test -- -- --run --coverage`. Every step blocks; none is `continue-on-error`.

- **Argument passthrough.** Root scripts are `turbo run <task>`, so arguments need a second `--`:
  the first passes through pnpm, the second through Turbo (`pnpm test -- -- --run --coverage`).
- **Registering a script CI runs.** Add it to the package's `package.json`, add a
  `turbo run <task>` passthrough to the root `package.json`, and register the task in `turbo.json`.
  Without the `turbo.json` entry, the root script fails. `arch:graph` and `review` are deliberate
  exceptions: both call `node` directly and CI never runs them.
- **Coverage thresholds** live in `packages/ui/vitest.config.ts` (80% across the board, scoped to
  `src/components/**`). Set them from measured coverage (`pnpm exec vitest run --coverage` in
  `packages/ui`), not from a target, and raise them as coverage grows.

## Key Files

| File                                         | Purpose                                     |
| -------------------------------------------- | ------------------------------------------- |
| `packages/ui/src/index.ts`                   | Main barrel export                          |
| `packages/ui/src/theme/global.css`           | CSS custom properties + Tailwind imports    |
| `packages/ui/src/theme/tokens/primitives.ts` | Raw color/spacing values                    |
| `packages/ui/src/theme/tokens/semantic.ts`   | Semantic token definitions                  |
| `packages/ui/src/theme/elevation.ts`         | Elevation system with shadow math           |
| `packages/ui/src/utils/cn.ts`                | Tailwind class merge utility                |
| `packages/ui/tailwind.config.js`             | Tailwind + NativeWind configuration         |
| `packages/ui/tsup.config.ts`                 | Build configuration                         |
| `packages/ui/vitest.config.ts`               | Test configuration                          |
| `packages/ui/.storybook/main.ts`             | Storybook config (jsxImportSource critical) |

## Exports

```tsx
// Components + theme + utils
import {
  Button,
  ButtonText,
  Card,
  Typography,
  cn,
} from "@titan-design/react-ui";

// Theme only (subpath export)
import { semanticColorsDark, elevation } from "@titan-design/react-ui/theme";

// CSS (required by consumers)
import "@titan-design/react-ui/theme/global.css";

// Tailwind config (for extending in consuming apps)
const tailwindConfig = require("@titan-design/react-ui/tailwind.config.js");
```
