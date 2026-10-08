// Synthetic fixtures for Board. Every name is invented (an editorial pipeline); only the numeric
// shapes follow the TP-852 Round 0 contract. Deterministic by construction. Not exported from any barrel.
import { seededRandom } from '../charts/kit/seededRandom'
import type { BoardColumn, BoardItem, BoardLane } from './types'

export interface BoardFixture {
  columns: BoardColumn[]
  lanes: BoardLane[]
  items: BoardItem[]
  highlightedItemId?: string | null
}

const COLUMNS: BoardColumn[] = [
  { id: 'pitched', label: 'Pitched', tone: 'neutral' },
  { id: 'drafting', label: 'Drafting', tone: 'info', limit: 6 },
  { id: 'in-edit', label: 'In edit', tone: 'warning' },
  { id: 'scheduled', label: 'Scheduled', tone: 'brand' },
  { id: 'published', label: 'Published', tone: 'success' },
]

const LANES: BoardLane[] = [
  { id: 'news', label: 'News' },
  { id: 'features', label: 'Features' },
  { id: 'opinion', label: 'Opinion' },
]

const SUBJECTS = ['Harbour', 'Orchard', 'Lantern', 'Quarry', 'Meadow', 'Copper', 'Tidal', 'Granite']
const pad = (n: number, width: number): string => String(n).padStart(width, '0')

function makeItem(n: number, columnId: string, laneId?: string): BoardItem {
  return {
    id: `story-${pad(n, 3)}`,
    columnId,
    ...(laneId ? { laneId } : {}),
    label: `${SUBJECTS[n % SUBJECTS.length]} piece ${pad(n, 3)}`,
  }
}

/** Builds items cell by cell; `counts[lane][column]` is the number of items in that cell. */
function fromCounts(counts: number[][], lanes: BoardLane[] | null): BoardItem[] {
  const items: BoardItem[] = []
  counts.forEach((laneCounts, laneIndex) =>
    laneCounts.forEach((count, columnIndex) => {
      for (let k = 0; k < count; k++) {
        items.push(makeItem(items.length, COLUMNS[columnIndex].id, lanes?.[laneIndex].id))
      }
    })
  )
  return items
}

const DEFAULT_COUNTS = [[3, 6, 5, 4, 6]]
const LANE_COUNTS = [
  [1, 3, 3, 0, 3],
  [1, 2, 2, 2, 2],
  [1, 1, 0, 2, 1],
]

export const BOARD_DEFAULT: BoardFixture = {
  columns: COLUMNS,
  lanes: [],
  items: fromCounts(DEFAULT_COUNTS, null),
}

export const BOARD_LANES: BoardFixture = {
  columns: COLUMNS,
  lanes: LANES,
  items: fromCounts(LANE_COUNTS, LANES),
}

export const BOARD_OVER_LIMIT: BoardFixture = {
  columns: COLUMNS.map((column) => (column.id === 'in-edit' ? { ...column, limit: 4 } : column)),
  lanes: [],
  items: BOARD_DEFAULT.items,
}

export const BOARD_ONE_ITEM: BoardFixture = {
  columns: COLUMNS,
  lanes: [],
  items: [makeItem(0, 'drafting')],
}

export const BOARD_EMPTY: BoardFixture = { columns: COLUMNS, lanes: [], items: [] }

export const BOARD_NO_COLUMNS: BoardFixture = { columns: [], lanes: [], items: [] }

const VERY_LARGE_LANES: BoardLane[] = Array.from({ length: 8 }, (_, i) => ({
  id: `desk-${i + 1}`,
  label: `Desk ${i + 1}`,
}))

function veryLargeItems(): BoardItem[] {
  const random = seededRandom(20261003)
  const lastColumn = COLUMNS.length - 1
  return Array.from({ length: 900 }, (_, n) => {
    const columnIndex = n < 432 ? lastColumn : Math.floor(random() * lastColumn)
    const lane = VERY_LARGE_LANES[Math.floor(random() * VERY_LARGE_LANES.length)]
    return makeItem(n, COLUMNS[columnIndex].id, lane.id)
  })
}

export const BOARD_VERY_LARGE: BoardFixture = {
  columns: COLUMNS,
  lanes: VERY_LARGE_LANES,
  items: veryLargeItems(),
}

export const BOARD_LONG_LABEL: BoardFixture = {
  columns: COLUMNS,
  lanes: [],
  items: [
    { ...makeItem(0, 'pitched'), label: 'Unbroken'.repeat(32).slice(0, 254) },
    {
      ...makeItem(1, 'drafting'),
      label: 'A slow walk along the harbour wall in search of the last working lantern '
        .repeat(3)
        .slice(0, 152),
    },
  ],
}

export const BOARD_MISSING: BoardFixture = {
  columns: COLUMNS.map(({ id, label }) => ({ id, label })),
  lanes: LANES,
  items: [
    makeItem(0, 'pitched', 'news'),
    makeItem(1, 'drafting', 'features'),
    makeItem(2, 'pitched'),
    makeItem(3, 'drafting'),
    makeItem(4, 'in-edit'),
    makeItem(5, 'published'),
    makeItem(6, 'in-edit', 'no-such-desk'),
  ],
}

const HOSTILE_LIMITS = [0, -1, Number.NaN, Number.POSITIVE_INFINITY]

export const BOARD_HOSTILE: BoardFixture = {
  columns: [
    ...COLUMNS.slice(0, 4).map((column, i) => ({ ...column, limit: HOSTILE_LIMITS[i] })),
    { id: 'pitched', label: 'Pitched again' },
  ],
  lanes: [...LANES, { id: 'news', label: 'News again' }],
  items: [
    makeItem(0, 'pitched', 'news'),
    makeItem(0, 'drafting', 'news'),
    makeItem(1, 'no-such-column', 'features'),
    { ...makeItem(2, 'in-edit'), label: '' },
  ],
  highlightedItemId: 'no-such-item',
}

export const BOARD_FIXTURES: Record<string, BoardFixture> = {
  default: BOARD_DEFAULT,
  lanes: BOARD_LANES,
  overLimit: BOARD_OVER_LIMIT,
  oneItem: BOARD_ONE_ITEM,
  empty: BOARD_EMPTY,
  noColumns: BOARD_NO_COLUMNS,
  veryLarge: BOARD_VERY_LARGE,
  longLabel: BOARD_LONG_LABEL,
  missing: BOARD_MISSING,
  hostile: BOARD_HOSTILE,
}
