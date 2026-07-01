import React from 'react'

import type {
  WeightBadgeProps,
  PrBadgeProps,
  PRType,
  StatusDotProps,
  StatusDotVariant,
  PlaceholderStripProps,
  VelocityStripProps,
  TempoDisplayProps,
  DeviationBarProps,
  IntensityBarProps,
  WorkoutPillProps,
  WorkoutPillStatus,
  MuscleGroupChipProps,
  VolumeStatus,
  SparklineProps,
} from '../src/components/custom/Workout'

/* ─────────────────────────────────────────────────────────────────────────
   HTML ground truth — Layer 0 of the visual test suite (TD-04.03)

   One tiny function per workout atom. Each renders raw div/span/svg with the
   inline styles copied verbatim from the frozen prototype
   (`voltras/docs/prototypes/component-demo.html`, lines ~11-757) and accepts
   the SAME props as its React counterpart in
   `src/components/custom/Workout`. These are the reference twins the 3-layer
   suite (TD-04.04 screenshots / TD-04.05 computed-style / TD-04.06 parity)
   asserts the React components against — so they intentionally reproduce the
   FROZEN demo, not the current React render. Where the two have drifted, the
   ground truth follows the demo and the drift is what the parity layer exists
   to surface.

   Interaction / animation props (onPress, animate, pulse, showInfo, …) do not
   affect the frozen static snapshot and are accepted but ignored.
   ───────────────────────────────────────────────────────────────────────── */

/** Frozen twin of the demo's `:root` palette (component-demo.html lines 11-36). */
const T = {
  brandPrimary: '#FF7900',
  brandPrimarySubtle: 'rgba(255, 121, 0, 0.12)',
  brandSecondary: '#406D87',
  surfaceRaised: '#1C1C1C',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  borderDefault: '#1F1F1F',
  borderStrong: '#2C2C2C',
  statusSuccess: '#14B8A6',
  statusError: '#D14343',
  statusWarning: '#FFB020',
  resultImprove: '#4caf50',
  resultDegrade: '#ef5350',
  velRed: '#ff4757',
  velOrange: '#ffa502',
  velYellow: '#ffd43b',
  velGreen: '#2ed573',
  fontHeading: "'Space Grotesk', sans-serif",
  fontUi: "'Nunito Sans', sans-serif",
  fontBody: "'Inter', sans-serif",
} as const

// ── 1. E1rmBadge (React: WeightBadge) ──────────────────────────────────────
const E1RM_ICON = { sm: 10, md: 12, lg: 14 }
const E1RM_PAD = { sm: '2px 6px', md: '2px 8px', lg: '4px 10px' }
const E1RM_FONT = { sm: 9, md: 10, lg: 12 }

/** Barbell glyph (demo's inline SVG, not React's lucide Dumbbell). */
function barbellIcon(dim: number) {
  return (
    <svg
      viewBox="0 2 24 20"
      width={dim}
      height={dim}
      style={{
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        fill: 'none',
        display: 'block',
      }}
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M4 18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" />
    </svg>
  )
}

export function HtmlE1rmBadge({ value, unit = 'lbs', delta, isPr, showIcon = true, size = 'md' }: WeightBadgeProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        background: isPr ? T.brandPrimarySubtle : T.surfaceRaised,
        border: `1px solid ${isPr ? 'rgba(255, 121, 0, 0.3)' : T.borderDefault}`,
        borderRadius: 2,
        fontFamily: T.fontHeading,
        fontWeight: 600,
        color: isPr ? T.brandPrimary : T.textSecondary,
        fontSize: E1RM_FONT[size],
        padding: E1RM_PAD[size],
      }}
    >
      {showIcon ? <span style={{ display: 'inline-flex', alignItems: 'center', marginTop: -1 }}>{barbellIcon(E1RM_ICON[size])}</span> : null}
      {`${isPr ? '★ ' : ''}${value} ${unit}`}
      {delta != null ? (
        <span style={{ marginLeft: 4, color: delta >= 0 ? T.resultImprove : T.resultDegrade }}>{` ${delta >= 0 ? '+' : ''}${delta}%`}</span>
      ) : null}
    </div>
  )
}

