// Advisory mutation run over jsdom logic; .github/workflows/mutation.yml runs it weekly.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // pnpm keeps plugins out of core's node_modules, so Stryker cannot discover them itself.
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.stryker.config.ts' },
  coverageAnalysis: 'perTest',
  mutate: [
    'src/utils/**/*.ts',
    'src/hooks/**/*.ts',
    'src/**/*Math.ts',
    'src/**/*-model.ts',
    '!src/**/*.test.ts',
    '!src/**/*.test-d.ts',
  ],
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  // Advisory: a low score never fails the run; scripts/check-mutation-report.mjs fails an empty one.
  thresholds: { high: 80, low: 60, break: null },
  tempDirName: '.stryker-tmp',
}
