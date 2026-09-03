/**
 * Shared kit for the S3 Session-Rail explorations (NOT a stories file — imported by the sheets under
 * `Custom/Workout/Explorations/*`). Throwaway CSS R&D at the real 232px rail width, on real titan tokens.
 * When these decisions harden they move into the real `ExerciseCard` + a titan `SessionRail` organism.
 */
import type { ReactNode } from 'react'
import { TempoDisplay } from './TempoDisplay'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'

// ---- geometry
export const RAIL_W = 232
export const SET_GAP = 5

// ---- surface + text tokens (dark theme)
// These were hand-copied hexes labelled with their grey/neutral steps, which
// is exactly how they silently stopped matching the ramps they named. They read
// from the tokens now, so a retune reaches them.
const T = getSemanticColors('dark')
export const GREY = greyRamp[900] // upcoming/placeholder
export const BORDER_SUBTLE = greyRamp[950] // row dividers
export const T_PRIMARY = T['text-primary']
export const T_SECONDARY = T['text-secondary']
export const T_TERTIARY = T['text-tertiary']
export const RAISED = greyRamp[925] // nav + heading raised plane
export const INSET = greyRamp[975] // sunk exercise-list column
// depth lives on the sunk list: inner shadow from the heading (top) + nav (left). Raised plane is flat.
export const INSET_SHADOW =
  'inset 0 9px 12px -6px rgba(0,0,0,0.85), inset 7px 0 10px -6px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.02)'

// ---- zone colors = real titan ramp pins (primitiveRamps)
export const RED = '#D14343' // red 600
export const ORANGE = '#FF7900' // orange 400
export const AMBER = '#F9B415' // amber 300
export const GREEN = '#2ED573' // green 300
export const velColor = (v: number): string =>
  v < 0.5 ? RED : v < 0.75 ? ORANGE : v < 1.0 ? AMBER : GREEN

// active-set pulse: each segment eases along its own ramp (adjacent lighter/darker steps) through the pin.
export const PULSE_CSS = `
@keyframes s3pRed{0%,100%{background:#E05254}50%{background:#A4221C}}
@keyframes s3pOrange{0%,100%{background:#FFA063}50%{background:#DA5F00}}
@keyframes s3pAmber{0%,100%{background:#FFD352}50%{background:#E08C00}}
@keyframes s3pGreen{0%,100%{background:#58F69E}50%{background:#21C05D}}`
export const pulseAnim = (c: string): string | undefined => {
  const name =
    c === RED
      ? 's3pRed'
      : c === ORANGE
        ? 's3pOrange'
        : c === AMBER
          ? 's3pAmber'
          : c === GREEN
            ? 's3pGreen'
            : null
  return name ? `${name} 1.9s ease-in-out infinite` : undefined
}

// ---- sets/reps/load in the TempoDisplay visual language (Inter · 600 · letter-spacing 1 · gray separators)
const INTER = 'Inter, sans-serif'
const SRL_SEP = '#6B7280'
function SRLCell({ children, color = T_PRIMARY }: { children: ReactNode; color?: string }) {
  return (
    <span style={{ fontFamily: INTER, fontSize: 11, fontWeight: 600, letterSpacing: 1, color }}>
      {children}
    </span>
  )
}
export function SetsRepsLoad({
  sets,
  reps,
  load,
  unit = 'lb',
}: {
  sets: number
  reps: number | string
  load: number
  unit?: string
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
      <SRLCell>{sets}</SRLCell>
      <SRLCell color={SRL_SEP}>&nbsp;×&nbsp;</SRLCell>
      <SRLCell>{reps}</SRLCell>
      <SRLCell color={SRL_SEP}>&nbsp;@&nbsp;</SRLCell>
      <SRLCell>{load}</SRLCell>
      <SRLCell color={SRL_SEP}>&nbsp;{unit}</SRLCell>
    </span>
  )
}

// ---- per-set bar: one continuous bar, rep intensities as butted segments (no gaps); active segments pulse
export type SetState =
  | { status: 'done'; reps: number[] }
  | { status: 'active'; reps: number[]; planned: number }
  | { status: 'todo'; planned: number }
export function setColors(s: SetState): string[] {
  if (s.status === 'todo') return [GREY]
  if (s.status === 'done') return s.reps.map(velColor)
  return [...s.reps.map(velColor), ...Array(Math.max(0, s.planned - s.reps.length)).fill(GREY)]
}
function SetBar({ colors, h, pulse }: { colors: string[]; h: number; pulse?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minWidth: 0,
        height: h,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {colors.map((c, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: '100%',
            background: c,
            animation: pulse && c !== GREY ? pulseAnim(c) : undefined,
          }}
        />
      ))}
    </div>
  )
}
export function SetStrip({ sets, h }: { sets: SetState[]; h: number }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: h, gap: SET_GAP }}>
      {sets.map((s, i) => (
        <SetBar key={i} colors={setColors(s)} h={h} pulse={s.status === 'active'} />
      ))}
    </div>
  )
}

