import { primitiveRamps as ramp } from '../../../theme/tokens/primitives'

/**
 * PROPOSALS ONLY (VW-371 phase 2). Candidate light-mode values for the three
 * `dataviz-*` palettes, rendered by `DatavizLightPalette.stories.tsx` for
 * approval. Nothing reads these outside the story; the token mirrors still
 * carry the phase-1 values until a human signs one set off.
 *
 * Every value is a `primitiveRamps` step, picked by exhaustive search over the
 * ramps and scored with the dataviz skill's validator (Machado-2009 CVD, OKLab
 * ΔE×100). "Planes" below means the three light surfaces a chart sits on:
 * `surface-base` (white), `surface-elevated` and `surface-raised`.
 *
 * Turn 1 (set A) read as muddy: it pushed stops to ramp steps 700-900, where
 * OKLCH chroma collapses (amber[800] C 0.066, cyan[600] C 0.088). Turn 2 added
 * B and C on steps 300-700. Turn 3 (2026-09-17 review) locks categorical B with
 * Cardio kept brown, adds diverging D (white labels) and narrows sequential to
 * steps 0-2 (`SEQUENTIAL_HEAD_VARIANTS`). Set A survives for sequential only.
 */

export type DatavizPalette = 'diverging' | 'sequential' | 'categorical'

export type DatavizKey = `dataviz-${DatavizPalette}-${number}`

export type CandidateSetId = 'A' | 'B' | 'C' | 'D' | 'H1' | 'H2' | 'H3' | 'H4'

export interface LightCandidate {
  key: DatavizKey
  /** The ramp step the proposal points at, as it would be written in semantic.ts. */
  step: string
  value: string
  rationale: string
}

export interface CandidateSet {
  id: CandidateSetId
  title: string
  /** One line: the trade-off this set makes. */
  rationale: string
  /** The rules the set satisfies, and any rule it relaxes, printed as stated. */
  rules: string[]
  steps: LightCandidate[]
  /** Forces every label on the fills to white instead of `bestTextColor`. */
  whiteLabels?: boolean
}

const DIVERGING_B: CandidateSet = {
  id: 'B',
  title: 'B · vivid',
  rationale: 'Ends one step darker than dark mode, inner arms at 500; every relaxed rule passes.',
  rules: [
    'ends (stops 0,4) ≥ 3:1 on all planes',
    'RELAXED: inner stops (1,2,3) ≥ 2:1 on all planes (was 3:1)',
    'centre strictly lightest; arms symmetric in L',
    'labels ≥ 4.5:1 (black or white); all-pairs CVD ΔE ≥ 8',
  ],
  steps: [
    {
      key: 'dataviz-diverging-0',
      step: 'blue[700]',
      value: ramp.blue[700],
      rationale: 'L 0.47, C 0.142. At 600 the ends sit too close to the 500 arms (ΔE 11.9-12.5).',
    },
    {
      key: 'dataviz-diverging-1',
      step: 'cyan[500]',
      value: ramp.cyan[500],
      rationale: 'L 0.63 mirrors amber[500]. C 0.106 is the cyan ramp at this L.',
    },
    {
      key: 'dataviz-diverging-2',
      step: 'green[400]',
      value: ramp.green[400],
      rationale: 'L 0.71, C 0.187. 2.0:1 on raised, 2.4:1 on white.',
    },
    {
      key: 'dataviz-diverging-3',
      step: 'amber[500]',
      value: ramp.amber[500],
      rationale: 'L 0.63, C 0.141. 3.0:1 on raised.',
    },
    {
      key: 'dataviz-diverging-4',
      step: 'red[700]',
      value: ramp.red[700],
      rationale: 'L 0.47, C 0.167. Same step dark mode uses for sequential-5.',
    },
  ],
}

