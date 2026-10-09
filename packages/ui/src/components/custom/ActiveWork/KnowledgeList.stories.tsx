import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { KnowledgeList, type KnowledgeListProps } from './KnowledgeList'
import type { KnowledgeItem, KnowledgeProblem } from './knowledge-filters'
import {
  KNOWLEDGE_EMPTY,
  KNOWLEDGE_HOSTILE,
  KNOWLEDGE_ITEMS,
  KNOWLEDGE_LARGE,
  KNOWLEDGE_NOW,
  KNOWLEDGE_ONE,
  KNOWLEDGE_PROBLEMS,
  KNOWLEDGE_SAME_DAY,
  KNOWLEDGE_SOURCES_ONLY,
} from './knowledge-fixture'

const ITEM_SETS: Record<string, KnowledgeItem[]> = {
  items: KNOWLEDGE_ITEMS,
  empty: KNOWLEDGE_EMPTY,
  one: KNOWLEDGE_ONE,
  'sources only': KNOWLEDGE_SOURCES_ONLY,
  'same day': KNOWLEDGE_SAME_DAY,
  hostile: KNOWLEDGE_HOSTILE,
  large: KNOWLEDGE_LARGE,
}

const PROBLEM_SETS: Record<string, KnowledgeProblem[]> = {
  none: [],
  three: KNOWLEDGE_PROBLEMS,
}

type StoryArgs = Omit<KnowledgeListProps, 'items' | 'problems'> & {
  itemSet: string
  problemSet: string
}

// Storybook maps a key to its fixture; composeStories (the smoke test) passes the key through.
const pick = <T,>(sets: Record<string, T>, value: string | T): T =>
  typeof value === 'string' ? sets[value]! : value

const meta: Meta<StoryArgs> = {
  title: 'Custom/ActiveWork/KnowledgeList',
  component: KnowledgeList as unknown as Meta<StoryArgs>['component'],
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    itemSet: 'items',
    problemSet: 'none',
    now: KNOWLEDGE_NOW,
    isLoading: false,
    pageSize: 50,
  },
  argTypes: {
    itemSet: {
      name: 'items',
      control: 'select',
      options: Object.keys(ITEM_SETS),
      mapping: ITEM_SETS,
    },
    problemSet: {
      name: 'problems',
      control: 'select',
      options: Object.keys(PROBLEM_SETS),
      mapping: PROBLEM_SETS,
    },
    hideColumns: { control: 'check', options: ['initiative', 'record', 'kind', 'date', 'tags'] },
    isLoading: { control: 'boolean' },
    pageSize: { control: { type: 'number', min: 5, step: 5 } },
    fitWidth: { control: { type: 'number', min: 200, step: 20 } },
    label: { control: 'text' },
    now: { table: { disable: true } },
    filters: { control: false },
    defaultFilters: { control: false },
    onFiltersChange: { control: false },
    selectedId: { control: false },
    defaultSelectedId: { control: false },
    onSelectedIdChange: { control: false },
    page: { control: false },
    defaultPage: { control: false },
    onPageChange: { control: false },
    filterBar: { control: false },
    emptyState: { control: false },
    noMatchState: { control: false },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6">
        <View className="w-full max-w-[1100px]">
          <Story />
        </View>
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** Every note and source across initiatives in one filterable, sortable, paged table; ' +
          "a row's title is a link that selects it for the host's reader. Composes " +
          '[Table](?path=/docs/components-organisms-table--docs) at `density="dense"` with `useTable` and ' +
          '`useColumnFit`, [Eyebrow](?path=/docs/components-atoms-eyebrow--docs) (a polite live count), ' +
          '[Alert](?path=/docs/components-molecules-alert--docs) (unreadable files), ' +
          '[Input](?path=/docs/components-atoms-input--docs) and ' +
          '[Select](?path=/docs/components-molecules-select--docs) (the built-in filter row, replaced by the ' +
          '`filterBar` slot), [Pill](?path=/docs/components-atoms-pill--docs), ' +
          '[DateTime](?path=/docs/components-atoms-datetime--docs) and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs). ' +
          'Loading: `isLoading` keeps the header and filter row, fills the body with skeleton cells and ' +
          'makes the filters inert. Empty: no items, or items the filters exclude, which offers a reset. ' +
          'Error: `problems` lists files the source could not read; a failed list read is the host’s ' +
          '`Alert`. No disabled state: the list is read-only and not a control.',
      },
    },
  },
  render: function Render({ itemSet, problemSet, ...args }) {
    return (
      <KnowledgeList
        {...args}
        items={pick(ITEM_SETS, itemSet)}
        problems={pick(PROBLEM_SETS, problemSet)}
      />
    )
  },
}
export default meta

type Story = StoryObj<StoryArgs>

export const Default: Story = {}
