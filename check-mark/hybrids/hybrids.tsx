import { useId } from 'react'
import type { Candidate, CandidateProps } from './candidates'

type Pt = [number, number]

interface HybridSpec {
  key: string
  name: string
  rationale: string
  /** Direction of the flat start cut, degrees from +x (90 vertical, 0 horizontal). */
  cutDeg: number
  /** Short-leg half-width, in stroke weights. */
  lead: number
  /** Apex half-width, in stroke weights. */
  apex: number
  /** Fraction of the short leg after which it swells toward the apex. */
  swellFrom: number
  /** Long leg: cubic from the vertex. */
  c1: Pt
  c2: Pt
  tip: Pt
}

const START: Pt = [3.8, 12.2]
const VERTEX: Pt = [9.3, 17.7]

const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]]
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k]
const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1]
const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0]
const unit = (a: Pt): Pt => mul(a, 1 / (Math.hypot(a[0], a[1]) || 1))
const normal = (d: Pt): Pt => unit([-d[1], d[0]])
const smooth = (t: number) => t * t * (3 - 2 * t)

function cubic(a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt {
  const u = 1 - t
  return add(add(mul(a, u * u * u), mul(b, 3 * u * u * t)), add(mul(c, 3 * u * t * t), mul(d, t * t * t)))
}

const area = (poly: Pt[]) => poly.reduce((a, p, i) => a + cross(p, poly[(i + 1) % poly.length]), 0)
const ring = (poly: Pt[]) => {
  const ccw = area(poly) < 0 ? [...poly].reverse() : poly
  return `M${ccw.map((q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join(' L')}Z`
}

/** Short-leg strip, long-leg strip and the apex joint (trimmed at the inner miter point), wound the same way so one nonzero fill unions them. */
function hybridOutline(s: HybridSpec, weight: number): string[] {
  const dir = unit(sub(VERTEX, START))
  const n1 = normal(dir)
  const cut: Pt = [Math.cos((s.cutDeg * Math.PI) / 180), Math.sin((s.cutDeg * Math.PI) / 180)]
  const lead: Pt[] = []
  const back: Pt[] = []
  for (const sign of [1, -1]) {
    const p = add(START, mul(n1, sign * s.lead * weight))
    const t = cross(sub(START, p), cut) / cross(dir, cut)
    ;(sign > 0 ? lead : back).push(add(p, mul(dir, t)))
  }
  for (let i = 1; i <= 12; i++) {
    const t = i / 12
    const k = t < s.swellFrom ? 0 : smooth((t - s.swellFrom) / (1 - s.swellFrom))
    const h = (s.lead + (s.apex - s.lead) * k) * weight
    const p = add(START, mul(sub(VERTEX, START), t))
    lead.push(add(p, mul(n1, h)))
    back.push(sub(p, mul(n1, h)))
  }

  const tail: Pt[] = []
  const tailBack: Pt[] = []
  const N = 32
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const p = cubic(VERTEX, s.c1, s.c2, s.tip, t)
    const n = normal(sub(cubic(VERTEX, s.c1, s.c2, s.tip, Math.min(1, t + 0.01)), cubic(VERTEX, s.c1, s.c2, s.tip, Math.max(0, t - 0.01))))
    const h = (s.apex - (s.apex - 0.04) * Math.pow(t, 1.4)) * weight
    tail.push(add(p, mul(n, h)))
    tailBack.push(sub(p, mul(n, h)))
  }

  const n2 = normal(sub(s.c1, VERTEX))
  const d2 = unit(sub(s.c1, VERTEX))
  const bis = unit(add(n1, n2))
  const m = (s.apex * weight) / dot(bis, n1)
  const innerSign = dot(n1, d2) > 0 ? 1 : -1
  const inner = add(VERTEX, mul(bis, innerSign * m))
  const outer = add(VERTEX, mul(bis, -innerSign * m))
  const reach = dot(sub(inner, VERTEX), d2)
  const shortInner = innerSign > 0 ? lead : back
  const tailInner = innerSign > 0 ? tail : tailBack
  const keptShort = shortInner.filter((q) => dot(sub(q, VERTEX), dir) < -reach)
  const keptTail = tailInner.filter((q) => dot(sub(q, VERTEX), d2) > reach)
  shortInner.splice(0, shortInner.length, ...keptShort, inner)
  tailInner.splice(0, tailInner.length, inner, ...keptTail)
  const joint = [
    add(VERTEX, mul(n1, -innerSign * s.apex * weight)),
    outer,
    add(VERTEX, mul(n2, -innerSign * s.apex * weight)),
    inner,
  ]
  return [[...lead, ...back.reverse()], [...tail, ...tailBack.reverse()], joint].map(ring)
}

