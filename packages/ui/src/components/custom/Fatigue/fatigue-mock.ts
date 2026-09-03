// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * Realistic mock {@link LiveFatigueModel}s for the Fatigue family stories + tests — a
 * fatiguing 8-rep cable chest press taken deep (velocity decays, ROM shrinks, tempo
 * degrades; reps 4 & 7 are cheats). Ported from the design-lab specimen so the
 * hardened components render against the same shape the wall will feed them. NOT
 * shipped in app bundles — story/test fixture only.
 */
import type {
  FatigueVerdict,
  LiveFatigueModel,
  PhaseSegment,
  RepVelocityCurve,
  SamplePhase,
  VelocitySample,
} from './fatigue-model'

interface RepSpec {
  romMm: number
  eccMs: number
  pBMs: number
  conMs: number
  pTMs: number
  eccControl: number
  conPower: number
}

const SPECS: RepSpec[] = [
  { romMm: 900, eccMs: 2600, pBMs: 420, conMs: 950, pTMs: 300, eccControl: 0.95, conPower: 0.9 },
  { romMm: 895, eccMs: 2650, pBMs: 380, conMs: 1000, pTMs: 250, eccControl: 0.94, conPower: 0.86 },
  { romMm: 880, eccMs: 2500, pBMs: 340, conMs: 1100, pTMs: 160, eccControl: 0.9, conPower: 0.78 },
  { romMm: 715, eccMs: 1300, pBMs: 120, conMs: 900, pTMs: 90, eccControl: 0.34, conPower: 0.82 },
  { romMm: 840, eccMs: 2300, pBMs: 300, conMs: 1500, pTMs: 90, eccControl: 0.85, conPower: 0.44 },
  { romMm: 800, eccMs: 2000, pBMs: 240, conMs: 1750, pTMs: 80, eccControl: 0.68, conPower: 0.34 },
  { romMm: 645, eccMs: 1200, pBMs: 100, conMs: 1650, pTMs: 70, eccControl: 0.3, conPower: 0.4 },
  { romMm: 600, eccMs: 1250, pBMs: 70, conMs: 2300, pTMs: 60, eccControl: 0.34, conPower: 0.24 },
]

/** Prescribed tempo (ms per phase). */
const TARGET = { ecc: 2600, pauseBottom: 400, con: 950, pauseTop: 280 }
export const TARGET_TEMPO_SECONDS: [number, number, number, number] = [
  TARGET.ecc / 1000,
  TARGET.pauseBottom / 1000,
  TARGET.con / 1000,
  TARGET.pauseTop / 1000,
]

type LabPhase = 'ecc' | 'pauseBottom' | 'con' | 'pauseTop'
// Both prescribed pauses are HOLDS (deliberate, under load), not idle dead time — the
// lab's tempo prescribes them, so the band names them.
const LAB_TO_MODEL: Record<LabPhase, SamplePhase> = {
  ecc: 'eccentric',
  pauseBottom: 'hold',
  con: 'concentric',
  pauseTop: 'hold',
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}
function hashNoise(i: number): number {
  const x = Math.sin(i * 127.1 + 11.7) * 43758.5453
  return x - Math.floor(x)
}
function eccVelMm(u: number, s: RepSpec): number {
  const mean = s.romMm / (s.eccMs / 1000)
  const peak = mean * (Math.PI / 2)
  const skew = 0.5 - (1 - s.eccControl) * 0.22
  const sharp = 1 + (1 - s.eccControl) * 1.3
  const hump = Math.pow(Math.sin(Math.PI * Math.pow(u, skew)), sharp)
  return peak * hump * (1 + (1 - s.eccControl) * 0.7)
}
function conVelMm(u: number, s: RepSpec): number {
  const mean = s.romMm / (s.conMs / 1000)
  const peak = mean * (Math.PI / 2)
  const skew = 0.5 - s.conPower * 0.18
  const stick = (1 - s.conPower) * 0.32 * Math.exp(-Math.pow((u - 0.46) / 0.16, 2))
  const shape = Math.max(0.02, Math.sin(Math.PI * Math.pow(u, skew)) - stick)
  return peak * shape * (0.72 + s.conPower * 0.5)
}