const DIVERGING_C: CandidateSet = {
  id: 'C',
  title: 'C · light centre',
  rationale:
    'Stays close to dark mode: centre one step darker (green pin), inner arms two, blue end one.',
  rules: [
    'ends (stops 0,4) ≥ 3:1 on all planes',
    'inner arms (1,3) ≥ 2:1 on all planes',
    'RELAXED: centre (2) has no contrast floor (1.6:1 on raised); relies on chip outline and label',
    'centre strictly lightest; labels ≥ 4.5:1; all-pairs CVD ΔE ≥ 8',
  ],
  steps: [
    {
      key: 'dataviz-diverging-0',
      step: 'blue[600]',
      value: ramp.blue[600],
      rationale: 'L 0.55, C 0.160. One step darker than dark mode.',
    },
    {
      key: 'dataviz-diverging-1',
      step: 'cyan[400]',
      value: ramp.cyan[400],
      rationale: 'L 0.71, C 0.125. Near the cyan chroma peak.',
    },
    {
      key: 'dataviz-diverging-2',
      step: 'green[300]',
      value: ramp.green[300],
      rationale: 'L 0.77, C 0.191. The green pin; 1.6:1 on raised.',
    },
    {
      key: 'dataviz-diverging-3',
      step: 'amber[400]',
      value: ramp.amber[400],
      rationale: 'L 0.71, C 0.156. Mirrors cyan[400].',
    },
    {
      key: 'dataviz-diverging-4',
      step: 'red[600]',
      value: ramp.red[600],
      rationale: 'Unchanged from dark. L 0.59, C 0.179, 3.8:1 on raised.',
    },
  ],
}

const DIVERGING_D: CandidateSet = {
  id: 'D',
  title: 'D · white labels everywhere',
  rationale:
    'B with a green[500] centre, the lightest centre that still takes white text at 3:1. No 700-step arms.',
  whiteLabels: true,
  rules: [
    'white label ≥ 3:1 on every stop; ≥ 4.5:1 on the ends only (6.87, 7.44)',
    'ends ≥ 3:1 and inner stops ≥ 2:1 on all planes',
    'BROKEN: centre is not visibly lightest; it leads cyan and amber by ΔL 0.0007 (all L 0.63)',
    'BROKEN: all-pairs CVD ΔE 4.9 (green↔amber; floor 8, WARN floor 6). Normal-vision ΔE 17.7',
  ],
  steps: [
    {
      key: 'dataviz-diverging-0',
      step: 'blue[700]',
      value: ramp.blue[700],
      rationale: 'L 0.47, C 0.142. White 6.87:1.',
    },
    {
      key: 'dataviz-diverging-1',
      step: 'cyan[500]',
      value: ramp.cyan[500],
      rationale: 'L 0.63, C 0.106. White 3.39:1.',
    },
    {
      key: 'dataviz-diverging-2',
      step: 'green[500]',
      value: ramp.green[500],
      rationale: 'L 0.63, C 0.174. White 3.25:1; green[400] is 2.40:1.',
    },
    {
      key: 'dataviz-diverging-3',
      step: 'amber[500]',
      value: ramp.amber[500],
      rationale: 'L 0.63, C 0.141. White 3.63:1.',
    },
    {
      key: 'dataviz-diverging-4',
      step: 'red[700]',
      value: ramp.red[700],
      rationale: 'L 0.47, C 0.167. White 7.44:1.',
    },
  ],
}

const SEQUENTIAL_A: CandidateSet = {
  id: 'A',
  title: 'A · turn 1 (contrast-first)',
  rationale: 'Strict ΔL 0.08 walk from a 2:1 light end; the dark end lands on brown.',
  rules: [
    'L strictly decreasing, ΔL ≥ 0.06',
    'lightest step ≥ 2:1 on white',
    'labels ≥ 4.5:1; adjacent CVD ΔE ≥ 4.5',
  ],
  steps: [
    {
      key: 'dataviz-sequential-0',
      step: 'green[400]',
      value: ramp.green[400],
      rationale: 'L 0.71, 2.4:1 on white.',
    },
    {
      key: 'dataviz-sequential-1',
      step: 'amber[500]',
      value: ramp.amber[500],
      rationale: 'L 0.63, C 0.141.',
    },
    {
      key: 'dataviz-sequential-2',
      step: 'amber[600]',
      value: ramp.amber[600],
      rationale: 'L 0.55, C 0.126.',
    },
    {
      key: 'dataviz-sequential-3',
      step: 'orange[700]',
      value: ramp.orange[700],
      rationale: 'L 0.47, C 0.140.',
    },
    {
      key: 'dataviz-sequential-4',
      step: 'red[800]',
      value: ramp.red[800],
      rationale: 'L 0.38, C 0.145.',
    },
    {
      key: 'dataviz-sequential-5',
      step: 'red[900]',
      value: ramp.red[900],
      rationale: 'L 0.30, C 0.114. Reads near-brown.',
    },
  ],
}

