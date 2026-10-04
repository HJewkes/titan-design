import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Text } from 'react-native'

import {
  CELL_SIZE,
  COLUMN_HEADER_HEIGHT,
  DependencyMatrix,
  OVERSCAN,
  ROW_HEADER_WIDTH,
} from './DependencyMatrix'
import { matrixFixtures, type MatrixFixture } from './fixtures'
import type { DependencyMatrixProps, MatrixDirection } from './types'

expect.extend(toHaveNoViolations)

const DIRECTIONS: MatrixDirection[] = ['row-depends-on-column', 'column-depends-on-row']

function byName(name: string): MatrixFixture {
  const fixture = matrixFixtures.find((candidate) => candidate.name === name)
  if (!fixture) throw new Error(`no fixture named ${name}`)
  return fixture
}

function renderMatrix(name: string, props: Partial<DependencyMatrixProps> = {}) {
  const { items, cells } = byName(name)
  return render(
    <DependencyMatrix
      items={items}
      cells={cells}
      width={600}
      height={400}
      accessibilityLabel="Module dependencies"
      {...props}
    />
  )
}

const veryLarge: Partial<DependencyMatrixProps> = {
  width: 600,
  height: 600,
  density: 'dense',
  maxItems: Number.POSITIVE_INFINITY,
}

const tabStops = (): HTMLElement[] =>
  Array.from(screen.getByRole('grid').querySelectorAll<HTMLElement>('[tabindex="0"]'))

const gridIndex = (element: Element | null): [number, number] => [
  Number(element?.getAttribute('aria-rowindex')),
  Number(element?.getAttribute('aria-colindex')),
]

function focusGrid(): void {
  act(() => tabStops()[0].focus())
}

function pressKey(key: string, init: KeyboardEventInit = {}): boolean {
  const target = document.activeElement as HTMLElement
  const notPrevented = fireEvent.keyDown(target, { key, ...init })
  fireEvent.keyUp(target, { key, ...init })
  return notPrevented
}

describe.each(DIRECTIONS)('DependencyMatrix keyboard, %s', (direction) => {
  it('offers exactly one tab stop, on the first cell', () => {
    renderMatrix('Default', { direction })

    expect(tabStops()).toHaveLength(1)
    expect(tabStops()[0]).toHaveAttribute('role', 'gridcell')
    expect(gridIndex(tabStops()[0])).toEqual([2, 2])
  })

  it('moves focus with the arrows and keeps aria-rowindex and aria-colindex in step', () => {
    renderMatrix('Default', { direction })
    focusGrid()

    pressKey('ArrowRight')
    expect(gridIndex(document.activeElement)).toEqual([2, 3])
    pressKey('ArrowDown')
    expect(gridIndex(document.activeElement)).toEqual([3, 3])
    pressKey('ArrowLeft')
    pressKey('ArrowUp')
    pressKey('ArrowUp')

    expect(gridIndex(document.activeElement)).toEqual([2, 2])
    expect(tabStops()).toEqual([document.activeElement])
  })

  it('stays in the row for Home and End and reaches the corners with Control', () => {
    renderMatrix('Default', { direction })
    focusGrid()

    pressKey('ArrowDown')
    pressKey('End')
    expect(gridIndex(document.activeElement)).toEqual([3, 32])
    pressKey('End', { ctrlKey: true })
    expect(gridIndex(document.activeElement)).toEqual([32, 32])
    pressKey('Home', { ctrlKey: true })

    expect(gridIndex(document.activeElement)).toEqual([2, 2])
  })

  it('presses the focused cell once for Enter and once for Space', () => {
    const onCellPress = vi.fn()
    renderMatrix('Default', { direction, onCellPress })
    focusGrid()
    pressKey('ArrowDown')
    const rowFirst = direction === 'row-depends-on-column'
    const pressed = rowFirst
      ? { from: 'module-01', to: 'module-00', value: 6 }
      : { from: 'module-00', to: 'module-01' }

    pressKey('Enter')
    expect(onCellPress).toHaveBeenCalledTimes(1)
    pressKey(' ')

    expect(onCellPress).toHaveBeenCalledTimes(2)
    expect(onCellPress).toHaveBeenNthCalledWith(1, pressed)
    expect(onCellPress).toHaveBeenNthCalledWith(2, pressed)
  })

  it('leaves Tab to the browser, so the single tab stop lets focus out of the grid', () => {
    renderMatrix('Default', { direction })
    focusGrid()
    pressKey('ArrowRight')
    const before = document.activeElement

    const notPrevented = pressKey('Tab')

    expect(notPrevented).toBe(true)
    expect(document.activeElement).toBe(before)
    expect(tabStops()).toEqual([before])
  })

  it('mounts and focuses a cell that an arrow or Control+End moves to outside the window', () => {
    renderMatrix('Very large', { ...veryLarge, direction })
    const grid = screen.getByRole('grid')
    focusGrid()
    expect(grid.querySelector('[aria-rowindex="60"]')).toBeNull()

    for (let step = 0; step < 58; step += 1) pressKey('ArrowDown')
    expect(gridIndex(document.activeElement)).toEqual([60, 2])
    pressKey('End', { ctrlKey: true })

    expect(document.activeElement).toHaveAttribute('role', 'gridcell')
    expect(gridIndex(document.activeElement)).toEqual([387, 387])
    expect(grid.querySelector('[role="row"][aria-rowindex="2"]')).toBeNull()
  })

  it('names the dependent and the dependency in the order the direction reads', () => {
    renderMatrix('Default', { direction })
    const rowFirst = direction === 'row-depends-on-column'
    const [row, col] = rowFirst ? [3, 2] : [2, 3]
    const name = rowFirst
      ? 'module-01 depends on module-00, 6 references'
      : 'module-00 is a dependency of module-01, 6 references'

    expect(gridIndex(screen.getByRole('gridcell', { name }))).toEqual([row, col])
  })

  it('states the reading direction in the legend caption', () => {
    renderMatrix('Default', { direction })

    expect(screen.getByTestId('matrix-direction-caption')).toHaveTextContent(
      direction === 'row-depends-on-column'
        ? 'Each row depends on the columns it marks.'
        : 'Each column depends on the rows it marks.'
    )
  })
})

