import { expectTypeOf, test } from 'vitest'
import type { ControlledProps } from './index'

test('ControlledProps types value, defaultValue and onValueChange by T, all optional', () => {
  expectTypeOf<ControlledProps<number>>().toEqualTypeOf<{
    value?: number
    defaultValue?: number
    onValueChange?: (value: number) => void
  }>()
})

test('ControlledProps rejects a value of another type', () => {
  expectTypeOf<{ value: string }>().not.toMatchTypeOf<ControlledProps<number>>()
})
