import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { KnowledgeFilterBar } from './KnowledgeFilterBar'
import { EMPTY_KNOWLEDGE_FILTERS } from './knowledge-filters'

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const React = await import('react')
  const Pressable = React.forwardRef<unknown, { className?: string }>((props, ref) =>
    React.createElement(actual.Pressable, {
      ...props,
      ref,
      dataSet: { class: props.className },
    } as never)
  )
  return { ...actual, Pressable }
})

const bar = (dateRange: 'all' | '7d') => (
  <KnowledgeFilterBar
    filters={{ ...EMPTY_KNOWLEDGE_FILTERS, dateRange }}
    onFiltersChange={vi.fn()}
  />
)

describe('KnowledgeFilterBar date select', () => {
  it('sits at the search field height', () => {
    render(bar('all'))
    expect((screen.getByRole('combobox').getAttribute('data-class') ?? '').split(' ')).toContain(
      'h-8'
    )
  })

  it('offers no clear button while the range is Any date', () => {
    render(bar('all'))
    expect(screen.queryByLabelText('Clear Date')).not.toBeInTheDocument()
  })

  it('clears a chosen range back to Any date', () => {
    const onFiltersChange = vi.fn()
    render(
      <KnowledgeFilterBar
        filters={{ ...EMPTY_KNOWLEDGE_FILTERS, dateRange: '7d' }}
        onFiltersChange={onFiltersChange}
      />
    )
    fireEvent.click(screen.getByLabelText('Clear Date'))
    expect(onFiltersChange).toHaveBeenCalledWith({ ...EMPTY_KNOWLEDGE_FILTERS, dateRange: 'all' })
  })
})
