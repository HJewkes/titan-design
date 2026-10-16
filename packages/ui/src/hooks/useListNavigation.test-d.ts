import { expectTypeOf, test } from 'vitest'
import { useListNavigation, type ListNavigationKeyEvent } from './useListNavigation'

test('useListNavigation takes the list options and returns a key handler and item props', () => {
  expectTypeOf(useListNavigation).parameter(0).toEqualTypeOf<{
    count: number
    activeIndex: number
    onActiveIndexChange: (index: number) => void
    isDisabled?: (index: number) => boolean
    loop?: boolean
    focusMode: 'roving' | 'virtual'
    getLabel?: (index: number) => string
  }>()
  expectTypeOf(useListNavigation).returns.toEqualTypeOf<{
    onKeyDown: (event: ListNavigationKeyEvent) => void
    getItemProps: (index: number) => { tabIndex: 0 | -1; ref: (node: unknown) => void }
  }>()
})

test('the key event is the structural shape a View and a TextInput both satisfy', () => {
  expectTypeOf<ListNavigationKeyEvent>().toEqualTypeOf<{
    key: string
    preventDefault: () => void
  }>()
})

test('focusMode is required', () => {
  // @ts-expect-error focusMode is missing
  useListNavigation({ count: 1, activeIndex: 0, onActiveIndexChange: () => {} })
})
