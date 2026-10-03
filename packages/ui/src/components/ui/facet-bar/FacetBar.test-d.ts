import { describe, expectTypeOf, it } from 'vitest'
import type { FacetBarProps, FacetOption } from './FacetBar'

type Record = 'notes' | 'sources'

describe('FacetBar types', () => {
  it('multiple mode takes and reports arrays', () => {
    type Multiple = Extract<FacetBarProps<Record>, { selectionMode?: 'multiple' }>
    expectTypeOf<Multiple['value']>().toEqualTypeOf<ReadonlyArray<Record> | undefined>()
    expectTypeOf<NonNullable<Multiple['onValueChange']>>().parameter(0).toEqualTypeOf<Record[]>()
  })

  it('single mode takes T or null and rejects an array', () => {
    type Single = Extract<FacetBarProps<Record>, { selectionMode: 'single' }>
    expectTypeOf<Single['value']>().toEqualTypeOf<Record | null | undefined>()
    expectTypeOf<NonNullable<Single['onValueChange']>>().parameter(0).toEqualTypeOf<Record | null>()
    const options: ReadonlyArray<FacetOption<Record>> = []
    const ok: FacetBarProps<Record> = { label: 'a', options, selectionMode: 'single', value: null }
    const bad: FacetBarProps<Record> = {
      label: 'a',
      options,
      selectionMode: 'single',
      // @ts-expect-error single mode does not accept an array
      value: ['notes'],
    }
    void [ok, bad]
  })

  it('requires label and options', () => {
    // @ts-expect-error label is required
    const noLabel: FacetBarProps = { options: [] }
    // @ts-expect-error options is required
    const noOptions: FacetBarProps = { label: 'a' }
    void [noLabel, noOptions]
  })

  it('rejects an option value outside T', () => {
    // @ts-expect-error 'other' is not a member of Record
    const bad: FacetBarProps<Record> = { label: 'a', options: [{ value: 'other', label: 'x' }] }
    void bad
  })
})
