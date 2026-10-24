import { describe, it, expect } from 'vitest'
import { spacingClassesOf, spacingClassesAt, resolveAll } from '../../../test/spacing-resolver'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
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
    volumeStatus: 'target',
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
    volumeStatus: 'behind',
    weeklySets: 3,
    landmarks: { mev: 4, mav: 10, mrv: 18 },
  },
  {
    muscleGroup: MuscleGroup.LATS,
    displayName: 'Lats',
    side: 'back',
    intensity: 0.6,
    volumeStatus: 'target',
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
      untrained: 0,
      noverdict: 0,
      behind: 1,
      ontrack: 0,
      target: 2,
      approaching: 0,
      over: 1,
    })
  })

  it('returns zeroed counts for an empty muscle list', () => {
    const summary = deriveTrainingSummary([])
    expect(summary.totalWeeklySets).toBe(0)
    expect(summary.trackedMuscles).toBe(0)
    expect(summary.statusCounts).toEqual({
      untrained: 0,
      noverdict: 0,
      behind: 0,
      ontrack: 0,
      target: 0,
      approaching: 0,
      over: 0,
    })
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
      volumeStatus: 'target',
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
    expect(screen.getByTestId('training-status-page-summary-target')).toHaveTextContent('2')
    expect(screen.getByTestId('training-status-page-bodymap-front')).toBeInTheDocument()
    expect(screen.getByTestId('training-status-page-bodymap-back')).toBeInTheDocument()
  })

  it('uses a custom title when provided', () => {
    render(<TrainingStatusPage title="Weekly Volume" meso={meso} muscles={muscles} />)
    expect(screen.getByTestId('training-status-page-title')).toHaveTextContent('Weekly Volume')
  })

  it('keeps the fixed phone width when size is unset or "phone"', () => {
    const { unmount } = render(<TrainingStatusPage meso={meso} muscles={muscles} />)
    const defaultStyle = screen.getByTestId('training-status-page').getAttribute('style')
    expect(defaultStyle).toContain('width: 390px')
    unmount()

    render(<TrainingStatusPage meso={meso} muscles={muscles} size="phone" />)
    const phoneStyle = screen.getByTestId('training-status-page').getAttribute('style')
    expect(phoneStyle).toBe(defaultStyle)
  })

  it('drops the fixed width and scales the body maps for size="wall"', () => {
    render(<TrainingStatusPage meso={meso} muscles={muscles} size="wall" />)
    expect(screen.getByTestId('training-status-page').getAttribute('style')).not.toContain('width:')

    const frontFigure = screen
      .getByTestId('training-status-page-bodymap-front')
      .querySelector('[data-testid="body-map-svg"]')
    expect(frontFigure?.getAttribute('style')).toContain('width: 480px')
  })

  it('keys no verdict in the legend as a ring and every verdict as a solid swatch', () => {
    render(<TrainingStatusPage meso={meso} muscles={muscles} />)

    const ring = screen.getByTestId('training-status-page-legend-noverdict-dot')
    expect(ring).toHaveStyle({ borderTopWidth: '1.5px' })
    expect(ring.getAttribute('style')).not.toContain('background-color')
    for (const status of ['behind', 'ontrack', 'target', 'approaching', 'over']) {
      const swatch = screen.getByTestId(`training-status-page-legend-${status}-dot`)
      expect(swatch.getAttribute('style')).toContain('background-color')
    }
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

/** TrainingStatusPage's geometry, pinned (AW-142); pixels unchanged. */
describe('TrainingStatusPage geometry resolves to the spacing tokens', () => {
  it('keeps the page gutter and its section rhythm', () => {
    render(<TrainingStatusPage meso={meso} muscles={muscles} />)
    const classes = spacingClassesOf('training-status-page-content')
    expect(classes).toEqual(['p-gutter-sm', 'gap-stack-lg'])
    expect(resolveAll(classes)).toEqual(['16px', '16px'])
  })

  it('keeps the summary card inset and its row gap', () => {
    render(<TrainingStatusPage meso={meso} muscles={muscles} />)
    const card = screen.getByTestId('training-status-page-summary-total')
    expect(resolveAll(spacingClassesAt(card))).toEqual(['12px'])
    const row = spacingClassesOf('training-status-page-summary')
    expect(row).toEqual(['gap-inline-md'])
    expect(resolveAll(row)).toEqual(['8px'])
  })

  it('keeps the body-map card inset and the gap between its figures', () => {
    render(<TrainingStatusPage meso={meso} muscles={muscles} />)
    const card = spacingClassesOf('training-status-page-bodymaps')
    expect(card).toEqual(['p-inset-md', 'gap-3'])
    expect(resolveAll(card)).toEqual(['12px', '12px'])
    const figures = screen.getByTestId('training-status-page-bodymap-front').parentElement
    expect(resolveAll(spacingClassesAt(figures))).toEqual(['8px'])
  })
})

describe('TrainingStatusPage accessibility', () => {
  it('has no accessibility violations with the detail panel closed', async () => {
    const { container } = render(<TrainingStatusPage meso={meso} muscles={muscles} />)
    expect(await axe(container)).toHaveNoViolations()
  }, 30_000)

  it('has no accessibility violations with the chest panel open', async () => {
    const { container } = render(<TrainingStatusPage meso={meso} muscles={muscles} />)
    fireEvent.click(screen.getByTestId('body-map-muscle-chest'))
    expect(screen.getByTestId('body-map-detail-panel')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  }, 30_000)
})
