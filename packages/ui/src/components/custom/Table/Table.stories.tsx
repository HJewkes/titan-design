import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { cn } from '../../../utils/cn'
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
import { Button, ButtonText } from '../../ui/button/Button'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

const sampleUsers: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' },
  { id: '3', name: 'Carol White', email: 'carol@example.com', role: 'Viewer', status: 'Inactive' },
  { id: '4', name: 'David Brown', email: 'david@example.com', role: 'Editor', status: 'Active' },
  { id: '5', name: 'Eve Davis', email: 'eve@example.com', role: 'Admin', status: 'Active' },
]

const manyUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['Admin', 'Editor', 'Viewer'][i % 3],
  status: i % 5 === 0 ? 'Inactive' : 'Active',
}))

const meta: Meta<typeof Table> = {
  title: 'Custom/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Whether the table is in a loading state',
    },
    selectable: {
      control: 'boolean',
      description: 'Enable row selection checkboxes',
    },
    loadingRowCount: {
      control: 'number',
      description: 'Number of skeleton rows when loading',
    },
  },
}

export default meta
type Story = StoryObj<typeof Table>

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow isHoverable={false}>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <Text className="text-sm text-text-primary font-medium">{user.name}</Text>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <View
                className={cn(
                  'px-2 py-0.5 rounded-full self-start',
                  user.status === 'Active' ? 'bg-status-success/20' : 'bg-status-warning/20'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-medium',
                    user.status === 'Active' ? 'text-status-success' : 'text-status-warning'
                  )}
                >
                  {user.status}
                </Text>
              </View>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const WithSorting: Story = {
  render: () => {
    const [sortColumn, setSortColumn] = useState<string | undefined>(undefined)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

    const handleSort = (column: string) => {
      if (sortColumn === column) {
        setSortDirection((prev) =>
          prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
        )
      } else {
        setSortColumn(column)
        setSortDirection('asc')
      }
    }

    const sorted = [...sampleUsers].sort((a, b) => {
      if (!sortColumn || !sortDirection) return 0
      const aVal = a[sortColumn as keyof User]
      const bVal = b[sortColumn as keyof User]
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDirection === 'asc' ? cmp : -cmp
    })

    return (
      <Table sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>
        <TableHeader>
          <TableRow isHoverable={false}>
            <TableHeaderCell sortKey="name">Name</TableHeaderCell>
            <TableHeaderCell sortKey="email">Email</TableHeaderCell>
            <TableHeaderCell sortKey="role">Role</TableHeaderCell>
            <TableHeaderCell sortKey="status">Status</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  },
}

export const WithRowSelection: Story = {
  render: () => {
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
    const rowIds = sampleUsers.map((u) => u.id)

    const handleSelectRow = (id: string, selected: boolean) => {
      setSelectedRows((prev) => {
        const next = new Set(prev)
        if (selected) {
          next.add(id)
        } else {
          next.delete(id)
        }
        return next
      })
    }

    const handleSelectAll = (selected: boolean) => {
      setSelectedRows(selected ? new Set(rowIds) : new Set())
    }

    return (
      <View style={{ gap: 8 }}>
        <Text className="text-sm text-text-secondary">
          Selected: {selectedRows.size} of {sampleUsers.length}
        </Text>
        <Table
          selectable
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          rowIds={rowIds}
        >
          <TableHeader>
            <TableRow isHoverable={false}>
              <TableSelectAllCell />
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleUsers.map((user) => (
              <TableRow key={user.id} isSelected={selectedRows.has(user.id)}>
                <TableSelectCell rowId={user.id} />
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </View>
    )
  },
}

export const Loading: Story = {
  render: () => (
    <Table isLoading loadingRowCount={5}>
      <TableHeader>
        <TableRow isHoverable={false}>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Placeholder</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const EmptyState: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow isHoverable={false}>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableEmptyState
        title="No users found"
        description="There are no users matching your current filters. Try adjusting your search criteria."
        action={
          <Button variant="outline" color="primary">
            <ButtonText>Clear Filters</ButtonText>
          </Button>
        }
      />
    </Table>
  ),
}

export const WithPagination: Story = {
  render: () => {
    const {
      paginatedData,
      page,
      pageSize,
      totalItems,
      sortColumn,
      sortDirection,
      setPage,
      setPageSize,
      handleSort,
    } = useTable({
      data: manyUsers,
      defaultPageSize: 10,
    })

    return (
      <View>
        <Table sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>
          <TableHeader>
            <TableRow isHoverable={false}>
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
              <TableHeaderCell sortKey="email">Email</TableHeaderCell>
              <TableHeaderCell sortKey="role">Role</TableHeaderCell>
              <TableHeaderCell sortKey="status">Status</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </View>
    )
  },
}

export const WithColumnWidths: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow isHoverable={false}>
          <TableHeaderCell width={60} align="center">#</TableHeaderCell>
          <TableHeaderCell width={200}>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell width={120} align="center">Role</TableHeaderCell>
          <TableHeaderCell width={100} align="right">Status</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.map((user, i) => (
          <TableRow key={user.id}>
            <TableCell width={60} align="center">
              <Text className="text-sm text-text-secondary">{i + 1}</Text>
            </TableCell>
            <TableCell width={200}>
              <Text className="text-sm text-text-primary font-medium">{user.name}</Text>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell width={120} align="center">{user.role}</TableCell>
            <TableCell width={100} align="right">{user.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const UseTableHook: Story = {
  render: () => {
    const {
      paginatedData,
      page,
      pageSize,
      totalItems,
      sortColumn,
      sortDirection,
      setPage,
      setPageSize,
      handleSort,
    } = useTable({
      data: manyUsers,
      defaultPageSize: 10,
      defaultSortColumn: 'name',
      defaultSortDirection: 'asc',
    })

    return (
      <View style={{ gap: 8 }}>
        <Text className="text-sm text-text-secondary">
          Showing {paginatedData.length} of {totalItems} users, sorted by{' '}
          {sortColumn ?? 'none'} ({sortDirection ?? 'none'})
        </Text>
        <Table sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>
          <TableHeader>
            <TableRow isHoverable={false}>
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
              <TableHeaderCell sortKey="email">Email</TableHeaderCell>
              <TableHeaderCell sortKey="role">Role</TableHeaderCell>
              <TableHeaderCell sortKey="status">Status</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </View>
    )
  },
}

export const SortingAndSelection: Story = {
  render: () => {
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

    const {
      paginatedData,
      page,
      pageSize,
      totalItems,
      sortColumn,
      sortDirection,
      setPage,
      setPageSize,
      handleSort,
    } = useTable({
      data: manyUsers,
      defaultPageSize: 10,
    })

    const handleSelectRow = (id: string, selected: boolean) => {
      setSelectedRows((prev) => {
        const next = new Set(prev)
        if (selected) {
          next.add(id)
        } else {
          next.delete(id)
        }
        return next
      })
    }

    const handleSelectAll = (selected: boolean) => {
      const currentPageIds = paginatedData.map((u) => u.id)
      setSelectedRows(selected ? new Set(currentPageIds) : new Set())
    }

    return (
      <View style={{ gap: 8 }}>
        <Text className="text-sm text-text-secondary">
          Selected: {selectedRows.size} rows
        </Text>
        <Table
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectable
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          rowIds={paginatedData.map((u) => u.id)}
        >
          <TableHeader>
            <TableRow isHoverable={false}>
              <TableSelectAllCell />
              <TableHeaderCell sortKey="name">Name</TableHeaderCell>
              <TableHeaderCell sortKey="email">Email</TableHeaderCell>
              <TableHeaderCell sortKey="role">Role</TableHeaderCell>
              <TableHeaderCell sortKey="status">Status</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((user) => (
              <TableRow key={user.id} isSelected={selectedRows.has(user.id)}>
                <TableSelectCell rowId={user.id} />
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </View>
    )
  },
}
