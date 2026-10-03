import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config'

// Stryker's vitest runner does not support `projects`, so this config runs the jsdom
// logic tests that cover stryker.config.mjs's `mutate` globs in one flat project.
const STRYKER_TEST_GLOB = [
  'src/utils/**/*.test.ts',
  'src/hooks/**/*.test.ts',
  'src/**/*Math.test.ts',
  'src/**/*-model.test.ts',
]

export default defineConfig({
  plugins: baseConfig.plugins,
  resolve: baseConfig.resolve,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: STRYKER_TEST_GLOB,
    server: baseConfig.test?.server,
  },
})
