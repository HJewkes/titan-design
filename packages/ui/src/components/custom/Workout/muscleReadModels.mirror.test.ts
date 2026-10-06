import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type {
  E1RMBand,
  MusclePlanSection,
  MusclePlanRemainingExercise,
  MuscleStrengthBestE1rm,
  MuscleStrengthExerciseRow,
  MuscleStrengthSection,
} from './muscleReadModels'

/**
 * The mirror cannot see voltras-mcp from CI. What these tests pin is the
 * source sha the header records and the field list of every mirrored shape.
 * A re-sync that changes either one without the other fails here, and the
 * `Record<keyof T, true>` maps fail type-check when a field is added to or
 * removed from an interface but not from the list.
 */
const SYNCED_FROM_SHA = '5a6fadd'

const E1RM_BAND_FIELDS: Record<keyof E1RMBand, true> = {
  fitFor: true,
  method: true,
  seePct: true,
  seePctCi: true,
  seeLbs: true,
  biasPct: true,
  biasLbs: true,
  lowLbs: true,
  highLbs: true,
  citation: true,
  note: true,
}

const BEST_E1RM_FIELDS: Record<keyof MuscleStrengthBestE1rm, true> = {
  value: true,
  band: true,
  method: true,
  confidence: true,
}

const STRENGTH_ROW_FIELDS: Record<keyof MuscleStrengthExerciseRow, true> = {
  exerciseId: true,
  name: true,
  side: true,
  bestE1rm: true,
  slopePctPerWeek: true,
  rSquared: true,
  isPR: true,
  priorBest: true,
  plateau: true,
  setCount: true,
  currentLevel: true,
  relativeIndex: true,
  daysSinceTrained: true,
  recency: true,
}

const STRENGTH_SECTION_FIELDS: Record<keyof MuscleStrengthSection, true> = {
  exercises: true,
  agreement: true,
  earlyPhase: true,
  relativeIndexBySide: true,
  daysSinceTrained: true,
}

const PLAN_REMAINING_FIELDS: Record<keyof MusclePlanRemainingExercise, true> = {
  workoutName: true,
  exerciseId: true,
  exerciseName: true,
  sets: true,
}

const PLAN_SECTION_FIELDS: Record<keyof MusclePlanSection, true> = {
  plannedSetsThisWeek: true,
  doneSetsThisWeek: true,
  exercises: true,
  frequency: true,
}

const PLAN_FREQUENCY_FIELDS: Record<keyof MusclePlanSection['frequency'], true> = {
  plannedPerWeek: true,
  observedThisWeek: true,
}

const keys = (fields: object) => Object.keys(fields).sort()
const header = () => readFileSync(join(__dirname, 'muscleReadModels.ts'), 'utf8')

describe('muscleReadModels mirror', () => {
  it('records the voltras-mcp sha the field lists were synced from', () => {
    expect(header()).toContain(`origin/main at \`${SYNCED_FROM_SHA}\``)
  })

  it('no longer claims an exact copy', () => {
    expect(header()).not.toMatch(/exact copy/i)
  })

  it('mirrors every field of a strength row, including the recency fields', () => {
    expect(keys(STRENGTH_ROW_FIELDS)).toEqual(
      [
        'exerciseId',
        'name',
        'side',
        'bestE1rm',
        'slopePctPerWeek',
        'rSquared',
        'isPR',
        'priorBest',
        'plateau',
        'setCount',
        'currentLevel',
        'relativeIndex',
        'daysSinceTrained',
        'recency',
      ].sort()
    )
  })

  it('mirrors the muscle-level strength fields', () => {
    expect(keys(STRENGTH_SECTION_FIELDS)).toEqual(
      ['exercises', 'agreement', 'earlyPhase', 'relativeIndexBySide', 'daysSinceTrained'].sort()
    )
  })

  it('mirrors the best-e1RM, band, plan and frequency shapes', () => {
    expect(keys(BEST_E1RM_FIELDS)).toEqual(['value', 'band', 'method', 'confidence'].sort())
    expect(keys(E1RM_BAND_FIELDS)).toHaveLength(11)
    expect(keys(PLAN_REMAINING_FIELDS)).toEqual(
      ['workoutName', 'exerciseId', 'exerciseName', 'sets'].sort()
    )
    expect(keys(PLAN_SECTION_FIELDS)).toEqual(
      ['plannedSetsThisWeek', 'doneSetsThisWeek', 'exercises', 'frequency'].sort()
    )
    expect(keys(PLAN_FREQUENCY_FIELDS)).toEqual(['plannedPerWeek', 'observedThisWeek'].sort())
  })
})
