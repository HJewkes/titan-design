import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config'
import strykerConfig from './stryker.config.mjs'

// Stryker's vitest runner does not support `projects`, so this config runs the jsdom
// logic tests that cover stryker.config.mjs's `mutate` globs in one flat project.
// Derived from `mutate` so a new mutate glob brings its tests along.
const STRYKER_TEST_GLOB = strykerConfig.mutate
  .filter((glob) => !glob.startsWith('!'))
  .map((glob) => glob.replace(/\.ts$/, '.test.ts'))

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
