import type { FacetOption } from './FacetBar'

export interface FacetBarFixture {
  label: string
  options: FacetOption[]
  selectionMode: 'single' | 'multiple'
  defaultValue: string[] | string | null
}

const manyCounts = [4, 0, 12, 7, 31, 1, 250, 9, 18, 2]

export const facetBarFixtures = {
  default: {
    label: 'Record',
    options: [
      { value: 'notes', label: 'Notes', count: 128 },
      { value: 'sources', label: 'Sources', count: 42 },
      { value: 'drafts', label: 'Drafts', count: 7 },
    ],
    selectionMode: 'multiple',
    defaultValue: ['notes'],
  },
  single: {
    label: 'Period',
    options: [
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'quarter', label: 'Quarter' },
    ],
    selectionMode: 'single',
    defaultValue: 'month',
  },
  empty: { label: 'Kind', options: [], selectionMode: 'multiple', defaultValue: [] },
  oneOption: {
    label: 'Kind',
    options: [{ value: 'only', label: 'Only', count: 3 }],
    selectionMode: 'multiple',
    defaultValue: [],
  },
  many: {
    label: 'Group',
    options: Array.from({ length: 40 }, (_, i) => ({
      value: `group-${i + 1}`,
      label: `Group ${String(i + 1).padStart(2, '0')}`,
      count: manyCounts[i % manyCounts.length],
    })),
    selectionMode: 'multiple',
    defaultValue: [],
  },
  longLabel: {
    label: 'Kind',
    options: [
      { value: 'a', label: 'Short' },
      {
        value: 'long',
        label: 'A label that keeps going well past the width of a narrow column ok',
      },
      { value: 'b', label: 'Brief' },
      { value: 'c', label: 'Tiny' },
    ],
    selectionMode: 'multiple',
    defaultValue: ['long'],
  },
  zeroAndLarge: {
    label: 'Volume',
    options: [
      { value: 'zero', label: 'Zero', count: 0 },
      { value: 'one', label: 'One', count: 1 },
      { value: 'high', label: 'High', count: 999 },
      { value: 'higher', label: 'Higher', count: 12_400 },
      { value: 'highest', label: 'Highest', count: 1_250_000 },
    ],
    selectionMode: 'multiple',
    defaultValue: [],
  },
  withDisabled: {
    label: 'Class',
    options: [
      { value: 'one', label: 'One', count: 5 },
      { value: 'two', label: 'Two', count: 3, isDisabled: true },
      { value: 'three', label: 'Three', count: 2 },
      { value: 'four', label: 'Four', count: 1 },
    ],
    selectionMode: 'multiple',
    defaultValue: ['two'],
  },
  duplicateValue: {
    label: 'Kind',
    options: [
      { value: 'alpha', label: 'Alpha' },
      { value: 'alpha', label: 'Alpha again' },
      { value: 'beta', label: 'Beta' },
    ],
    selectionMode: 'multiple',
    defaultValue: [],
  },
  staleSelection: {
    label: 'Record',
    options: [
      { value: 'notes', label: 'Notes', count: 128 },
      { value: 'sources', label: 'Sources', count: 42 },
    ],
    selectionMode: 'multiple',
    defaultValue: ['gone', 'notes'],
  },
} satisfies Record<string, FacetBarFixture>
