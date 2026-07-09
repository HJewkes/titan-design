/**
 * SHEET · SessionHeader — chunked-bar design. No eyebrow, no sub-heading. Progress bar
 * SEGMENTED by exercise (SetStrip language): one chunk per exercise, width ∝ its set
 * count, current chunk fills fractionally (per-rep). A time ghost marker overlays (dropped
 * with no target time). Clock element matches the TopBar treatment: ⏱ + mono, secondary,
 * right-justified. Upcoming = the same bar empty; the metric tiles become Date / Time /
 * Until (the session name is the title). THROWAWAY specimen (Lab), placeholder hex, 246px.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'

const AMBER = primitiveRamps.amber[300]
const GREEN = primitiveRamps.green[300]
const LIVE_GREEN = primitiveRamps.green[500] // status-live-muted — SideNav "Live" cue; active timer text
const STEEL = primitiveRamps.cyan[400] // progress with no time target (no pace)
const RAISED = primitiveColors.charcoal[400]
const TILE = primitiveColors.charcoal[500]
const T1 = primitiveColors.neutral[100]
const T2 = primitiveColors.neutral[400]
const T3 = primitiveColors.neutral[500]
const TRACK = '#2A2D34'
const W = 246
const GAP = 3

type Ex = { name: string; sets: number }
const PLAN: Ex[] = [
  { name: 'Seated Row', sets: 3 },
  { name: 'Incline DB', sets: 3 },
  { name: 'Chest Press', sets: 2 },
  { name: 'Calf Raise', sets: 2 },
  { name: 'Face Pull', sets: 2 },
]
const TOTAL = PLAN.reduce((s, e) => s + e.sets, 0) // 12

// clock element — matches TopBar: ⏱ glyph + mono, right-justified. Only the current
// (elapsed) time goes live-green (status-live-muted, the SideNav "Live" cue) when the
// timer is ticking; the /budget stays the prior dim color.
function Clock({ current, budget, active }: { current: string; budget?: string; active?: boolean }) {
  const live = active ? LIVE_GREEN : T2
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 10, textAlign: 'right', whiteSpace: 'nowrap' }}>
      <span style={{ marginRight: 3, color: live }}>⏱</span>
      <span style={{ color: live }}>{current}</span>
      {budget && <span style={{ color: T3 }}> / {budget}</span>}
    </span>
  )
}

// segmented progress bar: one chunk per exercise (width ∝ sets); current chunk fills
// fractionally; time marker overlaid at timePct of the whole bar.
function ChunkedBar({ setsDone, timePct }: { setsDone: number; timePct?: number }) {
  const setsPct = (setsDone / TOTAL) * 100
  const hasTime = timePct != null
  const color = !hasTime ? STEEL : setsPct >= timePct ? GREEN : AMBER
  return (
    <div style={{ position: 'relative', display: 'flex', gap: GAP, height: 9 }}>
      {PLAN.map((ex, i) => {
        const before = PLAN.slice(0, i).reduce((s, e) => s + e.sets, 0)
        const frac = Math.max(0, Math.min(1, (setsDone - before) / ex.sets)) // 0..1 of this chunk
        return (
          <div key={ex.name} style={{ flex: ex.sets, height: '100%', borderRadius: 2, background: TRACK, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${frac * 100}%`, background: color }} />
          </div>
        )
      })}
      {hasTime && <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${timePct}%`, width: 2, background: LIVE_GREEN }} />}
    </div>
  )
}

function Tiles({ cells }: { cells: [string, string, string?][] }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {cells.map(([label, value, color]) => (
        <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: TILE, borderRadius: 6, padding: '5px 3px' }}>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: T3 }}>{label}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, marginTop: 1, color: color ?? T1 }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

const ORANGE = primitiveRamps.orange[400]

type State = 'behind' | 'no-time' | 'upcoming'
type Until = { label: string; date: string; time: string; soon: boolean }

function Header({ state, until }: { state: State; until?: Until }) {
  const upcoming = state === 'upcoming'
  const u = until ?? { label: '2d', date: 'Jul 10', time: '6:30 PM', soon: false }
  const setsDone = upcoming ? 0 : 7.2
  const setsPct = (setsDone / TOTAL) * 100
  const timePct = state === 'behind' ? 70 : undefined
  const color = state === 'no-time' ? STEEL : setsPct >= (timePct ?? 999) ? GREEN : AMBER
  const title = upcoming ? 'Lower B · Volume' : 'Pull A · Intensification'
  return (
    <div style={{ width: W, background: RAISED, padding: '11px 12px 12px', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      {/* title only — no eyebrow, no sub-heading, no divider */}
      <span style={{ fontSize: 16, lineHeight: '18px', fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', color: T1, marginBottom: 10 }}>{title}</span>

      {/* tiles first, then the progress bar */}
      {upcoming ? (
        <Tiles cells={[['Date', u.date], ['Time', u.time], ['Until', u.label, u.soon ? ORANGE : undefined]]} />
      ) : (
        <Tiles cells={[['Volume', '76%'], ['Load', '7.3k'], ['Fatigue', 'MOD', AMBER]]} />
      )}

      <div style={{ marginTop: 10 }}>
        <ChunkedBar setsDone={setsDone} timePct={timePct} />
        {/* tight meta: sets (left) · clock (right-justified) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 5 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: upcoming ? T2 : color }}>{upcoming ? `${TOTAL} sets` : '7/12 sets'}</span>
          <Clock active={!upcoming} current={upcoming ? '52:00' : '42:18'} budget={state === 'behind' ? '60:00' : undefined} />
        </div>
      </div>
    </div>
  )
}

function Col({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: W }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: T1, fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <span style={{ fontSize: 11, color: T2, fontFamily: 'Inter, sans-serif', lineHeight: '16px' }}>{note}</span>
      <div style={{ marginTop: 2 }}>{children}</div>
    </div>
  )
}

function Sheet() {
  return (
    <div style={{ background: '#0E0E0E', padding: 28, minHeight: '100vh' }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: T1, fontFamily: 'Inter, sans-serif' }}>SessionHeader — chunked pace bar</span>
      <p style={{ fontSize: 12, color: T2, maxWidth: 700, fontFamily: 'Inter, sans-serif', lineHeight: '18px' }}>
        Bar chunked by exercise (width ∝ sets); current chunk fills per-rep. Clock ⏱ mono/secondary, right-justified
        (TopBar treatment). Upcoming = same bar empty; the tiles become Date / Time / Until — the session name is the title.
      </p>
      <div style={{ display: 'flex', gap: 40, marginTop: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Col label="Live · behind pace" note="5 chunks = 5 exercises; mid-chunk 3. Fill (sets) trails the time marker → amber.">
          <Header state="behind" />
        </Col>
        <Col label="Live · no time target" note="No marker, no /budget — just ⏱ elapsed. Bar is plain chunked progress (steel).">
          <Header state="no-time" />
        </Col>
        <Col label="Upcoming · next session" note="Empty bar = plan shape. Tiles carry Date / Time / Until; Until is accented only when < 1 day away.">
          <Header state="upcoming" until={{ label: '2d', date: 'Jul 10', time: '6:30 PM', soon: false }} />
          <div style={{ height: 10 }} />
          <Header state="upcoming" until={{ label: '5h', date: 'Today', time: '6:30 PM', soon: true }} />
        </Col>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Lab/Explorations/SessionHeader Final',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const States: Story = { render: () => <Sheet /> }
