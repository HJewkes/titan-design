import { describe, it, expect } from 'vitest'
import {
  collectFences,
  compareToBaseline,
  extractFences,
  fenceKey,
  updatedBaseline,
} from '../../scripts/check-doc-examples.mjs'

const DOC = [
  '# Usage',
  '',
  '```tsx',
  "import { Button } from '@titan-design/react-ui'",
  '```',
  '',
  '```bash',
  'pnpm add @titan-design/react-ui',
  '```',
  '',
  '```tsx fragment',
  '<Button />',
  '```',
  '',
  '````markdown',
  '```ts',
  'const nested = true',
  '```',
  '````',
  '',
  '- In a list:',
  '',
  '  ```ts',
  '  const indented = 1',
  '  ```',
  '',
  '~~~ts',
  'const tilde = 2',
  '~~~',
].join('\n')

describe('extractFences', () => {
  it('keeps ts and tsx fences in order and skips other languages', () => {
    const fences = extractFences(DOC)

    expect(fences.map((fence) => [fence.index, fence.lang])).toEqual([
      [0, 'tsx'],
      [1, 'tsx'],
      [2, 'ts'],
      [3, 'ts'],
    ])
  })

  it('marks a tsx fragment fence as opted out', () => {
    const fences = extractFences(DOC)

    expect(fences.map((fence) => fence.isFragment)).toEqual([false, true, false, false])
  })

  it('ignores a ts fence nested in a longer fence of another language', () => {
    const codes = extractFences(DOC).map((fence) => fence.code)

    expect(codes).not.toContain('const nested = true')
  })

  it('strips the indentation of a fence inside a list item', () => {
    expect(extractFences(DOC)[2].code).toBe('const indented = 1')
  })

  it('reads a tilde fence and an unclosed fence as no fence', () => {
    expect(extractFences(DOC)[3].code).toBe('const tilde = 2')
    expect(extractFences('```ts\nconst open = 1')).toEqual([])
  })
})

describe('fenceKey', () => {
  const fence = { index: 2, lang: 'ts', isFragment: false, code: 'const a = 1' }

  it('names the doc, the fence index and a content hash', () => {
    expect(fenceKey('packages/ui/README.md', fence)).toMatch(
      /^packages\/ui\/README\.md#2:[0-9a-f]{12}$/
    )
  })

  it('changes when the fence code changes', () => {
    const edited = { ...fence, code: 'const a = 2' }

    expect(fenceKey('README.md', edited)).not.toBe(fenceKey('README.md', fence))
  })
})

describe('collectFences', () => {
  it('compiles every fence except fragments, one file per fence', () => {
    const fences = collectFences(['docs/Guide.md'], () => DOC)

    expect(fences.map((fence) => fence.file)).toEqual([
      'docs_Guide_md_0.tsx',
      'docs_Guide_md_2.ts',
      'docs_Guide_md_3.ts',
    ])
  })
})

describe('compareToBaseline', () => {
  const [broken, stillBroken] = collectFences(['Guide.md'], () => DOC).map((fence) => fence.key)

  it('passes when every failing fence is baselined', () => {
    expect(compareToBaseline([broken], [broken]).ok).toBe(true)
  })

  it('fails on a fence with a type error that is not baselined', () => {
    const result = compareToBaseline([broken, stillBroken], [broken])

    expect(result).toEqual({ ok: false, unbaselined: [stillBroken], stale: [] })
  })

  it('fails on a baselined fence that now compiles until it is removed', () => {
    const result = compareToBaseline([broken], [broken, stillBroken])

    expect(result).toEqual({ ok: false, unbaselined: [], stale: [stillBroken] })
  })

  it('fails on a baselined fence whose code changed, under both keys', () => {
    const edited = fenceKey('Guide.md', { index: 0, lang: 'tsx', isFragment: false, code: 'x' })

    const result = compareToBaseline([edited], [broken])

    expect(result).toEqual({ ok: false, unbaselined: [edited], stale: [broken] })
  })
})

describe('updatedBaseline', () => {
  it('drops entries that now compile and never adds a failure by default', () => {
    expect(updatedBaseline(['b', 'c'], ['a', 'b'], { allowIncrease: false })).toEqual(['b'])
  })

  it('adds new failures, sorted, only with allowIncrease', () => {
    expect(updatedBaseline(['c', 'b'], ['b'], { allowIncrease: true })).toEqual(['b', 'c'])
  })
})
