import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import {
  reactNativeSvgWebResolver,
  reactNativeBodyHighlighterEsm,
  svgWebAliases,
  webResolveExtensions,
} from './vite-rn-svg-plugins'

// Absolute paths, because `**` skips dot directories such as `.worktrees/`.
const LOCAL_TIME_TEST_PATHS = [
  './src/components/custom/Workout/wholeBody.test.ts',
  './src/components/custom/Chat/DateSeparator.local-time.test.tsx',
].map((path) => fileURLToPath(new URL(path, import.meta.url)))

const STORYBOOK_CONFIG_DIR = fileURLToPath(new URL('./.storybook', import.meta.url))

const TEST_GLOB = ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs']
// Axe on every story is the slowest suite, so CI runs this project in a job of its own.
const STORIES_AXE_GLOB = ['src/test/stories-axe.test.tsx', 'src/test/stories-axe.*.test.tsx']
const TEST_EXCLUDE = ['src/**/*.visual.test.{ts,tsx}', 'node_modules']

// `threads` shares one jsdom and module graph per worker (`isolate: false`). A file that
// leaks state into the next one under sharing runs here instead, with the reason beside it.
const ISOLATED_TEST_PATHS: string[] = []

export default defineConfig({
  plugins: [reactNativeSvgWebResolver(), reactNativeBodyHighlighterEsm(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Threads, not forks: a forked worker per core loads its own jsdom plus
    // react-native-web (about 4.5 GB each, 13 on a 14-core Mac, orphaned if the
    // parent dies). Threads share the process and die with it. Same fix as brain #97.
    pool: 'threads',
    poolOptions: { threads: { minThreads: 1, maxThreads: 4 } },
    teardownTimeout: 30_000,
    // A worker thread cannot change its zone after start (Node reads TZ once per
    // process), so the tests that pin `process.env.TZ` run in a fork project of its own.
    projects: [
      {
        extends: true,
        test: {
          name: 'threads',
          include: TEST_GLOB,
          exclude: [
            ...TEST_EXCLUDE,
            ...LOCAL_TIME_TEST_PATHS,
            ...STORIES_AXE_GLOB,
            ...ISOLATED_TEST_PATHS,
          ],
          isolate: false,
        },
      },
      {
        extends: true,
        test: {
          name: 'isolated',
          include: ISOLATED_TEST_PATHS,
          exclude: TEST_EXCLUDE,
          isolate: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'stories-axe',
          include: STORIES_AXE_GLOB,
          exclude: TEST_EXCLUDE,
        },
      },
      {
        extends: true,
        test: {
          name: 'local-time',
          include: LOCAL_TIME_TEST_PATHS,
          exclude: TEST_EXCLUDE,
          pool: 'forks',
        },
      },
      {
        extends: true,
        test: {
          name: 'types',
          include: [],
          typecheck: { enabled: true, include: ['src/**/*.test-d.ts'], only: true },
        },
      },
      // A real browser, so none of the jsdom aliases above apply; `.storybook/main.ts`
      // supplies the resolution through its `viteFinal`. Run it with `pnpm test:storybook`.
      {
        extends: false,
        plugins: [storybookTest({ configDir: STORYBOOK_CONFIG_DIR, tags: { include: ['play'] } })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
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
      // Set from measured coverage (not a target) and raise as coverage grows; see docs/ci-and-scripts.md.
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
