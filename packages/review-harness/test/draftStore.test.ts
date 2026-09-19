import { describe, expect, it } from 'vitest'
import {
  MAX_DRAFT_CHARS,
  clearDraft,
  draftKey,
  saveDraft,
  type DraftStorage,
} from '../page/draftStore.ts'
import { createReducer, initialState, restoredState, type ReviewState } from '../page/state.ts'
import { SHA, manifest } from './fixtures.ts'

const m = manifest()
const reduce = createReducer(m)
const OTHER_SHA = 'b'.repeat(64)

function memoryStorage(): DraftStorage & { items: Map<string, string> } {
  const items = new Map<string, string>()
  return {
    items,
    getItem: (k) => items.get(k) ?? null,
    setItem: (k, v) => void items.set(k, v),
    removeItem: (k) => void items.delete(k),
  }
}

const brokenStorage: DraftStorage = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
  removeItem: () => {
    throw new Error('SecurityError')
  },
}

function reviewedState(): ReviewState {
  const pin = { width: 360, x: 12, y: 34, xPct: 0.03, yPct: 0.05 }
  const actions = [
    { type: 'verdict', key: 'A', verdict: 'chosen' },
    { type: 'verdict', key: 'B', verdict: 'rejected' },
    { type: 'variantComment', key: 'A', comment: 'Keep the pill' },
    { type: 'addPin', key: 'A', pin },
    { type: 'pinNote', key: 'A', id: 'A-1', note: 'too tight' },
    { type: 'pick', id: 'q1', option: 'A', many: false },
    { type: 'answerComment', id: 'q1', comment: 'close call' },
    { type: 'general', text: 'next round: light mode' },
  ] as const
  return actions.reduce(reduce, initialState(m))
}

describe('draft persistence', () => {
  it('restores verdicts, comments, pins and answers after a reload', () => {
    const storage = memoryStorage()
    const before = reviewedState()
    saveDraft(storage, SHA, before.draft)

    const after = restoredState(m, SHA, storage)

    expect(after.draft).toEqual(before.draft)
    expect(after.active).toBe(0)
    expect(after.screen).toBe('form')
  })

  it('restores nothing for an edited manifest', () => {
    const storage = memoryStorage()
    saveDraft(storage, SHA, reviewedState().draft)
    expect(restoredState(m, OTHER_SHA, storage)).toEqual(initialState(m))
  })

  it('forgets the draft once the round is sent', () => {
    const storage = memoryStorage()
    saveDraft(storage, SHA, reviewedState().draft)
    clearDraft(storage, SHA)
    expect(storage.items.has(draftKey(SHA))).toBe(false)
    expect(restoredState(m, SHA, storage)).toEqual(initialState(m))
  })

  it.each([
    ['unparseable JSON', '{"variants":'],
    ['the wrong shape', JSON.stringify({ variants: [], answers: 'x', general: 3 })],
    [
      'variants that do not match this manifest',
      JSON.stringify({ variants: {}, answers: {}, general: '' }),
    ],
    ['an oversized value', 'x'.repeat(MAX_DRAFT_CHARS + 1)],
  ])('ignores %s and starts clean', (_, raw) => {
    const storage = memoryStorage()
    storage.setItem(draftKey(SHA), raw)
    expect(restoredState(m, SHA, storage)).toEqual(initialState(m))
  })

  it('works with no storage at all, or storage that throws', () => {
    const draft = reviewedState().draft
    expect(restoredState(m, SHA, null)).toEqual(initialState(m))
    expect(restoredState(m, SHA, brokenStorage)).toEqual(initialState(m))
    expect(() => saveDraft(brokenStorage, SHA, draft)).not.toThrow()
    expect(() => clearDraft(brokenStorage, SHA)).not.toThrow()
  })
})
