import { describe, it, expect } from 'vitest'

import { REVEAL_PX, revealOffset } from './RevealRow'

describe('revealOffset', () => {
  it('follows a leftward drag one to one', () => {
    expect(revealOffset(-30)).toBe(30)
  })

  it('stops at the width of the time column', () => {
    expect(revealOffset(-400)).toBe(REVEAL_PX)
  })

  it('ignores a rightward drag', () => {
    expect(revealOffset(40)).toBe(0)
  })
})
