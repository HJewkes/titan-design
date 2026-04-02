import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable, type Column } from './DataTable'

interface TestItem {
  id: string
  name: string
  status: string
  count: number
}

const testData: TestItem[] = [
  { id: '1', name: 'Alpha', status: 'active', count: 10 },
  { id: '2', name: 'Beta', status: 'inactive', count: 5 },
  { id: '3', name: 'Gamma', status: 'active', count: 8 },
]

const testColumns: Column<TestItem>[] = [
  { id: 'name', header: 'Name', width: '1fr', cell: (item) => item.name },
  { id: 'status', header: 'Status', width: '140px', cell: (item) => item.status },
  { id: 'count', header: 'Count', width: '80px', align: 'end', cell: (item) => item.count },
]

describe('DataTable', () => {
  it('renders header row with column headers', () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        rowKey={(item) => item.id}
      />
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Count')).toBeInTheDocument()
  })

  it('renders data rows with cell content', () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        rowKey={(item) => item.id}
      />
    )

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()
    expect(screen.getAllByText('active')).toHaveLength(2)
    expect(screen.getByText('inactive')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('applies row className when provided', () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        rowKey={(item) => item.id}
        rowClassName={(item) =>
          item.status === 'active' ? 'bg-green-500' : 'bg-red-500'
        }
      />
    )

    const rows = screen.getAllByRole('row')
    // First row is header, data rows follow
    const dataRows = rows.slice(1)
    expect(dataRows[0]).toHaveClass('bg-green-500')
    expect(dataRows[1]).toHaveClass('bg-red-500')
    expect(dataRows[2]).toHaveClass('bg-green-500')
  })

  it('calls onRowClick when row is clicked', () => {
    const handleClick = vi.fn()

    render(
      <DataTable
        data={testData}
        columns={testColumns}
        rowKey={(item) => item.id}
        onRowClick={handleClick}
      />
    )

    const rows = screen.getAllByRole('row')
    const dataRows = rows.slice(1)
    fireEvent.click(dataRows[0])

    expect(handleClick).toHaveBeenCalledTimes(1)
    expect(handleClick).toHaveBeenCalledWith(testData[0])
  })

  it('shows empty message when data is empty', () => {
    render(
      <DataTable
        data={[]}
        columns={testColumns}
        rowKey={(item: TestItem) => item.id}
        emptyMessage="Nothing to show"
      />
    )

    expect(screen.getByText('Nothing to show')).toBeInTheDocument()
  })

  it('shows default empty message when none provided', () => {
    render(
      <DataTable
        data={[]}
        columns={testColumns}
        rowKey={(item: TestItem) => item.id}
      />
    )

    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('respects column alignment', () => {
    const columns: Column<TestItem>[] = [
      { id: 'name', header: 'Name', cell: (item) => item.name, align: 'start' },
      { id: 'status', header: 'Status', cell: (item) => item.status, align: 'center' },
      { id: 'count', header: 'Count', cell: (item) => item.count, align: 'end' },
    ]

    const { container } = render(
      <DataTable
        data={testData}
        columns={columns}
        rowKey={(item) => item.id}
      />
    )

    const headerRow = screen.getAllByRole('row')[0]
    const headerCells = headerRow.children

    expect(headerCells[0]).toHaveClass('text-start', 'justify-start')
    expect(headerCells[1]).toHaveClass('text-center', 'justify-center')
    expect(headerCells[2]).toHaveClass('text-end', 'justify-end')
  })

  it('sticky header applies correct classes', () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        rowKey={(item) => item.id}
        stickyHeader
      />
    )

    const headerRow = screen.getAllByRole('row')[0]
    expect(headerRow).toHaveClass('sticky', 'top-0', 'z-10', 'backdrop-blur-sm')
  })

  it('applies cursor-pointer class when onRowClick is provided', () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        rowKey={(item) => item.id}
        onRowClick={() => {}}
      />
    )

    const rows = screen.getAllByRole('row')
    const dataRows = rows.slice(1)
    expect(dataRows[0]).toHaveClass('cursor-pointer')
  })

  it('renders ReactNode header content', () => {
    const columns: Column<TestItem>[] = [
      {
        id: 'name',
        header: <span data-testid="custom-header">Custom</span>,
        cell: (item) => item.name,
      },
    ]

    render(
      <DataTable
        data={testData}
        columns={columns}
        rowKey={(item) => item.id}
      />
    )

    expect(screen.getByTestId('custom-header')).toBeInTheDocument()
  })

  it('renders ReactNode empty message', () => {
    render(
      <DataTable
        data={[]}
        columns={testColumns}
        rowKey={(item: TestItem) => item.id}
        emptyMessage={<span data-testid="custom-empty">Empty!</span>}
      />
    )

    expect(screen.getByTestId('custom-empty')).toBeInTheDocument()
  })
})
