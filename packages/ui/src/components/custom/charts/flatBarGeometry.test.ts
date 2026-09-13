import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SET_LEVEL_FLAT_BAR, REP_LEVEL_FLAT_BAR } from './flatBarGeometry'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const segmentedBarSource = readFileSync(path.join(DIR, '../Workout/SegmentedBar.tsx'), 'utf8')
const setBarChartSource = readFileSync(path.join(DIR, 'SetBarChart.tsx'), 'utf8')

describe('flat-bar geometry (VW-86)', () => {
  it('documents intentionally different set-level and rep-level sizes', () => {
    expect(SET_LEVEL_FLAT_BAR).toEqual({ height: 8, gap: 5, radius: 2 })
    expect(REP_LEVEL_FLAT_BAR).toEqual({ height: null, gapFloor: 2, radius: 5 })
  })

  it('SegmentedBar imports its geometry from the shared module rather than its own literals', () => {
    expect(segmentedBarSource).toMatch(
      /import\s*\{\s*SET_LEVEL_FLAT_BAR\s*\}\s*from\s*'\.\.\/charts\/flatBarGeometry'/
    )
    // The old hardcoded defaults must be gone from the component's own prop destructuring.
    expect(segmentedBarSource).not.toMatch(/height\s*=\s*8\b/)
    expect(segmentedBarSource).not.toMatch(/radius\s*=\s*2\b/)
    expect(segmentedBarSource).toMatch(/height\s*=\s*SET_LEVEL_FLAT_BAR\.height/)
    expect(segmentedBarSource).toMatch(/radius\s*=\s*SET_LEVEL_FLAT_BAR\.radius/)
  })

  it('SetBarChart imports its geometry from the shared module rather than its own literals', () => {
    expect(setBarChartSource).toMatch(
      /import\s*\{\s*REP_LEVEL_FLAT_BAR\s*\}\s*from\s*'\.\/flatBarGeometry'/
    )
    expect(setBarChartSource).not.toMatch(/const MIN_BAR_GAP = 2\b/)
    expect(setBarChartSource).not.toMatch(/const DEFAULT_BAR_RADIUS = 5\b/)
    expect(setBarChartSource).toMatch(/const MIN_BAR_GAP = REP_LEVEL_FLAT_BAR\.gapFloor/)
    expect(setBarChartSource).toMatch(/const DEFAULT_BAR_RADIUS = REP_LEVEL_FLAT_BAR\.radius/)
  })

  it('SegmentedBar keeps SEGMENTED_BAR_GAP derived from the shared set-level gap', () => {
    expect(segmentedBarSource).toMatch(/const SEGMENTED_BAR_GAP = SET_LEVEL_FLAT_BAR\.gap/)
  })
})
