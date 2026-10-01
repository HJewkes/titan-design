/**
 * The VW-333 pin: unifying the status must not repaint the figure.
 *
 * The chip moved onto the diverging scale by decision (2026-09-13) and its dot
 * colours DO change. The figure must not: every landmark zone paints the exact
 * hex it painted before the status union existed. The expectations below are
 * literal, recorded from the shipped `divergingScale`, so a token retune that
 * moves the figure fails here rather than in a screenshot diff.
 *
 * Literal hex is the point, which is why this file is exempt from
 * `titan/no-raw-color` along with every other test.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BodyMap, type BodyMapData } from './BodyMap'
import { BodyMapDetailPanel } from './BodyMapDetailPanel'
import { MuscleGroupChip } from './MuscleGroupChip'
import { deriveTrainingSummary } from './TrainingStatusPage'
import {
  MuscleGroup,
  landmarkZoneToStatus,
  getHeatmapColor,
  isMoreSevere,
  volumeStatusDotColor,
  VOLUME_STATUSES,
  VOLUME_STATUS_LABELS,
  VOLUME_STATUS_DATAVIZ_TOKEN,
  type VolumeLandmarkZone,
  type VolumeStatus,
} from './muscleTaxonomy'
import { getSemanticColors } from '../../../theme/tokens/semantic'

/**
 * What the figure painted before VW-333, keyed by landmark zone + intensity.
 * `light` is the VW-371 phase-2 light column (set C'), which moved on purpose.
 */
const FIGURE_BEFORE: Array<{
  zone: VolumeLandmarkZone
  intensity: number
  hex: string
  light: string
}> = [
  { zone: 'under', intensity: 0.3, hex: '#2196F3', light: '#2196F3' },
  { zone: 'maintenance', intensity: 0.5, hex: '#22D3EE', light: '#01B5D1' },
  { zone: 'productive', intensity: 0.6, hex: '#58F69E', light: '#2ED573' },
  // The near-MRV case `getHeatmapColor` used to decide from intensity; it is the
  // `approaching` status now, and it must still paint amber.
  { zone: 'productive', intensity: 0.85, hex: '#F9B415', light: '#E08C00' },
  { zone: 'productive', intensity: 0.95, hex: '#F9B415', light: '#E08C00' },
  { zone: 'over', intensity: 1, hex: '#D14343', light: '#D14343' },
]

describe('BodyMap fill is byte-identical across the VW-333 status unification', () => {
  for (const { zone, intensity, hex, light } of FIGURE_BEFORE) {
    it(`zone ${zone} at intensity ${intensity} still paints ${hex} on dark, ${light} on light`, () => {
      const status = landmarkZoneToStatus(zone, intensity)
      expect(getHeatmapColor(status, 'dark')).toBe(hex)
      expect(getHeatmapColor(status, 'light')).toBe(light)
    })
  }

  it('paints the no-data fill for a muscle with no status', () => {
    expect(getHeatmapColor(undefined, 'dark')).toBe('#E0E0E0')
    expect(getHeatmapColor('untrained', 'dark')).toBe('#E0E0E0')
  })

  it('renders those exact fills into the SVG', () => {
    const data: BodyMapData[] = [
      { muscleGroup: MuscleGroup.BICEPS, intensity: 0.3, volumeStatus: 'behind', weeklySets: 3 },
      { muscleGroup: MuscleGroup.CHEST, intensity: 0.6, volumeStatus: 'target', weeklySets: 12 },
      { muscleGroup: MuscleGroup.ABS, intensity: 0.9, volumeStatus: 'approaching', weeklySets: 15 },
      { muscleGroup: MuscleGroup.QUADS, intensity: 1, volumeStatus: 'over', weeklySets: 22 },
    ]
    const { container } = render(<BodyMap data={data} view="front" />)
    const fills = new Set(
      Array.from(container.querySelectorAll('path'))
        .map((path) => path.getAttribute('fill'))
        .filter((fill): fill is string => fill != null)
    )
    for (const hex of ['#2196F3', '#58F69E', '#F9B415', '#D14343']) {
      expect(fills, `${hex} is painted`).toContain(hex)
    }
  })
})

describe('the chip dot reads the same diverging scale as the figure', () => {
  const painted: Array<Exclude<VolumeStatus, 'untrained' | 'noverdict'>> = [
    'behind',
    'ontrack',
    'target',
    'approaching',
    'over',
  ]

  for (const status of painted) {
    it(`${status} resolves to the same hex on both surfaces`, () => {
      const colors = getSemanticColors('dark')
      expect(colors[VOLUME_STATUS_DATAVIZ_TOKEN[status]]).toBe(getHeatmapColor(status, 'dark'))
    })
  }

  // The rendered dot, status by status. These are the hexes the Layer-1 chip
  // baselines depict; a stale baseline is a colour mismatch against this table.
  const RENDERED_DOT: Array<[VolumeStatus, string]> = [
    ['behind', '#2196F3'],
    ['ontrack', '#22D3EE'],
    ['target', '#58F69E'],
    ['approaching', '#F9B415'],
    ['over', '#D14343'],
  ]

  for (const [status, hex] of RENDERED_DOT) {
    it(`renders the ${status} dot as ${hex}`, () => {
      const { getByTestId } = render(<MuscleGroupChip name="Quads" volumeStatus={status} />)
      expect(getByTestId('muscle-group-chip-dot')).toHaveStyle({ backgroundColor: hex })
    })
  }

  it('renders an untrained dot in the muted text role, not on the scale', () => {
    const { getByTestId } = render(<MuscleGroupChip name="Rear Delts" volumeStatus="untrained" />)
    expect(getByTestId('muscle-group-chip-dot')).toHaveStyle({ backgroundColor: '#888684' })
  })
})

