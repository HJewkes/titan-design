import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import path from 'path'
import {
  reactNativeSvgWebResolver,
  reactNativeSvgWebResolverEsbuild,
  svgWebAliases,
  webResolveExtensions,
} from '../vite-rn-svg-plugins'

/**
 * Specimen dev server (drives the Playwright visual harness in
 * `playwright.comparison.config.ts`). The comparison page imports the whole
 * `custom/Workout` barrel, which transitively pulls in `react-native-svg` (and,
 * via BodyMap, `react-native-body-highlighter`). Both ship native (Flow) Fabric
 * sources that a Node/esbuild resolver loads instead of their `.web.js`
 * siblings, crashing dep pre-bundling. This reuses the resolution already
 * proven in `vitest.config.ts` via `vite-rn-svg-plugins`:
 *   - alias bare `react-native` -> `react-native-web` (exact match only, so RN's
 *     own `react-native/Libraries/...` subpaths are left for the svg resolver),
 *   - alias `react-native-svg` -> its ESM build and rewrite its relative imports
 *     to their `.web.js` siblings (Vite plugin + esbuild optimizer replay),
 *   - `.web.*`-first extension order so web platform files win over native,
 *   - exclude `react-native-svg` from optimizeDeps so it flows through the
 *     plugin above rather than being pre-bundled from its Flow sources.
 *
 * `react-native-body-highlighter` has no web build and its Node-ESM interop uses
 * a dynamic `require('react')` that throws in the browser; BodyMap (its only
 * consumer) is not part of the atom comparison, so it is aliased to a no-op stub
 * (see specimen/stubs) purely to let the barrel load.
 */
export default defineConfig({
  plugins: [reactNativeSvgWebResolver(), react({ jsxImportSource: 'nativewind' })],
  root: __dirname,
  resolve: {
    alias: [
      ...svgWebAliases,
      { find: /^react-native$/, replacement: 'react-native-web' },
      {
        find: /^react-native-body-highlighter$/,
        replacement: path.resolve(__dirname, 'stubs/react-native-body-highlighter.tsx'),
      },
    ],
    extensions: webResolveExtensions,
  },
  optimizeDeps: {
    exclude: ['react-native-svg', 'react-native-body-highlighter'],
    esbuildOptions: {
      resolveExtensions: webResolveExtensions,
      // nativewind (titan >=0.4 ThemeProvider) pulls react-native-css-interop,
      // whose `dist/doctor.js` ships JSX in a `.js` file. esbuild's dep
      // pre-bundler defaults `.js` to the plain `js` loader and fails to parse
      // it; parse `.js` as JSX so the interop runtime pre-bundles cleanly.
      loader: { '.js': 'jsx' },
      plugins: [reactNativeSvgWebResolverEsbuild()],
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(__dirname, '../tailwind.config.js') }),
        autoprefixer(),
      ],
    },
  },
})
