// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostBloom — the smoothPath velocity "bloom": the faded ghost fan of prior reps and the
 * control-aware silver→red current-rep line, over a paper-inspired line treatment.
 * Extracted from GhostSpark so the single sparkline and the mirrored dual compose the SAME
 * bloom — the dual is just two blooms sharing one axis, one grown UP and one flipped to grow
 * DOWN (the ghost analogue of the diverging VelocityStrip's orientation flip). Improve the
 * bloom once and both single + dual inherit it.
 *
 * The caller owns the x-scale and passes MAGNITUDES (px height off the axis, ≥ 0); the bloom
 * owns the `baseline` (axis y) and `orientation` (grow up or down), so a mirrored twin is a
 * one-prop flip, not a second component.
 */
import { useId } from 'react'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'

const t = getSemanticColors('dark')
const PARCH = t['text-primary']

/** A point as `[x_px, magnitude_px]` — magnitude is height off the axis baseline (≥ 0). */
export type Pt = [number, number]

/** Catmull-Rom → cubic-bezier smoothing over absolute `[x, y]` points. */
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

/**
 * The line's ground treatment: a soft, blurred, low-opacity dark shadow with no hard edge —
 * the bar "paper" language adapted to a chart LINE, never a hard black outline.
 *
 * `glow` (a halo in the line's own tint) and `rimlight` (a lighter upper edge plus a dropped
 * contact shadow) were explored alongside it and NOT chosen. They were removed rather than
 * left as unreachable options: no component ever exposed the choice, so the only thing that
 * could select them was the exploration story, and dead branches in a render path read as
 * intent that no longer exists.
 */
const BLUR_STD_DEV = 2.6

export interface GhostBloomProps {
  /** The current rep as `[x_px, magnitude_px]` points (magnitude ≥ 0 off the baseline). */
  current: Pt[]
  /** Prior-rep ("ghost") point sets, oldest first, same `[x, magnitude]` shape. */
  ghosts?: Pt[][]
  /** The current-line tint — silver→red from {@link ghostLineColor}. */
  tint: string
  /** The axis y (px) the bloom grows from. */
  baseline: number
  /** Grow UP from the baseline (default) or DOWN — the mirrored-dual flip. */
  orientation?: 'up' | 'down'
  /** Per-ghost stroke colour by index; default fades the primary text token. */
  ghostStroke?: (index: number) => string
  /** Current-line stroke width, px. Default 3.5. */
  lineWidth?: number
}

/** The ghost fan + the paper-treated tinted current line. Render inside an `<svg>`. */
export function GhostBloom({
  current,
  ghosts = [],
  tint,
  baseline,
  orientation = 'up',
  ghostStroke = (i) => alpha(PARCH, 0.1 + i * 0.015),
  lineWidth = 3.5,
}: GhostBloomProps) {
  const rawId = useId()
  const blurId = `bloom-blur-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const toY = (mag: number) => (orientation === 'down' ? baseline + mag : baseline - mag)
  const toAbs = (pts: Pt[]): Pt[] => pts.map(([px, mag]) => [px, toY(mag)])
  const curD = smoothPath(toAbs(current))
  const ghostDs = ghosts.map((g) => smoothPath(toAbs(g)))
  // Rim-light sits on the side the line grows toward (its "top"); shadow falls the other way.

  return (
    <>
      <defs>
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={BLUR_STD_DEV} />
        </filter>
      </defs>

      {/* prior reps — faded ghosts (absolute time → the fan reads as drift). */}
      {ghostDs.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={ghostStroke(i)}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}

      {/* ground treatment — a paper-inspired line contact, never a hard black outline. */}
      <path
        d={curD}
        fill="none"
        stroke={alpha(primitiveColors.black, 0.3)}
        strokeWidth={lineWidth + 3}
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={`url(#${blurId})`}
      />

      {/* the crisp tinted line. */}
      <path
        d={curD}
        fill="none"
        stroke={tint}
        strokeWidth={lineWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  )
}
