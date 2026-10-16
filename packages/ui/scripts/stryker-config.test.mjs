// @vitest-environment node
import { describe, expect, it } from 'vitest'
import strykerConfig from '../stryker.config.mjs'
import strykerVitestConfig from '../vitest.stryker.config'

const sourceGlobs = strykerConfig.mutate.filter((glob) => !glob.startsWith('!'))

describe('Stryker test globs (TD-585)', () => {
  it('mutates at least one source glob', () => {
    expect(sourceGlobs.length).toBeGreaterThan(0)
  })

  it.each(sourceGlobs)('runs the tests beside the mutated sources in %s', (glob) => {
    expect(strykerVitestConfig.test.include).toContain(glob.replace(/\.ts$/, '.test.ts'))
  })

  it('runs no tests outside the mutated sources', () => {
    expect(strykerVitestConfig.test.include).toHaveLength(sourceGlobs.length)
  })
})
