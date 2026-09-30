import { describe, expectTypeOf, it } from 'vitest'
import type { SelectOption, SelectProps } from './Select'

type Size = 'sm' | 'md' | 'lg'

describe('Select types', () => {
  it('flows T from options to onChange', () => {
    type Props = SelectProps<Size>

    expectTypeOf<Props['options']>().toEqualTypeOf<SelectOption<Size>[]>()
    expectTypeOf<NonNullable<Props['onChange']>>().parameter(0).toEqualTypeOf<Size | null>()
    expectTypeOf<NonNullable<Props['onChangeMulti']>>().parameter(0).toEqualTypeOf<Size[]>()
  })

  it('rejects a value outside T', () => {
    const options: SelectOption<Size>[] = [
      { value: 'sm', label: 'Small' },
      // @ts-expect-error 'xl' is not a member of Size
      { value: 'xl', label: 'Extra large' },
    ]
    expectTypeOf(options).toEqualTypeOf<SelectOption<Size>[]>()
  })

  it('narrows the onChange argument to T rather than string', () => {
    const onChange: NonNullable<SelectProps<Size>['onChange']> = (next) => {
      expectTypeOf(next).toEqualTypeOf<Size | null>()
    }
    // @ts-expect-error a handler typed for T cannot accept a foreign literal
    onChange('xl')
    onChange('sm')
  })
})
