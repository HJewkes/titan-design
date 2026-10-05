import { act, renderHook, type RenderHookResult } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ancestorsOf, indexNodes } from './tree-model'
import { fixtures } from './fixtures'
import type { TreeNode } from './types'
import {
  useTreeNavigation,
  type TreeNavigation,
  type TreeNavigationOptions,
} from './useTreeNavigation'

type Options = TreeNavigationOptions<unknown>
type Hook = RenderHookResult<TreeNavigation<unknown>, Options>

// apps (loaded: api, auth), bin (three unloaded children), cli (leaf)
const NODES: TreeNode[] = [
  { id: 'apps', parentId: null, label: 'apps', childCount: 2 },
  { id: 'apps/api', parentId: 'apps', label: 'api' },
  { id: 'apps/auth', parentId: 'apps', label: 'auth' },
  { id: 'bin', parentId: null, label: 'bin', childCount: 3 },
  { id: 'cli', parentId: null, label: 'cli' },
]

const setup = (options: Partial<Options> = {}): Hook =>
  renderHook((props: Options) => useTreeNavigation(props), {
    initialProps: { nodes: NODES, ...options },
  })

const ids = (hook: Hook) => hook.result.current.rows.map((row) => row.id)
const rowProps = (hook: Hook, id: string) => {
  const row = hook.result.current.rows.find((r) => r.id === id)
  if (!row) throw new Error(`row ${id} is not visible`)
  return hook.result.current.getRowProps(row)
}

function press(hook: Hook, key: string) {
  const focused = hook.result.current.focusedId
  if (focused === null) throw new Error('no focused row')
  const preventDefault = vi.fn()
  act(() => rowProps(hook, focused).onKeyDown({ key, preventDefault }))
  return preventDefault
}

describe('useTreeNavigation, selection', () => {
  it('calls onSelect for a controlled selectedId and leaves the value to the prop', () => {
    const onSelect = vi.fn()
    const hook = setup({ selectedId: 'cli', onSelect })

    press(hook, 'ArrowUp')
    press(hook, 'Enter')

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('bin')
    expect(hook.result.current.selectedId).toBe('cli')
    expect(rowProps(hook, 'bin').isSelected).toBe(false)
  })

  it('never selects on arrows, Home, End, star or typeahead', () => {
    const onSelect = vi.fn()
    const hook = setup({ onSelect })

    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowUp', 'End', 'Home', '*', 'c']) {
      press(hook, key)
    }

    expect(hook.result.current.focusedId).toBe('cli')
    expect(onSelect).not.toHaveBeenCalled()
    expect(hook.result.current.selectedId).toBeNull()
  })

  it('never selects when a row takes focus', () => {
    const onSelect = vi.fn()
    const hook = setup({ onSelect })

    act(() => rowProps(hook, 'cli').onFocus())

    expect(hook.result.current.focusedId).toBe('cli')
    expect(onSelect).not.toHaveBeenCalled()
    expect(hook.result.current.selectedId).toBeNull()
  })

  it('selects once on Space and on press', () => {
    const onSelect = vi.fn()
    const hook = setup({ onSelect })

    press(hook, ' ')
    act(() => rowProps(hook, 'cli').onPress())

    expect(onSelect.mock.calls).toEqual([['apps'], ['cli']])
    expect(hook.result.current.focusedId).toBe('cli')
  })
})

describe('useTreeNavigation, lazy children', () => {
  it('calls onLoadChildren once per expand and not again while the id is loading', () => {
    const onLoadChildren = vi.fn()
    const hook = setup({ onLoadChildren })
    press(hook, 'ArrowDown')

    press(hook, 'ArrowRight')
    press(hook, 'ArrowRight')
    expect(onLoadChildren.mock.calls).toEqual([['bin']])

    hook.rerender({ nodes: NODES, onLoadChildren, loadingIds: new Set(['bin']) })
    press(hook, 'ArrowLeft')
    press(hook, 'ArrowRight')
    press(hook, '*')
    act(() => rowProps(hook, 'bin').onToggle())
    act(() => rowProps(hook, 'bin').onToggle())

    expect(onLoadChildren).toHaveBeenCalledTimes(1)
    expect(rowProps(hook, 'bin').isLoading).toBe(true)
  })

  it('loads every unloaded sibling on star without moving focus', () => {
    const onLoadChildren = vi.fn()
    const hook = setup({ onLoadChildren })

    press(hook, '*')

    expect(onLoadChildren.mock.calls).toEqual([['bin']])
    expect(hook.result.current.expandedIds).toEqual(new Set(['apps', 'bin']))
    expect(hook.result.current.focusedId).toBe('apps')
  })
})

describe('useTreeNavigation, typeahead', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resets the buffer 500 ms after the last key', () => {
    const hook = setup()

    press(hook, 'b')
    act(() => vi.advanceTimersByTime(499))
    press(hook, 'c')
    expect(hook.result.current.focusedId).toBe('bin')

    act(() => vi.advanceTimersByTime(500))
    press(hook, 'c')
    expect(hook.result.current.focusedId).toBe('cli')
  })

  it('keeps focus on a row whose label goes on matching the buffer', () => {
    const hook = setup({ defaultExpandedIds: new Set(['apps']) })

    press(hook, 'a')
    press(hook, 'p')

    expect(hook.result.current.focusedId).toBe('apps/api')
  })
})

