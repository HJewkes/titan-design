import { describe, it, expect } from 'vitest'
import { TASK_PR_STATE_META, toTaskPrState } from './task-pr'

describe('toTaskPrState', () => {
  it('maps OPEN, MERGED, CLOSED and draft in any case', () => {
    expect(toTaskPrState('OPEN')).toBe('open')
    expect(toTaskPrState('Merged')).toBe('merged')
    expect(toTaskPrState('closed')).toBe('closed')
    expect(toTaskPrState('draft')).toBe('draft')
  })

  it('returns undefined for an unknown state instead of defaulting to open', () => {
    for (const raw of ['WEIRD', '', 'constructor']) expect(toTaskPrState(raw)).toBeUndefined()
  })

  it('gives every state a label', () => {
    for (const meta of Object.values(TASK_PR_STATE_META)) expect(meta.label).not.toBe('')
  })
})