describe('DependencyMatrix disabled', () => {
  it('keeps arrows and reading, reports aria-disabled and blocks cell and header presses', () => {
    const onCellPress = vi.fn()
    const onHeaderPress = vi.fn()
    renderMatrix('Default', { isDisabled: true, onCellPress, onHeaderPress })
    focusGrid()

    pressKey('ArrowDown')
    pressKey('Enter')
    pressKey(' ')
    fireEvent.click(document.activeElement as HTMLElement)
    fireEvent.click(screen.getByRole('rowheader', { name: 'module-00' }))

    expect(gridIndex(document.activeElement)).toEqual([3, 2])
    expect(document.activeElement).toHaveAccessibleName(
      'module-01 depends on module-00, 6 references'
    )
    expect(screen.getByRole('grid')).toHaveAttribute('aria-disabled', 'true')
    expect(document.activeElement).toHaveAttribute('aria-disabled', 'true')
    expect(onCellPress).not.toHaveBeenCalled()
    expect(onHeaderPress).not.toHaveBeenCalled()
  })
})

describe('DependencyMatrix pointer', () => {
  it('presses a cell with data, moves the tab stop to it, and reports the move', () => {
    const onCellPress = vi.fn()
    const onActiveCellChange = vi.fn()
    renderMatrix('Default', { onCellPress, onActiveCellChange, width: 1200, height: 1200 })
    const cell = screen.getByRole('gridcell', { name: /module-30 depends on module-29/ })

    fireEvent.click(cell)

    expect(onCellPress).toHaveBeenCalledExactlyOnceWith({
      from: 'module-30',
      to: 'module-29',
      value: 16,
    })
    expect(onActiveCellChange).toHaveBeenCalledWith({ from: 'module-30', to: 'module-29' })
    expect(tabStops()).toEqual([cell])
  })

  it('reports a header press with the item id, and never for the fold header', () => {
    const onHeaderPress = vi.fn()
    renderMatrix('Very large', { maxItems: 3, onHeaderPress })

    fireEvent.click(screen.getByRole('rowheader', { name: 'file-01' }))
    fireEvent.click(screen.getByRole('columnheader', { name: 'file-02' }))
    fireEvent.click(screen.getByRole('rowheader', { name: '+383 more' }))

    expect(onHeaderPress.mock.calls).toEqual([['file-01'], ['file-02']])
  })
})

