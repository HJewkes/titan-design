import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  TrainingStatusPage,
  deriveTrainingSummary,
  toBodyMapData,
  type TrainingStatusMuscle,
} from './TrainingStatusPage'
import { type MesoStatusCardProps } from './MesoStatusCard'
import { MuscleGroup } from './muscleTaxonomy'

const meso: MesoStatusCardProps = {
  mesoName: 'Hypertrophy Block',
  mesoSubtitle: 'Week 6 of 8',
  statusBadge: { label: 'On Track', variant: 'success' },
  metrics: [{ label: 'Volume', value: '112 sets' }],
  gauges: [{ label: 'Volume', level: 0.68 }],
}

const muscles: TrainingStatusMuscle[] = [
  {
    muscleGroup: MuscleGroup.CHEST,
    displayName: 'Chest',
    side: 'front',
    intensity: 0.7,
    volumeStatus: 'productive',
    weeklySets: 14,
    landmarks: { mev: 8, mav: 14, mrv: 20 },
    lastTrained: '2 days ago',
    weeklyHistory: [10, 12, 14],
  },
  {
    muscleGroup: MuscleGroup.BICEPS,
    displayName: 'Biceps',
    side: 'front',
    intensity: 0.3,
    volumeStatus: 'under',
    weeklySets: 3,
    landmarks: { mev: 4, mav: 10, mrv: 18 },
  },
  {
    muscleGroup: MuscleGroup.LATS,
    displayName: 'Lats',
    side: 'back',
    intensity: 0.6,
    volumeStatus: 'productive',
    weeklySets: 11,
    landmarks: { mev: 8, mav: 14, mrv: 20 },
  },
  {
    muscleGroup: MuscleGroup.QUADS,
    displayName: 'Quads',
    side: 'front',
    intensity: 0.95,
    volumeStatus: 'over',
    weeklySets: 20,
    landmarks: { mev: 6, mav: 12, mrv: 18 },
  },
]

describe('deriveTrainingSummary', () => {
  it('sums weekly sets and counts muscles per volume status', () => {
    const summary = deriveTrainingSummary(muscles)
    expect(summary.totalWeeklySets).toBe(48)
    expect(summary.trackedMuscles).toBe(4)
    expect(summary.statusCounts).toEqual({
      under: 1,
      maintenance: 0,
      productive: 2,
      over: 1,
    })
  })

  it('returns zeroed counts for an empty muscle list', () => {
    const summary = deriveTrainingSummary([])
    expect(summary.totalWeeklySets).toBe(0)
    expect(summary.trackedMuscles).toBe(0)
    expect(summary.statusCounts).toEqual({ under: 0, maintenance: 0, productive: 0, over: 0 })
  })
})

describe('toBodyMapData', () => {
  it('keeps only the requested side and projects heatmap fields', () => {
    const front = toBodyMapData(muscles, 'front')
    expect(front.map((d) => d.muscleGroup)).toEqual([
      MuscleGroup.CHEST,
      MuscleGroup.BICEPS,
      MuscleGroup.QUADS,
    ])
    expect(front[0]).toEqual({
      muscleGroup: MuscleGroup.CHEST,
      intensity: 0.7,
      volumeStatus: 'productive',
      weeklySets: 14,
    })
  })

  it('filters to the back side', () => {
    const back = toBodyMapData(muscles, 'back')
    expect(back.map((d) => d.muscleGroup)).toEqual([MuscleGroup.LATS])
  })
})

describe('TrainingStatusPage', () => {
  it('renders the banner, summary cards, and both body maps', () => {
    render(<TrainingStatusPage meso={meso} muscles={muscles} />)
    expect(screen.getByTestId('training-status-page')).toBeInTheDocument()
    expect(screen.getByTestId('meso-status-card')).toBeInTheDocument()
    expect(screen.getByTestId('training-status-page-summary-total')).toHaveTextContent('48')
    expect(screen.getByTestId('training-status-page-summary-productive')).toHaveTextContent('2')
    expect(screen.getByTestId('training-status-page-bodymap-front')).toBeInTheDocument()
    expect(screen.getByTestId('training-status-page-bodymap-back')).toBeInTheDocument()
  })

  it('uses a custom title when provided', () => {
    render(<TrainingStatusPage title="Weekly Volume" meso={meso} muscles={muscles} />)
    expect(screen.getByTestId('training-status-page-title')).toHaveTextContent('Weekly Volume')
  })

  it('opens the detail panel for a tapped muscle and closes it again', () => {
    render(<TrainingStatusPage meso={meso} muscles={muscles} />)
    expect(screen.queryByTestId('body-map-detail-panel')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('body-map-muscle-chest'))
    expect(screen.getByTestId('body-map-detail-panel')).toBeInTheDocument()
    expect(screen.getByTestId('body-map-detail-panel-title')).toHaveTextContent('Chest')

    fireEvent.click(screen.getByTestId('body-map-detail-panel-close'))
    expect(screen.queryByTestId('body-map-detail-panel')).not.toBeInTheDocument()
  })
})
