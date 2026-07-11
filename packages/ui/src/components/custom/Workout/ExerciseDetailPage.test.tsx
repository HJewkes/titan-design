import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ExerciseDetailPage,
  deriveExerciseStats,
  toExerciseCardProps,
  summarizeVbt,
  type ExerciseDetailEntry,
  type ExerciseDetailPageProps,
} from './ExerciseDetailPage'

const entry = (id: string, weight: number, e1rm: number, isPR = false): ExerciseDetailEntry => ({
  id,
  title: `Session ${id}`,
  summary: { sets: 3, reps: 8, weight, unit: 'lbs' },
  e1rm: { value: e1rm, unit: 'lbs' },
  isPR,
  sets: [
    { state: 'done', setNumber: 1, unit: 'lbs', reps: 8, weight, rpe: 8, velocities: [] },
    { state: 'done', setNumber: 2, unit: 'lbs', reps: 8, weight, rpe: 8.5, velocities: [] },
  ],
})

const history: ExerciseDetailEntry[] = [
  entry('a', 195, 248, true),
  entry('b', 185, 235),
  entry('c', 175, 222),
]

const baseProps: ExerciseDetailPageProps = {
  exercise: { name: 'Bench Press', subtitle: 'Chest · Barbell', unit: 'lbs', currentE1rm: 248 },
  meso: {
    mesoName: 'Hypertrophy',
    mesoSubtitle: 'Week 6 of 8',
    statusBadge: { label: 'On Track', variant: 'success' },
    metrics: [{ label: 'Actual', value: '4×8' }],
    gauges: [{ label: 'Intensity', level: 0.7 }],
  },
  trend: {
    data: [
      { date: '2026-05-12', e1rm: 222 },
      { date: '2026-06-16', e1rm: 248, isPR: true },
    ],
  },
  progression: [entry('w1', 175, 222), entry('w2', 195, 248, true)],
  history,
  vbt: {
    band: [{ date: '2026-05-12', bandLow: 40, bandHigh: 70 }],
    workouts: [{ date: '2026-05-12', load: 52, status: 'within' }],
    sets: [
      { label: 'Set 1', velocities: [0.7, 0.6, 0.5] },
      { label: 'Set 2', velocities: [0.68, 0.5, 0.34] },
    ],
  },
}

describe('deriveExerciseStats', () => {
  it('counts sessions, tracks the best e1RM, and tallies PRs', () => {
    expect(deriveExerciseStats(history)).toEqual({ sessions: 3, bestE1rm: 248, prCount: 1 })
  })

  it('returns a null best e1RM for an empty history', () => {
    expect(deriveExerciseStats([])).toEqual({ sessions: 0, bestE1rm: null, prCount: 0 })
  })
})

describe('toExerciseCardProps', () => {
  it('collapses without sets and expands with them', () => {
    const collapsed = toExerciseCardProps(history[0], false, () => {})
    expect(collapsed.expanded).toBe(false)
    expect(collapsed.sets).toBeUndefined()

    const expanded = toExerciseCardProps(history[0], true, () => {})
    expect(expanded.expanded).toBe(true)
    expect(expanded.sets).toHaveLength(2)
    expect(expanded.name).toBe('Session a')
  })
})

describe('summarizeVbt', () => {
  it('averages every rep and reports the worst within-set loss', () => {
    const summary = summarizeVbt([
      { label: 'Set 1', velocities: [1, 0.5] },
      { label: 'Set 2', velocities: [1, 0.25] },
    ])
    expect(summary.meanVelocity).toBeCloseTo(0.6875)
    expect(summary.velocityLoss).toBe(75)
  })

  it('is zeroed for no sets', () => {
    expect(summarizeVbt([])).toEqual({ meanVelocity: 0, velocityLoss: 0 })
  })
})

describe('ExerciseDetailPage', () => {
  it('renders the header and opens on the Progress tab', () => {
    render(<ExerciseDetailPage {...baseProps} />)
    expect(screen.getByTestId('exercise-detail-page')).toBeInTheDocument()
    expect(screen.getByTestId('exercise-detail-page-title')).toHaveTextContent('Bench Press')
    expect(screen.getByTestId('exercise-detail-page-panel-progress')).toBeInTheDocument()
    expect(screen.getByTestId('meso-status-card')).toBeInTheDocument()
    expect(screen.getByTestId('exercise-detail-page-stat-sessions')).toHaveTextContent('3')
  })

  it('switches tabs to reveal history and advanced panels', () => {
    render(<ExerciseDetailPage {...baseProps} />)

    fireEvent.click(screen.getByTestId('exercise-detail-page-tab-history'))
    expect(screen.getByTestId('exercise-detail-page-panel-history')).toBeInTheDocument()
    expect(screen.queryByTestId('exercise-detail-page-panel-progress')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('exercise-detail-page-tab-advanced'))
    expect(screen.getByTestId('exercise-detail-page-panel-advanced')).toBeInTheDocument()
    expect(screen.getByTestId('exercise-detail-page-vbt-summary')).toBeInTheDocument()
    expect(screen.getAllByTestId('exercise-detail-page-vbt-set')).toHaveLength(2)
  })

  it('inline-expands a progression entry to reveal its sets', () => {
    render(<ExerciseDetailPage {...baseProps} />)
    expect(screen.queryByTestId('exercise-card-sets')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByTestId('exercise-card')[0])
    expect(screen.getByTestId('exercise-card-sets')).toBeInTheDocument()

    fireEvent.click(screen.getAllByTestId('exercise-card-header')[0])
    expect(screen.queryByTestId('exercise-card-sets')).not.toBeInTheDocument()
  })
})
