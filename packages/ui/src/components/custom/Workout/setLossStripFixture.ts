/**
 * Synthetic SetLossStrip data in the shape of a finished session's per-set rows: a warm-up, then
 * working sets that slow as the session goes on. No real session is recorded here.
 */
import type { SetLossStripSet } from './setLossStripModel'

/** A warm-up and three working sets; the last runs under its target and loses the most. */
export const SESSION_SETS: SetLossStripSet[] = [
  { index: 1, lossPct: 6, purpose: 'warmup', reps: 8, loadLabel: '60lb', e1rm: 76 },
  { index: 2, lossPct: 12, purpose: 'working', reps: 9, repMark: 'over', loadLabel: '100lb', e1rm: 130 },
  { index: 3, lossPct: 19, purpose: 'working', reps: 8, loadLabel: '100lb', e1rm: 127 },
  { index: 4, lossPct: 27, purpose: 'working', reps: 6, repMark: 'under', loadLabel: '100lb', e1rm: 120 },
]

/** One working set lost its velocity samples. */
export const NO_DATA_SETS: SetLossStripSet[] = [
  { index: 1, lossPct: 14, purpose: 'working', reps: 8, loadLabel: '75lb', e1rm: 95 },
  { index: 2, lossPct: null, purpose: 'working', reps: 8, loadLabel: '75lb', e1rm: 95 },
  { index: 3, lossPct: 22, purpose: 'working', reps: 7, repMark: 'under', loadLabel: '75lb', e1rm: 92 },
]

/** Two warm-ups ahead of two working sets. */
export const WARMUP_SETS: SetLossStripSet[] = [
  { index: 1, lossPct: 4, purpose: 'warmup', reps: 10, loadLabel: '45lb' },
  { index: 2, lossPct: 7, purpose: 'warmup', reps: 6, loadLabel: '70lb' },
  { index: 3, lossPct: 15, purpose: 'working', reps: 8, loadLabel: '95lb' },
  { index: 4, lossPct: 21, purpose: 'working', reps: 8, loadLabel: '95lb' },
]

/** The middle set was logged but left out of scoring. */
export const NOT_SCORED_SETS: SetLossStripSet[] = [
  { index: 1, lossPct: 11, purpose: 'working', reps: 10, loadLabel: 'Band' },
  { index: 2, lossPct: 18, purpose: 'working', scored: false, reps: 10, loadLabel: 'Band' },
  { index: 3, lossPct: 16, purpose: 'working', reps: 10, loadLabel: 'Band' },
]

/** A bilateral exercise: each side is its own set, labelled with the side. */
export const BILATERAL_SETS: SetLossStripSet[] = [
  { index: 1, label: '#1 L', lossPct: 13, purpose: 'working', reps: 10, loadLabel: '30lb' },
  { index: 2, label: '#2 R', lossPct: 17, purpose: 'working', reps: 10, loadLabel: '30lb' },
  { index: 3, label: '#3 L', lossPct: 21, purpose: 'working', reps: 9, repMark: 'under', loadLabel: '30lb' },
  { index: 4, label: '#4 R', lossPct: 24, purpose: 'working', reps: 9, repMark: 'under', loadLabel: '30lb' },
]
