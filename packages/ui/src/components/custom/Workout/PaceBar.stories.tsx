/**
 * SHEET · Two-layer pace bar — time vs. reps racing. Progress = completed reps / total
 * planned reps (all sets, all exercises); the reference = elapsed / budget. Whichever
 * leads sets the pace; color encodes ahead (reps ≥ time → green) / behind (reps < time
 * → amber). Derivable NOW — no VMCP time-model needed. THROWAWAY specimen (Lab),
 * placeholder hex, real rail width (246px). Two treatments + in the header.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'

const AMBER = primitiveRamps.amber[300]
const GREEN = primitiveRamps.green[300]
const RAISED = primitiveColors.charcoal[400]
const TILE = primitiveColors.charcoal[500]
const T1 = primitiveColors.neutral[100]
const T2 = primitiveColors.neutral[400]
const T3 = primitiveColors.neutral[500]
const DIVIDER = primitiveColors.charcoal[600]
const TRACK = '#2A2D34'
const LIVE = '#2ED573'
const W = 246

// pace = reps% vs time%; ahead when you've done more work than time spent
const paceColor = (repsPct: number, timePct: number) => (repsPct >= timePct ? GREEN : AMBER)

// ---- treatment 1: two stacked bars (time reference + reps progress) --------
function BarRow({ label, pct, fill, meta }: { label: string; pct: number; fill: string; meta: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ fontSize: 8, width: 30, color: T3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: TRACK, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: fill }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 9, color: T2, width: 62, textAlign: 'right' }}>{meta}</span>
    </div>
  )
}
function StackedBars({ timePct, repsPct }: { timePct: number; repsPct: number }) {
  const color = paceColor(repsPct, timePct)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <BarRow label="Time" pct={timePct} fill={T3} meta="42:18/60:00" />
      <BarRow label="Reps" pct={repsPct} fill={color} meta={`${Math.round((repsPct / 100) * 230)}/230`} />
    </div>
  )
}

// ---- treatment 2: reps fill + time "ghost" marker on one bar ---------------
function GhostBar({ timePct, repsPct }: { timePct: number; repsPct: number }) {
  const color = paceColor(repsPct, timePct)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ position: 'relative', height: 10, borderRadius: 5, background: TRACK, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${repsPct}%`, borderRadius: 5, background: color }} />
        {/* time ghost marker: where you "should" be */}
        <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${timePct}%`, width: 2, background: T1, opacity: 0.85 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color }}>{Math.round((repsPct / 100) * 230)}/230 reps</span>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: T2 }}>⏱ 42:18/60:00</span>
      </div>
    </div>
  )
}

function Case({ title, timePct, repsPct, Bar }: { title: string; timePct: number; repsPct: number; Bar: React.ComponentType<{ timePct: number; repsPct: number }> }) {
  return (
    <div style={{ width: W, background: RAISED, padding: 12, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'Inter, sans-serif' }}>
      <span style={{ fontSize: 10, color: T2 }}>{title}</span>
      <Bar timePct={timePct} repsPct={repsPct} />
    </div>
  )
}

// ---- header in context (treatment 1) --------------------------------------
function HeaderWithRace({ timePct, repsPct }: { timePct: number; repsPct: number }) {
  return (
    <div style={{ width: W, background: RAISED, padding: '11px 12px 12px', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: LIVE }} />
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: T3 }}>Live session</span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', color: T1, marginTop: 3 }}>Pull A · Intensification</span>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: T2, marginTop: 2 }}>ex 3/5 · set 2 live</span>
      <div style={{ height: 1, background: DIVIDER, margin: '10px 0 9px' }} />
      <StackedBars timePct={timePct} repsPct={repsPct} />
      <div style={{ display: 'flex', gap: 4, marginTop: 9 }}>
        {(['Volume', 'Load', 'Fatigue'] as const).map((l, i) => (
          <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: TILE, borderRadius: 6, padding: '5px 3px' }}>
            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: T3 }}>{l}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, marginTop: 1, color: i === 2 ? AMBER : T1 }}>{['76%', '7.3k', 'MOD'][i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Col({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: T1, fontFamily: 'Inter, sans-serif' }}>{label}</span>
      {children}
    </div>
  )
}

function Sheet() {
  return (
    <div style={{ background: '#0E0E0E', padding: 28, minHeight: '100vh' }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: T1, fontFamily: 'Inter, sans-serif' }}>Two-layer pace bar — time vs. reps race</span>
      <p style={{ fontSize: 12, color: T2, maxWidth: 660, fontFamily: 'Inter, sans-serif', lineHeight: '18px' }}>
        Progress = completed reps / total planned reps. Reference = elapsed / budget. Reps ahead of time → green; behind → amber.
        No time-model needed — both are plain counts.
      </p>
      <div style={{ display: 'flex', gap: 40, marginTop: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Col label="T1 · Stacked bars">
          <Case title="Behind — reps 56% vs time 70%" timePct={70} repsPct={56} Bar={StackedBars} />
          <Case title="Ahead — reps 78% vs time 62%" timePct={62} repsPct={78} Bar={StackedBars} />
        </Col>
        <Col label="T2 · Reps fill + time ghost marker">
          <Case title="Behind — fill behind the marker" timePct={70} repsPct={56} Bar={GhostBar} />
          <Case title="Ahead — fill past the marker" timePct={62} repsPct={78} Bar={GhostBar} />
        </Col>
        <Col label="In the header (T1)">
          <HeaderWithRace timePct={70} repsPct={56} />
          <HeaderWithRace timePct={62} repsPct={78} />
        </Col>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Lab/Explorations/Pace Bar',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const Race: Story = { render: () => <Sheet /> }