export function Indicator({ kind }: { kind: 'pr' | 'issue' | 'info' }) {
  const map = { pr: ['★', ORANGE], issue: ['!', RED], info: ['i', '#2196F3'] } as const
  const [glyph, color] = map[kind]
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        border: `1px solid ${color}`,
        color,
        fontSize: 10,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glyph}
    </span>
  )
}

const labelStyle = { fontSize: 14, fontWeight: 800, color: T_PRIMARY } as const

// ---- the finalized heading unit
export type Exercise = {
  name: string
  sets: number
  reps: number | string
  load: number
  tempo: [number, number, number, number]
  indicator?: 'pr' | 'issue' | 'info'
  setStates: SetState[]
  upcoming?: boolean
}
export function Heading({ ex, stripH }: { ex: Exercise; stripH: number }) {
  return (
    <div
      style={{
        padding: '9px 12px',
        display: 'flex',
        flexDirection: 'column',
        opacity: ex.upcoming ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={labelStyle}>{ex.name}</span>
        <div style={{ flex: 1 }} />
        {ex.indicator && <Indicator kind={ex.indicator} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
        <SetsRepsLoad sets={ex.sets} reps={ex.reps} load={ex.load} />
        <div style={{ flex: 1 }} />
        <TempoDisplay tempo={ex.tempo} size="sm" showLabel={false} showInfo={false} />
      </div>
      <div style={{ marginTop: 7 }}>
        <SetStrip sets={ex.setStates} h={stripH} />
      </div>
    </div>
  )
}

// ---- sample session (per-rep mean velocities; sets fatigue across the workout, reps decay in-set)
export const reps = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))
export const SESSION: Exercise[] = [
  {
    name: 'Seated Cable Row',
    sets: 5,
    reps: 8,
    load: 145,
    tempo: [3, 1, 2, 0],
    indicator: 'pr',
    setStates: [1.0, 0.9, 0.8, 0.7, 0.6].map((s) => ({ status: 'done', reps: reps(8, s) })),
  },
  {
    name: 'Incline DB Press',
    sets: 3,
    reps: 8,
    load: 70,
    tempo: [3, 0, 3, 0],
    setStates: [0.72, 0.62, 0.54].map((s) => ({ status: 'done', reps: reps(8, s) })),
  },
  {
    name: 'Cable Chest Press',
    sets: 3,
    reps: 10,
    load: 90,
    tempo: [2, 1, 2, 0],
    indicator: 'info',
    setStates: [
      { status: 'done', reps: reps(10, 0.72) },
      { status: 'active', reps: reps(5, 0.62), planned: 10 },
      { status: 'todo', planned: 10 },
    ],
  },
  {
    name: 'Standing Calf Raise',
    sets: 5,
    reps: 20,
    load: 25,
    tempo: [2, 1, 2, 0],
    upcoming: true,
    setStates: [1, 2, 3, 4, 5].map(() => ({ status: 'todo', planned: 20 })),
  },
  {
    name: 'Face Pull',
    sets: 3,
    reps: '15-20',
    load: 40,
    tempo: [2, 1, 2, 0],
    upcoming: true,
    setStates: [1, 2, 3].map(() => ({ status: 'todo', planned: 18 })),
  },
]

// ---- shell chrome (neumorphic): flat raised nav + heading plane; sunk inset exercise list
export function NavStub() {
  return (
    <div
      style={{
        width: 60,
        alignSelf: 'stretch',
        position: 'relative',
        zIndex: 2,
        background: RAISED,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 12,
        gap: 8,
      }}
    >
      {['Live', 'Plan', 'Body'].map((t) => (
        <span key={t} style={{ fontSize: 8, color: T_TERTIARY, fontWeight: 700 }}>
          {t}
        </span>
      ))}
    </div>
  )
}
export function Rail({ stripH, footer }: { stripH: number; footer?: ReactNode }) {
  return (
    <div style={{ width: 246, background: INSET, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{ position: 'relative', zIndex: 2, padding: '11px 12px 10px', background: RAISED }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: T_TERTIARY,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 3, background: GREEN }} />
          Live session
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3, color: T_PRIMARY }}>
          Pull A · Intensification
        </div>
        <div style={{ fontSize: 10, color: T_SECONDARY, marginTop: 2, fontFamily: 'monospace' }}>
          ex 3/5 · set 2 live
        </div>
      </div>
      <div style={{ flex: 1, background: INSET, boxShadow: INSET_SHADOW }}>
        {SESSION.map((ex, i) => (
          <div
            key={i}
            style={{
              borderBottom: i < SESSION.length - 1 ? `1px solid ${BORDER_SUBTLE}` : undefined,
            }}
          >
            <Heading ex={ex} stripH={stripH} />
          </div>
        ))}
      </div>
      {footer}
    </div>
  )
}

// ---- page scaffold shared by the sheets
export function Page({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        color: T_PRIMARY,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style>{PULSE_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 800 }}>{title}</span>
        <span style={{ fontSize: 12, color: T_SECONDARY, maxWidth: 820 }}>{note}</span>
      </div>
      {children}
    </div>
  )
}
export const sectionTitle = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: ORANGE,
} as const
export const monoTag = { fontFamily: 'monospace', fontSize: 11, color: T_SECONDARY } as const
