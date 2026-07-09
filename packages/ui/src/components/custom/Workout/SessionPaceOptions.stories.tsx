/**
 * SHEET · Q-S3.4 SessionPace footer — three shape options, rendered at real rail
 * width (246px) for side-by-side review. THROWAWAY specimen (Lab); the chosen shape
 * gets hardened into SessionPacePanel on real tokens. Placeholder literal-hex here.
 *   A · compact readout      — flat progress bar + metrics + suggestion (current)
 *   B · pace-band chart      — swap the flat bar for a session-scoped budget band
 *   C · compact + drawer     — compact footer that opens the band in an S4 drawer
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'

const AMBER = primitiveRamps.amber[300] // #F9B415 behind
const GREEN = primitiveRamps.green[300] // #2ED573 ahead
const ORANGE = primitiveRamps.orange[400] // #FF7900 eyebrow
const INSET = primitiveColors.charcoal[800] // #131313 footer surface
const RAISED = primitiveColors.charcoal[400] // #1F1F1F tile
const T1 = primitiveColors.neutral[100] // #F3F4F6
const T2 = primitiveColors.neutral[400] // #9CA3AF
const T3 = primitiveColors.neutral[500] // #6B7280
const DIVIDER = primitiveColors.charcoal[500] // #1C1C1C
const TRACK = '#22252C'
const W = 246

// ---- shared bits ----------------------------------------------------------
function Frame({ children, w = W }: { children: React.ReactNode; w?: number }) {
  return (
    <div style={{ width: w, background: INSET, borderTop: `1px solid ${DIVIDER}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'Inter, sans-serif' }}>
      {children}
    </div>
  )
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: ORANGE }}>{children}</span>
}
function BigTime() {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: T1 }}>42:18</span>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: T2 }}>of 60:00 budget</span>
    </div>
  )
}
function Metrics() {
  const cell = (label: string, value: string, color?: string) => (
    <div style={{ flex: 1, alignItems: 'center', display: 'flex', flexDirection: 'column', background: RAISED, borderRadius: 7, padding: '6px 3px' }}>
      <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.4, color: T3, fontWeight: 800 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, marginTop: 2, color: color ?? T1 }}>{value}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {cell('Volume', '76%')}
      {cell('Load', '7.3k')}
      {cell('Fatigue', 'MOD', AMBER)}
    </div>
  )
}
function Suggest({ tone }: { tone: 'behind' | 'ahead' }) {
  const color = tone === 'behind' ? AMBER : GREEN
  const bg = tone === 'behind' ? 'rgba(249,180,21,0.10)' : 'rgba(46,213,115,0.10)'
  const border = tone === 'behind' ? 'rgba(249,180,21,0.30)' : 'rgba(46,213,115,0.28)'
  return (
    <div style={{ display: 'flex', gap: 7, borderRadius: 8, padding: 9, background: bg, border: `1px solid ${border}` }}>
      <span style={{ fontSize: 12, color }}>{tone === 'behind' ? '▲' : '＋'}</span>
      <span style={{ flex: 1, fontSize: 10.5, lineHeight: '15px', color }}>
        {tone === 'behind' ? 'Behind pace — ~9 min over budget. Drop Face Pull to 2 sets to finish on time.' : 'Ahead of pace — ~7 min of headroom. Room to add a Cable Fly drop-set.'}
      </span>
    </div>
  )
}

// ---- the pace-band mini chart (version B / C) -----------------------------
// x-domain 0..1.3 of budget (shows projection past 60:00). Cumulative-progress
// curve: solid to "now" (0.705), dashed projection to finish; overshoot shaded.
function PaceBand({ w = W - 24, h = 58, tone }: { w?: number; h?: number; tone: 'behind' | 'ahead' }) {
  const color = tone === 'behind' ? AMBER : GREEN
  const DOM = 1.3
  const x = (t: number) => (t / DOM) * w
  const now = 0.705 // 42:18 / 60:00
  const finish = tone === 'behind' ? 1.15 : 0.92 // projected finish vs budget(1.0)
  const budgetX = x(1)
  const curveY = (t: number) => h - 6 - (t / finish) * (h - 14) // rises to full height at finish
  const pt = (t: number) => `${x(t)},${curveY(Math.min(t, finish))}`
  const solid = [0, 0.2, 0.4, 0.55, now].map(pt).join(' ')
  const proj = [now, 0.85, finish].map(pt).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {/* budget corridor */}
      <rect x={0} y={0} width={budgetX} height={h} fill="rgba(255,255,255,0.02)" />
      {/* overshoot region past budget */}
      {finish > 1 && <rect x={budgetX} y={0} width={x(finish) - budgetX} height={h} fill={tone === 'behind' ? 'rgba(249,180,21,0.10)' : 'transparent'} />}
      {/* baseline */}
      <line x1={0} y1={h - 6} x2={w} y2={h - 6} stroke={TRACK} strokeWidth={1} />
      {/* budget line */}
      <line x1={budgetX} y1={4} x2={budgetX} y2={h - 4} stroke={T3} strokeWidth={1} strokeDasharray="2 2" />
      <text x={budgetX - 3} y={12} textAnchor="end" fill={T3} fontSize={8} fontFamily="monospace">60:00</text>
      {/* solid progress + dashed projection */}
      <polyline points={solid} fill="none" stroke={color} strokeWidth={2} />
      <polyline points={proj} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />
      {/* now marker */}
      <circle cx={x(now)} cy={curveY(now)} r={3} fill={color} />
      <line x1={x(now)} y1={curveY(now) + 4} x2={x(now)} y2={h - 6} stroke={color} strokeWidth={1} opacity={0.4} />
      <text x={x(now)} y={h - 10} textAnchor="middle" fill={T2} fontSize={8} fontFamily="monospace">now</text>
      {/* projected finish */}
      <text x={x(finish)} y={curveY(finish) - 5} textAnchor="middle" fill={color} fontSize={8} fontFamily="monospace">{tone === 'behind' ? '+9m' : '−7m'}</text>
    </svg>
  )
}