describe('useTreeNavigation, uncontrolled', () => {
  it('expands, collapses and selects with only the default props', () => {
    const hook = setup({ defaultExpandedIds: new Set(['apps']), defaultSelectedId: 'cli' })
    expect(ids(hook)).toEqual(['apps', 'apps/api', 'apps/auth', 'bin', 'cli'])
    expect(hook.result.current.focusedId).toBe('cli')

    press(hook, 'Home')
    press(hook, 'ArrowLeft')
    expect(ids(hook)).toEqual(['apps', 'bin', 'cli'])

    press(hook, 'Enter')
    expect(hook.result.current.selectedId).toBe('apps')
    expect(rowProps(hook, 'apps').isSelected).toBe(true)
  })

  it('reports expansion to a controlled owner without changing the rows itself', () => {
    const onExpandedChange = vi.fn()
    const expandedIds = new Set<string>()
    const hook = setup({ expandedIds, onExpandedChange })

    press(hook, 'ArrowRight')

    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['apps']), {
      id: 'apps',
      isExpanded: true,
    })
    expect(expandedIds.size).toBe(0)
    expect(ids(hook)).toEqual(['apps', 'bin', 'cli'])
  })
})

describe('useTreeNavigation, row props', () => {
  it('gives exactly one visible row the tab stop, and leaves isExpanded undefined on leaves', () => {
    const hook = setup({ defaultExpandedIds: new Set(['apps']) })
    press(hook, 'ArrowDown')

    const props = hook.result.current.rows.map((row) => hook.result.current.getRowProps(row))

    expect(props.filter((p) => p.tabIndex === 0).map((p) => p.id)).toEqual(['apps/api'])
    expect(props.map((p) => p.isExpanded)).toEqual([true, undefined, undefined, false, undefined])
    expect(props[2]).toMatchObject({ level: 2, setsize: 2, posinset: 2, isFocused: false })
  })

  it('moves the tab stop to the nearest visible ancestor when the focused row is hidden', () => {
    const hook = setup({ defaultExpandedIds: new Set(['apps']) })
    act(() => rowProps(hook, 'apps/auth').onFocus())

    act(() => rowProps(hook, 'apps').onToggle())

    expect(hook.result.current.focusedId).toBe('apps')
  })
})

describe('useTreeNavigation, collapsing over focus', () => {
  it('moves focus onto a row collapsed by its expander and keeps it there on re-expand', () => {
    const hook = setup({ defaultExpandedIds: new Set(['apps']) })
    act(() => rowProps(hook, 'apps/auth').onFocus())

    act(() => rowProps(hook, 'apps').onToggle())
    act(() => rowProps(hook, 'apps').onToggle())

    expect(ids(hook)).toEqual(['apps', 'apps/api', 'apps/auth', 'bin', 'cli'])
    expect(hook.result.current.focusedId).toBe('apps')
  })
})

describe('useTreeNavigation, revealId', () => {
  it('expands the loaded ancestors of revealId and focuses it', () => {
    const { nodes, revealId = '' } = fixtures.deep
    const ancestors = ancestorsOf(indexNodes(nodes), revealId)
    const hook = renderHook(() => useTreeNavigation({ nodes, revealId }))

    expect(ancestors.length).toBeGreaterThan(2)
    expect(hook.result.current.expandedIds).toEqual(new Set(ancestors))
    expect(hook.result.current.focusedId).toBe(revealId)
  })
})

describe('useTreeNavigation, revealId before its rows load', () => {
  it('waits for the ancestors to arrive, then reveals', () => {
    const revealId = 'bin/src/main'
    const hook = setup({ revealId })
    expect(hook.result.current.expandedIds).toEqual(new Set())
    expect(hook.result.current.focusedId).toBe('apps')

    const loaded: TreeNode[] = [
      ...NODES,
      { id: 'bin/src', parentId: 'bin', label: 'src', childCount: 1 },
      { id: revealId, parentId: 'bin/src', label: 'main' },
    ]
    hook.rerender({ nodes: loaded, revealId })

    expect(hook.result.current.expandedIds).toEqual(new Set(['bin', 'bin/src']))
    expect(hook.result.current.focusedId).toBe(revealId)
  })
})

describe('useTreeNavigation, isDisabled', () => {
  it('moves focus on keys but does not select, expand or load', () => {
    const onSelect = vi.fn()
    const onLoadChildren = vi.fn()
    const hook = setup({ isDisabled: true, onSelect, onLoadChildren })

    press(hook, 'ArrowDown')
    press(hook, 'ArrowRight')
    press(hook, 'Enter')

    expect(hook.result.current.focusedId).toBe('bin')
    expect(hook.result.current.getTreeProps()).toEqual({ isDisabled: true, focusedId: 'bin' })
    expect(onSelect).not.toHaveBeenCalled()
    expect(onLoadChildren).not.toHaveBeenCalled()
    expect(ids(hook)).toEqual(['apps', 'bin', 'cli'])
  })

  it('does not select on press', () => {
    const onSelect = vi.fn()
    const hook = setup({ isDisabled: true, onSelect })

    act(() => rowProps(hook, 'cli').onPress())

    expect(hook.result.current.focusedId).toBe('cli')
    expect(onSelect).not.toHaveBeenCalled()
    expect(hook.result.current.selectedId).toBeNull()
  })

  it('neither expands nor loads from the expander', () => {
    const onLoadChildren = vi.fn()
    const onExpandedChange = vi.fn()
    const hook = setup({ isDisabled: true, onLoadChildren, onExpandedChange })

    act(() => rowProps(hook, 'bin').onToggle())
    act(() => rowProps(hook, 'apps').onToggle())

    expect(ids(hook)).toEqual(['apps', 'bin', 'cli'])
    expect(onExpandedChange).not.toHaveBeenCalled()
    expect(onLoadChildren).not.toHaveBeenCalled()
  })

  it('ignores keys it does not handle without preventing their default', () => {
    const hook = setup()

    expect(press(hook, 'Tab')).not.toHaveBeenCalled()
    expect(press(hook, 'ArrowDown')).toHaveBeenCalledTimes(1)
  })
})
