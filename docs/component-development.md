# Component development

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
- Tailwind is **v3** (`tailwindcss ^3.4`, configured in `tailwind.config.js`). Guidance written for
  Tailwind v4 (CSS-first `@theme`, `@import "tailwindcss"`) does not apply here.
- Inside titan, composing the existing tokens and primitives outranks any general design guidance
  to make a component look distinctive. A component that needs a new colour, hue or primitive
  raises it with the owner; it does not add one inline.

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

### Placement: which directory a component belongs in

A tier is decided by what the component knows, not by how much it composes.

| Directory                          | Holds                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/<name>/`        | Domain-free components of any size. Any product could render one without knowing another product's vocabulary.                     |
| `src/components/ui/charts/<name>/` | Domain-free charts. `d3-*` imports are legal only here. Shared scales, geometry and motion live in `ui/charts/kit/`.               |
| `src/components/custom/<Family>/`  | A domain family (`Workout`, `Fatigue`, `ActiveWork`, workout bar marks in `charts`). A prop, type or label names a domain concept. |
| `src/components/shell/`            | The domain-free application frame. `shell/<app>/` is one app's chrome and composes it.                                             |
| `src/lab/`                         | Unpublished exploration.                                                                                                           |
| `src/hooks/`, `src/utils/`         | Hooks and pure functions with no JSX. They never import `components/`.                                                             |

Deciding a new component's home, top to bottom, first match wins:

| Question                                                                                       | Home                                                                                                                                        |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Is it an exploration that must not publish?                                                    | `src/lab/<family>/`                                                                                                                         |
| Does any prop, type or label name a domain concept (set, rep, mesocycle, initiative, fatigue)? | `custom/<Family>/` of that domain                                                                                                           |
| Does it know the app's own chrome (its routes, its brand, its page regions)?                   | `shell/`, or `shell/<app>/` if it names an app. A generic sidebar, rail, or band that takes its content as props (e.g. `Sidebar`) is `ui/`. |
| Does it paint data marks from a scale?                                                         | `ui/charts/<name>/`                                                                                                                         |
| Is it a hook or pure function with no JSX?                                                     | `src/hooks/` or `src/utils/`                                                                                                                |
| Otherwise                                                                                      | `ui/<name>/`                                                                                                                                |

If the component you want to compose sits in a higher tier, run the table on that component. If it
lands lower, move it first.

Import order is theme, utils and hooks, icons, ui, custom, shell, pages; a lower tier never imports a
higher one (`titan/no-upward-tier-import`). The rule enforces the ui/, custom/, shell/ order today;
hooks and utils join it in the placement lint task (roadmap decision of 2026-09-19, appendix E).
`ui/` components may compose `ui/` siblings. If the component you need sits in a higher tier and is
domain-free, move it down first; do not copy it and do not replace it with a slot. Generic directories
still in `custom/` are listed in `custom-families.baseline.json`, which only shrinks.

Slots: import what is fixed anatomy (Typography, Skeleton, Tooltip, Surface); take a named `ReactNode`
slot for consumer vocabulary (wording, headers, actions); give every state slot (`emptyState`, ...) a
default built from `ui/`. Controlled state is named `x`, `defaultX`, `onXChange`.

Add the export to the family barrel (`ui/index.ts` or `custom/index.ts`) and, for `ui/`, a row in
`ui/README.md`; without the row the component stays `status:candidate`.

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