describe('DependencyMatrix windowing', () => {
  const size = CELL_SIZE.dense
  const maxCols = Math.ceil((600 - ROW_HEADER_WIDTH) / size) + 2 * OVERSCAN
  const maxRows = Math.ceil((600 - COLUMN_HEADER_HEIGHT) / size) + 2 * OVERSCAN

  it('mounts at most the window plus overscan of 386 items, yet reports the full size', () => {
    renderMatrix('Very large', veryLarge)
    const grid = screen.getByRole('grid')

    const mounted = screen.getAllByRole('gridcell').length

    expect(mounted).toBeGreaterThan(0)
    expect(mounted).toBeLessThanOrEqual(maxCols * maxRows)
    expect(screen.getAllByRole('columnheader').length).toBeLessThanOrEqual(maxCols + 1)
    expect(grid).toHaveAttribute('aria-rowcount', '387')
    expect(grid).toHaveAttribute('aria-colcount', '387')
  })

  it('follows a scroll on each axis, keeping the mount bounded and the tab stop alive', () => {
    renderMatrix('Very large', veryLarge)
    const grid = screen.getByRole('grid')

    fireEvent.scroll(screen.getByTestId('matrix-scroll-y'), { target: { scrollTop: 4000 } })
    fireEvent.scroll(screen.getByTestId('matrix-scroll-x'), { target: { scrollLeft: 2000 } })

    expect(
      grid.querySelector('[role="gridcell"][aria-rowindex="202"][aria-colindex="102"]')
    ).not.toBeNull()
    expect(screen.getAllByRole('gridcell').length).toBeLessThanOrEqual(
      (maxCols + 1) * (maxRows + 1)
    )
    expect(gridIndex(tabStops()[0])).toEqual([2, 2])
  })
})

describe('DependencyMatrix colour', () => {
  const fillsOf = (root: HTMLElement): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>('[data-testid="matrix-fill"]'))

  it('paints Package level with one hue at no more than four translucent steps', () => {
    renderMatrix('Package level')
    const grid = screen.getByRole('grid')

    const fills = fillsOf(grid)
    const hues = new Set(fills.map((fill) => fill.style.backgroundColor))
    const steps = new Set(fills.map((fill) => fill.style.opacity))

    expect(fills.length).toBeGreaterThan(0)
    expect([...hues]).toEqual(['var(--color-brand-primary)'])
    expect(steps.size).toBeGreaterThan(1)
    expect(steps.size).toBeLessThanOrEqual(4)
    for (const step of steps) expect(Number(step)).toBeLessThan(1)
    expect(grid.innerHTML).not.toMatch(/color-data-|bg-data-/)
  })

  it('shows the four steps in the legend', () => {
    renderMatrix('Package level')

    const steps = fillsOf(screen.getByTestId('matrix-legend')).map((fill) => fill.style.opacity)

    expect(steps).toEqual(['0.2', '0.4', '0.65', '0.9'])
  })

  it('marks a cycle with a shape and the word, not colour alone', () => {
    renderMatrix('Cycle')

    const cycles = screen.getAllByRole('gridcell', { name: /, cycle$/ })

    expect(cycles).toHaveLength(2)
    for (const cell of cycles) {
      expect(within(cell).getByTestId('matrix-flag-cycle')).toBeInTheDocument()
    }
    expect(within(screen.getByTestId('matrix-legend')).getByText('Cycle')).toBeInTheDocument()
  })

  it('finds an unflagged mutual pair and keeps the word after a custom label', () => {
    const items = byName('Null weight').items
    const cells = [
      { from: 'module-00', to: 'module-01', value: 2 },
      { from: 'module-01', to: 'module-00', value: 1 },
    ]
    render(
      <DependencyMatrix
        items={items}
        cells={cells}
        width={400}
        height={300}
        accessibilityLabel="Module dependencies"
        formatCellLabel={(from, to, value) => `${from.label} to ${to.label}: ${value ?? 'none'}`}
      />
    )

    expect(screen.getByRole('gridcell', { name: 'module-00 to module-01: 2, cycle' })).toBeVisible()
    expect(screen.getByRole('gridcell', { name: 'module-01 to module-00: 1, cycle' })).toBeVisible()
    expect(screen.getByRole('gridcell', { name: 'module-00 to module-02: none' })).toBeVisible()
  })

  it('shows the number as text and reads an unknown weight in words', () => {
    renderMatrix('Null weight', { showValues: true })

    const known = screen.getByRole('gridcell', {
      name: 'module-01 depends on module-02, 5 references',
    })

    expect(known).toHaveTextContent('5')
    expect(
      screen.getByRole('gridcell', { name: 'module-00 depends on module-01, weight unknown' })
    ).toHaveTextContent('')
  })
})