describe('landmarkZoneToStatus', () => {
  it('maps each zone onto the status the plan describes', () => {
    expect(landmarkZoneToStatus('under')).toBe('behind')
    expect(landmarkZoneToStatus('maintenance')).toBe('ontrack')
    expect(landmarkZoneToStatus('productive')).toBe('target')
    expect(landmarkZoneToStatus('over')).toBe('over')
  })

  it('splits the productive band at the near-MRV threshold', () => {
    expect(landmarkZoneToStatus('productive', 0.84)).toBe('target')
    expect(landmarkZoneToStatus('productive', 0.85)).toBe('approaching')
  })

  it('treats a missing intensity as the middle of the productive band', () => {
    expect(landmarkZoneToStatus('productive')).toBe('target')
  })
})

describe('noverdict: trained, but the landmarks are withheld (VW-741)', () => {
  it('fills the figure with result-neutral in both modes, never a diverging stop', () => {
    expect(getHeatmapColor('noverdict', 'dark')).toBe('#A29F9D')
    expect(getHeatmapColor('noverdict', 'light')).toBe('#72716F')
    for (const mode of ['dark', 'light'] as const) {
      expect(getHeatmapColor('noverdict', mode)).toBe(getSemanticColors(mode)['result-neutral'])
    }
  })

  it('paints the no-verdict fill into the SVG', () => {
    const data: BodyMapData[] = [
      { muscleGroup: MuscleGroup.GLUTES, intensity: 0.7, volumeStatus: 'noverdict', weeklySets: 9 },
    ]
    const { container } = render(<BodyMap data={data} view="back" />)
    const fills = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('fill'))
    expect(fills).toContain('#A29F9D')
  })

  it('draws the chip dot as a result-neutral ring, unlike the solid untrained dot', () => {
    const { getByTestId, rerender } = render(
      <MuscleGroupChip name="Glutes" volumeStatus="noverdict" />
    )
    const ring = getByTestId('muscle-group-chip-dot')
    expect(ring).toHaveStyle({ borderTopColor: '#A29F9D', borderTopWidth: '1.5px' })
    expect(ring.style.backgroundColor).toBe('')

    rerender(<MuscleGroupChip name="Glutes" volumeStatus="untrained" />)
    const dot = getByTestId('muscle-group-chip-dot')
    expect(dot).toHaveStyle({ backgroundColor: '#888684' })
    expect(dot.style.borderTopWidth).toBe('')
  })

  it('names the status "no verdict" in the chip label and the detail badge', () => {
    render(<MuscleGroupChip name="Glutes" volumeStatus="noverdict" />)
    expect(screen.getByLabelText('Glutes, volume status: noverdict')).toBeInTheDocument()
    expect(VOLUME_STATUS_LABELS.noverdict).toBe('no verdict')
  })

  it('gives the detail badge the same default colour as untrained', () => {
    const props = {
      muscleGroup: MuscleGroup.GLUTES,
      displayName: 'Glutes',
      weeklySets: 9,
      landmarks: { mev: 4, mav: 10, mrv: 16 },
      isOpen: true,
      onClose: () => {},
    }
    const badgeStyle = () =>
      screen.getByTestId('body-map-detail-panel-status-badge').getAttribute('style')
    const { rerender } = render(<BodyMapDetailPanel {...props} volumeStatus="noverdict" />)
    expect(screen.getByTestId('body-map-detail-panel-status-badge')).toHaveTextContent('no verdict')
    const noVerdict = badgeStyle()
    rerender(<BodyMapDetailPanel {...props} volumeStatus="untrained" />)
    expect(noVerdict).toBe(badgeStyle())
  })

  it('ranks above untrained and below every verdict on a shared slug', () => {
    expect(isMoreSevere('noverdict', 'untrained')).toBe(true)
    expect(isMoreSevere('untrained', 'noverdict')).toBe(false)
    for (const verdict of ['behind', 'ontrack', 'target', 'approaching', 'over'] as const) {
      expect(isMoreSevere('noverdict', verdict)).toBe(false)
      expect(isMoreSevere(verdict, 'noverdict')).toBe(true)
    }
  })
})

describe('every consumer handles every status', () => {
  const noDataFill = getHeatmapColor(undefined, 'dark')

  it.each(VOLUME_STATUSES)('%s has a label, a dot colour and a summary count', (status) => {
    expect(VOLUME_STATUS_LABELS[status]).toBeTruthy()
    expect(volumeStatusDotColor(status, 'dark')).toMatch(/^#/)
    const summary = deriveTrainingSummary([])
    expect(summary.statusCounts[status]).toBe(0)
  })

  it.each(VOLUME_STATUSES.filter((status) => status !== 'untrained'))(
    '%s paints a figure fill of its own, not the no-data fallback',
    (status) => {
      expect(getHeatmapColor(status, 'dark')).not.toBe(noDataFill)
    }
  )

  it('gives every painted status a distinct figure fill', () => {
    const fills = VOLUME_STATUSES.filter((status) => status !== 'untrained').map((status) =>
      getHeatmapColor(status, 'dark')
    )
    expect(new Set(fills).size).toBe(fills.length)
  })
})
