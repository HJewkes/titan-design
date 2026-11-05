import { primitiveRamps as ramp } from '../../../theme/tokens/primitives'
import type { CandidateSet, DatavizKey, LightCandidate } from './DatavizLightPalette.types'

/**
 * The categorical light candidates: B (landed 2026-09-17) and B′ (the TD-756
 * revisit, landed by TD-759). `DatavizLightPalette.candidates.ts` holds the record.
 */
export const CATEGORICAL_B: CandidateSet = {
  id: 'B',
  title: 'B · vivid, Cardio kept brown',
  rationale:
    'Reviewer pick of 2026-09-17, replaced by B′: red[600] and green[600] collide under CVD (all-pairs ΔE 4.9).',
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

function stepOfB(key: DatavizKey): LightCandidate {
  const step = CATEGORICAL_B.steps.find((candidate) => candidate.key === key)
  if (!step) throw new Error(`set B has no ${key}`)
  return step
}

export const CATEGORICAL_B_PRIME: CandidateSet = {
  id: "B'",
  title: 'B′ · L-fix-vivid, all-pairs CVD restored',
  chosen: true,
  rationale:
    'Owner pick (Morning 82): B with red[400] and green[700]. Separates the two by lightness, as dark does.',
  rules: [
    'all-pairs CVD ΔE ≥ 8 through slot 5 (8.6, red[400]↔orange[400]), the gate the dark fills meet',
    'every slot ≥ 2:1 on surface-base, elevated and raised; four slots under 3:1 (red 2.31 on raised)',
    'canonical order and slots 0, 1, 3, 5, 6 unchanged from B',
  ],
  steps: [
    stepOfB('dataviz-categorical-0'),
    stepOfB('dataviz-categorical-1'),
    {
      key: 'dataviz-categorical-2',
      step: 'red[400]',
      value: ramp.red[400],
      rationale: 'Coral, L 0.71. 2.31:1 on raised; black label 7.1:1.',
    },
    stepOfB('dataviz-categorical-3'),
    {
      key: 'dataviz-categorical-4',
      step: 'green[700]',
      value: ramp.green[700],
      rationale: 'Forest, L 0.47. 5.4:1 on raised; parts from red by lightness under CVD.',
    },
    stepOfB('dataviz-categorical-5'),
    stepOfB('dataviz-categorical-6'),
  ],
}
