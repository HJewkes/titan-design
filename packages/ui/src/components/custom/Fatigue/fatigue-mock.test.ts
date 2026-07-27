import { describe, it, expect } from 'vitest'
import {
  buildMockModel,
  buildMockPanelState,
  MOCK_PLANNED_REPS,
  MOCK_MEAN_VELOCITIES,
  FATIGUE_STATES,
} from './fatigue-mock'

/**
 * The panel puts the ROM chart and the velocity strip side by side, and each draws its own
 * upcoming-rep remainder from a SEPARATE prop. These lock the two to one number — the drift
 * they prevent is visible on screen as two different rep counts on one panel.
 */
describe('buildMockPanelState', () => {
  it('gives the ROM chart and the velocity strip the SAME planned rep count', () => {
    const { model, velocity } = buildMockPanelState(2)
    expect(model.plannedReps).toBe(velocity.targetReps)
  })

  it('truncates the model and the velocities at the same point', () => {
    for (const current of [0, 2, 5, 7]) {
      const { model, velocity } = buildMockPanelState(current)
      expect(model.romProgression).toHaveLength(current + 1)
      expect(model.velocityCurves).toHaveLength(current + 1)
      expect(velocity.velocities).toHaveLength(current + 1)
      expect(velocity.liveRepIndex).toBe(current)
    }
  })

  it('never plans fewer reps than it has performed', () => {
    for (const s of FATIGUE_STATES) {
      const { model, velocity } = buildMockPanelState(s.current)
      expect(model.plannedReps!).toBeGreaterThanOrEqual(model.romProgression.length)
      expect(velocity.targetReps).toBeGreaterThanOrEqual(velocity.velocities.length)
    }
  })

  it('counts the header rep out of the same planned total', () => {
    const { header } = buildMockPanelState(3)
    expect(header.meta).toBe(`SET 3 · REP 4 / ${MOCK_PLANNED_REPS}`)
  })

  it('derives the planned count from the rep data, not a literal', () => {
    expect(MOCK_PLANNED_REPS).toBe(MOCK_MEAN_VELOCITIES.length)
  })
})

describe('buildMockModel plannedReps', () => {
  it('attaches the mock plan by default', () => {
    expect(buildMockModel(2).plannedReps).toBe(MOCK_PLANNED_REPS)
  })

  it('honours an EXPLICIT undefined as "no plan attached"', () => {
    const model = buildMockModel(2, { plannedReps: undefined })
    expect(model.plannedReps).toBeUndefined()
    expect('plannedReps' in model).toBe(true)
  })
})
