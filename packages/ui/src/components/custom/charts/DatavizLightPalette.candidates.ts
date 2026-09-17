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
 * Set A is turn 1, kept for comparison. Review of A (2026-09-17): "the proposed
 * palettes look very muddy". A pushed stops to ramp steps 700-900, where OKLCH
 * chroma collapses (amber[800] C 0.066, cyan[600] C 0.088). Sets B and C stay
 * on steps 300-700, where every ramp is near its chroma peak.
 */

export type DatavizPalette = 'diverging' | 'sequential' | 'categorical'

export type DatavizKey = `dataviz-${DatavizPalette}-${number}`

export type CandidateSetId = 'A' | 'B' | 'C'

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
}

const DIVERGING_A: CandidateSet = {
  id: 'A',
  title: 'A · turn 1 (contrast-first)',
  rationale:
    'Arms three to four steps darker so every non-centre stop clears 3:1; reads navy/maroon.',
  rules: [
    'arms (stops 0,1,3,4) ≥ 3:1 on all planes',
    'centre strictly lightest; arms symmetric in L',
    'labels ≥ 4.5:1 (black or white); all-pairs CVD ΔE ≥ 8',
  ],
  steps: [
    {
      key: 'dataviz-diverging-0',
      step: 'blue[800]',
      value: ramp.blue[800],
      rationale: 'L 0.38, C 0.116.',
    },
    {
      key: 'dataviz-diverging-1',
      step: 'cyan[600]',
      value: ramp.cyan[600],
      rationale: 'L 0.55, C 0.088.',
    },
    {
      key: 'dataviz-diverging-2',
      step: 'green[400]',
      value: ramp.green[400],
      rationale: 'L 0.71. 2.0:1 on raised.',
    },
    {
      key: 'dataviz-diverging-3',
      step: 'amber[600]',
      value: ramp.amber[600],
      rationale: 'L 0.55, C 0.126.',
    },
    {
      key: 'dataviz-diverging-4',
      step: 'red[800]',
      value: ramp.red[800],
      rationale: 'L 0.38, C 0.145.',
    },
  ],
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

const CATEGORICAL_A: CandidateSet = {
  id: 'A',
  title: 'A · turn 1 (contrast-first)',
  rationale:
    'Three slots move down to 500-700 so all clear 3:1 on white; magenta and orange darken.',
  rules: [
    'every slot ≥ 3:1 on white; L in 0.43-0.77; C ≥ 0.10',
    'adjacent CVD ΔE ≥ 8; adjacent normal-vision ΔE ≥ 15',
  ],
  steps: [
    {
      key: 'dataviz-categorical-0',
      step: 'blue[500]',
      value: ramp.blue[500],
      rationale: 'Unchanged.',
    },
    {
      key: 'dataviz-categorical-1',
      step: 'magenta[700]',
      value: ramp.magenta[700],
      rationale: 'L 0.47.',
    },
    {
      key: 'dataviz-categorical-2',
      step: 'red[500]',
      value: ramp.red[500],
      rationale: 'Unchanged.',
    },
    {
      key: 'dataviz-categorical-3',
      step: 'orange[700]',
      value: ramp.orange[700],
      rationale: 'L 0.47, C 0.140. Reads brown.',
    },
    {
      key: 'dataviz-categorical-4',
      step: 'green[500]',
      value: ramp.green[500],
      rationale: 'L 0.63.',
    },
    {
      key: 'dataviz-categorical-5',
      step: 'cyan[500]',
      value: ramp.cyan[500],
      rationale: 'L 0.63, C 0.106.',
    },
    {
      key: 'dataviz-categorical-6',
      step: 'amber[600]',
      value: ramp.amber[600],
      rationale: 'Unchanged.',
    },
  ],
}

const CATEGORICAL_B: CandidateSet = {
  id: 'B',
  title: 'B · vivid',
  rationale:
    'Keeps orange[400] and dark-mode brightness; red and green take the darker slots instead.',
  rules: [
    'RELAXED: every slot ≥ 2:1 on all planes (was 3:1 on white); legend and tile labels carry identity',
    'L in 0.43-0.77; C ≥ 0.12 (cyan) and ≥ 0.15 (every other hue)',
    'adjacent normal-vision ΔE ≥ 15',
    'RELAXED: adjacent CVD ΔE ≥ 6 (was 8); green↔orange is 6.9, the validator WARN band',
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
      step: 'amber[400]',
      value: ramp.amber[400],
      rationale: 'L 0.71, C 0.156. amber[600] (C 0.126) read ochre.',
    },
  ],
}

export const LIGHT_CANDIDATE_SETS: Record<DatavizPalette, CandidateSet[]> = {
  diverging: [DIVERGING_A, DIVERGING_B, DIVERGING_C],
  sequential: [SEQUENTIAL_A, SEQUENTIAL_B],
  categorical: [CATEGORICAL_A, CATEGORICAL_B],
}