const SEQUENTIAL_B: CandidateSet = {
  id: 'B',
  title: 'B · vivid',
  rationale: 'The A walk shifted one step lighter: starts on the green pin, ends on red[800].',
  rules: [
    'L strictly decreasing',
    'RELAXED: ΔL ≥ 0.05 (was 0.06; step 0→1 is 0.059)',
    'RELAXED: lightest step ≥ 1.9:1 on white (was 2:1; green[300] is 1.93:1)',
    'labels ≥ 4.5:1; adjacent CVD ΔE ≥ 4.5 (7.9 here)',
  ],
  steps: [
    {
      key: 'dataviz-sequential-0',
      step: 'green[300]',
      value: ramp.green[300],
      rationale: 'Unchanged from dark. L 0.77, C 0.191.',
    },
    {
      key: 'dataviz-sequential-1',
      step: 'amber[400]',
      value: ramp.amber[400],
      rationale: 'L 0.71, C 0.156. Darker than step 0, unlike dark-mode amber[200].',
    },
    {
      key: 'dataviz-sequential-2',
      step: 'amber[500]',
      value: ramp.amber[500],
      rationale: 'L 0.63, C 0.141.',
    },
    {
      key: 'dataviz-sequential-3',
      step: 'orange[600]',
      value: ramp.orange[600],
      rationale: 'L 0.55, C 0.159. A used orange[700] (C 0.140).',
    },
    {
      key: 'dataviz-sequential-4',
      step: 'red[700]',
      value: ramp.red[700],
      rationale: 'L 0.47, C 0.167.',
    },
    {
      key: 'dataviz-sequential-5',
      step: 'red[800]',
      value: ramp.red[800],
      rationale: 'L 0.38, C 0.145. Replaces red[900] (C 0.114).',
    },
  ],
}

const CATEGORICAL_B: CandidateSet = {
  id: 'B',
  title: 'B · vivid, LOCKED (Cardio kept brown)',
  rationale:
    'Reviewer pick: B with step 6 back on the current amber[600]. Red and green take the darker slots.',
  rules: [
    'RELAXED: every slot ≥ 2:1 on all planes (was 3:1 on white); legend and tile labels carry identity',
    'L in 0.43-0.77; C ≥ 0.12 (cyan) and ≥ 0.15 (other hues, bar Cardio)',
    'adjacent normal-vision ΔE ≥ 15',
    'RELAXED: adjacent CVD ΔE ≥ 6 (was 8); green↔orange is 6.9, the validator WARN band',
    'L in band except the locked brown: amber[600] is L 0.55, C 0.126 (below the 0.15 hue floor, by choice)',
  ],
  steps: [
    {
      key: 'dataviz-categorical-0',
      step: 'blue[500]',
      value: ramp.blue[500],
      rationale: 'Unchanged from dark. 2.6:1 on raised.',
    },
    {
      key: 'dataviz-categorical-1',
      step: 'magenta[600]',
      value: ramp.magenta[600],
      rationale: 'L 0.55, C 0.209, the most saturated ramp step. ΔE 15.3 from red[600].',
    },
    {
      key: 'dataviz-categorical-2',
      step: 'red[600]',
      value: ramp.red[600],
      rationale: 'The red pin. L 0.59 separates it from orange[400] (ΔE 15.9).',
    },
    {
      key: 'dataviz-categorical-3',
      step: 'orange[400]',
      value: ramp.orange[400],
      rationale: 'Unchanged from dark. L 0.72, C 0.190. 2.2:1 on raised.',
    },
    {
      key: 'dataviz-categorical-4',
      step: 'green[600]',
      value: ramp.green[600],
      rationale: 'L 0.55, C 0.150. Darker than dark mode so it clears 3:1 and parts from cyan.',
    },
    {
      key: 'dataviz-categorical-5',
      step: 'cyan[400]',
      value: ramp.cyan[400],
      rationale: 'L 0.71, C 0.125. The cyan ramp peaks at 0.134.',
    },
    {
      key: 'dataviz-categorical-6',
      step: 'amber[600]',
      value: ramp.amber[600],
      rationale: 'Unchanged from dark, per review. ΔE 24.0 from cyan[400]; adjacent min stays 6.9.',
    },
  ],
}

