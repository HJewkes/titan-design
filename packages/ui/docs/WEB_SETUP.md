# Web Consumer Setup

How to use `@titan-design/react-ui` in a Vite-based web application.

## Prerequisites

- **Vite** 5+ with `@vitejs/plugin-react`
- **Tailwind CSS** 3.4+
- **react-native-web** 0.19+

## Quick Start

### 1. Install dependencies

```bash
npm install @titan-design/react-ui react-native-web
npm install -D tailwindcss autoprefixer postcss nativewind
```

> `nativewind` is an **optional peer dependency** and only needed at build time — it
> provides a Tailwind preset that adds React Native platform variants (`web:`,
> `native:`) used by titan components. It is NOT needed at runtime on web.
> Install it as a dev dependency so Tailwind can resolve the preset.

### 2. Configure Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
})
```

That's it. No `jsxImportSource`, no `optimizeDeps`, no `resolve.dedupe`.

### 3. Configure Tailwind CSS

```js
// tailwind.config.js
const titanConfig = require('@titan-design/react-ui/tailwind.config.js')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@titan-design/react-ui/dist/**/*.{js,mjs}',
  ],
  presets: [titanConfig],
  darkMode: 'class',
}
```

The `titanConfig` preset includes `nativewind/preset` which registers the `web:` and
`native:` Tailwind variants that titan components use (e.g., `web:hover:bg-gray-100`).

### 4. Configure PostCSS

```js
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 5. Import global CSS

```tsx
// main.tsx or App.tsx
import '@titan-design/react-ui/theme/global.css'
```

This loads the design token CSS custom properties (colors, typography, spacing, etc.).

### 6. Use components

```tsx
import { Button, ButtonText, Card, CardContent } from '@titan-design/react-ui'

function App() {
  return (
    <Card>
      <CardContent>
        <Button color="primary">
          <ButtonText>Hello</ButtonText>
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

## How It Works

Titan's web distribution (the `dist/` you import) uses a custom JSX runtime
that converts `className` props to
[`$$css` style objects](https://github.com/nicholasxjy/styleq#compiled-styles)
at **build time**. react-native-web's `styleq` recognizes these objects and
applies their values as CSS class names on DOM elements.

This means:
- No NativeWind runtime needed on web
- No `interopComponents` Map lookup (which breaks under Vite module deduplication)
- No `jsxImportSource: 'nativewind'` configuration needed
- className and inline `style` work together correctly (inline style wins on conflicts)

### Native React Native

On native (iOS/Android), Metro resolves the `react-native` export condition in
titan's `package.json`, which points to source files. NativeWind's Babel plugin
(configured in your Metro/Expo setup) handles `className` natively.

---

## Migration from NativeWind-based Setup

If you previously configured NativeWind's runtime interop, here's what to remove:

### Remove from `vite.config.ts`

```diff
  plugins: [
-   react({ jsxImportSource: 'nativewind' }),
+   react(),
  ],
  resolve: {
    alias: { 'react-native': 'react-native-web' },
-   dedupe: ['react-native-web'],
  },
- optimizeDeps: {
-   esbuildOptions: {
-     loader: { '.js': 'jsx' },
-   },
- },
```

### Remove `setup-interop.ts`

Delete any file that re-registers `cssInterop` for View/Text/Pressable.
This was a workaround for Vite's module deduplication breaking
NativeWind's `interopComponents` Map. It is no longer needed.

```diff
  // main.tsx
- import './setup-interop'
  import '@titan-design/react-ui/theme/global.css'
```

### Remove runtime dependencies

```bash
npm uninstall nativewind react-native-css-interop
npm install -D nativewind  # keep as dev dep for Tailwind preset only
```

### Remove `conditions` from Vite resolve

If you were using `conditions: ['react-native']` to resolve titan's source
files, remove it. The dist now handles className conversion internally.

```diff
  resolve: {
-   conditions: ['react-native', 'import'],
    alias: { 'react-native': 'react-native-web' },
  },
```

---

## Troubleshooting

### Tailwind classes not appearing

1. Verify your `tailwind.config.js` content array includes titan's dist:
   ```js
   content: [
     './node_modules/@titan-design/react-ui/dist/**/*.{js,mjs}',
   ]
   ```
2. Verify PostCSS is configured with the `tailwindcss` plugin
3. Verify you imported `@titan-design/react-ui/theme/global.css`

### Layout properties not applying (flexDirection, alignItems, etc.)

This was the original NativeWind interop issue. If you see this after upgrading,
ensure you've updated `@titan-design/react-ui` to a version with the custom
JSX runtime (0.3.0+). Older versions require the NativeWind runtime setup.

### Your own `<View className="...">` components don't get styles

Titan's custom JSX runtime only applies to titan's pre-built dist. If your app
code directly uses React Native primitives with className, you have two options:

1. **Use standard CSS/Tailwind on web**: Write `<div className="flex-row">` for
   your own web-only components
2. **Set up NativeWind for your app's JSX**: Add `jsxImportSource: 'nativewind'`
   to your Vite React plugin config. This only affects your app's source files
   (titan's dist is already handled)

### Using titan with Webpack instead of Vite

The same principle applies. You need:
1. `react-native` → `react-native-web` alias (via `resolve.alias` in webpack config)
2. Tailwind CSS configured with titan's content paths
3. No NativeWind runtime setup needed
