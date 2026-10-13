import { useId, type ReactNode } from 'react'
import type { IconProps } from '../../components/icons/SvgIcon'

export interface CandidateProps extends IconProps {
  /** Draw-on progress 0..1 (stroke-dashoffset on the pathLength=1 stroke). */
  progress?: number
}

export interface Candidate {
  key: string
  name: string
  rationale: string
  Mark: (props: CandidateProps) => ReactNode
}

const dash = (progress?: number) =>
  progress === undefined ? {} : { strokeDasharray: 1, strokeDashoffset: 1 - progress }

function Frame({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  children,
  cap = 'round',
  join = 'round',
}: IconProps & { children: ReactNode; cap?: 'round' | 'butt'; join?: 'round' | 'miter' | 'bevel' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap={cap}
      strokeLinejoin={join}
      aria-hidden
    >
      {children}
    </svg>
  )
}

function stroked(d: string, cap: 'round' | 'butt' = 'round', join: 'round' | 'miter' | 'bevel' = 'round') {
  return function Mark({ progress, ...props }: CandidateProps) {
    return (
      <Frame {...props} cap={cap} join={join}>
        <path d={d} pathLength={1} style={dash(progress)} />
      </Frame>
    )
  }
}

/** Lucide `Check` (ISC) — the control. */
const LUCIDE = 'M4 12l5 5L20 6'

const GROTESK_D = 'M1.6 10.3 9.4 18.1 21.6 3.4'

function GroteskCut({ progress, ...props }: CandidateProps) {
  const id = useId()
  return (
    <Frame {...props} cap="butt" join="miter">
      <defs>
        <clipPath id={id}>
          <rect x={3.6} y={5} width={18} height={14.2} />
        </clipPath>
      </defs>
      <path d={GROTESK_D} pathLength={1} clipPath={`url(#${id})`} strokeMiterlimit={10} style={dash(progress)} />
    </Frame>
  )
}

type Pt = [number, number]
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => lerp(lerp(a, c, t), lerp(c, b, t), t)

const BRUSH_A: Pt = [4.3, 12.5]
const BRUSH_V: Pt = [9.3, 17.6]
const BRUSH_C: Pt = [12.6, 11.4]
const BRUSH_B: Pt = [20.8, 4.4]
const BRUSH_CENTRE = `M${BRUSH_A.join(' ')} L${BRUSH_V.join(' ')} Q${BRUSH_C.join(' ')} ${BRUSH_B.join(' ')}`

/** Samples the centreline with a half-width per sample; widths in units of the stroke weight. */
function brushSamples(): { p: Pt; w: number }[] {
  const out: { p: Pt; w: number }[] = []
  for (let i = 0; i <= 8; i++) out.push({ p: lerp(BRUSH_A, BRUSH_V, i / 8), w: 0.5 + (0.62 - 0.5) * (i / 8) })
  for (let i = 1; i <= 24; i++) {
    const t = i / 24
    out.push({ p: quad(BRUSH_V, BRUSH_C, BRUSH_B, t), w: 0.62 - 0.54 * Math.pow(t, 1.4) })
  }
  return out
}

function brushOutline(weight: number): string {
  const s = brushSamples()
  const left: Pt[] = []
  const right: Pt[] = []
  s.forEach(({ p, w }, i) => {
    const a = s[Math.max(0, i - 1)].p
    const b = s[Math.min(s.length - 1, i + 1)].p
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    const n: Pt = [-dy / len, dx / len]
    const h = w * weight
    left.push([p[0] + n[0] * h, p[1] + n[1] * h])
    right.push([p[0] - n[0] * h, p[1] - n[1] * h])
  })
  const f = (q: Pt) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`
  const r0 = s[0].w * weight
  return (
    `M${f(left[0])} ` +
    left.slice(1).map((q) => `L${f(q)}`).join(' ') +
    ' ' +
    right
      .reverse()
      .map((q) => `L${f(q)}`)
      .join(' ') +
    ` A${r0.toFixed(2)} ${r0.toFixed(2)} 0 0 0 ${f(left[0])}Z`
  )
}

function Brush({ progress, strokeWidth = 2, color = 'currentColor', size = 24 }: CandidateProps) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
          <path
            d={BRUSH_CENTRE}
            pathLength={1}
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth * 2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={dash(progress)}
          />
        </mask>
      </defs>
      <path d={brushOutline(strokeWidth)} fill={color} mask={`url(#${id})`} />
    </svg>
  )
}

export const CANDIDATES: Candidate[] = [
  {
    key: 'lucide',
    name: '0 · Lucide (control)',
    rationale: 'Current #838 mark, lucide Check (ISC). Symmetric-ish 1:2 legs, round caps.',
    Mark: stroked(LUCIDE),
  },
  {
    key: 'grotesk',
    name: '1 · Grotesk cut',
    rationale:
      "Space Grotesk's v/y: miter apex and both terminals clipped flat (vertical left, horizontal top, horizontal apex).",
    Mark: GroteskCut,
  },
  {
    key: 'seven',
    name: '2 · Seven',
    rationale: "Straight short leg; long leg bows like Space Grotesk's 7 descender, steep off the apex, easing right.",
    Mark: stroked('M4.2 12.4 9.2 17.4C10.6 13.4 14.2 8.4 20.6 5.2'),
  },
  {
    key: 'flag',
    name: '3 · Flag',
    rationale:
      "Long leg ends in a squared turn to horizontal, the j/y-descender corner of Space Grotesk and JetBrains Mono, butt-cut.",
    Mark: stroked('M3.4 12.6 8.8 18 16.2 8.2Q17.8 6 20.2 6H22.4', 'butt', 'miter'),
  },
  {
    key: 'soft',
    name: '4 · Soft join',
    rationale: "Nunito-style round apex: the corner is a radius, not a point; round caps. Friendliest at 12 px.",
    Mark: stroked('M4 11.6 7.2 15.2Q9.4 17.8 11.4 15.2L19.8 4.8'),
  },
  {
    key: 'tick',
    name: '5 · Hand tick',
    rationale: 'A pen tick: curled entry, apex low, long leg overshoots the top-right like a ticked box.',
    Mark: stroked('M3.4 11.4C5.4 12.4 7.4 14.6 9 17.8 11.8 11.6 15.6 6.8 21.4 3.2'),
  },
  {
    key: 'brush',
    name: '6 · Brush taper',
    rationale: 'Filled stroke that swells at the apex and tapers to a hairline; draws on through a stroked mask.',
    Mark: Brush,
  },
  {
    key: 'split',
    name: '7 · Stencil split',
    rationale: "A cut between the legs, like Space Grotesk's detached 1-flag; butt caps keep the gap crisp.",
    Mark: stroked('M3.8 12.4 7.6 16.2M9.4 17.9 20.4 5', 'butt', 'miter'),
  },
]