function makeMark(s: HybridSpec) {
  const centre = `M${START.join(' ')} L${VERTEX.join(' ')} C${s.c1.join(' ')} ${s.c2.join(' ')} ${s.tip.join(' ')}`
  return function Mark({ progress, strokeWidth = 2, color = 'currentColor', size = 24 }: CandidateProps) {
    const id = useId()
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <defs>
          <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
            <path
              d={centre}
              pathLength={1}
              fill="none"
              stroke="white"
              strokeWidth={strokeWidth * 2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={progress === undefined ? {} : { strokeDasharray: 1, strokeDashoffset: 1 - progress }}
            />
          </mask>
        </defs>
        <path d={hybridOutline(s, strokeWidth).join(' ')} fill={color} fillRule="nonzero" mask={`url(#${id})`} />
      </svg>
    )
  }
}

/** Brush taper's long leg (quad V→(12.6,11.4)→(20.8,4.4)) as a cubic. */
const BRUSH_C1: Pt = [11.5, 13.5]
const BRUSH_C2: Pt = [15.3, 9.07]
const BRUSH_TIP: Pt = [20.8, 4.4]

const SPECS: HybridSpec[] = [
  {
    key: 'h1',
    name: 'H1 · Vertical cut',
    rationale:
      "Grotesk's vertical start cut and a thin even lead-in; swells over the last 40% into Brush's apex and tail unchanged.",
    cutDeg: 90,
    lead: 0.42,
    apex: 0.66,
    swellFrom: 0.6,
    c1: BRUSH_C1,
    c2: BRUSH_C2,
    tip: BRUSH_TIP,
  },
  {
    key: 'h2',
    name: 'H2 · Square cut, late curve',
    rationale:
      'Start cut square to the leg; the long leg leaves the apex straight and only bends in its top third, so the mark reads more geometric.',
    cutDeg: -45,
    lead: 0.46,
    apex: 0.66,
    swellFrom: 0.75,
    c1: [12.4, 12.7],
    c2: [17.4, 6.2],
    tip: BRUSH_TIP,
  },
  {
    key: 'h3',
    name: 'H3 · Horizontal cut, hairline lead',
    rationale:
      'Thinnest lead-in with a horizontal cut (the SG v top); a long swell into a fuller apex, and the curve takes over right at the apex with more bow.',
    cutDeg: 0,
    lead: 0.36,
    apex: 0.72,
    swellFrom: 0.45,
    c1: [10.6, 13.2],
    c2: [14.4, 7.2],
    tip: BRUSH_TIP,
  },
  {
    key: 'h4',
    name: 'H4 · Slant cut, sharp swell',
    rationale:
      'A steep slanted cut and a near-even lead-in that swells only at the apex; the long leg is nearly straight and curls flat just before the hairline.',
    cutDeg: 70,
    lead: 0.5,
    apex: 0.68,
    swellFrom: 0.85,
    c1: [14.6, 11.6],
    c2: [17.6, 6.4],
    tip: BRUSH_TIP,
  },
]

export const HYBRIDS: Candidate[] = SPECS.map((s) => ({
  key: s.key,
  name: s.name,
  rationale: s.rationale,
  Mark: makeMark(s),
}))
