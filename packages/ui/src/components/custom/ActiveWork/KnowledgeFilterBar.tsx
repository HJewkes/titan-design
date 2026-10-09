// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View } from 'react-native'
import { Input } from '../../ui/input'
import { Select, type SelectOption } from '../../ui/select'
import {
  KNOWLEDGE_CLASS_META,
  NOTE_KIND_LABEL,
  NOTE_KINDS,
  SOURCE_TYPE_LABEL,
  SOURCE_TYPES,
} from './knowledge-class'
import {
  knowledgeFacetCounts,
  type KnowledgeDateRange,
  type KnowledgeFilters,
  type KnowledgeItem,
  type KnowledgeRecord,
} from './knowledge-filters'

const DATE_RANGE_OPTIONS: SelectOption<KnowledgeDateRange>[] = [
  { value: 'all', label: 'Any date' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const counted = (label: string, count: number) => `${label} (${count})`

function useFacetOptions(items: KnowledgeItem[]) {
  return useMemo(() => {
    const counts = knowledgeFacetCounts(items)
    return {
      initiatives: Object.keys(counts.initiatives)
        .sort((a, b) => a.localeCompare(b))
        .map((slug) => ({ value: slug, label: counted(slug, counts.initiatives[slug] ?? 0) })),
      records: (['note', 'source'] as KnowledgeRecord[]).map((record) => ({
        value: record,
        label: counted(KNOWLEDGE_CLASS_META[record].plural, counts.records[record]),
      })),
      noteKinds: NOTE_KINDS.map((kind) => ({
        value: kind,
        label: counted(NOTE_KIND_LABEL[kind], counts.noteKinds[kind]),
      })),
      sourceTypes: SOURCE_TYPES.map((type) => ({
        value: type,
        label: counted(SOURCE_TYPE_LABEL[type], counts.sourceTypes[type]),
      })),
    }
  }, [items])
}

export interface KnowledgeFilterBarProps {
  /** Every item, before filtering: the options and their counts come from these. */
  items: KnowledgeItem[]
  filters: KnowledgeFilters
  onFiltersChange: (filters: KnowledgeFilters) => void
  /** Keeps the row mounted but inert, while the list loads. */
  isDisabled?: boolean
}

/**
 * KnowledgeFilterBar — the knowledge list's built-in filter row: a query field,
 * then one multi-select per facet with its counts, then a date range.
 *
 * Composes {@link Input} and {@link Select}. A stand-in until `ui/facet-bar`
 * ships toggle chips with a pressed state; the list's `slots.filterBar` replaces it.
 */
export function KnowledgeFilterBar({
  items,
  filters,
  onFiltersChange,
  isDisabled = false,
}: KnowledgeFilterBarProps) {
  const options = useFacetOptions(items)
  const set = (patch: Partial<KnowledgeFilters>) => onFiltersChange({ ...filters, ...patch })
  const multi = {
    isMulti: true,
    isDisabled,
    variant: 'filled',
    className: 'w-auto min-w-40',
  } as const

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
        {...multi}
        accessibilityLabel="Initiative"
        placeholder="Any initiative"
        options={options.initiatives}
        values={filters.initiatives}
        onChangeMulti={(initiatives) => set({ initiatives })}
      />
      <Select
        {...multi}
        accessibilityLabel="Record"
        placeholder="Notes and sources"
        options={options.records}
        values={filters.records}
        onChangeMulti={(records) => set({ records })}
      />
      <Select
        {...multi}
        accessibilityLabel="Note kind"
        placeholder="Any note kind"
        options={options.noteKinds}
        values={filters.noteKinds}
        onChangeMulti={(noteKinds) => set({ noteKinds })}
      />
      <Select
        {...multi}
        accessibilityLabel="Source type"
        placeholder="Any source type"
        options={options.sourceTypes}
        values={filters.sourceTypes}
        onChangeMulti={(sourceTypes) => set({ sourceTypes })}
      />
      <Select
        isDisabled={isDisabled}
        variant="filled"
        className="w-auto min-w-40"
        accessibilityLabel="Date"
        options={DATE_RANGE_OPTIONS}
        value={filters.dateRange}
        onChange={(dateRange) => set({ dateRange: dateRange ?? 'all' })}
      />
    </View>
  )
}
