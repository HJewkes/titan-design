import { describe, expectTypeOf, it } from 'vitest'
import type { ColorToken } from '../../../../theme/resolve-color'
import type { BarListMarker, BarListProps, BarListRow, BarListRowContext } from './BarList'

describe('BarList types', () => {
  it('requires rows and accessibilityLabel', () => {
    expectTypeOf<BarListProps['rows']>().toEqualTypeOf<BarListRow[]>()
    expectTypeOf<BarListProps['accessibilityLabel']>().toEqualTypeOf<string>()
    // @ts-expect-error rows and accessibilityLabel are required
    const missing: BarListProps = {}
    void missing
  })

  it('hands formatValue a number, never null', () => {
    expectTypeOf<NonNullable<BarListProps['formatValue']>>().parameter(0).toEqualTypeOf<number>()
  })

  it('rejects an arbitrary string as color', () => {
    expectTypeOf<NonNullable<BarListProps['color']>>().toEqualTypeOf<ColorToken>()
    // @ts-expect-error not a semantic color token
    const bad: BarListProps['color'] = 'not-a-token'
    void bad
  })

  it('takes an optional referenceMarker object, never a bare number', () => {
    expectTypeOf<BarListProps['referenceMarker']>().toEqualTypeOf<BarListMarker | undefined>()
    // @ts-expect-error a marker needs a label
    const bare: BarListProps['referenceMarker'] = 100
    void bare
  })

  it('hands the marker formatter a number and the row context a boolean', () => {
    expectTypeOf<NonNullable<BarListMarker['formatValue']>>().parameter(0).toEqualTypeOf<number>()
    expectTypeOf<BarListRowContext['reachesMarker']>().toEqualTypeOf<boolean>()
  })
})
