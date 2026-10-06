import { describe, it, expect, vi } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import { Table, TableHeader, TableRow, TableHeaderCell } from './Table'
import { pageRange, useTableState } from './useTableState'

function renderHeader(cell: React.ReactNode, onSort?: () => void) {
  return render(
    <Table onSort={onSort}>
      <TableHeader>
        <TableRow>{cell}</TableRow>
      </TableHeader>
    </Table>
  )
}

describe('TableHeaderCell sort label', () => {
  it('names the sort button from sortLabel when children are elements', () => {
    renderHeader(
      <TableHeaderCell sortKey="name" sortLabel="Name">
        <>Na</>
        <>me</>
      </TableHeaderCell>,
      vi.fn()
    )
    expect(screen.getByRole('button', { name: 'Sort by Name' })).toBeInTheDocument()
  })

  it('warns when an element child has no string label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderHeader(
      <TableHeaderCell sortKey="name">
        <>Name</>
      </TableHeaderCell>,
      vi.fn()
    )
    expect(warn).toHaveBeenCalled()
    expect(screen.queryByLabelText(/object Object/)).not.toBeInTheDocument()
    warn.mockRestore()
  })

  it('passes rest props through on a non-sortable header', () => {
    renderHeader(
      <TableHeaderCell testID="plain-header" accessibilityLabel="Plain column">
        Name
      </TableHeaderCell>
    )
    expect(screen.getByLabelText('Plain column')).toBeInTheDocument()
    expect(screen.getByTestId('plain-header')).toBeInTheDocument()
  })
})

describe('useTableState page clamp', () => {
  it('moves back to the last page that has rows when data shrinks', () => {
    const rows = (n: number) => Array.from({ length: n }, (_, id) => ({ id }))
    const { result, rerender } = renderHook(
      ({ data }) => useTableState({ data, defaultPageSize: 10 }),
      { initialProps: { data: rows(25) } }
    )
    act(() => result.current.setPage(2))
    rerender({ data: rows(12) })
    expect(result.current.page).toBe(1)
    expect(result.current.paginatedData).toHaveLength(2)
    rerender({ data: rows(0) })
    expect(result.current.page).toBe(0)
  })

  it('reports an empty range as zero items', () => {
    expect(pageRange(0, 10, 0)).toMatchObject({ startItem: 0, endItem: 0 })
  })
})
