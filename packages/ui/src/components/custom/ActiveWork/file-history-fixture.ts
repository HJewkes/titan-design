import type { FileActivityDetailData } from './FileActivityDetail'
import type { CoChangeEdge, FileHistoryStat } from './FileHistoryExplorer'

/**
 * A small, hand-trimmed slice of a real session-history mine, used by the
 * ActiveWork file-history stories and tests. Fixed values (no `Date.now()`, no
 * randomness) so visual baselines stay deterministic.
 */
export const FILE_HISTORY_FILES: FileActivityDetailData[] = [
  {
    path: 'src/commands/open.ts',
    reads: 84,
    writes: 12,
    edits: 61,
    touches: 157,
    sessions: 23,
    charsAdded: 41280,
    charsRemoved: 9640,
    netGrowth: 31640,
    firstTouched: '2026-05-02T10:12:00Z',
    lastTouched: '2026-07-11T18:40:00Z',
    timeline: [120, 340, -80, 910, 420, 0, 1580, 260, -310, 740, 1120, 90],
    coChange: [
      { path: 'src/commands/_open-helpers.ts', count: 19 },
      { path: 'src/registry/index.ts', count: 11 },
      { path: '__tests__/commands/open.test.ts', count: 8 },
    ],
  },
  {
    path: 'src/bootstrap/prompt.ts',
    reads: 71,
    writes: 9,
    edits: 44,
    touches: 124,
    sessions: 19,
    charsAdded: 33900,
    charsRemoved: 15220,
    netGrowth: 18680,
    firstTouched: '2026-05-04T09:00:00Z',
    lastTouched: '2026-07-10T21:05:00Z',
    timeline: [80, 610, 1240, -420, 300, 150, -90, 880, 410, 220],
    coChange: [
      { path: 'src/commands/open.ts', count: 14 },
      { path: '__tests__/bootstrap/prompt.test.ts', count: 9 },
    ],
  },
  {
    path: 'src/utils/fs-atomic.ts',
    reads: 52,
    writes: 4,
    edits: 18,
    touches: 74,
    sessions: 12,
    charsAdded: 8110,
    charsRemoved: 11480,
    netGrowth: -3370,
    firstTouched: '2026-05-09T14:30:00Z',
    lastTouched: '2026-06-28T11:15:00Z',
    timeline: [420, -180, -960, 240, -510, 130, -320, 80],
    coChange: [{ path: 'src/utils/flock.ts', count: 7 }],
  },
  {
    path: 'README.md',
    reads: 40,
    writes: 6,
    edits: 9,
    touches: 55,
    sessions: 8,
    charsAdded: 6200,
    charsRemoved: 1450,
    netGrowth: 4750,
    firstTouched: '2026-05-01T08:00:00Z',
    lastTouched: '2026-07-02T16:20:00Z',
    timeline: [1200, 0, 340, 0, 0, 890, 120],
    coChange: [],
  },
]

export const FILE_HISTORY_CO_EDGES: CoChangeEdge[] = [
  { a: 'src/commands/open.ts', b: 'src/commands/_open-helpers.ts', count: 19 },
  { a: 'src/commands/open.ts', b: 'src/bootstrap/prompt.ts', count: 14 },
  { a: 'src/bootstrap/prompt.ts', b: '__tests__/bootstrap/prompt.test.ts', count: 9 },
  { a: 'src/utils/fs-atomic.ts', b: 'src/utils/flock.ts', count: 7 },
]

export const FILE_HISTORY_STATS: FileHistoryStat[] = [
  { label: 'Files', value: '4' },
  { label: 'File events', value: '410' },
  { label: 'Sessions', value: '23' },
  { label: 'Transcripts', value: '31' },
]
