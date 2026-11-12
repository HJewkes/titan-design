// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { Input } from '../../ui/input'
import { Select, type SelectOption } from '../../ui/select'
import type { KnowledgeDateRange, KnowledgeFilters } from './knowledge-filters'

const DATE_RANGE_OPTIONS: SelectOption<KnowledgeDateRange>[] = [
  { value: 'all', label: 'Any date' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export interface KnowledgeFilterBarProps {
  filters: KnowledgeFilters
  onFiltersChange: (filters: KnowledgeFilters) => void
  /** Keeps the row mounted but inert, while the list loads. */
  isDisabled?: boolean
}

/**
 * KnowledgeFilterBar — the knowledge list's built-in filter row: a query field and
 * a date range.
 *
 * Composes {@link Input} and {@link Select}. The initiative, record, kind and type
 * facets wait for `ui/facet-bar`, toggle chips with a pressed state (contract C4).
 * Until then the host drives them through `filters` and puts its own controls in
 * the list's `slots.filterBar`, which replaces this row.
 */
export function KnowledgeFilterBar({
  filters,
  onFiltersChange,
  isDisabled = false,
}: KnowledgeFilterBarProps) {
  const set = (patch: Partial<KnowledgeFilters>) => onFiltersChange({ ...filters, ...patch })
  return (
    <View role="group" aria-label="Filters" className="flex-row flex-wrap items-center gap-2">
      <Input
        size="sm"
        className="w-auto min-w-56"
        value={filters.query}
        onChangeText={(query) => set({ query })}
        placeholder="Search titles, paths, tags"
        accessibilityLabel="Search notes and sources"
        isDisabled={isDisabled}
      />
      <Select
        isDisabled={isDisabled}
        variant="filled"
        size="sm"
        isClearable={filters.dateRange !== 'all'}
        className="w-auto min-w-40"
        accessibilityLabel="Date"
        options={DATE_RANGE_OPTIONS}
        value={filters.dateRange}
        onChange={(dateRange) => set({ dateRange: dateRange ?? 'all' })}
      />
    </View>
  )
}
