import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { KnowledgeList, type KnowledgeListProps } from './KnowledgeList'
import { EMPTY_KNOWLEDGE_FILTERS } from './knowledge-filters'
import {
  KNOWLEDGE_HOSTILE,
  KNOWLEDGE_ITEMS,
  KNOWLEDGE_LARGE,
  KNOWLEDGE_NOW,
  KNOWLEDGE_PROBLEMS,
  KNOWLEDGE_SAME_DAY,
  KNOWLEDGE_SOURCES_ONLY,
} from './knowledge-fixture'

const renderList = (props: Partial<KnowledgeListProps> = {}) =>
  render(<KnowledgeList items={KNOWLEDGE_ITEMS} now={KNOWLEDGE_NOW} {...props} />)

const rowTitles = () =>
  screen.getAllByTestId('knowledge-row').map((row) => within(row).getByRole('link').textContent)

const search = (query: string) =>
  fireEvent.change(screen.getByLabelText('Search notes and sources'), { target: { value: query } })

const pageReadout = () => screen.getByText(/^\d+-\d+ of \d+$/).textContent

describe('KnowledgeList', () => {
  it('renders one row per item, newest first', () => {
    renderList()
    expect(screen.getAllByTestId('knowledge-row')).toHaveLength(40)
    expect(rowTitles()[0]).toBe('Cone 6 glazes craze on the thin bowls')
    expect(screen.getByText('40 notes and sources')).toBeInTheDocument()
  })

  it('an invalid date sorts last in both directions', () => {
    renderList({ items: KNOWLEDGE_HOSTILE })
    const impossible = 'Written on a day that does not exist'
    expect(rowTitles().slice(-1)).toEqual([impossible])
    const header = screen.getByRole('button', { name: 'Sort by Date' })
    // desc, then unsorted, then asc.
    fireEvent.click(header)
    fireEvent.click(header)
    expect(screen.getByRole('columnheader', { name: /Date/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
    expect(rowTitles().slice(-1)).toEqual([impossible])
  })

  it('same filename in two initiatives renders two rows with unique keys', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderList({ items: KNOWLEDGE_HOSTILE })
    expect(screen.getByText('Shared filename in garden')).toBeInTheDocument()
    expect(screen.getByText('Shared filename in kiln')).toBeInTheDocument()
    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/same key/)
    consoleError.mockRestore()
  })

  it('renders a duplicated id once, keeping the first copy', () => {
    renderList({ items: KNOWLEDGE_HOSTILE })
    expect(screen.getByText('First copy of a duplicated id')).toBeInTheDocument()
    expect(screen.queryByText('Second copy of a duplicated id')).not.toBeInTheDocument()
  })

  it('keeps tied dates in their given order', () => {
    renderList({ items: KNOWLEDGE_SAME_DAY })
    expect(rowTitles()).toEqual(KNOWLEDGE_SAME_DAY.map((item) => item.title))
  })

  it('shows the empty state when there are no items', () => {
    renderList({ items: [] })
    expect(screen.getByText('No notes or sources yet')).toBeInTheDocument()
    expect(screen.queryByText('Nothing matches these filters')).not.toBeInTheDocument()
  })

  it('shows the no-match state, not the empty state, when filters exclude everything', () => {
    renderList()
    search('no such words anywhere')
    expect(screen.getByText('Nothing matches these filters')).toBeInTheDocument()
    expect(screen.queryByText('No notes or sources yet')).not.toBeInTheDocument()
    expect(screen.getByText('0 of 40 notes and sources')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(screen.getAllByTestId('knowledge-row')).toHaveLength(40)
  })

  it('takes custom empty and no-match states', () => {
    const { unmount } = renderList({ items: [], slots: { emptyState: <>Nothing written yet</> } })
    expect(screen.getByText('Nothing written yet')).toBeInTheDocument()
    unmount()
    renderList({
      filters: { ...EMPTY_KNOWLEDGE_FILTERS, query: 'zzz' },
      slots: { noMatchState: <>Try another word</> },
    })
    expect(screen.getByText('Try another word')).toBeInTheDocument()
  })

  it('changing a filter returns to page 1 when uncontrolled', () => {
    renderList({ items: KNOWLEDGE_LARGE })
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(pageReadout()).toBe('51-100 of 5000')
    search('note')
    expect(pageReadout()).toMatch(/^1-50 of /)
  })

  it('changing a filter asks for page 1 when controlled', () => {
    const onPageChange = vi.fn()
    renderList({ items: KNOWLEDGE_LARGE, table: { page: 3, onPageChange } })
    expect(pageReadout()).toBe('101-150 of 5000')
    search('note')
    expect(onPageChange).toHaveBeenCalledWith(1)
    // Controlled: the page stays where the host holds it until the host moves it.
    expect(pageReadout()).toMatch(/^101-150 of /)
  })

  it('does not change controlled filters on its own, and reports the change', () => {
    const onFiltersChange = vi.fn()
    renderList({ filters: EMPTY_KNOWLEDGE_FILTERS, onFiltersChange })
    search('kiln')
    expect(onFiltersChange).toHaveBeenCalledWith({ ...EMPTY_KNOWLEDGE_FILTERS, query: 'kiln' })
    expect(screen.getAllByTestId('knowledge-row')).toHaveLength(40)
  })

  it('reports unreadable files, even with no items', () => {
    renderList({ items: [], problems: KNOWLEDGE_PROBLEMS })
    const alert = screen.getByTestId('knowledge-problems')
    expect(within(alert).getByText('3 files could not be read')).toBeInTheDocument()
    for (const problem of KNOWLEDGE_PROBLEMS) {
      expect(alert.textContent).toContain(problem.filename)
    }
    expect(screen.getByText('No notes or sources yet')).toBeInTheDocument()
  })

  it('counts the undated items a date range leaves out', () => {
    renderList({
      items: KNOWLEDGE_SOURCES_ONLY,
      defaultFilters: { ...EMPTY_KNOWLEDGE_FILTERS, dateRange: '90d' },
    })
    expect(screen.getByText(/· 2 undated not in range$/)).toBeInTheDocument()
  })

  it('pressing a title selects its row', () => {
    const onSelectedIdChange = vi.fn()
    renderList({ onSelectedIdChange })
    const first = screen.getAllByTestId('knowledge-row')[0]!
    fireEvent.click(within(first).getByRole('link'))
    expect(onSelectedIdChange).toHaveBeenCalledWith(
      'kiln:notes:2026-09-29-cone-6-glazes-craze-on-the-thin-bowls.md'
    )
    expect(first).toHaveAttribute('aria-current', 'true')
  })

  it('Enter on a focused title selects it; focus alone does not', () => {
    const onSelectedIdChange = vi.fn()
    renderList({ onSelectedIdChange })
    const link = within(screen.getAllByTestId('knowledge-row')[1]!).getByRole('link')
    fireEvent.focus(link)
    expect(onSelectedIdChange).not.toHaveBeenCalled()
    fireEvent.keyDown(link, { key: 'Enter' })
    fireEvent.keyUp(link, { key: 'Enter' })
    expect(onSelectedIdChange).toHaveBeenCalledTimes(1)
  })

  it('marks a controlled selection without a press', () => {
    renderList({ selectedId: KNOWLEDGE_ITEMS[0]!.id })
    const selected = screen
      .getAllByTestId('knowledge-row')
      .filter((row) => row.getAttribute('aria-current') === 'true')
    expect(selected).toHaveLength(1)
    expect(within(selected[0]!).getByRole('link')).toHaveTextContent(KNOWLEDGE_ITEMS[0]!.title)
  })

  it('pressing a header sorts and sets aria-sort', () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: 'Sort by Title' }))
    expect(screen.getByRole('columnheader', { name: /Title/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
    expect(rowTitles()[0]).toBe('Add the outer planets')
  })

  it('keeps the filter row mounted but inert while loading', () => {
    renderList({ isLoading: true })
    expect(screen.queryAllByTestId('knowledge-row')).toHaveLength(0)
    expect(screen.getAllByTestId('knowledge-skeleton-row')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Sort by Title' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search notes and sources')).toHaveAttribute('readonly')
  })

  it('replaces the built-in filter row with the filterBar slot', () => {
    renderList({ slots: { filterBar: <>Host filters</> } })
    expect(screen.getByText('Host filters')).toBeInTheDocument()
    expect(screen.queryByLabelText('Search notes and sources')).not.toBeInTheDocument()
  })

  it('drops metadata columns before the title as it narrows', () => {
    renderList({ table: { fitWidth: 520 } })
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers.some((h) => h?.startsWith('Title'))).toBe(true)
    expect(headers.some((h) => h?.startsWith('Tags'))).toBe(false)
    const firstRow = screen.getAllByTestId('knowledge-row')[0]!
    expect(within(firstRow).getAllByRole('cell')).toHaveLength(headers.length)
  })

  it('leaves out hidden columns in the header and the rows', () => {
    renderList({ table: { hideColumns: ['initiative', 'tags'] } })
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers.some((h) => h?.startsWith('Initiative'))).toBe(false)
    const firstRow = screen.getAllByTestId('knowledge-row')[0]!
    expect(within(firstRow).getAllByRole('cell')).toHaveLength(headers.length)
  })

  it.each([
    ['default', {}],
    ['loading', { isLoading: true }],
    ['empty', { items: [] }],
    ['no match', { filters: { ...EMPTY_KNOWLEDGE_FILTERS, query: 'zzz' } }],
    ['problems', { problems: KNOWLEDGE_PROBLEMS }],
    ['hostile', { items: KNOWLEDGE_HOSTILE }],
  ] as const)('has no a11y violations: %s', async (_, props) => {
    // A 10-row page has every row shape; axe over all 40 rows outran the 5 s timeout in the full suite.
    const { container } = renderList({
      table: { pageSize: 10 },
      ...props,
    } as Partial<KnowledgeListProps>)
    expect(await axe(container)).toHaveNoViolations()
  })
})
