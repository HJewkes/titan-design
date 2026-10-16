import { expectTypeOf, test } from 'vitest'
import { useControllableState } from './useControllableState'

test('useControllableState returns the value and a setter of the same type', () => {
  const result = useControllableState<boolean>({ value: undefined, defaultValue: false })
  expectTypeOf(result).toEqualTypeOf<[boolean, (next: boolean) => void]>()
})

test('useControllableState infers T from defaultValue', () => {
  const [value] = useControllableState({ value: undefined, defaultValue: 'a' })
  expectTypeOf(value).toEqualTypeOf<string>()
})