// ── 2. PrBadge ──────────────────────────────────────────────────────────────
const PR_LABELS: Record<PRType, string> = {
  e1rm: 'PR e1RM',
  weight: 'PR Weight',
  reps: 'PR Reps',
  volume: 'PR Volume',
  velocity: 'PR Velocity',
}

export function HtmlPrBadge({ type = 'e1rm', label, compact }: PrBadgeProps) {
  if (compact) {
    return <span style={{ display: 'inline-flex', color: T.brandPrimary, fontSize: 13 }}>{'★'}</span>
  }
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: T.brandPrimarySubtle,
        border: '1px solid rgba(255, 121, 0, 0.3)',
        borderRadius: 2,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 700,
        color: T.brandPrimary,
        fontFamily: T.fontBody,
      }}
    >
      {`★ ${label ?? PR_LABELS[type]}`}
    </div>
  )
}

// ── 3. StatusDot ────────────────────────────────────────────────────────────
const DOT_SOLID: Record<string, string> = {
  success: T.statusSuccess,
  warning: T.statusWarning,
  error: T.statusError,
  neutral: T.textTertiary,
}
const DOT_RING: Record<string, { background: string; border: string }> = {
  'on-track': { background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' },
  deviation: { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' },
  future: { background: 'rgba(107,114,128,0.1)', border: '1px dashed rgba(107,114,128,0.2)' },
}
const DOT_ICON_COLOR: Record<StatusDotVariant, string> = {
  success: '#0A5C52',
  warning: '#6B4000',
  error: '#5C1A1A',
  neutral: '#D1D5DB',
  'on-track': T.statusSuccess,
  deviation: T.statusWarning,
  future: T.textTertiary,
}
const DOT_GLOW: Record<string, string> = {
  success: '0 0 4px rgba(20,184,166,0.4)',
  warning: '0 0 4px rgba(245,158,11,0.4)',
  error: '0 0 4px rgba(239,68,68,0.4)',
}
const DOT_ICON_CHAR = { check: '✓', exclamation: '!', dash: '—' }

export function HtmlStatusDot({ variant, icon, size = 'sm', glow }: StatusDotProps) {
  const dim = size === 'md' ? 18 : 8
  const ring = DOT_RING[variant]
  return (
    <span
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: ring ? ring.background : DOT_SOLID[variant],
        border: ring ? ring.border : undefined,
        boxShadow: glow ? DOT_GLOW[variant] : undefined,
      }}
    >
      {icon ? <span style={{ fontSize: 11, lineHeight: 1, fontWeight: 900, color: DOT_ICON_COLOR[variant] }}>{DOT_ICON_CHAR[icon]}</span> : null}
    </span>
  )
}

// ── 4. PlaceholderStrip ─────────────────────────────────────────────────────
export function HtmlPlaceholderStrip({ width, mode = 'single', segments = 3 }: PlaceholderStripProps) {
  const w = width as number | string | undefined
  if (mode === 'segmented') {
    return (
      <div style={{ display: 'flex', gap: 2, height: 3, opacity: 0.5, width: w }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, background: '#3A3A3A', borderRadius: 1, minWidth: 4 }} />
        ))}
      </div>
    )
  }
  return <div style={{ height: 3, background: '#3A3A3A', borderRadius: 2, opacity: 0.5, width: w }} />
}

// ── 5. VelocityStrip ────────────────────────────────────────────────────────
function velZoneHex(v: number): string {
  if (v >= 1.0) return T.velGreen
  if (v >= 0.75) return T.velYellow
  if (v >= 0.5) return T.velOrange
  return T.velRed
}

