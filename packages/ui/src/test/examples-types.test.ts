import { describe, it, expect } from 'vitest'
import {
  compareToBaseline,
  groupDiagnostics,
  updatedBaseline,
} from '../../scripts/check-examples-types.mjs'

const STORY = 'src/components/ui/button/Button.stories.tsx'
const TEST = 'src/components/ui/button/Button.test.tsx'
const GONE = 'src/components/ui/old/Old.stories.tsx'
const BROKEN = 'src/components/ui/card/Card.stories.tsx'

const exists = (file: string) => file !== GONE

describe('groupDiagnostics', () => {
  it('counts errors per file with the keys sorted', () => {
    const diagnostics = [
      { file: TEST, syntactic: false },
      { file: STORY, syntactic: false },
      { file: TEST, syntactic: false },
    ]

    const { counts, syntaxFiles } = groupDiagnostics(diagnostics)

    expect(Object.entries(counts)).toEqual([
      [STORY, 1],
      [TEST, 2],
    ])
    expect(syntaxFiles).toEqual([])
  })

  it('sets aside a file with a syntax error instead of counting it', () => {
    const diagnostics = [
      { file: BROKEN, syntactic: true },
      { file: STORY, syntactic: false },
    ]

    const { counts, syntaxFiles } = groupDiagnostics(diagnostics)

    expect(counts).toEqual({ [STORY]: 1 })
    expect(syntaxFiles).toEqual([BROKEN])
  })
})

describe('compareToBaseline', () => {
  it('passes when every count equals its entry', () => {
    const result = compareToBaseline({ [STORY]: 2 }, { [STORY]: 2 }, { exists })

    expect(result.ok).toBe(true)
  })

  it('fails on a file with errors and no entry', () => {
    const result = compareToBaseline({ [STORY]: 1 }, {}, { exists })

    expect(result.ok).toBe(false)
    expect(result.unbaselined).toEqual([{ file: STORY, count: 1 }])
  })

  it('fails on a count above its entry', () => {
    const result = compareToBaseline({ [STORY]: 3 }, { [STORY]: 2 }, { exists })

    expect(result.ok).toBe(false)
    expect(result.increased).toEqual([{ file: STORY, count: 3, baseline: 2 }])
  })

  it('fails on a count below its entry, including a file now free of errors', () => {
    const result = compareToBaseline({ [STORY]: 1 }, { [STORY]: 2, [TEST]: 1 }, { exists })

    expect(result.ok).toBe(false)
    expect(result.decreased).toEqual([
      { file: STORY, count: 1, baseline: 2 },
      { file: TEST, count: 0, baseline: 1 },
    ])
  })

  it('fails on an entry for a file that no longer exists', () => {
    const result = compareToBaseline({}, { [GONE]: 1 }, { exists })

    expect(result.ok).toBe(false)
    expect(result.missing).toEqual([GONE])
    expect(result.decreased).toEqual([])
  })

  it('fails on a syntax error without also reporting the file as stale', () => {
    const result = compareToBaseline({}, { [BROKEN]: 2 }, { syntaxFiles: [BROKEN], exists })

    expect(result.ok).toBe(false)
    expect(result.decreased).toEqual([])
  })
})

describe('updatedBaseline', () => {
  const baseline = { [STORY]: 2, [TEST]: 1, [GONE]: 1 }

  it('lowers entries, drops fixed and deleted files, and refuses growth', () => {
    const counts = { [STORY]: 1, [BROKEN]: 4 }

    const next = updatedBaseline(counts, baseline, { allowIncrease: false, exists })

    expect(next).toEqual({ [STORY]: 1 })
  })

  it('keeps an entry at its value when the count grew without allowIncrease', () => {
    const next = updatedBaseline({ [STORY]: 5, [TEST]: 1 }, baseline, {
      allowIncrease: false,
      exists,
    })

    expect(next).toEqual({ [STORY]: 2, [TEST]: 1 })
  })

  it('raises and adds entries with allowIncrease, keys sorted', () => {
    const counts = { [STORY]: 5, [TEST]: 1, [BROKEN]: 4 }

    const next = updatedBaseline(counts, baseline, { allowIncrease: true, exists })

    expect(Object.entries(next)).toEqual([
      [STORY, 5],
      [TEST, 1],
      [BROKEN, 4],
    ])
  })

  it('leaves the entry of a file with a syntax error untouched', () => {
    const next = updatedBaseline(
      {},
      { [BROKEN]: 2 },
      {
        allowIncrease: false,
        syntaxFiles: [BROKEN],
        exists,
      }
    )

    expect(next).toEqual({ [BROKEN]: 2 })
  })
})
