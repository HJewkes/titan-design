import { describe, expect, it } from 'vitest'
import { classify, gitBlobId, stemOf } from '../src/packet-classify.ts'

const PREFIX = 'packages/ui/specimen/baseline/chip.test.ts-snapshots/'
const path = (name: string) => `${PREFIX}${name}-chromium-linux.png`
const bytes = (text: string) => Buffer.from(text)

describe('classify', () => {
  it('sorts a regenerated layer by blob id, not by path presence', () => {
    const main = new Map([
      [path('a'), gitBlobId(bytes('a'))],
      [path('b'), gitBlobId(bytes('b'))],
      [path('c'), gitBlobId(bytes('c'))],
    ])
    const artifact = new Map([
      [path('a'), bytes('a')],
      [path('b'), bytes('b, regenerated')],
      [path('d'), bytes('d')],
    ])

    const result = classify(main, artifact, true)

    expect(result.unchanged).toBe(1)
    expect(result.shown).toEqual([
      { path: path('b'), change: 'changed' },
      { path: path('c'), change: 'removed' },
      { path: path('d'), change: 'new' },
    ])
  })

  it('shows nothing for a layer the run did not regenerate', () => {
    const main = new Map([[path('a'), gitBlobId(bytes('a'))]])

    const result = classify(main, new Map([[path('d'), bytes('d')]]), false)

    expect(result).toEqual({ shown: [], unchanged: 0 })
  })

  it('ignores files that are not Linux Chromium baselines', () => {
    const main = new Map([[`${PREFIX}chip.test.ts`, 'f'.repeat(40)]])
    const artifact = new Map([
      [`${PREFIX}chip.test.ts`, bytes('spec')],
      [`${PREFIX}a-chromium-darwin.png`, bytes('mac')],
    ])

    expect(classify(main, artifact, true)).toEqual({ shown: [], unchanged: 0 })
  })
})

describe('gitBlobId', () => {
  it('matches git hash-object for the same bytes', () => {
    expect(gitBlobId(bytes('synthetic baseline'))).toBe('e765bb039f4cb78a393c4adaf1e42adbc9f25fba')
  })
})

describe('stemOf', () => {
  it('drops the directory and the platform suffix', () => {
    expect(stemOf(path('chip-selected'))).toBe('chip-selected')
  })
})