function genRep(spec: RepSpec, repNumber: number): RepVelocityCurve {
  const segs: Array<{ phase: LabPhase; dur: number }> = [
    { phase: 'ecc', dur: spec.eccMs },
    { phase: 'pauseBottom', dur: spec.pBMs },
    { phase: 'con', dur: spec.conMs },
    { phase: 'pauseTop', dur: spec.pTMs },
  ]
  const total = spec.eccMs + spec.pBMs + spec.conMs + spec.pTMs
  const dt = 1000 / 11
  const samples: VelocitySample[] = []
  const segments: PhaseSegment[] = []
  let n = 0
  for (let time = 0; time <= total + 1; time += dt) {
    let acc = 0
    let phase: LabPhase = 'pauseTop'
    let u = 0
    for (let k = 0; k < segs.length; k++) {
      if (time < acc + segs[k].dur || k === segs.length - 1) {
        phase = segs[k].phase
        u = Math.min(1, Math.max(0, (time - acc) / Math.max(segs[k].dur, 1)))
        break
      }
      acc += segs[k].dur
    }
    let velMm = 0
    if (phase === 'ecc') velMm = eccVelMm(u, spec)
    else if (phase === 'con') velMm = conVelMm(u, spec)
    velMm *= 1 + (hashNoise(n) - 0.5) * 0.05
    n += 1
    samples.push({
      tMs: Math.round(time),
      velocityMps: Math.abs(velMm) / 1000,
      phase: LAB_TO_MODEL[phase],
    })
  }
  // Contiguous phase runs (bridge the seam so segments abut).
  samples.forEach((s) => {
    const last = segments[segments.length - 1]
    if (!last || last.phase !== s.phase)
      segments.push({ phase: s.phase, startMs: s.tMs, endMs: s.tMs })
    else last.endMs = s.tMs
  })
  // tempoDeviation — normalized concentric-duration deviation from prescribed con.
  const tempoDeviation = clamp(Math.abs(spec.conMs - TARGET.con) / TARGET.con, 0, 1)
  // grindSignature — mid-concentric collapse; low conPower = grinding (cheats stay low, they're fast).
  const grindSignature = clamp((1 - spec.conPower) * 1.1, 0, 1)
  return { repNumber, samples, phaseSegments: segments, tempoDeviation, grindSignature }
}

const CURVES: RepVelocityCurve[] = SPECS.map((s, i) => genRep(s, i + 1))

/** Per-rep RPE estimate through the fatiguing set (the cheat rep 4 dips). */
const RPE: Array<number | null> = [null, 6.5, 7.5, 7, 8.5, 9, 9.5, 10]

/** Working ROM standard (metres): trimmed peak — drop rep 1 + the current rep. `null` under 3 reps. */
function workingStandard(current: number): number | null {
  const trimmed = SPECS.slice(1, current).map((s) => s.romMm / 1000)
  if (trimmed.length === 0) return null
  return Math.max(...trimmed)
}

/**
 * Build a mock model for the set truncated at `current` (0-based rep index). Pass a
 * `verdict` / `rpe` to override the plausible derived read (used by the state showcase).
 */
export function buildMockModel(
  current: number,
  overrides?: {
    rpe?: number | null
    verdict?: FatigueVerdict | null
    /** Override the plan. Pass `undefined` explicitly for the no-plan-attached case. */
    plannedReps?: number
  }
): LiveFatigueModel {
  const spec = SPECS[current]
  const working = workingStandard(current)
  const rpe = overrides && 'rpe' in overrides ? (overrides.rpe ?? null) : (RPE[current] ?? null)
  const verdict = overrides && 'verdict' in overrides ? (overrides.verdict ?? null) : null
  const plannedReps =
    overrides && 'plannedReps' in overrides ? overrides.plannedReps : MOCK_PLANNED_REPS
  return {
    rpe,
    repsInReserve: rpe == null ? null : Math.max(0, Math.round(10 - rpe)),
    verdict,
    romProgression: SPECS.slice(0, current + 1).map((s, i) => ({
      repNumber: i + 1,
      romM: s.romMm / 1000,
    })),
    plannedReps,
    romWorkingStandardM: working,
    romShortThresholdM: working != null ? working * 0.75 : null,
    velocityCurves: CURVES.slice(0, current + 1),
    tempoSeconds: [spec.eccMs / 1000, spec.pBMs / 1000, spec.conMs / 1000, spec.pTMs / 1000],
    targetTempoSeconds: TARGET_TEMPO_SECONDS,
  }
}