const headStep = (
  index: number,
  step: string,
  value: string,
  rationale: string
): LightCandidate => ({
  key: `dataviz-sequential-${index}`,
  step,
  value,
  rationale,
})

/**
 * Sequential steps 0-2 only (turn 3). The review: "we need to start by figuring
 * out how to make steps 1 and 2 work without making them look like dirt". The
 * tail (steps 3-5) is decided after one of these is picked. `primitiveRamps` has
 * no yellow or lime ramp, so amber[300] (the gold pin) is the nearest yellow.
 */
export const SEQUENTIAL_HEAD_VARIANTS: CandidateSet[] = [
  {
    id: 'H1',
    title: 'H1 · green → gold pin → orange pin',
    rationale: 'Nearest thing to a lime/yellow middle: no ramp exists, so the gold pin stands in.',
    rules: [
      'BROKEN: not monotone; amber[300] (L 0.81) is lighter than green[300] (L 0.77)',
      'adjacent CVD 6.4 / 8.9',
    ],
    steps: [
      headStep(0, 'green[300]', ramp.green[300], 'L 0.77, C 0.191.'),
      headStep(1, 'amber[300]', ramp.amber[300], 'L 0.81, C 0.165.'),
      headStep(2, 'orange[400]', ramp.orange[400], 'L 0.72, C 0.190.'),
    ],
  },
  {
    id: 'H2',
    title: 'H2 · tint-first',
    rationale: 'Lightness carries the walk; step 2 is still amber[500], so the mustard stays.',
    rules: ['monotone light→dark', 'adjacent CVD 10.9 / 18.7', 'step 0 is 1.16:1 on raised'],
    steps: [
      headStep(0, 'green[200]', ramp.green[200], 'L 0.87, C 0.181.'),
      headStep(1, 'amber[300]', ramp.amber[300], 'L 0.81, C 0.165.'),
      headStep(2, 'amber[500]', ramp.amber[500], 'L 0.63, C 0.141. The mustard.'),
    ],
  },
  {
    id: 'H3',
    title: 'H3 · skip mustard',
    rationale: 'No amber at all: green straight into light and mid orange.',
    rules: [
      'BROKEN: not monotone; orange[300] (L 0.79) is lighter than green[300] (L 0.77)',
      'BROKEN: adjacent CVD 4.7 (step 0↔1), below the 6 WARN floor',
    ],
    steps: [
      headStep(0, 'green[300]', ramp.green[300], 'L 0.77, C 0.191.'),
      headStep(1, 'orange[300]', ramp.orange[300], 'L 0.79, C 0.137. Reads peach.'),
      headStep(2, 'orange[500]', ramp.orange[500], 'L 0.63, C 0.175.'),
    ],
  },
  {
    id: 'H4',
    title: 'H4 · pins only (recommended)',
    rationale:
      'Amber never goes below its gold pin, where it turns to mustard; every step is C ≥ 0.165.',
    rules: [
      'monotone light→dark (ΔL 0.055 / 0.092)',
      'adjacent CVD 10.9 / 8.9',
      'step 0 is 1.16:1 on raised; it reads by chroma, not contrast',
      'leaves orange[500] 0.63 → red[600] 0.59 → red[700] 0.47 for the tail',
    ],
    steps: [
      headStep(0, 'green[200]', ramp.green[200], 'L 0.87, C 0.181. The dark-mode centre mint.'),
      headStep(1, 'amber[300]', ramp.amber[300], 'L 0.81, C 0.165. The dark-mode step 2.'),
      headStep(2, 'orange[400]', ramp.orange[400], 'L 0.72, C 0.190. The dark-mode step 3.'),
    ],
  },
]

export const LIGHT_CANDIDATE_SETS: Record<DatavizPalette, CandidateSet[]> = {
  diverging: [DIVERGING_C, DIVERGING_D, DIVERGING_B],
  sequential: [SEQUENTIAL_A, SEQUENTIAL_B],
  categorical: [CATEGORICAL_B],
}
