# Using @titan-design/react-ui in Web Applications

This guide covers the Vite configuration required to use Titan components in a web project. Titan components are built on React Native primitives with NativeWind (Tailwind CSS), so a few extra build settings are needed for everything to work on the web.

## Prerequisites

- Vite-based project
- `react-native-web` installed

## Setup

### 1. Install dependencies

```bash
npm install nativewind react-native-css-interop --legacy-peer-deps
```

### 2. Configure Vite

In `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ jsxImportSource: 'nativewind' })],
  resolve: {
    conditions: ['react-native', 'import'],
    alias: {
      'react-native': 'react-native-web',
    },
  },
})
```

### 3. Configure Tailwind

In `tailwind.config.ts`:

```ts
const titanConfig = require('@titan-design/react-ui/tailwind.config.js')

export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@titan-design/react-ui/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [titanConfig],
}
```

## Why this setup is needed

Titan components use React Native primitives (`View`, `Text`, `Pressable`) styled with Tailwind `className`. On the web, two things need to happen for this to work:

1. **NativeWind JSX transform** -- Setting `jsxImportSource: 'nativewind'` in the Vite React plugin enables a custom JSX transform that converts `className` props into `style` objects that `react-native-web` understands. Without this, `react-native-web` ignores `className` entirely and components render unstyled.

2. **`react-native` resolve condition** -- Adding `'react-native'` to Vite's `resolve.conditions` tells Vite to follow the `react-native` export map entry in Titan's `package.json`. This imports Titan's source files (rather than pre-built bundles), which allows the NativeWind JSX transform to process them during your app's build.

3. **`react-native-web` alias** -- The alias redirects all `react-native` imports to `react-native-web` so that primitives like `View` and `Text` render as HTML elements in the browser.

4. **Tailwind content paths** -- The content array must include Titan's source files so that Tailwind scans them for class names and generates the corresponding CSS.

## Troubleshooting

- **Styles are missing or components look unstyled** -- Clear the Vite cache with `rm -rf node_modules/.vite` and restart the dev server.
- **Peer dependency conflicts during install** -- Use the `--legacy-peer-deps` flag. NativeWind's peer dependency ranges can conflict with newer React versions.
- **CSS variables not resolving** -- Make sure `nativewind/preset` is included in your Tailwind config (Titan's config preset includes it, but verify it was not overridden).
- **`Cannot find module 'react-native'` at runtime** -- Confirm the `react-native` -> `react-native-web` alias is present in your Vite config.