/**
 * The WHOLE panel's input for a set truncated at `current` — model, velocity and header
 * from one rep count and one truncation point.
 *
 * The panel feeds two components that each draw their own upcoming-rep remainder, so
 * assembling their props separately is how the two halves drift apart. Build both here
 * or they will disagree again.
 */
export function buildMockPanelState(
  current: number,
  overrides?: { rpe?: number | null; verdict?: FatigueVerdict | null }
): {
  model: LiveFatigueModel
  velocity: { velocities: number[]; targetReps: number; liveRepIndex: number }
  header: typeof MOCK_HEADER
} {
  const model = buildMockModel(current, overrides)
  return {
    model,
    velocity: {
      // Same truncation as the model's romProgression / velocityCurves.
      velocities: MOCK_MEAN_VELOCITIES.slice(0, current + 1),
      targetReps: MOCK_PLANNED_REPS,
      liveRepIndex: current,
    },
    header: { ...MOCK_HEADER, meta: `SET 3 · REP ${current + 1} / ${MOCK_PLANNED_REPS}` },
  }
}

/** Per-rep MEAN concentric velocity (m/s) for the velocity hero (mm/ms == m/s). */
export const MOCK_MEAN_VELOCITIES: number[] = SPECS.map((s) => s.romMm / s.conMs)

/**
 * The prescribed rep count for the mock set — ONE number for the whole family.
 *
 * The fatigue card's ROM chart and the velocity hero beside it both draw an
 * upcoming-rep remainder, from `plannedReps` and `targetReps` respectively. Those
 * are separate props on separate components, so a story that hardcodes one and
 * leaves the other unset puts two different rep counts side by side on one panel.
 * Derive both from here.
 */
export const MOCK_PLANNED_REPS = SPECS.length

const V = (
  state: FatigueVerdict['state'],
  tone: FatigueVerdict['tone'],
  vel: FatigueVerdict['dimensions']['velocityLoss'],
  rom: FatigueVerdict['dimensions']['rom'],
  tempo: FatigueVerdict['dimensions']['tempo']
): FatigueVerdict => ({
  state,
  tone,
  dimensions: { velocityLoss: vel, rom, tempo },
})

/** The four verdict states, each a full plausible model — the "Live states" showcase. */
export const FATIGUE_STATES: Array<{ name: string; current: number; model: LiveFatigueModel }> = [
  {
    name: 'GOOD · early set',
    current: 1,
    model: buildMockModel(1, { rpe: 6, verdict: V('good', 'ok', 'ok', 'ok', 'ok') }),
  },
  {
    name: 'SLOWING · bar speed dropping',
    current: 2,
    model: buildMockModel(2, { rpe: 7.5, verdict: V('slowing', 'warn', 'warn', 'ok', 'ok') }),
  },
  {
    name: 'GRINDING · deep loss, clean form',
    current: 5,
    model: buildMockModel(5, { rpe: 9, verdict: V('grinding', 'warn', 'alarm', 'ok', 'ok') }),
  },
  {
    name: 'FORM BREAKING DOWN · cheat rep',
    current: 7,
    model: buildMockModel(7, {
      rpe: 10,
      verdict: V('form-breakdown', 'alarm', 'alarm', 'alarm', 'alarm'),
    }),
  },
]

/** A warming-up (cold-start, < 2 reps) model — null verdict / RPE. */
export const WARMING_UP_MODEL: LiveFatigueModel = buildMockModel(0, { rpe: null, verdict: null })

export const MOCK_HEADER = {
  title: 'Cable Chest Press',
  subtitle: `Push A · Hypertrophy · 62 lb × ${MOCK_PLANNED_REPS} · tempo 2.6·0.4·0.95·0.28`,
  meta: `SET 3 · REP ${MOCK_PLANNED_REPS} / ${MOCK_PLANNED_REPS}`,
}
