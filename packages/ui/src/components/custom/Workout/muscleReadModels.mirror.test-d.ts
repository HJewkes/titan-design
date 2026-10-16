import { expectTypeOf, test } from 'vitest'
import type {
  E1RMBand,
  MusclePlanRemainingExercise,
  MusclePlanSection,
  MuscleStrengthBestE1rm,
  MuscleStrengthExerciseRow,
  MuscleStrengthSection,
} from './muscleReadModels'

/**
 * Field lists of the shapes mirrored from voltras-mcp. Adding or removing a
 * field on a mirrored interface without updating its list here fails the
 * `types` project. Re-sync them together with the sha in the header, which
 * `muscleReadModels.mirror.test.ts` pins.
 */
test('E1RMBand mirrors the source fields', () => {
  expectTypeOf<keyof E1RMBand>().toEqualTypeOf<
    | 'fitFor'
    | 'method'
    | 'seePct'
    | 'seePctCi'
    | 'seeLbs'
    | 'biasPct'
    | 'biasLbs'
    | 'lowLbs'
    | 'highLbs'
    | 'citation'
    | 'note'
  >()
})

test('MuscleStrengthBestE1rm mirrors the source fields', () => {
  expectTypeOf<keyof MuscleStrengthBestE1rm>().toEqualTypeOf<
    'value' | 'band' | 'method' | 'confidence'
  >()
})

test('MuscleStrengthExerciseRow mirrors the source fields, including the recency ones', () => {
  expectTypeOf<keyof MuscleStrengthExerciseRow>().toEqualTypeOf<
    | 'exerciseId'
    | 'name'
    | 'side'
    | 'bestE1rm'
    | 'slopePctPerWeek'
    | 'rSquared'
    | 'isPR'
    | 'priorBest'
    | 'plateau'
    | 'setCount'
    | 'currentLevel'
    | 'relativeIndex'
    | 'daysSinceTrained'
    | 'recency'
  >()
})

test('MuscleStrengthSection mirrors the source muscle fields minus muscle', () => {
  expectTypeOf<keyof MuscleStrengthSection>().toEqualTypeOf<
    'exercises' | 'agreement' | 'earlyPhase' | 'relativeIndexBySide' | 'daysSinceTrained'
  >()
})

test('MusclePlanRemainingExercise mirrors the source fields', () => {
  expectTypeOf<keyof MusclePlanRemainingExercise>().toEqualTypeOf<
    'workoutName' | 'exerciseId' | 'exerciseName' | 'sets'
  >()
})

test('MusclePlanSection mirrors the plan view fields, with frequency', () => {
  expectTypeOf<keyof MusclePlanSection>().toEqualTypeOf<
    'plannedSetsThisWeek' | 'doneSetsThisWeek' | 'exercises' | 'frequency'
  >()
  expectTypeOf<keyof MusclePlanSection['frequency']>().toEqualTypeOf<
    'plannedPerWeek' | 'observedThisWeek'
  >()
})
