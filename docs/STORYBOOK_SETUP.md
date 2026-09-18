# Storybook Setup for NativeWind + React Native Web

This document explains the Storybook configuration required for React Native Web components with NativeWind v4 styling.

## Overview

The design system uses **Storybook 10** with the `@storybook/react-native-web-vite` framework. This specific combination is required because:

1. NativeWind v4 uses a JSX transform approach that requires framework-level support
2. The react-native-web-vite framework handles React Native Web aliasing automatically
3. Vite provides fast builds and HMR

## Required Dependencies

```json
{
  "devDependencies": {
    "storybook": "^10.2.0",
    "@storybook/react-native-web-vite": "^10.2.0",
    "@storybook/addon-a11y": "^10.2.0",
    "@storybook/addon-docs": "^10.2.0",
    "react-native-web": "^0.19.0",
    "autoprefixer": "^10.4.0"
  }
}
```

## Configuration Files

### `.storybook/main.ts`

The main configuration file must use `@storybook/react-native-web-vite` and configure the NativeWind JSX import source:

```typescript
import type { StorybookConfig } from '@storybook/react-native-web-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      pluginReactOptions: {
        // CRITICAL: This tells the build system to use NativeWind's JSX transform
        // Without this, className props on React Native components won't be styled
        jsxImportSource: 'nativewind',
      },
    },
  },
}

export default config
```

### `.storybook/preview.tsx`

The preview file imports global CSS and configures default parameters:

```tsx
import type { Preview } from '@storybook/react'
import React from 'react'

// CRITICAL: Import global CSS to load Tailwind utilities and CSS custom properties
import '../src/theme/global.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#111827',  // matches --color-background-base dark
        },
        {
          name: 'light',
          value: '#FFFFFF',
        },
      ],
    },
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#F3F4F6',
      }}>
        <Story />
      </div>
    ),
  ],
}

export default preview
```

### `postcss.config.js`

Required for Tailwind CSS processing:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### `tailwind.config.js`

Must include the NativeWind preset:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],  // REQUIRED for NativeWind v4
  darkMode: 'class',
  theme: {
    extend: {
      // Your theme extensions...
    },
  },
  plugins: [],
}
```

## Story File Format

Each component has one `Default` story driven by `args` and `argTypes`. Variants, colours, sizes
and states are controls on that story rather than separate `Primary`, `AllVariants` or
`AllSizes` stories (roadmap E4 in `packages/ui/docs/library-roadmap.md`). Stories import types
from `@storybook/react-vite`. From `src/components/shell/workout/DeviceMenu.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DeviceMenu } from './DeviceMenu'
import { type Device } from './DeviceRow'

const DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]

const meta: Meta<typeof DeviceMenu> = {
  title: 'Shell/Workout/DeviceMenu',
  component: DeviceMenu,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { devices: DEVICES, isOpen: false },
  argTypes: {
    devices: { control: 'object' },
    isOpen: { control: 'boolean' },
    onOpenChange: { control: false },
    onSelectDevice: { control: false },
  },
  decorators: [
    (Story) => (
      <View className="flex-row p-4 pb-48">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** The device glyph + its dropdown. Composes ' +
          '[Popover](?path=/docs/components-molecules-popover--docs) + ' +
          '[DeviceIndicator](?path=/docs/shell-deviceindicator--docs) (trigger) + ' +
          '[DeviceRow](?path=/docs/shell-devicerow--docs) (list) + ' +
          '[Typography](?path=/docs/foundations-typography--docs) (header). Aggregates the bound devices ' +
          '(worst-of) for the glyph state. Click the glyph, or toggle the `isOpen` control.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeviceMenu>

export const Default: Story = {}
```

The title groups, status tags, the "Composes" line and the lint rules that apply to stories are
listed in `CLAUDE.md` under _Storybook Pattern_.

## Global CSS Structure

The `global.css` file must be structured correctly:

```css
/* Font imports MUST be at top level (not inside @layer) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Dark mode (default) */
  :root {
    --color-brand-primary: #5048E5;
    --color-text-primary: #F9FAFB;
    --color-surface-base: #111827;
    /* ... other variables */
  }

  /* Light mode */
  .light,
  :root.light {
    --color-brand-primary: #5048E5;
    --color-text-primary: #111827;
    --color-surface-base: #FFFFFF;
    /* ... other variables */
  }
}
```

## Common Issues and Solutions

### Issue: Components render but have no styles

**Cause**: The `jsxImportSource` option is not configured in Storybook.

**Solution**: Ensure `main.ts` includes:
```typescript
framework: {
  name: '@storybook/react-native-web-vite',
  options: {
    pluginReactOptions: {
      jsxImportSource: 'nativewind',
    },
  },
},
```

### Issue: "Cannot find module 'autoprefixer'"

**Cause**: PostCSS is configured but autoprefixer is not installed.

**Solution**: Install autoprefixer:
```bash
pnpm add -D autoprefixer
```

### Issue: Storybook stuck in loading state

**Cause**: Usually a CSS import error or PostCSS configuration issue.

**Solution**:
1. Check that `postcss.config.js` exists
2. Ensure `@import url()` statements are at the top of CSS files (not inside `@layer`)
3. Clear caches: `rm -rf node_modules/.cache node_modules/.vite`

### Issue: "Expected property name" or CSS parsing errors

**Cause**: CSS `@import` statements inside `@layer` blocks.

**Solution**: Move `@import url()` to the top level of the CSS file.

### Issue: Storybook 8.x components don't render correctly

**Cause**: The `@storybook/react-native-web-vite` framework requires Storybook 10.

**Solution**: Upgrade Storybook:
```bash
npx storybook@latest upgrade --yes
pnpm install --no-frozen-lockfile
```

## Running Storybook

```bash
# Start development server
pnpm storybook

# Build static Storybook
pnpm build-storybook
```

## Testing in Storybook

### Accessibility Testing

The `@storybook/addon-a11y` addon runs axe-core checks automatically. View results in the "Accessibility" tab.

### Visual Testing

Use the background switcher to test dark/light modes:
1. Click the background tool in the toolbar
2. Select "dark" or "light"

### Interactive Testing

Components respond to controls in the "Controls" panel. The `Default` story's controls are how
you check variant combinations, disabled and loading states, and sizes. Resize the canvas to check
widths.

## Organizing Stories

```
src/
├── components/
│   ├── ui/
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.stories.tsx
│   │   └── input/
│   │       ├── Input.tsx
│   │       └── Input.stories.tsx
│   └── custom/
│       └── Typography/
│           ├── Typography.tsx
│           └── Typography.stories.tsx
└── theme/
    └── Colors.stories.tsx        # Design token documentation
```

## Best Practices

1. **Use `tags: ['autodocs']`** - Enables automatic documentation generation
2. **Define argTypes** - Provides controls for all configurable props
3. **Create render functions** - For compound components, explicit render functions work better
4. **Group related stories** - Use the six title groups in `CLAUDE.md`, for example
   `Components/Molecules/Popover`, `Custom/Workout/SetRow`, `Foundations/Typography`
5. **One `Default` story** - Show variants through controls, not one story per variant
6. **Show composition** - Create stories that show components working together
