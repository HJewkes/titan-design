# Titan Design System Architecture

This document describes the technical architecture, design decisions, and patterns used in the Titan Design System.

## Overview

Titan Design is a cross-platform React design system that uses:

- **React Native primitives** - Components that work on web (via react-native-web) and native platforms
- **NativeWind v4** - Tailwind CSS for React Native with build-time compilation
- **Gluestack UI** - Foundation for accessible, cross-platform components
- **Storybook 10** - Component documentation and visual testing

## Monorepo Structure

```
titan-design/
├── packages/
│   └── ui/                       # @hjewkes/titan-ui - Core component library
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/           # Gluestack-based components
│       │   │   └── custom/       # Hand-built components
│       │   ├── theme/
│       │   │   ├── tokens/       # Design tokens (primitives + semantic)
│       │   │   ├── global.css    # CSS custom properties + Tailwind
│       │   │   └── config.ts     # Gluestack config
│       │   ├── utils/
│       │   │   └── cn.ts         # Class name utility
│       │   └── types/
│       │       └── nativewind.d.ts  # Type augmentation
│       ├── .storybook/           # Storybook configuration
│       ├── tailwind.config.js    # Tailwind + NativeWind config
│       └── postcss.config.js     # PostCSS for Tailwind processing
├── docs/                         # Documentation
├── pnpm-workspace.yaml           # Workspace definition
└── turbo.json                    # Build orchestration
```

## Cross-Platform Architecture

### Why React Native Primitives?

React Native primitives (`View`, `Text`, `Pressable`) provide a unified API that compiles to:
- **Web**: Standard HTML elements via `react-native-web`
- **iOS/Android**: Native platform components

This "write once, run everywhere" approach eliminates platform-specific code for 95% of UI work.

### NativeWind v4 Architecture

NativeWind v4 uses a fundamentally different approach from v2:

1. **JSX Import Source Transform**: Instead of a babel plugin that converts `className` to `style`, v4 uses a custom JSX transform (`jsxImportSource: 'nativewind'`)

2. **Build-time CSS Compilation**: Tailwind classes are compiled at build time, not runtime

3. **CSS Custom Properties**: Theme values are CSS variables that work on both platforms

4. **Runtime Style Interop**: The `react-native-css-interop` library handles className-to-style conversion at runtime

### Component Patterns

#### Compound Components (Gluestack Pattern)

Complex components use the compound component pattern for flexibility:

```tsx
// Compound pattern - explicit structure
<Button variant="solid" color="primary">
  <ButtonIcon as={PlusIcon} />
  <ButtonText>Add Item</ButtonText>
</Button>

// Also supports simple usage
<Button>Simple Button</Button>
```

#### Props Conventions

| Prop | Type | Purpose |
|------|------|---------|
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'link'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | Size variant |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'info'` | Color scheme |
| `isDisabled` | `boolean` | Disabled state |
| `isLoading` | `boolean` | Loading state |
| `onPress` | `() => void` | Press handler (RN convention) |

## Design Token Architecture

### Two-Tier Token System

Following Design Tokens Community Group (DTCG) and Material Design 3 conventions:

#### 1. Primitive Tokens (Raw Values)

```typescript
// packages/ui/src/theme/tokens/primitives.ts
export const primitiveColors = {
  indigo: {
    50: '#EEF2FF',
    500: '#5048E5',  // Brand primary
    900: '#312E81',
  },
  // ... other color scales
}
```

#### 2. Semantic Tokens (Meaningful Roles)

```typescript
// packages/ui/src/theme/tokens/semantic.ts
export const semanticTokens = {
  dark: {
    brand: {
      primary: primitiveColors.indigo[500],
      secondary: primitiveColors.emerald[500],
    },
    text: {
      primary: primitiveColors.gray[50],
      secondary: primitiveColors.gray[400],
    },
    surface: {
      base: primitiveColors.gray[900],
      elevated: primitiveColors.gray[800],
    },
  },
  light: {
    // Light mode equivalents...
  },
}
```

### Token Naming Conventions

| Category | Pattern | Example |
|----------|---------|---------|
| Brand | `brand-{role}` | `brand-primary`, `brand-secondary` |
| Status | `status-{type}` | `status-success`, `status-error` |
| Text | `text-{role}` | `text-primary`, `text-secondary` |
| Surface | `surface-{level}` | `surface-base`, `surface-elevated` |
| Background | `background-{role}` | `background-base`, `background-default` |
| Border | `border-{strength}` | `border-default`, `border-subtle` |
| Interactive | `interactive-{state}` | `interactive-hover`, `interactive-focus` |

### CSS Custom Properties

Tokens are exposed as CSS custom properties for runtime theming:

```css
/* Dark mode (default) */
:root {
  --color-brand-primary: #5048E5;
  --color-text-primary: #F9FAFB;
  --color-surface-base: #111827;
}

