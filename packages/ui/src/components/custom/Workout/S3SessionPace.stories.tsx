/**
 * SHEET · Session Pace — the rail-footer pace tile (NAV-D05: VMCP-primary, plan-aware trim/add).
 * PRESENTATIONAL only; the derivation (session time-model + trim/add heuristic) is a separate VMCP/WA
 * ticket (no WA support today). OPEN: which metrics earn the row · behind/ahead visual · idle treatment ·
 * whether it restores a CapacityBandChart. See DECISIONS-ExerciseRow doc.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import {
  AMBER,
  GREEN,
  INSET,
  RAISED,
  T_PRIMARY,
  T_SECONDARY,
  T_TERTIARY,
  ORANGE,
  Page,
  monoTag,
} from './setHeadingKit'

type PaceState = 'behind' | 'ahead' | 'idle'

function Metric({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: 'center',
        background: RAISED,
        borderRadius: 7,
        padding: '6px 3px',
      }}
    >
      <div
        style={{
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          color: T_TERTIARY,
          fontWeight: 800,
        }}
      >
        {k}
      </div>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: 800,
          marginTop: 2,
          color: color ?? T_PRIMARY,
        }}
      >
        {v}
      </div>
    </div>
  )
}
function Suggest({ tone, children }: { tone: 'behind' | 'ahead'; children: ReactNode }) {
  const color = tone === 'behind' ? AMBER : GREEN
  return (
    <div
      style={{
        fontSize: 10.5,
        lineHeight: 1.4,
        borderRadius: 8,
        padding: '8px 9px',
        display: 'flex',
        gap: 7,
        alignItems: 'flex-start',
        color,
        background: tone === 'behind' ? 'rgba(249,180,21,0.10)' : 'rgba(46,213,115,0.10)',
        border: `1px solid ${tone === 'behind' ? 'rgba(249,180,21,0.30)' : 'rgba(46,213,115,0.28)'}`,
      }}
    >
      <span style={{ flex: '0 0 auto', fontSize: 12 }}>{tone === 'behind' ? '▲' : '＋'}</span>
      <div>{children}</div>
    </div>
  )
}
const b = (t: string) => <b style={{ color: T_PRIMARY }}>{t}</b>

// The pace tile — lives pinned in the rail footer (inset surface).
function SessionPaceTile({ state }: { state: PaceState }) {
  if (state === 'idle') {
    return (
      <div
        style={{
          width: 246,
          background: INSET,
          borderTop: `1px solid #1C1C1C`,
          padding: '11px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: ORANGE,
          }}
        >
          Next session budget
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontFamily: 'monospace' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: T_PRIMARY }}>~52:00</span>
          <span style={{ fontSize: 11, color: T_SECONDARY }}>planned · Lower B</span>
        </div>
        <Suggest tone="ahead">
          6 exercises · ~20 sets. Wall wakes to Live when the first set streams.
        </Suggest>
      </div>
    )
  }
  const behind = state === 'behind'
  return (
    <div
      style={{
        width: 246,
        background: INSET,
        borderTop: `1px solid #1C1C1C`,
        padding: '11px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: ORANGE,
          }}
        >
          Session Pace
        </span>
        <span
          style={{
            fontSize: 8,
            fontFamily: 'monospace',
            color: T_TERTIARY,
            border: `1px solid #2C2C2C`,
            borderRadius: 5,
            padding: '2px 5px',
          }}
        >
          {behind ? 'show ahead ▸' : 'show behind ▸'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontFamily: 'monospace' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: T_PRIMARY }}>42:18</span>
        <span style={{ fontSize: 11, color: T_SECONDARY }}>of 60:00 budget</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: '#22252c',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '70%',
            borderRadius: 3,
            background: behind ? AMBER : GREEN,
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <Metric k="Volume" v="76%" />
        <Metric k="Load" v="7.3k" />
        <Metric k="Fatigue" v="MOD" color={AMBER} />
      </div>
      {behind ? (
        <Suggest tone="behind">
          {b('Behind pace')} — ~9 min over budget at this rate. Drop {b('Face Pull')} to 2 sets to
          finish on time.
        </Suggest>
      ) : (
        <Suggest tone="ahead">
          {b('Ahead of pace')} — ~7 min of headroom. Room to add a {b('Cable Fly')} drop-set or a
          back-off set on Row.
        </Suggest>
      )}
    </div>
  )
}

const meta: Meta = { title: 'Lab/Explorations/Session Pace', parameters: { layout: 'fullscreen' } }
export default meta
type Story = StoryObj

export const States: Story = {
  name: 'Pace tile · behind / ahead / idle',
  render: () => (
    <Page
      title="Session Pace — rail footer tile"
      note="VMCP-primary (NAV-D05): behind → what to trim · ahead → what to add · idle → next-session budget. Presentational; derivation is a separate VMCP/WA ticket (no WA session time-model today). Surfaces on real tokens."
    >
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {(['behind', 'ahead', 'idle'] as PaceState[]).map((s) => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={monoTag}>{s}</span>
            <SessionPaceTile state={s} />
          </div>
        ))}
      </div>
    </Page>
  ),
}