export function HtmlVelocityStrip({ velocities, variant = 'full', expanded }: VelocityStripProps) {
  if (variant === 'mini' || !expanded) {
    return (
      <div style={{ display: 'flex', gap: 2, height: 3, borderRadius: 2, width: '100%' }}>
        {velocities.map((v, i) => (
          <div key={i} style={{ flex: 1, borderRadius: 1, minWidth: 4, background: velZoneHex(v) }} />
        ))}
      </div>
    )
  }
  const maxV = Math.max(...velocities) * 1.15
  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: T.surfaceRaised, borderRadius: 6, padding: '16px 8px 24px', height: 80, width: '100%' }}>
      <div style={{ display: 'flex', gap: 2, flex: 1, alignItems: 'flex-end' }}>
        {velocities.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 7, color: T.textSecondary, fontFamily: T.fontUi, marginBottom: 2, textAlign: 'center' }}>{v.toFixed(2)}</span>
            <div style={{ width: '100%', borderRadius: '2px 2px 0 0', minHeight: 2, height: `${Math.round((v / maxV) * 100)}%`, background: velZoneHex(v) }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 6. TempoDisplay ─────────────────────────────────────────────────────────
// Demo renders concentric-hold-eccentric-idle; the React tuple is
// [eccentric, pauseBottom, concentric, pauseTop], so the display order is
// re-mapped here to match the frozen prototype.
export function HtmlTempoDisplay({ tempo, size = 'md', colored = true }: TempoDisplayProps) {
  const [ecc, hold, con, idle] = tempo
  const fontSize = size === 'sm' ? 9 : 11
  const padding = size === 'sm' ? '2px 6px' : '2px 8px'
  const dash = <span style={{ color: T.textSecondary }}>-</span>
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', background: T.surfaceRaised, borderRadius: 2, fontFamily: T.fontUi, padding }}>
      <span style={{ fontWeight: 600, letterSpacing: 2, fontSize, color: colored ? undefined : '#9CA3AF' }}>
        {colored ? (
          <>
            <span style={{ color: T.brandPrimary }}>{con}</span>
            {dash}
            <span style={{ color: '#2196F3' }}>{hold}</span>
            {dash}
            <span style={{ color: T.statusSuccess }}>{ecc}</span>
            {dash}
            <span style={{ color: T.textSecondary }}>{idle}</span>
          </>
        ) : (
          `${con}-${hold}-${ecc}-${idle}`
        )}
      </span>
    </div>
  )
}

// ── 7. DeviationBar ─────────────────────────────────────────────────────────
function deviationDotColor(d: number): string {
  const abs = Math.abs(d)
  if (d < -0.3) return T.statusSuccess
  if (abs <= 0.3) return T.textTertiary
  if (abs <= 0.7) return T.statusWarning
  return T.statusError
}

export function HtmlDeviationBar({ deviation, width = 40 }: DeviationBarProps) {
  const clamped = Math.max(-1, Math.min(1, deviation))
  const left = Math.max(0, Math.min(width - 6, ((clamped + 1) / 2) * width - 3))
  return (
    <div style={{ position: 'relative', height: 10, display: 'flex', alignItems: 'center', width }}>
      <div style={{ width: '100%', height: 4, background: '#333333', borderRadius: 100 }} />
      <div style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', top: 2, left, background: deviationDotColor(clamped) }} />
    </div>
  )
}

// ── 8. IntensityBar ─────────────────────────────────────────────────────────
// `level` is a fraction (React clamps to 0-1; the demo also shows >100% "over"
// states, so this ground truth keeps values above 1 to reproduce them).
const INTENSITY_GRADIENT = `linear-gradient(to top, ${T.statusWarning} 0%, ${T.brandPrimary} 50%, ${T.statusError} 100%)`
const BULGE_SIZE: Record<number, number> = { 1: 8, 2: 10, 3: 11 }

function intensityZone(pct: number): { fill: string; over: number } {
  if (pct > 120) return { fill: '#7A1C1C', over: 3 }
  if (pct > 110) return { fill: '#A62626', over: 2 }
  if (pct > 100) return { fill: T.statusError, over: 1 }
  if (pct >= 95) return { fill: INTENSITY_GRADIENT, over: 0 }
  if (pct >= 75) return { fill: T.statusWarning, over: 0 }
  return { fill: T.statusSuccess, over: 0 }
}

