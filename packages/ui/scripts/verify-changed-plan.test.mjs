import { describe, expect, it } from 'vitest'

import { parseNameList, planSteps, splitByPackage } from './verify-changed-plan.mjs'

const run = (files) => planSteps(files).filter((s) => !s.skip).map((s) => s.name)
const step = (files, name) => planSteps(files).find((s) => s.name === name)

describe('parseNameList', () => {
  it('drops blanks and duplicates', () => {
    expect(parseNameList('a.ts\n\nb.ts\na.ts\n')).toEqual(['a.ts', 'b.ts'])
  })
})

describe('splitByPackage', () => {
  it('keeps packages/ui paths relative and counts the rest', () => {
    const files = ['packages/ui/src/a.ts', 'package.json', 'packages/review-harness/x.ts']
    expect(splitByPackage(files)).toEqual({ inUi: ['src/a.ts'], outside: 2 })
  })
})

describe('planSteps', () => {
  it('runs every check for a changed component', () => {
    expect(run(['src/components/ui/alert/Alert.tsx'])).toEqual([
      'prettier', 'eslint', 'type-check', 'type-check:examples',
      'catalog freshness', 'decomposition ratchet', 'arch:check', 'related tests',
    ])
  })

  it('skips type, catalog and ratchet checks for a doc-only change, saying why', () => {
    const steps = planSteps(['docs/notes.md'])
    expect(steps.every((s) => s.skip)).toBe(true)
    expect(steps[0].skip).toMatch(/no src/)
  })

  it('skips the catalog and ratchet for a hook outside components', () => {
    expect(run(['src/hooks/useThing.ts'])).toEqual([
      'prettier', 'eslint', 'type-check', 'type-check:examples', 'arch:check', 'related tests',
    ])
  })

  it('runs the catalog check when the maturity vocabulary changes', () => {
    expect(run(['MATURITY.md'])).toEqual(['catalog freshness'])
  })

  it('hands every changed source file to vitest related, so dependents run', () => {
    const files = ['src/components/ui/alert/Alert.tsx', 'src/hooks/useThing.ts']
    expect(step(files, 'related tests').args.slice(-2)).toEqual(files)
  })

  it('runs a changed script test through the related step', () => {
    expect(step(['scripts/verify-changed-plan.test.mjs'], 'related tests').args).toContain(
      'scripts/verify-changed-plan.test.mjs'
    )
  })

  it('lints script sources without checking their formatting', () => {
    expect(run(['scripts/verify-changed.mjs'])).toEqual(['eslint'])
  })
})
