import { useId } from 'react'
import { BRUSH_CENTRE, brushOutline, type CandidateProps } from './candidates'

type Pt = readonly [number, number]

const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]]
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k]
const len = (a: Pt) => Math.hypot(a[0], a[1])
const unit = (a: Pt): Pt => mul(a, 1 / len(a))
const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0]
const innerNormal = (d: Pt): Pt => [d[1], -d[0]]
const rotate = (d: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180
  return [d[0] * Math.cos(r) - d[1] * Math.sin(r), d[0] * Math.sin(r) + d[1] * Math.cos(r)]
}
const intersect = (p: Pt, d: Pt, q: Pt, e: Pt): Pt => add(p, mul(d, cross(sub(q, p), e) / cross(d, e)))
const f = (q: Pt) => `${q[0].toFixed(3)} ${q[1].toFixed(3)}`

/** Brush taper's skeleton. */
const APEX: Pt = [9.3, 17.6]
const BEND: Pt = [12.6, 11.4]
const TIP: Pt = [20.8, 4.4]

export interface GeometricParams {
  weight: number
  /** x of the vertical start cut. */
  cutX: number
  /** Short-leg thickness, in weights. */
  lead: number
  /** Sag of the short leg's single curve, in weights (positive bows down-left). */
  sag: number
  /** Flat-bottom width, in weights. */
  flat: number
  /** Up-stroke thickness at its base, in weights. */
  rise: number
  /** How much shallower than the skeleton the under edge leaves the flat bottom, degrees. */
  underLift: number
  /** Half-angle of the point, degrees. */
  tipDeg: number
}

export const A_DEFAULTS: GeometricParams = {
  weight: 2,
  cutX: 4,
  lead: 0.8,
  sag: 0.12,
  flat: 0.55,
  rise: 1.05,
  underLift: 4,
  tipDeg: 9,
}

/**
 * Six on-curve nodes: cut top, inner corner, point, flat-bottom right, flat-bottom left, cut bottom.
 * Segments: short-leg top (quad), up-stroke top (cubic), under-curve (cubic), flat bottom (line),
 * short-leg bottom (quad), vertical cut (close).
 */
export function geometricCheck(p: GeometricParams): { d: string; spine: string } {
  const w = p.weight
  const d1 = unit([1, 1])
  const u1 = innerNormal(d1)
  const d2 = unit(sub(BEND, APEX))
  const u2 = innerNormal(d2)
  const dT = unit(sub(TIP, BEND))

  const bottomY = APEX[1] + 0.5 * w
  const flatLeft: Pt = [APEX[0] - (p.flat * w) / 2, bottomY]
  const flatRight: Pt = [APEX[0] + (p.flat * w) / 2, bottomY]
  const cutBottom = intersect(flatLeft, d1, [p.cutX, 0], [0, 1])
  const topLine = add(flatLeft, mul(u1, p.lead * w))
  const cutTop = intersect(topLine, d1, [p.cutX, 0], [0, 1])
  const riseLine = add(flatRight, mul(u2, p.rise * w))
  const corner = intersect(topLine, d1, riseLine, d2)

  const sagBy = mul(u1, -p.sag * w)
  const topCtrl = add(mul(add(cutTop, corner), 0.5), sagBy)
  const bottomCtrl = add(mul(add(cutBottom, flatLeft), 0.5), sagBy)

  const topIn = rotate(dT, p.tipDeg)
  const underIn = rotate(dT, -p.tipDeg)
  const underOut = rotate(d2, p.underLift)
  const topChord = len(sub(TIP, corner))
  const underChord = len(sub(TIP, flatRight))
  const top1 = add(corner, mul(d2, 0.3 * topChord))
  const top2 = sub(TIP, mul(topIn, 0.35 * topChord))
  const under1 = add(flatRight, mul(underOut, 0.62 * underChord))
  const under2 = sub(TIP, mul(underIn, 0.12 * underChord))

  const d =
    `M${f(cutTop)} Q${f(topCtrl)} ${f(corner)} C${f(top1)} ${f(top2)} ${f(TIP)} ` +
    `C${f(under2)} ${f(under1)} ${f(flatRight)} L${f(flatLeft)} Q${f(bottomCtrl)} ${f(cutBottom)}Z`
  const start = sub(mul(add(cutTop, cutBottom), 0.5), mul(d1, p.lead * w))
  const spine = `M${f(start)} L${f(APEX)} Q${f(BEND)} ${f(add(TIP, mul(dT, 0.5)))}`
  return { d, spine }
}

function MaskedFill({
  d,
  spine,
  cap,
  progress,
  strokeWidth,
  color,
  size,
}: { d: string; spine: string; cap: 'butt' | 'round' } & Required<Pick<CandidateProps, 'strokeWidth' | 'color' | 'size'>> &
  Pick<CandidateProps, 'progress'>) {
  const id = useId()
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
            strokeLinecap={cap}
            strokeLinejoin="round"
            style={progress === undefined ? {} : { strokeDasharray: 1, strokeDashoffset: 1 - progress }}
          />
        </mask>
      </defs>
      <path d={d} fill={color} mask={`url(#${id})`} />
    </svg>
  )
}

export function GeometricA({ progress, strokeWidth = 2, color = 'currentColor', size = 24 }: CandidateProps) {
  const { d, spine } = geometricCheck({ ...A_DEFAULTS, weight: strokeWidth })
  return <MaskedFill {...{ d, spine, progress, strokeWidth, color, size }} cap="butt" />
}

type Cmd = { op: string; xy: Pt | null; raw: string }

function commands(d: string): Cmd[] {
  return (d.match(/[MLAZ][^MLAZ]*/g) ?? []).map((raw) => {
    const nums = raw.slice(1).trim().split(/\s+/).filter(Boolean).map(Number)
    const xy: Pt | null = nums.length >= 2 ? [nums[nums.length - 2], nums[nums.length - 1]] : null
    return { op: raw[0], xy, raw: raw.trim() }
  })
}

/**
 * Brush taper with only a vertical cut: drops the round start cap (the arc) and the outline points left
 * of the cut, and adds the one point where the cut meets the outline. Every surviving command is the
 * original command string, byte for byte.
 */
export function literalCut(weight: number): string {
  const cmds = commands(brushOutline(weight))
  const arcAt = cmds.findIndex((c) => c.op === 'A')
  const capEnd = cmds[arcAt - 1].xy!
  const cutX = Math.max(cmds[0].xy![0], capEnd[0])
  const side = cmds.slice(0, arcAt)
  const firstKept = side.findIndex((c) => c.xy![0] >= cutX)
  const a = side[firstKept - 1].xy!
  const b = side[firstKept].xy!
  const t = (cutX - a[0]) / (b[0] - a[0])
  const hit: Pt = [cutX, a[1] + (b[1] - a[1]) * t]
  const kept = side.slice(firstKept).map((c) => c.raw)
  return [`M${hit[0].toFixed(2)} ${hit[1].toFixed(2)}`, ...kept, 'Z'].join(' ')
}

export function LiteralB({ progress, strokeWidth = 2, color = 'currentColor', size = 24 }: CandidateProps) {
  return <MaskedFill d={literalCut(strokeWidth)} spine={BRUSH_CENTRE} cap="round" {...{ progress, strokeWidth, color, size }} />
}
