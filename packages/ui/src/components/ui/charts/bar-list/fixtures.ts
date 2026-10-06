// Synthetic, labelled fixtures for BarList. Every name is invented; tool names such as Bash are
// product vocabulary. Not exported from any barrel.
import { seededRandom } from '../kit/seededRandom'
import type { BarListRow } from './bar-list-model'

export interface BarListFixture {
  name: string
  rows: BarListRow[]
  max?: number
  sort?: 'descending' | 'none'
  maxRows?: number
  layout?: 'inline' | 'stacked'
}

const fromValues = (prefix: string, values: (number | null)[]): BarListRow[] =>
  values.map((value, i) => ({ id: `${prefix}-${i}`, label: `${prefix} ${i + 1}`, value }))

const toolNames = [
  'Bash',
  'Read',
  'Edit',
  'Grep',
  'Write',
  'Glob',
  'WebFetch',
  'Task',
  'TodoWrite',
  'NotebookEdit',
  'WebSearch',
  'KillShell',
]
const toolCounts = [412, 388, 201, 96, 44, 31, 18, 9, 6, 3, 2, 1]

export const defaultFixture: BarListFixture = {
  name: 'Default',
  maxRows: 10,
  rows: toolNames.map((label, i) => ({ id: label, label, value: toolCounts[i] })),
}

const spendDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon (prev)']
const spend = [84.2, 61.05, 47.9, 33.33, 21.1, 12.75, 6.4, 2.08]

const withSecondary: BarListFixture = {
  name: 'With secondary',
  rows: spendDays.map((label, i) => ({
    id: `spend-${i}`,
    label,
    value: spend[i],
    secondaryValue: 12 - i,
  })),
}

const errorRows = [
  ['Parser', 9.1],
  ['Formatter', 6.4],
  ['Scheduler', 4.2],
  ['Exporter', 2.7],
  ['Importer', 0.9],
] as const

const flagged: BarListFixture = {
  name: 'Flagged',
  rows: errorRows.map(([label, value], i) => ({
    id: `err-${i}`,
    label,
    value,
    ...(i < 2 ? { flag: { tone: 'error' as const, label: 'over 5%' } } : {}),
    ...(i === 2 ? { flag: { tone: 'warning' as const, label: 'near 5%' } } : {}),
  })),
}

export const funnelFixture: BarListFixture = {
  name: 'Funnel',
  sort: 'none',
  max: 100,
  rows: ['Started', 'Planned', 'Built', 'Reviewed', 'Shipped'].map((label, i) => ({
    id: `stage-${i}`,
    label,
    value: [100, 82, 61, 40, 12][i],
  })),
}

const withDescription: BarListFixture = {
  name: 'With description',
  layout: 'stacked',
  rows: [
    ['Widget.tsx', 'src/widgets/Widget.tsx', 41],
    ['index.ts', 'src/widgets/index.ts', 33],
    ['format.ts', 'src/utils/format.ts', 27],
    ['Panel.tsx', 'src/panels/Panel.tsx', 19],
    ['theme.css', 'src/theme/theme.css', 14],
    ['notes.md', 'docs/notes.md', 8],
    ['config.json', 'config/config.json', 5],
    ['fixtures.ts', 'src/test/fixtures.ts', 2],
  ].map(([label, description, value]) => ({
    id: String(description),
    label: String(label),
    description: String(description),
    value: Number(value),
  })),
}

const empty: BarListFixture = { name: 'Empty', rows: [] }
const oneItem: BarListFixture = { name: 'One item', rows: fromValues('Solo', [58]) }
const allEqual: BarListFixture = { name: 'All equal', rows: fromValues('Even', [7, 7, 7, 7, 7, 7]) }
const allZero: BarListFixture = { name: 'All zero', rows: fromValues('Idle', [0, 0, 0, 0]) }

const missingValues: BarListFixture = {
  name: 'Missing values',
  rows: [
    ...fromValues('Seen', [40, 25, 12, null, 3]).map((row) => ({
      ...row,
      secondaryValue: row.id === 'Seen-2' ? null : 5,
    })),
    { id: 'Seen-5', label: 'Seen 6', value: null, secondaryValue: 2 },
  ],
}

const veryLargeCount = 5000

export const veryLargeFixture: BarListFixture = {
  name: 'Very large',
  maxRows: 10,
  rows: (() => {
    const random = seededRandom(848)
    return Array.from({ length: veryLargeCount }, (_, i) => ({
      id: `bulk-${i}`,
      label: `Bulk item ${i}`,
      value: Math.floor(random() * 100000),
    }))
  })(),
}

const longLabel: BarListFixture = {
  name: 'Long label',
  layout: 'stacked',
  rows: [
    {
      id: 'long-0',
      label: `Long label ${'with many words '.repeat(7)}`.slice(0, 120),
      value: 123456789,
      description: 'A long description. '.repeat(15).slice(0, 300),
    },
    { id: 'long-1', label: 'x'.repeat(60), value: 4200 },
    { id: 'long-2', label: 'Short', value: 17 },
  ],
}

export const hostileFixture: BarListFixture = {
  name: 'Hostile',
  rows: [
    { id: 'dup', label: 'Duplicate A', value: 10 },
    { id: 'dup', label: 'Duplicate B', value: 20 },
    { id: 'nan', label: 'Not a number', value: Number.NaN },
    { id: 'inf', label: 'Infinite', value: Number.POSITIVE_INFINITY, secondaryValue: Number.NaN },
    { id: 'neg', label: 'Negative', value: -5 },
    { id: 'empty-label', label: '', value: 3 },
  ],
}

/** Option sets that the hostile rows must survive. */
export const hostileOptionSets: Pick<BarListFixture, 'max' | 'maxRows'>[] = [
  { max: 0 },
  { max: -5 },
  { max: Number.NaN },
  { maxRows: 0 },
  { maxRows: 2.5 },
  { maxRows: -3 },
]

export const barListFixtures: BarListFixture[] = [
  defaultFixture,
  withSecondary,
  flagged,
  funnelFixture,
  withDescription,
  empty,
  oneItem,
  allEqual,
  allZero,
  missingValues,
  veryLargeFixture,
  longLabel,
  hostileFixture,
]
