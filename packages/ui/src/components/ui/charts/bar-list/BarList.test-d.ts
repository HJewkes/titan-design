import { describe, expectTypeOf, it } from 'vitest'
import type { ViewProps } from 'react-native'
import type { ColorToken } from '../../../../theme/resolve-color'
import type { BarListMarker, BarListProps, BarListReadout, BarListRow } from './BarList'

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

  it('hands formatValue an optional row, absent for the hidden total', () => {
    expectTypeOf<NonNullable<BarListProps['formatValue']>>()
      .parameter(1)
      .toEqualTypeOf<BarListRow | undefined>()
  })

  it('keeps a per-row color and takes no list-wide one', () => {
    expectTypeOf<BarListRow['color']>().toEqualTypeOf<ColorToken | undefined>()
    expectTypeOf<BarListProps>().not.toHaveProperty('color')
  })

  it('takes readouts as a list of the two readout names', () => {
    expectTypeOf<BarListReadout>().toEqualTypeOf<'value' | 'flag'>()
    expectTypeOf<BarListProps['readouts']>().toEqualTypeOf<BarListReadout[] | undefined>()
  })

  it('declares exactly the fourteen audited props', () => {
    type Own = Exclude<keyof BarListProps, keyof ViewProps> | 'accessibilityLabel' | 'className'
    expectTypeOf<Own>().toEqualTypeOf<
      | 'rows'
      | 'accessibilityLabel'
      | 'max'
      | 'referenceMarker'
      | 'sort'
      | 'maxRows'
      | 'layout'
      | 'size'
      | 'formatValue'
      | 'formatSecondary'
      | 'readouts'
      | 'isLoading'
      | 'emptyState'
      | 'className'
    >()
  })

  it('takes an optional referenceMarker object, never a bare number', () => {
    expectTypeOf<BarListProps['referenceMarker']>().toEqualTypeOf<BarListMarker | undefined>()
    // @ts-expect-error a marker needs a label
    const bare: BarListProps['referenceMarker'] = 100
    void bare
  })

  it('hands the marker formatter a number', () => {
    expectTypeOf<NonNullable<BarListMarker['formatValue']>>().parameter(0).toEqualTypeOf<number>()
  })
})
