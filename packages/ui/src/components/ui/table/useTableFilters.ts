import { useMemo } from 'react'
import { useControllableState } from '../../../hooks/useControllableState'
import {
  activeFilterCount as countActiveFilters,
  clearFilters as withoutFilters,
  facetCounts,
  facetOptions as mergeFacetOptions,
  toggleSetFilter,
  type FacetOption,
  type TableFilters,
  type TableFilterValue,
} from './table-model'
import type { ColumnDef, TableSort, UseTableOptions } from './table-state-types'

const NO_FILTERS: TableFilters = {}
const NO_VALUES: readonly string[] = []

export interface PipelineInput<T> {
  isManual: boolean
  data: T[]
  filters: TableFilters
  columns: readonly ColumnDef<T>[]
  sort: TableSort
  comparators: UseTableOptions<T>['comparators']
}

export function useFilterSlice<T>(options: UseTableOptions<T>, columns: readonly ColumnDef<T>[]) {
  const [filters, setFilters] = useControllableState<TableFilters>({
    value: options.filters,
    defaultValue: options.defaultFilters ?? NO_FILTERS,
    onChange: options.onFiltersChange,
  })
  const setFilter = (field: string, value: TableFilterValue | undefined) =>
    setFilters(
      value === undefined ? withoutFilters(filters, field) : { ...filters, [field]: value }
    )
  return {
    filters,
    setFilter,
    toggleFilterValue: (field: string, value: string) =>
      setFilters(toggleSetFilter(filters, field, value)),
    clearFilters: (field?: string) => setFilters(withoutFilters(filters, field)),
    activeFilterCount: countActiveFilters(filters, columns),
  }
}

/** Each field's facet counts over `rows`, counted on first ask and kept for these rows and columns. */
function facetCountsByField<T>(rows: readonly T[], columns: readonly ColumnDef<T>[]) {
  const cache = new Map<string, Record<string, number>>()
  return (field: string): Record<string, number> => {
    const cached = cache.get(field)
    if (cached) return cached
    const counts = facetCounts(rows, columns.find((c) => c.key === field) ?? { key: field })
    cache.set(field, counts)
    return counts
  }
}

export function useFacetOptions<T>(input: PipelineInput<T>) {
  const { isManual, data, filters, columns } = input
  const countsFor = useMemo(() => facetCountsByField(data, columns), [data, columns])
  return (field: string, counts?: Readonly<Record<string, number>>): FacetOption[] => {
    const value = filters[field]
    const selected = Array.isArray(value) ? (value as readonly string[]) : NO_VALUES
    return mergeFacetOptions(counts ?? (isManual ? undefined : countsFor(field)), selected)
  }
}