describe('DependencyMatrix fold', () => {
  it('folds Very large at maxItems 10 into a "+376 more" header whose cells sum the tail', () => {
    const { items, cells } = byName('Very large')
    const tail = new Set(items.slice(10).map((item) => item.id))
    const sumFrom = (id: string) =>
      cells
        .filter((cell) => cell.from === id && tail.has(cell.to))
        .reduce((sum, cell) => sum + (cell.value ?? 0), 0)
    const kept = items.slice(0, 10).find((item) => sumFrom(item.id) > 1)
    if (!kept) throw new Error('fixture has no kept item depending on the tail')

    renderMatrix('Very large', { maxItems: 10, width: 800, height: 600 })

    expect(screen.getByRole('columnheader', { name: '+376 more' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: '+376 more' })).toBeInTheDocument()
    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '12')
    expect(
      screen.getByRole('gridcell', {
        name: `${kept.label} depends on +376 more, ${sumFrom(kept.id)} references`,
      })
    ).toBeInTheDocument()
  })

  it('does not call the summed fold row and column a cycle', () => {
    renderMatrix('Very large', { maxItems: 10, width: 800, height: 600 })

    expect(screen.getAllByRole('gridcell', { name: /\+376 more/ }).length).toBeGreaterThan(10)
    expect(screen.queryAllByRole('gridcell', { name: /, cycle$/ })).toEqual([])
  })
})

describe('DependencyMatrix states', () => {
  it('shows a named skeleton and no grid while loading', () => {
    renderMatrix('Default', { isLoading: true })

    expect(screen.getByRole('progressbar', { name: 'Module dependencies, loading' })).toBeVisible()
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('shows the default empty state, or the slot, when there are no items', () => {
    const { rerender } = renderMatrix('Empty')
    expect(screen.getByText('Nothing to compare')).toBeVisible()
    expect(screen.queryByRole('grid')).toBeNull()

    rerender(
      <DependencyMatrix
        items={[]}
        cells={[]}
        width={600}
        height={400}
        accessibilityLabel="Module dependencies"
        emptyState={<Text>Pick a package first</Text>}
      />
    )

    expect(screen.getByText('Pick a package first')).toBeVisible()
    expect(screen.queryByText('Nothing to compare')).toBeNull()
  })

  it('draws the grid with a caption, not the empty state, when items have no edges', () => {
    renderMatrix('No edges')

    expect(screen.getByRole('grid')).toBeVisible()
    expect(screen.getAllByRole('gridcell')).toHaveLength(4)
    expect(screen.getByText('No dependencies between these items.')).toBeVisible()
    expect(screen.queryByText('Nothing to compare')).toBeNull()
  })

  it('names the grid and gives a group to the headers that have one', () => {
    renderMatrix('Package level')

    expect(screen.getByRole('grid', { name: 'Module dependencies' })).toBeVisible()
    expect(screen.getByRole('rowheader', { name: 'lib-00, libraries' })).toBeVisible()
  })
})

describe('DependencyMatrix accessibility', () => {
  it.each(matrixFixtures.map((fixture) => fixture.name))(
    'has no axe violations on the %s fixture',
    async (name) => {
      const { container } = renderMatrix(name)

      expect(await axe(container)).toHaveNoViolations()
    }
  )

  it.each(DIRECTIONS)('has no axe violations reading %s with values shown', async (direction) => {
    const { container } = renderMatrix('Default', { direction, showValues: true })

    expect(await axe(container)).toHaveNoViolations()
  })

  it.each([
    ['loading', { isLoading: true }],
    ['disabled', { isDisabled: true }],
    ['folded', { maxItems: 5 }],
  ] as const)('has no axe violations while %s', async (_state, props) => {
    const { container } = renderMatrix('Default', props)

    expect(await axe(container)).toHaveNoViolations()
  })
})
