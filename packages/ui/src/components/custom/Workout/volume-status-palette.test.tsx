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
import { render } from '@testing-library/react'
import { BodyMap, type BodyMapData } from './BodyMap'
import { MuscleGroupChip } from './MuscleGroupChip'
import {
  MuscleGroup,
  landmarkZoneToStatus,
  getHeatmapColor,
  VOLUME_STATUS_DATAVIZ_TOKEN,
  type VolumeLandmarkZone,
  type VolumeStatus,
} from './muscleTaxonomy'
import { getSemanticColors } from '../../../theme/tokens/semantic'

/** What the figure painted before VW-333, keyed by landmark zone + intensity. */
const FIGURE_BEFORE: Array<{ zone: VolumeLandmarkZone; intensity: number; hex: string }> = [
  { zone: 'under', intensity: 0.3, hex: '#2196F3' },
  { zone: 'maintenance', intensity: 0.5, hex: '#22D3EE' },
  { zone: 'productive', intensity: 0.6, hex: '#58F69E' },
  // The near-MRV case `getHeatmapColor` used to decide from intensity; it is the
  // `approaching` status now, and it must still paint amber.
  { zone: 'productive', intensity: 0.85, hex: '#F9B415' },
  { zone: 'productive', intensity: 0.95, hex: '#F9B415' },
  { zone: 'over', intensity: 1, hex: '#D14343' },
]

describe('BodyMap fill is byte-identical across the VW-333 status unification', () => {
  for (const { zone, intensity, hex } of FIGURE_BEFORE) {
    it(`zone ${zone} at intensity ${intensity} still paints ${hex}`, () => {
      const status = landmarkZoneToStatus(zone, intensity)
      expect(getHeatmapColor(status, 'dark')).toBe(hex)
      expect(getHeatmapColor(status, 'light')).toBe(hex)
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
  const painted: Array<Exclude<VolumeStatus, 'untrained'>> = [
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

  it('renders the dot with that hex', () => {
    const { getByTestId } = render(<MuscleGroupChip name="Quads" volumeStatus="approaching" />)
    expect(getByTestId('muscle-group-chip-dot')).toHaveStyle({ backgroundColor: '#F9B415' })
  })

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
