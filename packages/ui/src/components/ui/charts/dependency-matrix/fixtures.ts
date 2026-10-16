// Synthetic, labelled fixtures for DependencyMatrix. Every name is invented; only the numeric shapes
// (item, edge and weight counts) follow the TD-35 Round 0 contract. Not exported from any barrel.
import { seededRandom } from '../kit/seededRandom'

export interface FixtureItem {
  id: string
  label: string
  group?: string
}

export interface FixtureCell {
  from: string
  to: string
  value: number | null
  flag?: 'cycle' | 'violation'
}

export interface MatrixFixture {
  name: string
  items: FixtureItem[]
  cells: FixtureCell[]
}

const pad = (n: number): string => String(n).padStart(2, '0')

function makeItems(count: number, prefix: string, group?: string): FixtureItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${pad(i)}`,
    label: `${prefix}-${pad(i)}`,
    ...(group ? { group } : {}),
  }))
}

const pairKey = (from: string, to: string): string => `${from}\u0000${to}`

/** Adds `count` unique off-diagonal cells with weights 1 to 6, skipping pairs already in `taken`. */
function scatterCells(
  items: FixtureItem[],
  count: number,
  seed: number,
  taken: Set<string> = new Set()
): FixtureCell[] {
  const random = seededRandom(seed)
  const cells: FixtureCell[] = []
  const seen = new Set(taken)
  while (cells.length < count) {
    const from = items[Math.floor(random() * items.length)].id
    const to = items[Math.floor(random() * items.length)].id
    const key = pairKey(from, to)
    if (from === to || seen.has(key) || seen.has(pairKey(to, from))) continue
    seen.add(key)
    cells.push({ from, to, value: 1 + Math.floor(random() * 6) })
  }
  return cells
}

const keysOf = (cells: FixtureCell[]): Set<string> =>
  new Set(cells.map((c) => pairKey(c.from, c.to)))

// Default: 31 items, 68 edges. Contains the hub column, the heaviest cell and one mutual pair.
const defaultItems = makeItems(31, 'module')
const hubId = 'module-00'
const hubWeights = [6, 6, 6, ...Array<number>(22).fill(5)]
const hubCells: FixtureCell[] = hubWeights.map((value, i) => ({
  from: defaultItems[i + 1].id,
  to: hubId,
  value,
}))
const heaviestCell: FixtureCell = { from: 'module-30', to: 'module-29', value: 16 }
const cycleCells: FixtureCell[] = [
  { from: 'module-12', to: 'module-13', value: 3, flag: 'cycle' },
  { from: 'module-13', to: 'module-12', value: 2, flag: 'cycle' },
]
const anchored = [...hubCells, heaviestCell, ...cycleCells]
const defaultCells = [
  ...anchored,
  ...scatterCells(defaultItems, 68 - anchored.length, 11, keysOf(anchored)),
]

const defaultFixture: MatrixFixture = { name: 'Default', items: defaultItems, cells: defaultCells }

const hubFixture: MatrixFixture = {
  name: 'Hub',
  items: defaultItems,
  cells: defaultCells.filter((c) => c.to === hubId),
}

const heaviestFixture: MatrixFixture = {
  name: 'Heaviest cell',
  items: defaultItems,
  cells: defaultCells,
}

const cycleFixture: MatrixFixture = {
  name: 'Cycle',
  items: defaultItems.filter((i) => ['module-12', 'module-13'].includes(i.id)),
  cells: cycleCells,
}

const wideItems = makeItems(46, 'pkg/core/util')
const wideFixture: MatrixFixture = {
  name: 'Wide',
  items: wideItems,
  cells: scatterCells(wideItems, 147, 23),
}

const packageItems: FixtureItem[] = [
  ...makeItems(18, 'lib', 'libraries'),
  ...makeItems(2, 'app', 'apps'),
]
const packageFixture: MatrixFixture = {
  name: 'Package level',
  items: packageItems,
  cells: scatterCells(packageItems, 22, 37).map((c) => ({
    ...c,
    value: c.value === null ? null : c.value * 4,
  })),
}

const oneItemFixture: MatrixFixture = {
  name: 'One item',
  items: [{ id: 'solo-00', label: 'solo-00' }],
  cells: [],
}

const noEdgesFixture: MatrixFixture = {
  name: 'No edges',
  items: makeItems(2, 'standalone'),
  cells: [],
}

const emptyFixture: MatrixFixture = { name: 'Empty', items: [], cells: [] }

const veryLargeItems = makeItems(386, 'file')
const veryLargeFixture: MatrixFixture = {
  name: 'Very large',
  items: veryLargeItems,
  cells: scatterCells(veryLargeItems, 1021, 53),
}

const longLabelFixture: MatrixFixture = {
  name: 'Long label',
  items: [
    ...makeItems(3, 'module'),
    {
      id: 'module-long',
      label: 'module-with-a-deliberately-long-descriptive-name-for-truncation.test.ts',
    },
  ],
  cells: [
    { from: 'module-00', to: 'module-long', value: 2 },
    { from: 'module-long', to: 'module-01', value: 4 },
    { from: 'module-02', to: 'module-long', value: 1 },
  ],
}

const nullWeightFixture: MatrixFixture = {
  name: 'Null weight',
  items: makeItems(3, 'module'),
  cells: [
    { from: 'module-00', to: 'module-01', value: null },
    { from: 'module-01', to: 'module-02', value: 5 },
  ],
}

export const hostileFixture: MatrixFixture = {
  name: 'Hostile',
  items: [
    { id: 'module-00', label: 'module-00' },
    { id: 'module-01', label: 'module-01' },
    { id: 'module-01', label: 'module-01 (duplicate id)' },
  ],
  cells: [
    { from: 'module-00', to: 'missing-id', value: 3 },
    { from: 'module-00', to: 'module-00', value: 2 },
    { from: 'module-00', to: 'module-01', value: 4 },
    { from: 'module-00', to: 'module-01', value: 1 },
    { from: 'module-01', to: 'module-00', value: -2 },
    { from: 'module-01', to: 'module-00', value: Number.NaN },
  ],
}

export const matrixFixtures: MatrixFixture[] = [
  defaultFixture,
  hubFixture,
  heaviestFixture,
  cycleFixture,
  wideFixture,
  packageFixture,
  oneItemFixture,
  noEdgesFixture,
  emptyFixture,
  veryLargeFixture,
  longLabelFixture,
  nullWeightFixture,
  hostileFixture,
]

export const hubItemId = hubId
