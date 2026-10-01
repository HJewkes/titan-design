import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // Threads, not forks: forked workers outlive a dead parent (PPID 1) and held tens of GB.
    pool: 'threads',
    poolOptions: { threads: { minThreads: 1, maxThreads: 4 } },
  },
})
