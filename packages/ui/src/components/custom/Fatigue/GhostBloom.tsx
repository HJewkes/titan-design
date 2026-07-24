// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostBloom — the smoothPath velocity "bloom": the faded ghost fan of prior reps, a
 * dark halo underlay, and the control-aware silver→red current-rep line on top. Extracted
 * from GhostSpark so the single sparkline and a future top/bottom dual compose the SAME
 * bloom (one grows up from a baseline, the mirrored twin grows down) rather than forking
 * the path machinery.
 *
 * It is a pure SVG group: the caller owns the x/y scale (so orientation — grow up or down —
 * is a mapping decision) and passes the silver→red `tint` from {@link ghostLineColor}.
 */
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'

const t = getSemanticColors('dark')
const PARCH = t['text-primary']

export type Pt = [number, number]

/** Catmull-Rom → cubic-bezier smoothing over a point list. */
export function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : ''
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

export interface GhostBloomProps {
  /** The current rep's points, already mapped to px. */
  current: Pt[]
  /** Prior-rep ("ghost") point sets, oldest first, already mapped to px. */
  ghosts?: Pt[][]
  /** The current-line tint — silver→red from {@link ghostLineColor}. */
  tint: string
  /** Per-ghost stroke colour by index; default fades the primary text token. */
  ghostStroke?: (index: number) => string
  /** Current-line stroke width, px. Default 3.5. */
  lineWidth?: number
  /** Dark halo underlay width, px. Default 7. */
  haloWidth?: number
}

/** The ghost fan + halo + tinted current line. Render inside an `<svg>`. */
export function GhostBloom({
  current,
  ghosts = [],
  tint,
  ghostStroke = (i) => alpha(PARCH, 0.1 + i * 0.015),
  lineWidth = 3.5,
  haloWidth = 7,
}: GhostBloomProps) {
  return (
    <>
      {/* prior reps — faded ghosts (absolute time → the fan reads as drift). */}
      {ghosts.map((pts, i) => (
        <path
          key={i}
          d={smoothPath(pts)}
          fill="none"
          stroke={ghostStroke(i)}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}

      {/* current rep — a soft dark halo underlay, then the tinted line on top. */}
      <path
        d={smoothPath(current)}
        fill="none"
        stroke={alpha('#000000', 0.55)}
        strokeWidth={haloWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={smoothPath(current)}
        fill="none"
        stroke={tint}
        strokeWidth={lineWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  )
}
