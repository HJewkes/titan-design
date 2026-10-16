import { describe, expect, it } from 'vitest'
import { compareText } from './compareText'

describe('compareText', () => {
  it('orders by code unit, so capitals sort before lower case', () => {
    expect(['b', 'B', 'a'].sort(compareText)).toEqual(['B', 'a', 'b'])
  })

  it('returns 0 for equal text', () => {
    expect(compareText('node', 'node')).toBe(0)
  })
})