export function HtmlIntensityBar({ level, threshold, size = 24, thickness = 6 }: IntensityBarProps) {
  const pct = level * 100
  const zone = intensityZone(pct)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content' }}>
      <div style={{ width: thickness, height: size, background: '#333333', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 3, zIndex: 2, height: zone.over > 0 ? '100%' : `${Math.round(pct)}%`, background: zone.fill }} />
        {zone.over > 0 ? (
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', zIndex: 1, width: BULGE_SIZE[zone.over], height: BULGE_SIZE[zone.over], background: zone.fill }} />
        ) : null}
        {threshold != null ? (
          <div style={{ position: 'absolute', left: -3, right: -3, height: 1.5, background: 'rgba(33, 150, 243, 0.5)', zIndex: 4, bottom: `${Math.round(threshold * 100)}%` }} />
        ) : null}
      </div>
      <span style={{ fontSize: 8, color: T.textTertiary, fontFamily: T.fontUi, marginTop: 6 }}>{Math.round(pct)}%</span>
    </div>
  )
}

// ── 9. WorkoutPill ──────────────────────────────────────────────────────────
// `current` maps to the demo's `.active` class. `deload` has no frozen twin in
// the prototype; the purple values mirror the React component so the function
// still renders every status.
const PILL: Record<WorkoutPillStatus, { bg: string; border: string; color: string; prefix: string }> = {
  completed: { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.3)', color: T.statusSuccess, prefix: '✓ ' },
  current: { bg: 'rgba(255,121,0,0.15)', border: 'rgba(255,121,0,0.3)', color: T.brandPrimary, prefix: '' },
  next: { bg: 'transparent', border: 'rgba(255,121,0,0.4)', color: T.brandPrimary, prefix: '' },
  upcoming: { bg: T.surfaceRaised, border: T.borderDefault, color: T.textTertiary, prefix: '' },
  missed: { bg: 'rgba(209,67,67,0.1)', border: 'rgba(209,67,67,0.25)', color: 'rgba(209,67,67,0.7)', prefix: '— ' },
  deload: { bg: 'rgba(147,51,234,0.15)', border: 'rgba(147,51,234,0.3)', color: '#9333ea', prefix: '' },
}

export function HtmlWorkoutPill({ name, status }: WorkoutPillProps) {
  const s = PILL[status]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, fontFamily: T.fontUi, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {`${s.prefix}${name}`}
    </div>
  )
}

// ── 10. MuscleGroupChip ─────────────────────────────────────────────────────
const CHIP_DOT: Record<VolumeStatus, string> = {
  ontrack: T.statusSuccess,
  target: T.brandPrimary,
  behind: T.brandSecondary,
  untrained: T.borderStrong,
  over: T.statusError,
}

export function HtmlMuscleGroupChip({ name, volumeStatus }: MuscleGroupChipProps) {
  const dot = volumeStatus ? CHIP_DOT[volumeStatus] : T.borderStrong
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', background: T.surfaceRaised, border: `1px solid ${T.borderDefault}`, borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 500, color: T.textSecondary, fontFamily: T.fontUi }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', marginRight: 6, flexShrink: 0, background: dot }} />
      {name}
    </div>
  )
}

// ── 11. Sparkline ───────────────────────────────────────────────────────────
// Demo draws an SVG polyline of segments + dots (React uses positioned divs).
export function HtmlSparkline({ data, width = 80, height = 30, color, referenceLines, showDots }: SparklineProps) {
  const stroke = color ?? '#ff7900'
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const x = (i: number) => (data.length === 1 ? 0 : (i / (data.length - 1)) * width)
  const y = (v: number) => height - ((v - min) / range) * height
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {referenceLines?.map((r, i) => (
        <line key={`ref-${i}`} x1={0} y1={y(r.value)} x2={width} y2={y(r.value)} stroke={r.color} strokeWidth={1} strokeDasharray={r.dashed ? '3,3' : undefined} opacity={0.6} />
      ))}
      {data.slice(1).map((v, i) => (
        <line key={`seg-${i}`} x1={x(i)} y1={y(data[i])} x2={x(i + 1)} y2={y(v)} stroke={stroke} strokeWidth={1.5} />
      ))}
      {showDots ? data.map((v, i) => <circle key={`dot-${i}`} cx={x(i)} cy={y(v)} r={1.5} fill={stroke} />) : null}
      {data.length > 0 ? <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={3} fill={stroke} /> : null}
    </svg>
  )
}