/* Light mode */
.light, :root.light {
  --color-brand-primary: #5048E5;
  --color-text-primary: #111827;
  --color-surface-base: #FFFFFF;
}
```

## Storybook Architecture

### Why Storybook 10 + react-native-web-vite?

The `@storybook/react-native-web-vite` framework was chosen because:

1. **Native NativeWind Support**: Built-in support for `jsxImportSource: 'nativewind'`
2. **Vite Performance**: Fast HMR and build times
3. **React Native Web Integration**: Automatic aliasing and babel configuration
4. **Feature Rich**: Full Storybook 10 features (docs, interactions, a11y)

### Configuration Requirements

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-native-web-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      pluginReactOptions: {
        jsxImportSource: 'nativewind',  // Critical for NativeWind v4
      },
    },
  },
}
```

### Preview Configuration

```tsx
// .storybook/preview.tsx
import '../src/theme/global.css'  // Must import global CSS

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' },
        { name: 'light', value: '#FFFFFF' },
      ],
    },
  },
}
```

## Testing Strategy

### Unit Tests (Vitest)

- Component rendering and props
- Accessibility compliance (`jest-axe`)
- Utility functions

### Visual Tests (Storybook)

- Component variations and states
- Dark/light mode rendering
- Responsive behavior

### Cross-Platform Verification

1. **Web (Storybook)**: Primary development environment
2. **iOS Simulator**: Native rendering verification
3. **Android Emulator**: Native rendering verification

## Build Pipeline

### Development

```bash
pnpm storybook     # Start Storybook dev server
pnpm dev           # Start monorepo dev mode
```

### Production Build

```bash
pnpm build         # tsup bundles ESM + CJS + DTS
```

### Output Structure

```
packages/ui/dist/
├── index.js       # CommonJS
├── index.mjs      # ESM
├── index.d.ts     # TypeScript declarations
├── theme/
│   ├── index.js
│   ├── index.mjs
│   └── index.d.ts
```

## Dependencies

### Peer Dependencies (Consumer Must Provide)

- `react` ^18.0.0
- `react-dom` ^18.0.0 (web)
- `react-native` >=0.72.0 (native)
- `react-native-web` >=0.19.0 (web)
- `lucide-react` >=0.400.0 (web)
- `lucide-react-native` >=0.400.0 (native)

### Core Dependencies (Bundled)

- `nativewind` ^4.1.0
- `@gluestack-ui/themed` ^1.1.0
- `@gluestack-style/react` ^1.0.0
- `clsx` ^2.1.0
- `tailwind-merge` ^2.6.0

## Migration from MUI

This design system was created to provide a cross-platform alternative to MUI. Key differences:

| MUI Concept | Titan Equivalent |
|-------------|------------------|
| `<Box>` | `<View>` |
| `<Typography>` | `<Typography>` (custom) or `<Text>` |
| `<Button>` | `<Button>` + `<ButtonText>` |
| `<Paper>` | `<Card variant="elevated">` |
| `sx` prop | `className` with Tailwind |
| `theme.palette` | CSS custom properties |
| `useTheme()` | Class-based dark/light mode |

## Future Considerations

1. **Animation Library**: Consider adding `react-native-reanimated` for complex animations
2. **Form Library**: Integration with `react-hook-form`
3. **Data Fetching**: Patterns for `@tanstack/react-query` integration
4. **Additional Components**: DatePicker, Select, Popover, Toast
