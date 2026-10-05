import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Pressable, Text } from 'react-native'
import { describe, expect, it, vi } from 'vitest'
import { expectBoundedMount } from '../../../test/scale'
import { renderMetric } from './fixture-slots'
import { fixtures, type HierarchyNode, type TreeFixture } from './fixtures'
import { indexNodes, visibleRows } from './tree-model'
import { TreeView, type TreeViewProps } from './TreeView'
import { ROW_HEIGHT } from './TreeRow'
import type { TreeNode } from './types'
import { TREE_OVERSCAN } from './useTreeWindow'

// apps (loaded: api, auth), bin (three unloaded children), cli (leaf)
const NODES: TreeNode[] = [
  { id: 'apps', parentId: null, label: 'apps', childCount: 2 },
  { id: 'apps/api', parentId: 'apps', label: 'api' },
  { id: 'apps/auth', parentId: 'apps', label: 'auth' },
  { id: 'bin', parentId: null, label: 'bin', childCount: 3 },
  { id: 'cli', parentId: null, label: 'cli' },
]

const HEIGHT = 400
const WINDOW_MAX = Math.ceil(HEIGHT / ROW_HEIGHT.comfortable) + 1 + 2 * TREE_OVERSCAN

const LARGE = fixtures.veryLarge.nodes
const ALL_LARGE_OPEN = new Set(LARGE.map((node) => node.id))
const LARGE_ROWS = visibleRows(indexNodes(LARGE), ALL_LARGE_OPEN, null)

type Props = Partial<TreeViewProps<unknown>>

function renderTree(props: Props = {}) {
  return render(<TreeView accessibilityLabel="Code tree" nodes={NODES} {...props} />)
}

function renderLarge(props: Partial<TreeViewProps<HierarchyNode['data']>> = {}) {
  return render(
    <TreeView
      accessibilityLabel="Code tree"
      nodes={LARGE}
      defaultExpandedIds={ALL_LARGE_OPEN}
      height={HEIGHT}
      {...props}
    />
  )
}

const row = (name: string) => screen.getByRole('treeitem', { name })
const focusedName = () => document.activeElement?.getAttribute('aria-label')
const tabStops = () => document.querySelectorAll('[role="treeitem"][tabindex="0"]')

const descriptionOf = (el: HTMLElement) =>
  document.getElementById(el.getAttribute('aria-describedby') ?? '')?.textContent ?? ''

function focusRow(name: string) {
  act(() => row(name).focus())
}

function press(key: string) {
  const target = document.activeElement
  if (!target || target === document.body) throw new Error('nothing has focus')
  return fireEvent.keyDown(target, { key })
}

describe('TreeView, the R2 spike: react-native-web passes ARIA through as DOM props', () => {
  it('puts tree, treeitem, level, set, position, roving tabindex and describedby on the DOM', () => {
    renderTree({
      defaultExpandedIds: new Set(['apps']),
      renderTrailing: (n) => <Text>{`${n.label} trail`}</Text>,
    })

    expect(screen.getByRole('tree')).toHaveAttribute('aria-label', 'Code tree')
    const api = row('api')
    expect(api).toHaveAttribute('aria-level', '2')
    expect(api).toHaveAttribute('aria-setsize', '2')
    expect(api).toHaveAttribute('aria-posinset', '1')
    expect(api).toHaveAttribute('tabindex', '-1')
    expect(row('apps')).toHaveAttribute('tabindex', '0')
    expect(api).toHaveAccessibleDescription('api trail')
    expect(api).toHaveStyle({ paddingLeft: '16px' })
  })
})

