import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TablePagination,
  TableEmptyState,
  TableSelectAllCell,
  TableSelectCell,
  useTable,
} from './Table'

function renderBasicTable() {
  return render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>John Doe</TableCell>
          <TableCell>john@example.com</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Jane Smith</TableCell>
          <TableCell>jane@example.com</TableCell>
          <TableCell>Inactive</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

describe('Table', () => {
  it('renders header and body content', () => {
    renderBasicTable()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('renders string children in TableCell as text', () => {
    renderBasicTable()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders custom children in TableCell', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>
              <span data-testid="custom-cell">Custom Content</span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByTestId('custom-cell')).toBeInTheDocument()
  })

  describe('loading state', () => {
    it('shows loading skeleton when isLoading', () => {
      render(
        <Table isLoading>
          <TableBody>
            <TableRow>
              <TableCell>Hidden content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      // Loading skeleton replaces children
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
    })

    it('respects loadingRowCount', () => {
      render(<Table isLoading loadingRowCount={3} />)
      // Should render without errors
    })
  })

  describe('sorting', () => {
    it('renders sortable header cells', () => {
      const onSort = vi.fn()
      render(
        <Table sortColumn="name" sortDirection="asc" onSort={onSort}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
              <TableHeaderCell sortKey="email">Email</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('calls onSort when sortable header cell is clicked', () => {
      const onSort = vi.fn()
      render(
        <Table onSort={onSort}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )

      fireEvent.click(screen.getByText('Name'))
      expect(onSort).toHaveBeenCalledWith('name')
    })

    it('shows sort direction indicator for sorted column', () => {
      render(
        <Table sortColumn="name" sortDirection="asc" onSort={vi.fn()}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )
      // Ascending arrow
      expect(screen.getByText('\u2191')).toBeInTheDocument()
    })

    it('shows descending indicator', () => {
      render(
        <Table sortColumn="name" sortDirection="desc" onSort={vi.fn()}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(screen.getByText('\u2193')).toBeInTheDocument()
    })

    it('shows neutral sort indicator for unsorted sortable column', () => {
      render(
        <Table sortColumn="email" sortDirection="asc" onSort={vi.fn()}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(screen.getByText('\u2195')).toBeInTheDocument()
    })

    it('non-sortable header cell does not trigger onSort', () => {
      const onSort = vi.fn()
      render(
        <Table onSort={onSort}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )
      fireEvent.click(screen.getByText('Actions'))
      expect(onSort).not.toHaveBeenCalled()
    })
  })

  describe('row selection', () => {
    it('renders select all checkbox when selectable', () => {
      render(
        <Table selectable selectedRows={new Set()} rowIds={['1', '2']}>
          <TableHeader>
            <TableRow>
              <TableSelectAllCell />
              <TableHeaderCell>Name</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('does not render select cells when not selectable', () => {
      render(
        <Table selectable={false}>
          <TableHeader>
            <TableRow>
              <TableSelectAllCell />
              <TableHeaderCell>Name</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('calls onSelectAll when select all is clicked', () => {
      const onSelectAll = vi.fn()
      render(
        <Table selectable selectedRows={new Set()} rowIds={['1', '2']} onSelectAll={onSelectAll}>
          <TableHeader>
            <TableRow>
              <TableSelectAllCell />
            </TableRow>
          </TableHeader>
        </Table>
      )

      fireEvent.click(screen.getByRole('checkbox'))
      expect(onSelectAll).toHaveBeenCalledWith(true)
    })

    it('calls onSelectRow for individual row selection', () => {
      const onSelectRow = vi.fn()
      render(
        <Table selectable selectedRows={new Set()} onSelectRow={onSelectRow}>
          <TableBody>
            <TableRow>
              <TableSelectCell rowId="1" />
              <TableCell>John</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )

      fireEvent.click(screen.getByRole('checkbox'))
      expect(onSelectRow).toHaveBeenCalledWith('1', true)
    })

    it('shows checked state for selected rows', () => {
      render(
        <Table selectable selectedRows={new Set(['1'])}>
          <TableBody>
            <TableRow>
              <TableSelectCell rowId="1" />
            </TableRow>
          </TableBody>
        </Table>
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
    })
  })

  describe('TableRow', () => {
    it('renders with selected style', () => {
      render(
        <Table>
          <TableBody>
            <TableRow isSelected>
              <TableCell>Selected row</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByText('Selected row')).toBeInTheDocument()
    })

    it('supports non-hoverable rows', () => {
      render(
        <Table>
          <TableBody>
            <TableRow isHoverable={false}>
              <TableCell>Static row</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByText('Static row')).toBeInTheDocument()
    })
  })

  describe('TableHeaderCell alignment', () => {
    const alignments = ['left', 'center', 'right'] as const
    alignments.forEach((align) => {
      it(`renders with ${align} alignment`, () => {
        render(
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell align={align}>Header</TableHeaderCell>
              </TableRow>
            </TableHeader>
          </Table>
        )
        expect(screen.getByText('Header')).toBeInTheDocument()
      })
    })
  })

  describe('TableCell alignment', () => {
    const alignments = ['left', 'center', 'right'] as const
    alignments.forEach((align) => {
      it(`renders with ${align} alignment`, () => {
        render(
          <Table>
            <TableBody>
              <TableRow>
                <TableCell align={align}>Content</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )
        expect(screen.getByText('Content')).toBeInTheDocument()
      })
    })
  })

  describe('TablePagination', () => {
    it('renders pagination info', () => {
      render(
        <TablePagination
          page={0}
          pageSize={10}
          totalItems={50}
          onPageChange={vi.fn()}
        />
      )
      expect(screen.getByText('1-10 of 50')).toBeInTheDocument()
    })

    it('calls onPageChange when next is clicked', () => {
      const onPageChange = vi.fn()
      render(
        <TablePagination
          page={0}
          pageSize={10}
          totalItems={50}
          onPageChange={onPageChange}
        />
      )

      fireEvent.click(screen.getByLabelText('Next page'))
      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    it('calls onPageChange when previous is clicked', () => {
      const onPageChange = vi.fn()
      render(
        <TablePagination
          page={2}
          pageSize={10}
          totalItems={50}
          onPageChange={onPageChange}
        />
      )

      fireEvent.click(screen.getByLabelText('Previous page'))
      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    it('disables previous button on first page', () => {
      render(
        <TablePagination
          page={0}
          pageSize={10}
          totalItems={50}
          onPageChange={vi.fn()}
        />
      )
      const prevButton = screen.getByLabelText('Previous page')
      expect(prevButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('disables next button on last page', () => {
      render(
        <TablePagination
          page={4}
          pageSize={10}
          totalItems={50}
          onPageChange={vi.fn()}
        />
      )
      const nextButton = screen.getByLabelText('Next page')
      expect(nextButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('calls onPageSizeChange when page size option is clicked', () => {
      const onPageSizeChange = vi.fn()
      render(
        <TablePagination
          page={0}
          pageSize={10}
          totalItems={50}
          onPageChange={vi.fn()}
          onPageSizeChange={onPageSizeChange}
        />
      )

      fireEvent.click(screen.getByText('25'))
      expect(onPageSizeChange).toHaveBeenCalledWith(25)
    })

    it('renders custom pageSizeOptions', () => {
      render(
        <TablePagination
          page={0}
          pageSize={5}
          totalItems={50}
          pageSizeOptions={[5, 15, 30]}
          onPageChange={vi.fn()}
        />
      )
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
    })

    it('shows correct range for middle pages', () => {
      render(
        <TablePagination
          page={2}
          pageSize={10}
          totalItems={50}
          onPageChange={vi.fn()}
        />
      )
      expect(screen.getByText('21-30 of 50')).toBeInTheDocument()
    })

    it('shows correct range for last partial page', () => {
      render(
        <TablePagination
          page={2}
          pageSize={10}
          totalItems={25}
          onPageChange={vi.fn()}
        />
      )
      expect(screen.getByText('21-25 of 25')).toBeInTheDocument()
    })
  })

  describe('TableEmptyState', () => {
    it('renders with default text', () => {
      render(<TableEmptyState />)
      expect(screen.getByText('No data')).toBeInTheDocument()
      expect(screen.getByText('There are no items to display.')).toBeInTheDocument()
    })

    it('renders with custom title and description', () => {
      render(
        <TableEmptyState title="No users" description="Add users to see them here." />
      )
      expect(screen.getByText('No users')).toBeInTheDocument()
      expect(screen.getByText('Add users to see them here.')).toBeInTheDocument()
    })

    it('renders with action element', () => {
      render(
        <TableEmptyState
          title="No data"
          action={<button>Add Item</button>}
        />
      )
      expect(screen.getByText('Add Item')).toBeInTheDocument()
    })

    it('renders with custom icon', () => {
      render(
        <TableEmptyState
          title="No data"
          icon={<span data-testid="empty-icon">E</span>}
        />
      )
      expect(screen.getByTestId('empty-icon')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations for basic table', async () => {
      const { container } = renderBasicTable()
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for pagination', async () => {
      const { container } = render(
        <TablePagination
          page={0}
          pageSize={10}
          totalItems={50}
          onPageChange={vi.fn()}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('sortable header has button role and label', () => {
      render(
        <Table onSort={vi.fn()}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(screen.getByRole('button', { name: /sort by name/i })).toBeInTheDocument()
    })

    it('exposes real ARIA table semantics (table/rowgroup/row/columnheader/cell)', () => {
      renderBasicTable()
      expect(screen.getByRole('table')).toBeInTheDocument()
      // header rowgroup + body rowgroup
      expect(screen.getAllByRole('rowgroup')).toHaveLength(2)
      // 1 header row + 2 body rows
      expect(screen.getAllByRole('row')).toHaveLength(3)
      expect(screen.getAllByRole('columnheader')).toHaveLength(3)
      expect(screen.getAllByRole('cell')).toHaveLength(6)
    })

    it('sortable header reflects sort state via aria-sort', () => {
      render(
        <Table sortColumn="name" sortDirection="asc" onSort={vi.fn()}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
              <TableHeaderCell sortKey="email">Email</TableHeaderCell>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const [name, email] = screen.getAllByRole('columnheader')
      expect(name).toHaveAttribute('aria-sort', 'ascending')
      expect(email).toHaveAttribute('aria-sort', 'none')
    })

    it('pagination buttons have accessible labels', () => {
      render(
        <TablePagination
          page={1}
          pageSize={10}
          totalItems={50}
          onPageChange={vi.fn()}
        />
      )
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
      expect(screen.getByLabelText('Next page')).toBeInTheDocument()
    })
  })
})

describe('Table density', () => {
  it('defaults to comfortable and accepts dense without changing structure', () => {
    const { rerender } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByRole('cell')).toBeInTheDocument()

    rerender(
      <Table density="dense">
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    // nativewind compiles className to style, so density is asserted through
    // structure + a11y surviving rather than through class names.
    expect(screen.getByRole('cell')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('keeps header cells sortable at dense density', () => {
    const onSort = vi.fn()
    render(
      <Table density="dense" sortColumn="name" sortDirection="asc" onSort={onSort}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell sortKey="name">Name</TableHeaderCell>
          </TableRow>
        </TableHeader>
      </Table>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sort by Name' }))
    expect(onSort).toHaveBeenCalledWith('name')
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'ascending')
  })
})

describe('useTable', () => {
  // A type alias, not an interface: `useTable` constrains T to an index-signature
  // shape, and only aliases get the implicit index signature that satisfies it.
  type Row = {
    id: string
    rank: number
    size?: number
  }
  const rows: Row[] = [
    { id: 'b', rank: 2, size: 5 },
    { id: 'a', rank: 3 },
    { id: 'c', rank: 1, size: 2 },
  ]

  const ids = (data: Row[]) => data.map((r) => r.id)

  it('returns data untouched until a direction is set', () => {
    const { result } = renderHook(() => useTable<Row>({ data: rows, defaultSortColumn: 'rank' }))
    expect(ids(result.current.sortedData)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by raw field value when no comparator is supplied', () => {
    const { result } = renderHook(() =>
      useTable<Row>({ data: rows, defaultSortColumn: 'rank', defaultSortDirection: 'asc' })
    )
    expect(ids(result.current.sortedData)).toEqual(['c', 'b', 'a'])
  })

  it('ranks blank values last in BOTH directions', () => {
    const asc = renderHook(() =>
      useTable<Row>({ data: rows, defaultSortColumn: 'size', defaultSortDirection: 'asc' })
    )
    const desc = renderHook(() =>
      useTable<Row>({ data: rows, defaultSortColumn: 'size', defaultSortDirection: 'desc' })
    )
    // `a` has no size; flipping direction must not promote it to the top.
    expect(ids(asc.result.current.sortedData).at(-1)).toBe('a')
    expect(ids(desc.result.current.sortedData).at(-1)).toBe('a')
  })

  it('uses a per-column comparator when one is supplied', () => {
    const { result } = renderHook(() =>
      useTable<Row>({
        data: rows,
        defaultSortColumn: 'id',
        defaultSortDirection: 'asc',
        // Reverse-alphabetical, to prove the comparator beats the field compare.
        comparators: { id: (x, y) => y.id.localeCompare(x.id) },
      })
    )
    expect(ids(result.current.sortedData)).toEqual(['c', 'b', 'a'])
  })

  it('inverts a comparator for desc rather than reversing the array', () => {
    const { result } = renderHook(() =>
      useTable<Row>({
        data: rows,
        defaultSortColumn: 'id',
        defaultSortDirection: 'desc',
        comparators: { id: (x, y) => y.id.localeCompare(x.id) },
      })
    )
    expect(ids(result.current.sortedData)).toEqual(['a', 'b', 'c'])
  })

  it('leaves columns without a comparator on the default compare', () => {
    const { result } = renderHook(() =>
      useTable<Row>({
        data: rows,
        defaultSortColumn: 'rank',
        defaultSortDirection: 'asc',
        comparators: { id: (x, y) => y.id.localeCompare(x.id) },
      })
    )
    expect(ids(result.current.sortedData)).toEqual(['c', 'b', 'a'])
  })

  it('toggles direction through handleSort on the same column', () => {
    const { result } = renderHook(() =>
      useTable<Row>({ data: rows, defaultSortColumn: 'rank', defaultSortDirection: 'asc' })
    )
    act(() => result.current.handleSort('rank'))
    expect(result.current.sortDirection).toBe('desc')
    expect(ids(result.current.sortedData)).toEqual(['a', 'b', 'c'])
  })
})
