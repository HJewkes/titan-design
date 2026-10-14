import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { smallFixture } from './fixtures'
import { layeredLayout } from './layouts/layered-layout-model'
import { buildGraphModel } from './network-graph-model'
import type { GraphEdge, GraphItemRef } from './types'
import {
  PULSE_MS,
  useEdgePulses,
  useNetworkGraph,
  type UseNetworkGraphOptions,
} from './useNetworkGraph'

const build = (edges: GraphEdge[] = smallFixture.edges) =>
  buildGraphModel(smallFixture.nodes, edges, layeredLayout(), { width: 720, height: 420 })
const model = build()
const WORKER_02: GraphItemRef = { type: 'node', id: 'worker-02' }
const SPAWN_EDGE: GraphItemRef = { type: 'edge', id: 'lead-01->worker-01:spawn' }

const setup = (options: Partial<UseNetworkGraphOptions> = {}) =>
  renderHook((props: Partial<UseNetworkGraphOptions>) => useNetworkGraph({ model, ...props }), {
    initialProps: options,
  })

afterEach(() => {
  vi.useRealTimers()
})

describe('useNetworkGraph selection', () => {
  it('starts at defaultSelection, toggles on and off, and reports each change', () => {
    const onSelectionChange = vi.fn()
    const { result } = setup({ defaultSelection: WORKER_02, onSelectionChange })
    expect(result.current.selection).toEqual(WORKER_02)
    act(() => result.current.toggle(WORKER_02))
    expect(result.current.selection).toBeNull()
    act(() => result.current.toggle(SPAWN_EDGE))
    expect(result.current.selection).toEqual(SPAWN_EDGE)
    expect(onSelectionChange.mock.calls).toEqual([[null], [SPAWN_EDGE]])
  })

  it('reports a change and keeps the controlled value until the prop changes', () => {
    const onSelectionChange = vi.fn()
    const { result, rerender } = setup({ selection: null, onSelectionChange })
    act(() => result.current.toggle(WORKER_02))
    expect(onSelectionChange).toHaveBeenCalledWith(WORKER_02)
    expect(result.current.selection).toBeNull()
    rerender({ selection: WORKER_02, onSelectionChange })
    expect(result.current.selection).toEqual(WORKER_02)
  })

  it('treats a selection that is not drawn as none and never reports it back', () => {
    const onSelectionChange = vi.fn()
    const { result } = setup({ selection: { type: 'node', id: 'ghost' }, onSelectionChange })
    expect(result.current.selection).toBeNull()
    act(() => void result.current.handleKey('Escape'))
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('does not change the selection while disabled', () => {
    const onSelectionChange = vi.fn()
    const { result } = setup({ defaultSelection: WORKER_02, onSelectionChange, isDisabled: true })
    act(() => result.current.toggle(SPAWN_EDGE))
    act(() => void result.current.handleKey('Escape'))
    expect(result.current.selection).toEqual(WORKER_02)
    expect(onSelectionChange).not.toHaveBeenCalled()
  })
})

describe('useNetworkGraph active item', () => {
  it('a hover makes an item active, and leaving clears it while the graph has no focus', () => {
    const { result } = setup()
    act(() => result.current.activate(SPAWN_EDGE))
    expect(result.current.active).toEqual({ ...SPAWN_EDGE, from: 'lead-01' })
    act(() => result.current.deactivate())
    expect(result.current.active).toBeNull()
  })

  it('keeps the cursor when a hover ends while the graph has focus, and drops it on leave', () => {
    const { result } = setup()
    act(() => result.current.enter())
    act(() => result.current.activate(WORKER_02))
    act(() => result.current.deactivate())
    expect(result.current.active).toEqual(WORKER_02)
    expect(result.current.isFocused).toBe(true)
    act(() => result.current.leave())
    expect([result.current.active, result.current.isFocused]).toEqual([null, false])
  })

  it('enters at the hovered item when there is one', () => {
    const { result } = setup({ defaultSelection: SPAWN_EDGE })
    act(() => {
      result.current.activate(WORKER_02)
      result.current.enter()
    })
    expect(result.current.active).toEqual(WORKER_02)
  })

  it('takes focus from a pointer without placing the cursor', () => {
    const { result } = setup()
    act(() => result.current.enter(true))
    expect([result.current.isFocused, result.current.active]).toEqual([true, null])
  })

  it('drops an active item that the next model no longer draws', () => {
    const { result, rerender } = setup()
    act(() => result.current.activate(SPAWN_EDGE))
    rerender({ model: build(smallFixture.edges.filter((edge) => edge.kind !== 'spawn')) })
    expect(result.current.active).toBeNull()
  })

  it('takes a move key with no active item as an entry, and ignores other keys', () => {
    const { result } = setup()
    let handled = false
    act(() => void (handled = result.current.handleKey('ArrowDown')))
    expect([handled, result.current.active]).toEqual([true, { type: 'node', id: 'lead-01' }])
    for (const key of ['Tab', 'a', 'toString', 'constructor']) {
      act(() => void (handled = result.current.handleKey(key)))
      expect([key, handled]).toEqual([key, false])
    }
    expect(result.current.active).toEqual({ type: 'node', id: 'lead-01' })
  })

  it('Escape leaves the default action alone and dismisses the tooltip until the item changes', () => {
    const { result } = setup()
    act(() => result.current.enter())
    let handled = true
    act(() => void (handled = result.current.handleKey('Escape')))
    expect([handled, result.current.isTooltipDismissed]).toEqual([false, true])
    act(() => void result.current.handleKey('ArrowDown'))
    expect(result.current.isTooltipDismissed).toBe(false)
  })
})

describe('useEdgePulses', () => {
  const edges = (activityAt?: number): GraphEdge[] => [
    { id: 'a', source: 'x', target: 'y', activityAt },
    { id: 'b', source: 'y', target: 'z' },
  ]

  it('pulses nothing on the first render, then each edge whose activityAt rose', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook((list: GraphEdge[]) => useEdgePulses(list), {
      initialProps: edges(10),
    })
    expect(result.current.size).toBe(0)
    rerender(edges(10))
    rerender(edges(9))
    expect(result.current.size).toBe(0)
    rerender(edges(11))
    expect([...result.current]).toEqual([['a', 11]])
  })

  it('ends a pulse after PULSE_MS, and a newer value restarts the wait', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook((list: GraphEdge[]) => useEdgePulses(list), {
      initialProps: edges(),
    })
    rerender(edges(1))
    act(() => void vi.advanceTimersByTime(PULSE_MS - 1))
    rerender(edges(2))
    act(() => void vi.advanceTimersByTime(PULSE_MS - 1))
    expect([...result.current]).toEqual([['a', 2]])
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current.size).toBe(0)
  })

  it('pulses an edge that arrives after mount with an activityAt', () => {
    const { result, rerender } = renderHook((list: GraphEdge[]) => useEdgePulses(list), {
      initialProps: edges(),
    })
    rerender([...edges(), { id: 'c', source: 'z', target: 'x', activityAt: 5 }])
    expect([...result.current]).toEqual([['c', 5]])
  })

  it('leaves no timer running after unmount', () => {
    vi.useFakeTimers()
    const { rerender, unmount } = renderHook((list: GraphEdge[]) => useEdgePulses(list), {
      initialProps: edges(),
    })
    rerender(edges(1))
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
