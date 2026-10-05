import { expectTypeOf, test } from 'vitest'
import { useTableState } from './useTableState'

// An interface has no implicit index signature, so a `Record<string, unknown>` bound would reject it.
interface Row {
  id: string
  score: number
}

test('useTableState accepts interface rows', () => {
  expectTypeOf(useTableState<Row>)
    .parameter(0)
    .toHaveProperty('data')
    .toEqualTypeOf<Row[] | undefined>()
})
