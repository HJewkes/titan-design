# Titan Design System

Cross-platform React + React Native design system built on Gluestack UI, NativeWind v4, and Tailwind CSS.

## Quick Reference

- **Package**: `@titan-design/react-ui` (in `packages/ui/`)
- **Monorepo**: pnpm workspaces + Turborepo
- **Node**: Use `pnpm` (v9.15.0) for all package management
- **Build**: `pnpm build` (tsup, outputs ESM + CJS + DTS to `dist/`)
- **Test**: `pnpm test` (Vitest + Testing Library + jest-axe)
- **Storybook**: `pnpm storybook` (Storybook 10 on port 6006)
- **Lint**: `pnpm lint` (ESLint 9)

## Architecture

### Cross-Platform First

All components use React Native primitives - never HTML elements directly:

| Use | Not |
|-----|-----|
| `View` | `div` |
| `Text` | `span`, `p` |
| `Pressable` | `button` |
| `TextInput` | `input` |
| `Image` | `img` |
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

Custom components go in `src/components/custom/` with PascalCase directories.

### Props Conventions

| Prop | Type | Notes |
|------|------|-------|
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'link'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | Size variant |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'info'` | Color scheme |
| `isDisabled` | `boolean` | Not `disabled` |
| `isLoading` | `boolean` | Not `loading` |
| `isSelected` | `boolean` | Not `selected` |
| `onPress` | `() => void` | Not `onClick` (React Native convention) |
| `className` | `string` | Tailwind overrides via cn() |

### Accessibility Requirements

- All components must pass WCAG 2.1 AA (tested with jest-axe)
- Use `accessibilityRole`, `accessibilityLabel`, `accessibilityState` on custom components
- Gluestack components have accessibility built in - don't remove ARIA attributes
- Every component test file must include an accessibility test

### Testing Pattern

```tsx
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('ComponentName', () => {
  it('renders correctly', () => { /* ... */ })
  it('has no accessibility violations', async () => {
    const { container } = render(<Component />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

### Storybook Pattern

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'  // NOT @storybook/react

const meta: Meta<typeof Component> = {
  title: 'Components/ComponentName',  // or 'Custom/Name', 'Design Tokens/Name'
  component: Component,
  tags: ['autodocs'],
  argTypes: { /* controls */ },
}
export default meta
type Story = StoryObj<typeof Component>
```

**Critical**: Storybook uses `@storybook/react-native-web-vite` with `jsxImportSource: 'nativewind'`. Without this NativeWind classes won't work.

## Design Tokens

### Two-Tier System (DTCG Standard)

1. **Primitives** (`src/theme/tokens/primitives.ts`) - Raw color scales, no semantic meaning
2. **Semantic** (`src/theme/tokens/semantic.ts`) - Meaningful names referencing primitives

### Token Categories

| Category | Pattern | Example Classes |
|----------|---------|----------------|
| Brand | `brand-{role}` | `bg-brand-primary`, `text-brand-secondary` |
| Status | `status-{type}` | `bg-status-success`, `text-status-error` |
| Text | `text-{role}` | `text-text-primary`, `text-text-secondary` |
| Surface | `surface-{level}` | `bg-surface-base`, `bg-surface-elevated` |
| Background | `background-{role}` | `bg-background-base`, `bg-background-default` |
| Border | `border-{strength}` | `border-border-default`, `border-border-subtle` |
| Interactive | `interactive-{state}` | `hover:bg-interactive-hover`, `focus:ring-interactive-focus` |
| Result | `result-{outcome}` | `text-result-improve`, `text-result-degrade` |
| Data | `data-{n}` | `bg-data-1` through `bg-data-10` |

### Adding New Tokens

Four files must be updated in order:
1. `primitives.ts` - Add raw value (if new)
2. `semantic.ts` - Add semantic mapping (both dark and light)
3. `global.css` - Add CSS custom property (both `:root` and `.light`)
4. `tailwind.config.js` - Add Tailwind color reference

### Elevation System

Levels -2 to +5 with calculated surface colors and shadows:
- **-2, -1**: Inset (inputs, pressed states)
- **0**: Base level
- **1-3**: Cards, panels
- **4-5**: Modals, overlays

## Key Files

| File | Purpose |
|------|---------|
| `packages/ui/src/index.ts` | Main barrel export |
| `packages/ui/src/theme/global.css` | CSS custom properties + Tailwind imports |
| `packages/ui/src/theme/tokens/primitives.ts` | Raw color/spacing values |
| `packages/ui/src/theme/tokens/semantic.ts` | Semantic token definitions |
| `packages/ui/src/theme/elevation.ts` | Elevation system with shadow math |
| `packages/ui/src/utils/cn.ts` | Tailwind class merge utility |
| `packages/ui/tailwind.config.js` | Tailwind + NativeWind configuration |
| `packages/ui/tsup.config.ts` | Build configuration |
| `packages/ui/vitest.config.ts` | Test configuration |
| `packages/ui/.storybook/main.ts` | Storybook config (jsxImportSource critical) |

## Exports

```tsx
// Components + theme + utils
import { Button, ButtonText, Card, Typography, cn } from '@titan-design/react-ui'

// Theme only (subpath export)
import { semanticColorsDark, elevation } from '@titan-design/react-ui/theme'

// CSS (required by consumers)
import '@titan-design/react-ui/theme/global.css'

// Tailwind config (for extending in consuming apps)
const tailwindConfig = require('@titan-design/react-ui/tailwind.config.js')
```
