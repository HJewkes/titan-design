import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import {
  reactNativeSvgWebResolver,
  reactNativeBodyHighlighterEsm,
  svgWebAliases,
  webResolveExtensions,
} from './vite-rn-svg-plugins'

export default defineConfig({
  plugins: [reactNativeSvgWebResolver(), reactNativeBodyHighlighterEsm(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/**/*.visual.test.{ts,tsx}', 'node_modules'],
    // Inline react-native-svg so its relative imports run through the resolver
    // plugin above and resolve to the `.web.js` implementations instead of
    // being externalized to Node (which would load the native Flow sources).
    server: {
      deps: {
        inline: ['react-native-svg', 'react-native-body-highlighter'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/components/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx', 'src/**/index.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: [
      ...svgWebAliases,
      { find: /^react-native$/, replacement: 'react-native-web' },
      // nativewind pulls RN Flow sources jsdom can't parse; only ThemeProvider
      // imports it (for native `vars()`). Stub it on web — tokens come from
      // global.css there. Real package used at build/native.
      {
        find: /^nativewind$/,
        replacement: fileURLToPath(new URL('./src/test/nativewind-stub.ts', import.meta.url)),
      },
      { find: '@', replacement: './src' },
    ],
    extensions: webResolveExtensions,
  },
})
