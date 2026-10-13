import { useId } from 'react'
import type { CandidateProps } from './candidates'

type Pt = readonly [number, number]

export interface CleanCheckParams {
  /** Stroke weight in viewBox units; every thickness is a multiple of it. */
  weight: number
  /** Direction of the flat start cut, degrees from +x (90 = vertical). */
  cutDeg: number
  /** Lead-in thickness as a fraction of the apex thickness. */
  leadRatio: number
  /** Fraction of the short leg after which the outer edge swells. */
  swellFrom: number
  /** Apex thickness as a multiple of the weight. */
  apexRatio: number
  /** Half-angle of the tail's point, degrees. */
  tipDeg: number
}

export const H1_DEFAULTS: CleanCheckParams = {
  weight: 2,
  cutDeg: 90,
  leadRatio: 0.64,
  swellFrom: 0.6,
  apexRatio: 1.32,
  tipDeg: 8,
}

/** Brush taper's skeleton: start, apex, tail control, tip (24-unit grid). */
const START: Pt = [3.8, 12.2]
const APEX: Pt = [9.3, 17.7]
const BEND: Pt = [12.6, 11.4]
const TIP: Pt = [20.8, 4.4]

/** Handle lengths as fractions of the chord, from the skeleton quad raised to a cubic. */
const TAIL_OUT_HANDLE = 0.27
const TAIL_IN_HANDLE = 0.41
/** Swell handle along the lead-in, as a fraction of the swell chord. */
const SWELL_HANDLE = 0.4
/** Apex rounding handle, as a fraction of the apex thickness. */
const APEX_HANDLE = 0.32

const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]]
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k]
const len = (a: Pt) => Math.hypot(a[0], a[1])
const unit = (a: Pt): Pt => mul(a, 1 / len(a))
const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0]
/** The normal on the inside of the check (up-left of a rightward-rising leg). */
const innerNormal = (d: Pt): Pt => [d[1], -d[0]]

function intersect(p: Pt, d: Pt, q: Pt, e: Pt): Pt {
  return add(p, mul(d, cross(sub(q, p), e) / cross(d, e)))
}

function rotateToward(d: Pt, n: Pt, deg: number): Pt {
  return unit(add(d, mul(n, Math.tan((deg * Math.PI) / 180))))
}

export interface CleanCheck {
  d: string
  /** Draw-on spine for the mask, extended past both ends so butt caps never clip the outline. */
  spine: string
}

/**
 * Six on-curve nodes: the two start-cut corners, the inner corner, the tip, the apex and the swell
 * start. The apex and the swell start are tangent-continuous; every other node is a deliberate corner.
 */
export function cleanCheck(p: CleanCheckParams): CleanCheck {
  const ta = p.apexRatio * p.weight
  const tl = p.leadRatio * ta
  const d1 = unit(sub(APEX, START))
  const d2 = unit(sub(BEND, APEX))
  const dT = unit(sub(TIP, BEND))
  const u1 = innerNormal(d1)
  const u2 = innerNormal(d2)
  const uT = innerNormal(dT)
  const cut: Pt = [Math.cos((p.cutDeg * Math.PI) / 180), Math.sin((p.cutDeg * Math.PI) / 180)]

  const innerLine = add(START, mul(u1, tl / 2))
  const outerLine = sub(START, mul(u1, tl / 2))
  const cutTop = intersect(innerLine, d1, START, cut)
  const cutBottom = intersect(outerLine, d1, START, cut)
  const corner = intersect(innerLine, d1, add(APEX, mul(u2, tl / 2)), d2)
  const swell = add(outerLine, mul(d1, p.swellFrom * len(sub(APEX, START))))
  const apex = add(APEX, mul(unit(add(u1, u2)), -(ta - tl / 2)))
  const apexTangent = unit(add(d1, d2))
  const tipIn = rotateToward(dT, mul(uT, -1), p.tipDeg)
  const tipOut = rotateToward(dT, uT, p.tipDeg)

  const inChord = len(sub(TIP, corner))
  const in1 = add(corner, mul(d2, TAIL_OUT_HANDLE * inChord))
  const in2 = sub(TIP, mul(tipIn, TAIL_IN_HANDLE * inChord))
  const out1 = add(apex, mul(apexTangent, APEX_HANDLE * ta))
  const out2 = sub(TIP, mul(tipOut, TAIL_IN_HANDLE * len(sub(TIP, apex))))
  const sw1 = add(swell, mul(d1, SWELL_HANDLE * len(sub(apex, swell))))
  const sw2 = sub(apex, mul(apexTangent, APEX_HANDLE * ta))

  const f = (q: Pt) => `${q[0].toFixed(3)} ${q[1].toFixed(3)}`
  const d =
    `M${f(cutTop)} L${f(corner)} C${f(in1)} ${f(in2)} ${f(TIP)} ` +
    `C${f(out2)} ${f(out1)} ${f(apex)} C${f(sw2)} ${f(sw1)} ${f(swell)} L${f(cutBottom)}Z`
  const spine = `M${f(sub(START, mul(d1, tl)))} L${f(APEX)} Q${f(BEND)} ${f(add(TIP, mul(dT, 0.5)))}`
  return { d, spine }
}

export function CleanH1({ progress, strokeWidth = 2, color = 'currentColor', size = 24 }: CandidateProps) {
  const id = useId()
  const { d, spine } = cleanCheck({ ...H1_DEFAULTS, weight: strokeWidth })
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
          <path
            d={spine}
            pathLength={1}
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth * 2.6}
            strokeLinecap="butt"
            strokeLinejoin="round"
            style={progress === undefined ? {} : { strokeDasharray: 1, strokeDashoffset: 1 - progress }}
          />
        </mask>
      </defs>
      <path d={d} fill={color} mask={`url(#${id})`} />
    </svg>
  )
}
