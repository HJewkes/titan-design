/**
 * TD-4 light-mode depth candidates. Lab only: nothing here reaches `theme/`
 * until the owner picks one, and then the pick moves into `lift-shadow.ts`
 * and `semantic.ts`.
 *
 * The shipped light ladder collapses at the top (raised and overlay are both
 * white) and runs only ~3 L* from the pane to a card, which is the "card does
 * not differentiate from the pane" complaint. Each candidate rebuilds the
 * ladder so every plane is lighter than the one below, and differs in which
 * cue carries the rank:
 *
 *   A  TONE    the wall's spacing: even ~3.5 L* steps, a quiet shadow, no rim.
 *   B  SHADOW  the shipped page tone, a compressed ramp near white, and a
 *              warmer, heavier shadow doing the separating.
 *   C  EDGE    the owner's td-487 r3 pick (crisp geometry, ring 0.08, rim 0.9)
 *              on an evened ladder.
 */
import { LIFT_AMBIENT, LIFT_AMBIENT_ALPHA_SCALE, LIFT_RIM_ALPHA } from '../../theme/lift-shadow'
import type { LiftStep } from '../../theme/lift-shadow'
import { surfaceBackground, type SurfaceLevel } from '../../theme/surface-planes'

export type CandidateKey = 'shipped' | 'A' | 'B' | 'C'

export interface LightCandidate {
  key: CandidateKey
  name: string
  /** One line on what carries the rank. */
  idea: string
  planes: Record<SurfaceLevel, string>
  /** White top rim-light alpha; 0 drops it. */
  rim: number
  /** Hairline ring alpha around a lifted plane; 0 drops it. */
  ring: number
  /** The shadow's colour channels, `r,g,b`. */
  shadowRgb: string
  /** Multiplies the dark alphas in LIFT_AMBIENT. */
  shadowAlpha: number
  /** Multiplies the dark y offsets and blurs in LIFT_AMBIENT. */
  shadowGeometry: number
  /** Edge alpha for the `outline` Card on an off-white host plane. */
  outlineEdge: number
}

const SHIPPED_PLANES: SurfaceLevel[] = [
  'frame',
  'background',
  'base',
  'elevated',
  'raised',
  'overlay',
]

function shippedPlanes(): Record<SurfaceLevel, string> {
  return Object.fromEntries(
    SHIPPED_PLANES.map((level) => [level, surfaceBackground(level, 'light')])
  ) as Record<SurfaceLevel, string>
}

export const LIGHT_CANDIDATES: Record<CandidateKey, LightCandidate> = {
  shipped: {
    key: 'shipped',
    name: 'Shipped',
    idea: 'What ships today: raised and overlay are both white.',
    planes: shippedPlanes(),
    rim: LIFT_RIM_ALPHA.light,
    ring: 0,
    shadowRgb: '0,0,0',
    shadowAlpha: LIFT_AMBIENT_ALPHA_SCALE.light,
    shadowGeometry: 1,
    outlineEdge: 0.24,
  },
  A: {
    key: 'A',
    name: 'A · Tone ladder',
    idea: 'Even ~3.5 L* steps like the wall; a quiet shadow, no rim.',
    planes: {
      frame: '#D4D1CE', // L*84.0, grey 200
      background: '#DCD9D6', // L*86.9
      base: '#E5E2DF', // L*90.0
      elevated: '#EDEAE7', // L*92.8, grey 100
      raised: '#F6F3F0', // L*96.0
      overlay: '#FFFFFF', // L*100
    },
    rim: 0,
    ring: 0,
    shadowRgb: '40,30,20',
    shadowAlpha: 0.35,
    shadowGeometry: 1,
    outlineEdge: 0.16,
  },
  B: {
    key: 'B',
    name: 'B · Shadow paper',
    idea: 'Shipped page tone, planes packed near white; a warm shadow separates.',
    planes: {
      frame: '#DEDCDA', // L*87.9
      background: '#E4E2E0', // L*90.0
      base: '#EDEAE7', // L*92.8, grey 100
      elevated: '#F5F3F1', // L*95.9
      raised: '#FBF9F7', // L*98.0
      overlay: '#FFFFFF', // L*100
    },
    rim: 0,
    ring: 0,
    shadowRgb: '60,40,20',
    shadowAlpha: 0.6,
    shadowGeometry: 1.1,
    outlineEdge: 0.12,
  },
  C: {
    key: 'C',
    name: 'C · Crisp edge',
    idea: 'td-487 r3 geometry (alpha x0.5, blur x0.6, ring 0.08, rim 0.9) on an even ladder.',
    planes: {
      frame: '#D4D1CE', // L*84.0, grey 200
      background: '#DFDCD9', // L*87.9
      base: '#E8E5E2', // L*91.1
      elevated: '#F1EFED', // L*94.5
      raised: '#F9F6F3', // L*97.0, grey 50
      overlay: '#FFFFFF', // L*100
    },
    rim: 0.9,
    ring: 0.08,
    shadowRgb: '0,0,0',
    shadowAlpha: 0.5,
    shadowGeometry: 0.6,
    outlineEdge: 0.14,
  },
}

export const CANDIDATE_KEYS: CandidateKey[] = ['shipped', 'A', 'B', 'C']

/** The web boxShadow a candidate gives a lift: rim, ring, then the ambient layers. */
export function candidateShadow(step: LiftStep, c: LightCandidate): string {
  const scale = (n: number) => Math.round(n * c.shadowGeometry)
  const layers = LIFT_AMBIENT[step].map(
    ({ y, blur, alpha }) =>
      `0 ${scale(y)}px ${scale(blur)}px rgba(${c.shadowRgb},${(alpha * c.shadowAlpha).toFixed(2)})`
  )
  if (c.ring > 0) layers.unshift(`0 0 0 1px rgba(0,0,0,${c.ring.toFixed(2)})`)
  if (c.rim > 0) layers.unshift(`inset 0 1px 0 rgba(255,255,255,${c.rim.toFixed(2)})`)
  return layers.join(', ')
}

/** The outline Card's edge colour for a candidate. */
export function candidateOutline(c: LightCandidate): string {
  return `rgba(0,0,0,${c.outlineEdge.toFixed(2)})`
}
