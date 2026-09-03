/**
 * Fixtures for the `Lab/North Star/Live Wall Dashboard` specimen.
 *
 * Shapes deliberately MIRROR the voltras-mcp dashboard store read-models so a later
 * provisional wiring is a mechanical field map, not a reshape:
 *   - {@link LiveModel}    — the live-set telemetry read-model (`velocity`, `force`,
 *     `phase`, `lastRep`, `velocityLossPct`).
 *   - {@link SessionModel} — the session read-model (`exerciseName` + completed sets).
 *   - {@link CompletedSet} — a logged set (`weightLbs`, `mode`, `repCount`, `reps`).
 *
 * The presentational titan props each view consumes are DERIVED from these read-models
 * (see the `derive*` helpers) — the same projection the store→component adapter will do.
 * Numbers are realistic cable chest-press strength-training values.
 */
import type { SessionRailExercise } from '../../components'

// --- Store read-model shapes (mirror voltras-mcp dashboard store) -------------

/** One completed rep's per-rep telemetry (mean-concentric metric family). */
export interface RepModel {
  /** Mean CONCENTRIC velocity (m/s) — the canonical metric (brain WA-D02). */
  vCon: number
  /** Range of motion (m). */
  rom: number
  /** Peak instantaneous velocity (m/s). */
  peakVelocity: number
}

/** The live-set telemetry read-model. */
export interface LiveModel {
  /** Instantaneous cable velocity (m/s). */
  velocity: number
  /** Instantaneous cable force (lbs). */
  force: number
  /** Current movement phase. */
  phase: 'concentric' | 'hold' | 'eccentric' | 'idle'
  /** Elapsed time (ms) within the current phase — drives the live tempo fill. */
  phaseElapsedMs: number
  /** The most-recently completed rep. */
  lastRep: RepModel
  /** Per-rep mean-concentric velocities logged so far this set (m/s). */
  repVelocities: number[]
  /** Velocity loss vs the set's best rep (%). Drives verdict + aura + fatigue. */
  velocityLossPct: number
  /** Peak concentric force this set (lbs). */
  peakForce: number
}

/** A logged set on the session read-model. */
export interface CompletedSet {
  weightLbs: number
  /**
   * Resistance mode as echoed back from the requested-settings cascade — i.e. the mode the
   * machine confirms it is applying, NOT the lazily-updated state-dump fields (which can lag
   * or report stale values mid-set).
   */
  mode: 'weight' | 'chains' | 'eccentric' | 'isokinetic'
  repCount: number
  /** Per-rep mean-concentric velocities (m/s). */
  reps: number[]
}

/** The session read-model. */
export interface SessionModel {
  exerciseName: string
  title: string
  weightLbs: number
  unit: 'lbs' | 'kg'
  /**
   * Prescribed tempo tuple [ecc, pauseBottom, con, pauseTop]. OPTIONAL — a set may carry no
   * prescribed tempo (coach left it unset and no exercise default); the live view then hides
   * the tempo readout entirely rather than inventing one.
   */
  tempo?: [number, number, number, number]
  completedSets: CompletedSet[]
  plannedSets: number
}

/** The full store snapshot the specimen reads. */
export interface DashboardModel {
  live: LiveModel
  session: SessionModel
}

// --- The fixture instance -----------------------------------------------------

/**
 * A mid-set cable chest press: 6 reps in, velocity decaying from 0.52 → 0.405 m/s,
 * ~22% velocity loss (the VL20–VL30 mid-zone → `threshold` verdict / amber aura).
 */
export const dashboardFixture: DashboardModel = {
  live: {
    velocity: 0.41,
    force: 498,
    phase: 'concentric',
    phaseElapsedMs: 700,
    lastRep: { vCon: 0.405, rom: 0.58, peakVelocity: 0.61 },
    repVelocities: [0.52, 0.5, 0.48, 0.46, 0.44, 0.405],
    velocityLossPct: 22,
    peakForce: 542,
  },
  session: {
    exerciseName: 'Cable Chest Press',
    title: 'Push A · Hypertrophy',
    weightLbs: 140,
    unit: 'lbs',
    tempo: [3, 1, 1, 0],
    plannedSets: 4,
    completedSets: [
      {
        weightLbs: 140,
        mode: 'weight',
        repCount: 8,
        reps: [0.55, 0.54, 0.52, 0.51, 0.49, 0.47, 0.45, 0.43],
      },
      {
        weightLbs: 140,
        mode: 'weight',
        repCount: 8,
        reps: [0.53, 0.52, 0.5, 0.48, 0.46, 0.44, 0.42, 0.4],
      },
    ],
  },
}

