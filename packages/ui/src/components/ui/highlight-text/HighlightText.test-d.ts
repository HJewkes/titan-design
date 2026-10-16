import { describe, expectTypeOf, it } from 'vitest'
import type { MatchRange } from '../command-palette/types'
import type { HighlightRange } from './highlight-model'

describe('HighlightRange types', () => {
  it('accepts the command palette MatchRange list', () => {
    expectTypeOf<MatchRange[]>().toMatchTypeOf<readonly HighlightRange[]>()
  })
})
