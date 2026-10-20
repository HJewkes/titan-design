import type { ChipGroupItem } from './ChipGroup'

export interface ChipGroupFixture {
  label: string
  items: ChipGroupItem[]
  defaultValue?: string
}

export const chipGroupFixtures = {
  default: {
    label: 'Kind',
    items: [
      { value: 'all', label: 'All', count: 48 },
      { value: 'clips', label: 'Clips', count: 12 },
      { value: 'talks', label: 'Talks', count: 9 },
      { value: 'demos', label: 'Demos', count: 14 },
      { value: 'notes', label: 'Notes', count: 6 },
      { value: 'interviews', label: 'Interviews', count: 4 },
      { value: 'walkthroughs', label: 'Walkthroughs', count: 2 },
      { value: 'archive', label: 'Archive', count: 1 },
    ],
    defaultValue: 'all',
  },
  selectedPastTheFold: {
    label: 'Kind',
    items: [
      { value: 'all', label: 'All', count: 48 },
      { value: 'clips', label: 'Clips', count: 12 },
      { value: 'talks', label: 'Talks', count: 9 },
      { value: 'demos', label: 'Demos', count: 14 },
      { value: 'notes', label: 'Notes', count: 6 },
      { value: 'interviews', label: 'Interviews', count: 4 },
      { value: 'walkthroughs', label: 'Walkthroughs', count: 2 },
      { value: 'archive', label: 'Archive', count: 1 },
    ],
    defaultValue: 'walkthroughs',
  },
  withoutCounts: {
    label: 'Period',
    items: [
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'quarter', label: 'Quarter' },
    ],
    defaultValue: 'month',
  },
  oneDisabled: {
    label: 'Kind',
    items: [
      { value: 'all', label: 'All', count: 20 },
      { value: 'clips', label: 'Clips', count: 0, isDisabled: true },
      { value: 'talks', label: 'Talks', count: 20 },
    ],
    defaultValue: 'all',
  },
  oneItem: { label: 'Kind', items: [{ value: 'all', label: 'All', count: 3 }] },
  empty: { label: 'Kind', items: [] },
  largeCounts: {
    label: 'Kind',
    items: [
      { value: 'all', label: 'All', count: 128400 },
      { value: 'clips', label: 'Clips', count: 98250 },
      { value: 'talks', label: 'Talks', count: 30150 },
    ],
  },
} satisfies Record<string, ChipGroupFixture>