// ---- version A: compact readout (current) ---------------------------------
function VersionA({ tone }: { tone: 'behind' | 'ahead' }) {
  const fill = tone === 'behind' ? AMBER : GREEN
  return (
    <Frame>
      <Eyebrow>Session Pace</Eyebrow>
      <BigTime />
      <div style={{ height: 6, borderRadius: 3, background: TRACK, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '70%', borderRadius: 3, background: fill }} />
      </div>
      <Metrics />
      <Suggest tone={tone} />
    </Frame>
  )
}

// ---- version B: pace-band chart replaces the flat bar ---------------------
function VersionB({ tone }: { tone: 'behind' | 'ahead' }) {
  return (
    <Frame>
      <Eyebrow>Session Pace</Eyebrow>
      <BigTime />
      <PaceBand tone={tone} />
      <Metrics />
      <Suggest tone={tone} />
    </Frame>
  )
}

// ---- version C: compact footer that opens the band in a drawer ------------
function VersionC({ tone }: { tone: 'behind' | 'ahead' }) {
  const fill = tone === 'behind' ? AMBER : GREEN
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
      <Frame>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>Session Pace</Eyebrow>
          <span style={{ fontSize: 10, color: fill }}>detail ↗</span>
        </div>
        <BigTime />
        <div style={{ height: 6, borderRadius: 3, background: TRACK, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '70%', borderRadius: 3, background: fill }} />
        </div>
        <span style={{ fontSize: 10, color: tone === 'behind' ? AMBER : GREEN }}>{tone === 'behind' ? '▲ ~9 min over — tap for the plan' : '＋ ~7 min headroom — tap for the plan'}</span>
      </Frame>
      {/* simulated S4 drawer */}
      <div style={{ width: 360, background: primitiveColors.charcoal[600], border: `1px solid ${DIVIDER}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'Inter, sans-serif', boxShadow: '-8px 0 24px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Session Pace</span>
          <span style={{ fontSize: 11, color: T3 }}>✕ close</span>
        </div>
        <BigTime />
        <PaceBand w={332} h={92} tone={tone} />
        <Metrics />
        <Suggest tone={tone} />
      </div>
      <span style={{ fontSize: 9, color: T3, fontStyle: 'italic', maxWidth: 360 }}>↑ the drawer is a mock of the S4 overlay — footer stays compact, full band + metrics live in the drill-in.</span>
    </div>
  )
}

// ---- sheet ----------------------------------------------------------------
function Col({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: T1, fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <span style={{ fontSize: 11, color: T2, maxWidth: 280, fontFamily: 'Inter, sans-serif', lineHeight: '16px' }}>{note}</span>
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  )
}

function Sheet({ tone }: { tone: 'behind' | 'ahead' }) {
  return (
    <div style={{ background: '#0E0E0E', padding: 28, minHeight: '100vh' }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: T1, fontFamily: 'Inter, sans-serif' }}>Q-S3.4 · SessionPace footer — three shapes ({tone})</span>
      <div style={{ display: 'flex', gap: 44, marginTop: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Col label="A · Compact readout" note="Current shape, hardened. Flat progress bar + metrics + one suggestion. Reads at a glance; fits 246px.">
          <VersionA tone={tone} />
        </Col>
        <Col label="B · Pace-band chart" note="Swap the flat bar for a session-scoped budget band: solid = done, dashed = projected finish vs the 60:00 line, overshoot shaded.">
          <VersionB tone={tone} />
        </Col>
        <Col label="C · Compact + S4 drawer" note="Footer stays minimal (time + tap affordance); the full band + metrics open in the S4 drawer. First real consumer of S4.">
          <VersionC tone={tone} />
        </Col>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Lab/Explorations/SessionPace Options',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const Behind: Story = { render: () => <Sheet tone="behind" /> }
export const Ahead: Story = { render: () => <Sheet tone="ahead" /> }
