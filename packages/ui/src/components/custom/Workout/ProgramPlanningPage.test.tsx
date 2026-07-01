import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ProgramPlanningPage,
  deriveNavLevel,
  toProgressBarMesos,
  findMeso,
  findWeek,
  findWorkout,
  buildBreadcrumbs,
  type PlanMeso,
} from './ProgramPlanningPage'

const workout = (id: string, status: 'completed' | 'today' | 'upcoming') => ({
  id,
  name: `Workout ${id}`,
  date: 'Mon, Jun 2',
  status,
  muscleGroups: [{ group: 'chest', label: 'Chest' as const }],
  totalSets: 12,
  unit: 'lbs' as const,
  exercises: [
    {
      name: 'Bench Press',
      state: 'collapsed' as const,
      onToggle: () => {},
      summary: { sets: 3, reps: 8, weight: 185, unit: 'lbs' as const },
    },
    { name: 'Row', state: 'upcoming' as const, onToggle: () => {}, prescription: '3×10' },
  ],
})

const mesos: PlanMeso[] = [
  {
    id: 'm1',
    name: 'Accumulation',
    goal: 'Hypertrophy',
    split: 'Upper/Lower',
    weekRange: 'Weeks 1-4',
    weekCount: 2,
    currentWeek: 1,
    status: 'current',
    weeks: [
      {
        weekNumber: 1,
        intensityLevel: 0.5,
        isCurrent: true,
        workouts: [workout('w1a', 'today'), workout('w1b', 'upcoming')],
      },
      { weekNumber: 2, intensityLevel: 0.7, workouts: [workout('w2a', 'upcoming')] },
    ],
  },
  {
    id: 'm2',
    name: 'Peak',
    goal: 'Peaking',
    split: 'Full Body',
    weekRange: 'Weeks 5-6',
    weekCount: 1,
    status: 'upcoming',
    weeks: [{ weekNumber: 1, intensityLevel: 0.9, workouts: [workout('w3a', 'upcoming')] }],
  },
]

describe('deriveNavLevel', () => {
  it('returns the deepest level indicated by the selection cursor', () => {
    expect(deriveNavLevel({ weekNumber: null, workoutId: null })).toBe('meso')
    expect(deriveNavLevel({ weekNumber: 1, workoutId: null })).toBe('week')
    expect(deriveNavLevel({ weekNumber: 1, workoutId: 'w1a' })).toBe('workout')
  })
})

describe('toProgressBarMesos', () => {
  it('projects only the fields MesoProgressBar needs', () => {
    expect(toProgressBarMesos(mesos)).toEqual([
      { id: 'm1', name: 'Accumulation', weekCount: 2, status: 'current', currentWeek: 1 },
      { id: 'm2', name: 'Peak', weekCount: 1, status: 'upcoming', currentWeek: undefined },
    ])
  })
})

describe('find helpers', () => {
  it('locates a meso, week, and workout down the tree', () => {
    const meso = findMeso(mesos, 'm1')
    expect(meso?.name).toBe('Accumulation')
    const week = findWeek(meso, 1)
    expect(week?.workouts).toHaveLength(2)
    expect(findWorkout(week, 'w1b')?.name).toBe('Workout w1b')
  })

  it('returns null for missing ids or null inputs', () => {
    expect(findMeso(mesos, 'nope')).toBeNull()
    expect(findMeso(mesos, null)).toBeNull()
    expect(findWeek(null, 1)).toBeNull()
    expect(findWorkout(findWeek(findMeso(mesos, 'm1'), 1), 'nope')).toBeNull()
  })
})

describe('buildBreadcrumbs', () => {
  it('grows the trail with drill depth', () => {
    const meso = mesos[0]
    expect(buildBreadcrumbs(meso, null, null).map((c) => c.label)).toEqual(['Accumulation'])
    expect(buildBreadcrumbs(meso, 1, null).map((c) => c.label)).toEqual(['Accumulation', 'Week 1'])
    const wo = findWorkout(findWeek(meso, 1), 'w1a')
    expect(buildBreadcrumbs(meso, 1, wo).map((c) => c.level)).toEqual(['meso', 'week', 'workout'])
  })
})

describe('ProgramPlanningPage', () => {
  it('renders the progress bar and starts at the meso level', () => {
    render(<ProgramPlanningPage mesos={mesos} />)
    expect(screen.getByTestId('program-planning-page')).toBeInTheDocument()
    expect(screen.getByTestId('meso-progress-bar')).toBeInTheDocument()
    expect(screen.getByTestId('program-planning-page-meso-level')).toBeInTheDocument()
    expect(screen.getByTestId('program-planning-page-crumb-meso')).toHaveTextContent('Accumulation')
  })

  it('drills meso -> week -> workout and rewinds via breadcrumbs', () => {
    render(<ProgramPlanningPage mesos={mesos} />)

    // Meso level: tapping a week's workout pill drills into that week.
    fireEvent.click(screen.getAllByTestId('workout-pill-pressable')[0])
    expect(screen.getByTestId('program-planning-page-week-level')).toBeInTheDocument()
    expect(screen.getByTestId('program-planning-page-crumb-week')).toHaveTextContent('Week 1')

    // Week level: the week's two workouts render as cards; open the first.
    expect(screen.getAllByTestId('workout-card')).toHaveLength(2)
    fireEvent.click(screen.getAllByTestId('workout-card-toggle')[0])
    expect(screen.getByTestId('program-planning-page-workout-level')).toBeInTheDocument()
    expect(screen.getByTestId('workout-card-exercises')).toBeInTheDocument()

    // Breadcrumb rewinds back to the meso overview.
    fireEvent.click(screen.getByTestId('program-planning-page-crumb-meso'))
    expect(screen.getByTestId('program-planning-page-meso-level')).toBeInTheDocument()
  })

  it('switches the active meso when a progress-bar segment is pressed', () => {
    render(<ProgramPlanningPage mesos={mesos} />)
    fireEvent.click(screen.getByTestId('meso-segment-m2'))
    expect(screen.getByTestId('program-planning-page-crumb-meso')).toHaveTextContent('Peak')
  })
})