// --- Derived projections (store read-model → titan presentational props) -------

/** Arithmetic mean of a per-rep velocity array (m/s). */
export function meanVelocity(reps: number[]): number {
  if (reps.length === 0) return 0
  return reps.reduce((a, v) => a + v, 0) / reps.length
}

/** Verdict status from velocity loss %, matching FatigueMeter's VL20/VL30 bands. */
export function verdictFromLoss(lossPct: number): 'productive' | 'threshold' | 'stop' {
  if (lossPct >= 30) return 'stop'
  if (lossPct >= 20) return 'threshold'
  return 'productive'
}

/**
 * The session rail's exercise list, projected from the model: the current exercise
 * (active), the completed sets behind it, and an upcoming accessory.
 */
export function deriveRailExercises(model: DashboardModel): SessionRailExercise[] {
  const { session, live } = model
  return [
    {
      id: 'chest-press',
      // Active-row summary is PROGRESS, not a prescription (VW-68): sets banked + the one in
      // progress, and the best (most reps) set so far — what has actually happened — rather
      // than echoing the plan's `4 × 8`. The plan's target set count stays legible from the
      // `todo` columns in the strip below.
      name: session.exerciseName,
      summary: {
        sets: session.completedSets.length + 1,
        reps: Math.max(...session.completedSets.map((s) => s.repCount), live.repVelocities.length),
        weight: session.weightLbs,
        unit: session.unit,
      },
      tempo: session.tempo,
      indicator: 'velocity-loss',
      setStates: [
        { status: 'done', velocities: session.completedSets[0].reps },
        { status: 'done', velocities: session.completedSets[1].reps },
        { status: 'active', velocities: live.repVelocities, planned: 8 },
        { status: 'todo', planned: 8 },
      ],
    },
    {
      id: 'incline-db',
      name: 'Incline DB Press',
      summary: { sets: 3, reps: 10, weight: 55, unit: 'lbs' },
      tempo: [2, 0, 1, 0],
      setStates: [
        { status: 'todo', planned: 10 },
        { status: 'todo', planned: 10 },
        { status: 'todo', planned: 10 },
      ],
      upcoming: true,
    },
    {
      id: 'cable-fly',
      name: 'Cable Fly',
      summary: { sets: 3, reps: 12, weight: 30, unit: 'lbs' },
      setStates: [
        { status: 'todo', planned: 12 },
        { status: 'todo', planned: 12 },
        { status: 'todo', planned: 12 },
      ],
      upcoming: true,
    },
  ]
}

// --- Dual-mode (bilateral) projection -----------------------------------------

/**
 * Split a single-cable model into a bilateral (dual-mode) pair — one model per voltra.
 *
 * A dual-mode exercise drives two Voltra devices as a left/right pair. For v1 the two
 * layers are rendered independently (one {@link LiveModel} each); a unified split-bar
 * treatment is deferred. The fixture gives the RIGHT side a realistic left-dominant
 * deficit (slightly slower reps, more velocity loss, a touch less force) so the two
 * layers read as genuinely different streams rather than a mirror.
 */
export function deriveDualModel(base: DashboardModel = dashboardFixture): {
  left: DashboardModel
  right: DashboardModel
} {
  // Left is the dominant side — the base fixture verbatim.
  const left: DashboardModel = base
  // Right lags: ~8% slower per-rep concentric velocity, +7 pts velocity loss, ~6% less force.
  const scale = (v: number) => Number((v * 0.92).toFixed(3))
  const right: DashboardModel = {
    session: base.session,
    live: {
      ...base.live,
      velocity: scale(base.live.velocity),
      force: Math.round(base.live.force * 0.94),
      peakForce: Math.round(base.live.peakForce * 0.94),
      velocityLossPct: base.live.velocityLossPct + 7,
      repVelocities: base.live.repVelocities.map(scale),
      lastRep: {
        vCon: scale(base.live.lastRep.vCon),
        rom: Number((base.live.lastRep.rom * 0.96).toFixed(2)),
        peakVelocity: scale(base.live.lastRep.peakVelocity),
      },
    },
  }
  return { left, right }
}
