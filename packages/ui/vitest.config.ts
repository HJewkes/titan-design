import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import {
  reactNativeSvgWebResolver,
  reactNativeBodyHighlighterEsm,
  svgWebAliases,
  webResolveExtensions,
} from './vite-rn-svg-plugins'

const LOCAL_TIME_TEST_FILE = './src/components/custom/Workout/wholeBody.test.ts'

export default defineConfig({
  plugins: [reactNativeSvgWebResolver(), reactNativeBodyHighlighterEsm(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/**/*.visual.test.{ts,tsx}', 'node_modules'],
    // Threads, not forks: a forked worker per core loads its own jsdom plus
    // react-native-web (about 4.5 GB each, 13 on a 14-core Mac, orphaned if the
    // parent dies). Threads share the process and die with it. Same fix as brain #97.
    pool: 'threads',
    poolOptions: { threads: { minThreads: 1, maxThreads: 4 } },
    // A worker thread cannot change its zone after start (Node reads TZ once per
    // process), so the test that pins `process.env.TZ` runs on a fork of its own.
    // An absolute path, because `**` skips dot directories such as `.worktrees/`.
    poolMatchGlobs: [[fileURLToPath(new URL(LOCAL_TIME_TEST_FILE, import.meta.url)), 'forks']],
    teardownTimeout: 30_000,
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
