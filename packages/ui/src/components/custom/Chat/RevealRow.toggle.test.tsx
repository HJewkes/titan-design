import { describe, it, expect } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { Animated } from 'react-native'

import { REVEAL_PX, useRevealGesture } from './RevealRow'

const valueOf = (offset: Animated.Value) =>
  (offset as unknown as { __getValue(): number }).__getValue()

describe('useRevealGesture toggle', () => {
  it('slides the thread out to the full reveal width without a pan gesture', async () => {
    const { result } = renderHook(() => useRevealGesture(false))

    act(() => result.current.toggle())

    await waitFor(() => expect(valueOf(result.current.offset)).toBe(REVEAL_PX))
    expect(result.current.revealed).toBe(true)
  })

  it('slides the thread back when toggled again', async () => {
    const { result } = renderHook(() => useRevealGesture(true))

    act(() => result.current.toggle())

    await waitFor(() => expect(valueOf(result.current.offset)).toBe(0))
    expect(result.current.revealed).toBe(false)
  })
})