describe('TreeView, APG keys', () => {
  const steps: [string, string][] = [
    ['ArrowDown', 'bin'],
    ['ArrowUp', 'apps'],
    ['ArrowRight', 'apps'],
    ['ArrowRight', 'api'],
    ['ArrowDown', 'auth'],
    ['ArrowLeft', 'apps'],
    ['ArrowLeft', 'apps'],
    ['End', 'cli'],
    ['Home', 'apps'],
    ['c', 'cli'],
    ['*', 'cli'],
  ]

  it('moves document.activeElement on every key and keeps exactly one tab stop', () => {
    renderTree()
    focusRow('apps')

    for (const [key, expected] of steps) {
      press(key)
      expect(focusedName(), `after ${key}`).toBe(expected)
      expect(tabStops(), `after ${key}`).toHaveLength(1)
    }
  })

  it('opens and closes rows on Right and Left', () => {
    renderTree()
    focusRow('apps')

    press('ArrowRight')
    expect(row('apps')).toHaveAttribute('aria-expanded', 'true')
    press('ArrowLeft')

    expect(row('apps')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('treeitem', { name: 'api' })).toBeNull()
  })

  it('selects once on Enter and once on Space, never on arrows', () => {
    const onSelect = vi.fn()
    renderTree({ onSelect })
    focusRow('apps')

    press('ArrowDown')
    expect(onSelect).not.toHaveBeenCalled()
    press('Enter')
    fireEvent.keyUp(document.activeElement as Element, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledTimes(1)
    press('ArrowDown')
    press(' ')

    expect(onSelect.mock.calls).toEqual([['bin'], ['cli']])
    expect(row('cli')).toHaveAttribute('aria-selected', 'true')
    expect(row('bin')).toHaveAttribute('aria-selected', 'false')
  })

  it('leaves Tab to the browser, so focus moves past the tree in one step', () => {
    render(
      <>
        <TreeView accessibilityLabel="Code tree" nodes={NODES} />
        <Pressable accessibilityRole="button" accessibilityLabel="After" />
      </>
    )
    focusRow('bin')

    expect(press('Tab')).toBe(true)
    const tabbable = [...document.querySelectorAll('[tabindex="0"]')]
    expect(tabbable.map((el) => el.getAttribute('aria-label'))).toEqual(['bin', 'After'])
  })

  it('selects on press', () => {
    const onSelect = vi.fn()
    renderTree({ onSelect })

    fireEvent.click(row('cli'))

    expect(onSelect).toHaveBeenCalledWith('cli')
    expect(row('cli')).toHaveAttribute('tabindex', '0')
  })
})

describe('TreeView, aria-expanded', () => {
  it('is absent on leaves and present on rows whose children are not loaded', () => {
    renderTree({ defaultExpandedIds: new Set(['apps']) })

    expect(row('cli')).not.toHaveAttribute('aria-expanded')
    expect(row('api')).not.toHaveAttribute('aria-expanded')
    expect(row('bin')).toHaveAttribute('aria-expanded', 'false')
    expect(row('apps')).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('TreeView, lazy rows', () => {
  it('asks for children on expand and shows a spinner while the row loads', () => {
    const onLoadChildren = vi.fn()
    const { rerender } = renderTree({ onLoadChildren })
    focusRow('bin')

    press('ArrowRight')
    expect(onLoadChildren).toHaveBeenCalledWith('bin')
    rerender(
      <TreeView accessibilityLabel="Code tree" nodes={NODES} loadingIds={new Set(['bin'])} />
    )

    expect(row('bin')).toHaveAttribute('aria-busy', 'true')
    expect(within(row('bin')).getAllByRole('progressbar', { hidden: true }).length).toBeGreaterThan(
      0
    )
    expect(row('apps')).not.toHaveAttribute('aria-busy')
  })
})

describe('TreeView, windowing', () => {
  it('mounts at most the window plus overscan of 5,000 rows', () => {
    expect(LARGE_ROWS).toHaveLength(5000)
    expectBoundedMount({
      render: () => (
        <TreeView
          accessibilityLabel="Code tree"
          nodes={LARGE}
          defaultExpandedIds={ALL_LARGE_OPEN}
          height={HEIGHT}
        />
      ),
      selector: '[role="treeitem"]',
      max: WINDOW_MAX,
    })
  })

  it('moves the window with the scroll offset', () => {
    renderLarge()
    const scroller = screen.getByRole('tree').parentElement?.parentElement as HTMLElement

    fireEvent.scroll(scroller, { target: { scrollTop: 100 * ROW_HEIGHT.comfortable } })

    const mounted = screen.getAllByRole('treeitem')
    expect(mounted.length).toBeLessThanOrEqual(WINDOW_MAX)
    expect(mounted.map((el) => el.getAttribute('aria-label'))).toContain(LARGE_ROWS[100].node.label)
    expect(screen.queryByRole('treeitem', { name: LARGE_ROWS[0].node.label })).toBeNull()
  })

  it('scrolls an off-window row in on End, then focuses it once it mounts', () => {
    renderLarge()
    focusRow(LARGE_ROWS[0].node.label)

    press('End')

    const last = LARGE_ROWS[LARGE_ROWS.length - 1]
    expect(document.activeElement).toHaveAttribute('aria-posinset', String(last.posinset))
    expect(focusedName()).toBe(last.node.label)
    expect(screen.getAllByRole('treeitem').length).toBeLessThanOrEqual(WINDOW_MAX)
    press('Home')
    expect(focusedName()).toBe(LARGE_ROWS[0].node.label)
  })

  it('scrolls revealId into the window without taking DOM focus', () => {
    const last = LARGE_ROWS[LARGE_ROWS.length - 1]
    renderLarge({ revealId: last.id })

    const mounted = screen.getAllByRole('treeitem')
    expect(mounted[mounted.length - 1]).toHaveAttribute('tabindex', '0')
    expect(mounted[mounted.length - 1]).toHaveAttribute('aria-label', last.node.label)
    expect(screen.queryByRole('treeitem', { name: LARGE_ROWS[0].node.label })).toBeNull()
    expect(document.activeElement).toBe(document.body)
  })

  it('re-renders at most the window plus overscan rows for one Down', () => {
    const renderTrailing = vi.fn(() => null)
    renderLarge({ renderTrailing })
    focusRow(LARGE_ROWS[0].node.label)
    renderTrailing.mockClear()

    press('ArrowDown')

    expect(focusedName()).toBe(LARGE_ROWS[1].node.label)
    expect(renderTrailing.mock.calls.length).toBeGreaterThan(0)
    expect(renderTrailing.mock.calls.length).toBeLessThanOrEqual(WINDOW_MAX)
  })

  it('mounts every row at natural height when height is absent (A6)', () => {
    renderTree({ defaultExpandedIds: new Set(['apps']) })

    expect(screen.getAllByRole('treeitem')).toHaveLength(5)
    expect(screen.getByRole('tree').closest('[style*="overflow"]')).toBeNull()
  })
})

describe('TreeView, states', () => {
  it('shows skeleton rows and no treeitems while loading', () => {
    renderTree({ isLoading: true })

    expect(screen.getByRole('tree')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryAllByRole('treeitem')).toHaveLength(0)
  })

  it('shows the default EmptyState for no nodes, and a consumer emptyState when given', () => {
    const { rerender } = renderTree({ nodes: [] })
    expect(screen.getByText('Nothing to show')).toBeInTheDocument()
    expect(screen.queryByRole('tree')).toBeNull()

    rerender(
      <TreeView accessibilityLabel="Code tree" nodes={[]} emptyState={<Text>None yet</Text>} />
    )

    expect(screen.getByText('None yet')).toBeInTheDocument()
  })

  it('when disabled, still moves focus but neither selects nor expands', () => {
    const onSelect = vi.fn()
    renderTree({ isDisabled: true, onSelect })
    expect(screen.getByRole('tree')).toHaveAttribute('aria-disabled', 'true')
    focusRow('apps')

    press('ArrowRight')
    press('Enter')
    press('ArrowDown')
    fireEvent.click(row('cli'))

    expect(focusedName()).toBe('bin')
    expect(row('apps')).toHaveAttribute('aria-expanded', 'false')
    expect(row('apps')).toHaveAttribute('aria-disabled', 'true')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('adds a truncation notice that is not a treeitem, a tab stop or counted in the set', () => {
    renderTree({ isTruncated: true })

    const notice = screen.getByText(/not every row is shown/)
    expect(notice.closest('[role="treeitem"]')).toBeNull()
    expect(notice.closest('[tabindex]')).toBeNull()
    expect(row('cli')).toHaveAttribute('aria-setsize', '3')
  })

  it('renders a consumer truncatedNotice in place of the default', () => {
    renderTree({ isTruncated: true, truncatedNotice: 'Showing 3 of 900' })

    expect(screen.getByText('Showing 3 of 900')).toBeInTheDocument()
  })
})

describe('TreeView, React warnings', () => {
  it('renders the windowed body with a notice without a missing-key warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderTree({ isTruncated: true, height: HEIGHT })

    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })
})

describe('TreeView, trailing content (A2)', () => {
  it('reads a null value as its reason in the row description', () => {
    const { nodes, rootId } = fixtures.nullWithReason
    render(
      <TreeView
        accessibilityLabel="Code tree"
        nodes={nodes}
        rootId={rootId}
        defaultExpandedIds={new Set([`${rootId}/ids.ts`])}
        renderTrailing={renderMetric('loc')}
      />
    )

    const rows = screen.getAllByRole('treeitem')
    const reasoned = rows.filter((el) => /not applicable/.test(descriptionOf(el)))

    expect(reasoned.length).toBeGreaterThan(0)
    expect(reasoned[0]).toHaveAccessibleDescription('loc not applicable')
    expect(rows.map(descriptionOf).join('|')).not.toMatch(/loc 0\b/)
  })
})

describe('TreeView, focus after a collapse from outside', () => {
  it('moves DOM focus to the nearest visible ancestor when a controlled parent collapses', () => {
    const open = new Set(['apps'])
    const { rerender } = renderTree({ expandedIds: open })
    focusRow('auth')

    rerender(<TreeView accessibilityLabel="Code tree" nodes={NODES} expandedIds={new Set()} />)

    expect(focusedName()).toBe('apps')
    expect(tabStops()).toHaveLength(1)
  })
})

describe('TreeView, focus while the user scrolls', () => {
  const label = (index: number) => LARGE_ROWS[index].node.label

  function scrollFocusedRowAway(keyFirst?: string) {
    renderLarge()
    focusRow(label(0))
    if (keyFirst !== undefined) press(keyFirst)
    const scroller = screen.getByRole('tree').parentElement?.parentElement as HTMLElement
    fireEvent.scroll(scroller, { target: { scrollTop: 200 * ROW_HEIGHT.comfortable } })
  }

  it('leaves a pointer scroll where it is after the focused row unmounts', () => {
    scrollFocusedRowAway()

    expect(screen.getByRole('treeitem', { name: label(200) })).toBeInTheDocument()
    expect(screen.queryByRole('treeitem', { name: label(0) })).toBeNull()
  })

  it('does not follow a later scroll after a key the tree leaves to the browser', () => {
    scrollFocusedRowAway('Tab')

    expect(screen.getByRole('treeitem', { name: label(200) })).toBeInTheDocument()
  })

  it('scrolls back and moves from the focused row on the next Down', () => {
    scrollFocusedRowAway()

    press('ArrowDown')

    expect(focusedName()).toBe(label(1))
    expect(screen.queryByRole('treeitem', { name: label(200) })).toBeNull()
    expect(tabStops()).toHaveLength(1)
  })
})

describe('TreeView, accessibility', () => {
  const named: [string, TreeFixture][] = Object.entries(fixtures)

  it.each(named)('has no axe violations on the %s fixture', async (_, f) => {
    const { container } = render(
      <TreeView
        accessibilityLabel={f.name}
        nodes={f.nodes}
        rootId={f.rootId}
        revealId={f.revealId}
        isTruncated={f.isTruncated}
        density={f.density}
        renderTrailing={renderMetric('loc')}
        height={HEIGHT}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  const states: [string, Props][] = [
    ['loading', { isLoading: true }],
    ['empty', { nodes: [] }],
    ['disabled', { isDisabled: true }],
    ['truncated', { isTruncated: true }],
    ['row loading', { loadingIds: new Set(['bin']), defaultExpandedIds: new Set(['bin']) }],
    ['natural height', {}],
    ['dense', { density: 'dense', height: HEIGHT }],
  ]

  it.each(states)('has no axe violations in the %s state', async (_, props) => {
    const { container } = renderTree(props)
    expect(await axe(container)).toHaveNoViolations()
  })
})
