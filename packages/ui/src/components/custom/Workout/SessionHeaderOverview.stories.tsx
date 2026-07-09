/**
 * SHEET · Q-S3.4 (resolved: fold SessionPace into the header) — the consolidated
 * SessionHeader carrying the session overview: eyebrow/title/status + a timer BAR
 * with a shrunk time label + the Volume/Load/Fatigue metrics. No suggestion banner
 * (the trim/add coaching defers to a future info-tooltip). THROWAWAY specimen (Lab);
 * placeholder literal-hex. Rendered at real rail width (246px), across states.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'

const AMBER = primitiveRamps.amber[300] // behind
const GREEN = primitiveRamps.green[300] // ahead / on pace
const RAISED = primitiveColors.charcoal[400] // #1F1F1F header plane
const TILE = primitiveColors.charcoal[500] // #1C1C1C metric tile on the raised plane
const T1 = primitiveColors.neutral[100] // #F3F4F6
const T2 = primitiveColors.neutral[400] // #9CA3AF
const T3 = primitiveColors.neutral[500] // #6B7280
const DIVIDER = primitiveColors.charcoal[600] // hairline on the plane
const TRACK = '#2A2D34'
const LIVE = '#2ED573'
const W = 246

type Pace = 'behind' | 'ahead' | 'idle'

function Dot({ color }: { color: string }) {
  return <span style={{ width: 7, height: 7, borderRadius: 999, background: color, display: 'inline-block' }} />
}

function MetricTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: TILE, borderRadius: 6, padding: '5px 3px' }}>
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: T3 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, marginTop: 1, color: color ?? T1 }}>{value}</span>
    </div>
  )
}

function Header({ pace }: { pace: Pace }) {
  const idle = pace === 'idle'
  const fill = pace === 'behind' ? AMBER : GREEN
  const pct = pace === 'behind' ? 70 : pace === 'ahead' ? 62 : 0
  return (
    <div style={{ width: W, background: RAISED, padding: '11px 12px 12px', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      {/* eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {!idle && <Dot color={LIVE} />}
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: T3 }}>{idle ? 'Next session' : 'Live session'}</span>
      </div>
      {/* title + status */}
      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', color: T1, marginTop: 3 }}>Pull A · Intensification</span>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: T2, marginTop: 2 }}>{idle ? '6 exercises · ~20 sets · Lower B' : 'ex 3/5 · set 2 live'}</span>

      {/* hairline */}
      <div style={{ height: 1, background: DIVIDER, margin: '10px 0 9px' }} />

      {/* timer bar + shrunk time label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: TRACK, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: idle ? T3 : fill, opacity: idle ? 0.5 : 1 }} />
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: T2, whiteSpace: 'nowrap' }}>
          {idle ? '~52:00' : '42:18'}
          <span style={{ color: T3 }}> / 60:00</span>
        </span>
      </div>

      {/* metrics */}
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <MetricTile label="Volume" value={idle ? '—' : '76%'} />
        <MetricTile label="Load" value={idle ? '—' : '7.3k'} />
        <MetricTile label="Fatigue" value={idle ? '—' : 'MOD'} color={idle ? undefined : AMBER} />
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
      <span style={{ fontSize: 18, fontWeight: 800, color: T1, fontFamily: 'Inter, sans-serif' }}>
        SessionHeader — overview folded in (timer bar + metrics, no footer pane)
      </span>
      <p style={{ fontSize: 12, color: T2, maxWidth: 640, fontFamily: 'Inter, sans-serif', lineHeight: '18px' }}>
        The session pace lives in the header, not a separate footer tile. Timer text shrinks to a label; the bar + metrics
        carry the glance. Ahead/behind coaching (trim/add) defers to a future info-tooltip.
      </p>
      <div style={{ display: 'flex', gap: 40, marginTop: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Col label="Behind pace (amber)"><Header pace="behind" /></Col>
        <Col label="Ahead of pace (green)"><Header pace="ahead" /></Col>
        <Col label="Idle (pre-session)"><Header pace="idle" /></Col>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Lab/Explorations/SessionHeader Overview',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const States: Story = { render: () => <Sheet /> }
