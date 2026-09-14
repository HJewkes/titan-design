/**
 * Fixtures for the BodyMapDetailPanel strength / PR / plan sections, shaped
 * exactly like voltras-mcp's `/api/muscle-strength` (B3) and `/api/muscle-plan`
 * (B4) payloads. Shared by the stories and the tests so the two cannot drift.
 */
import type {
  E1RMBand,
  MusclePlanSection,
  MuscleStrengthSection,
  StrengthExerciseRow,
} from './muscleReadModels'
import type { StrengthTrendDataPoint } from './StrengthTrendChart'

const CITATION =
  'Greig, Aspe, Hall, Comfort, Cooper & Swinton, Sports Medicine 2023 — individual-participant ' +
  'meta-analysis of 137 load-velocity models.'

/** A load-velocity band: the pooled figures describe this method, so they are stated. */
function velocityBand(e1rm: number): E1RMBand {
  return {
    fitFor: 'trend',
    method: 'profile',
    seePct: 9.8,
    seePctCi: [7.4, 12.2],
    seeLbs: Math.round(e1rm * 0.098 * 10) / 10,
    biasPct: 3.7,
    biasLbs: Math.round(e1rm * 0.037 * 10) / 10,
    lowLbs: Math.round((e1rm - e1rm * 0.098) * 10) / 10,
    highLbs: Math.round((e1rm + e1rm * 0.098) * 10) / 10,
    citation: CITATION,
    note: 'Trend instrument, not a measurement. The bias is reported here, never subtracted.',
  }
}

/** A rep-formula band: no source states an error figure for it, so every number is null. */
function repsBand(): E1RMBand {
  return {
    fitFor: 'trend',
    method: 'reps',
    seePct: null,
    seePctCi: null,
    seeLbs: null,
    biasPct: null,
    biasLbs: null,
    lowLbs: null,
    highLbs: null,
    citation: CITATION,
    note:
      'The numeric fields are null on purpose: the pooled figures were measured on ' +
      'load-velocity models, and this estimate is the Epley rep formula.',
  }
}

function series(values: readonly number[], prIndex?: number): StrengthTrendDataPoint[] {
  return values.map((e1rm, index) => ({
    date: `2026-0${index < 4 ? 6 : 7}-${String(1 + index * 7).padStart(2, '0')}`,
    e1rm,
    ...(index === prIndex ? { isPR: true } : {}),
  }))
}

const cableRow: StrengthExerciseRow = {
  exerciseId: 'cable-row',
  name: 'Seated Cable Row',
  side: null,
  bestE1rm: { value: 205, band: velocityBand(205), method: 'profile', confidence: 0.82 },
  slopePctPerWeek: 2.14,
  rSquared: 0.71,
  isPR: true,
  priorBest: 198,
  plateau: 'none',
  history: series([182, 188, 191, 199, 205], 4),
}

const latPulldownLeft: StrengthExerciseRow = {
  exerciseId: 'lat-pulldown',
  name: 'Lat Pulldown',
  side: 'left',
  bestE1rm: { value: 148, band: repsBand(), method: 'reps', confidence: 0.64 },
  slopePctPerWeek: 0.9,
  rSquared: 0.44,
  isPR: false,
  priorBest: 151,
  plateau: 'tolerated',
  history: series([140, 143, 145, 148]),
}

const latPulldownRight: StrengthExerciseRow = {
  exerciseId: 'lat-pulldown',
  name: 'Lat Pulldown',
  side: 'right',
  bestE1rm: { value: 162, band: repsBand(), method: 'reps', confidence: 0.64 },
  slopePctPerWeek: -0.4,
  rSquared: 0.12,
  isPR: true,
  priorBest: 160,
  plateau: 'plateau',
  history: series([158, 161, 159, 162], 3),
}

/** A muscle with nothing trained: an empty row list is itself a finding. */
export const emptyStrength: MuscleStrengthSection = {
  exercises: [],
  agreement: 'insufficient',
  earlyPhase: false,
}

/** One exercise, side-unknown — the single-exercise case that cannot agree with itself. */
export const singleExerciseStrength: MuscleStrengthSection = {
  exercises: [cableRow],
  agreement: 'insufficient',
  earlyPhase: false,
}

/** A bilateral exercise: one row per side, never a merged average. */
export const bilateralStrength: MuscleStrengthSection = {
  exercises: [cableRow, latPulldownLeft, latPulldownRight],
  agreement: 'mixed',
  earlyPhase: true,
}

/** Nothing planned and nothing done — the panel still states the zero. */
export const emptyPlan: MusclePlanSection = {
  plannedSetsThisWeek: 0,
  doneSetsThisWeek: 0,
  exercises: [],
}

export const singleExercisePlan: MusclePlanSection = {
  plannedSetsThisWeek: 9,
  doneSetsThisWeek: 3,
  exercises: [
    {
      workoutName: 'Pull A',
      exerciseId: 'cable-row',
      exerciseName: 'Seated Cable Row',
      sets: 3,
      done: true,
    },
    {
      workoutName: 'Pull B',
      exerciseId: 'lat-pulldown',
      exerciseName: 'Lat Pulldown',
      sets: 3,
      done: false,
    },
    {
      workoutName: 'Pull B',
      exerciseId: 'chest-supported-row',
      exerciseName: 'Chest-Supported Row',
      sets: 3,
      done: false,
    },
  ],
}
