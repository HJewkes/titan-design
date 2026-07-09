// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'

// Placeholder tokens (literal hex, RNW-safe). The real derivation lives in VMCP-02.76.
const AMBER = primitiveRamps.amber[300] // #F9B415 — behind pace
const GREEN = primitiveRamps.green[300] // #2ED573 — ahead / on pace
const ORANGE = primitiveRamps.orange[400] // #FF7900 — section eyebrow
const INSET = primitiveColors.charcoal[800] // #131313 — sunk footer surface
const RAISED = primitiveColors.charcoal[400] // #1F1F1F — metric tile
const T_PRIMARY = primitiveColors.neutral[100] // #F3F4F6
const T_SECONDARY = primitiveColors.neutral[400] // #9CA3AF
const T_TERTIARY = primitiveColors.neutral[500] // #6B7280
const DIVIDER = primitiveColors.charcoal[500] // #1C1C1C

export type SessionPaceState = 'ahead' | 'behind' | 'idle'

export interface SessionPacePanelProps {
  /** Pace posture: behind budget, ahead of budget, or the pre-session idle budget. */
  state?: SessionPaceState
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        backgroundColor: RAISED,
        borderRadius: 7,
        paddingVertical: 6,
        paddingHorizontal: 3,
      }}
    >
      <Text
        style={{
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          color: T_TERTIARY,
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: '800',
          marginTop: 2,
          color: color ?? T_PRIMARY,
        }}
      >
        {value}
      </Text>
    </View>
  )
}

function Suggest({ tone, children }: { tone: 'behind' | 'ahead'; children: ReactNode }) {
  const color = tone === 'behind' ? AMBER : GREEN
  const background = tone === 'behind' ? 'rgba(249,180,21,0.10)' : 'rgba(46,213,115,0.10)'
  const border = tone === 'behind' ? 'rgba(249,180,21,0.30)' : 'rgba(46,213,115,0.28)'
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 7,
        borderRadius: 8,
        padding: 9,
        backgroundColor: background,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <Text style={{ fontSize: 12, color }}>{tone === 'behind' ? '▲' : '＋'}</Text>
      <Text style={{ flex: 1, fontSize: 10.5, lineHeight: 15, color }}>{children}</Text>
    </View>
  )
}

const shellStyle = {
  width: 246,
  backgroundColor: INSET,
  borderTopWidth: 1,
  borderTopColor: DIVIDER,
  padding: 12,
  flexDirection: 'column' as const,
  gap: 8,
}

function IdlePanel() {
  return (
    <View style={shellStyle} testID="session-pace-panel">
      <Text
        style={{
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: ORANGE,
        }}
      >
        Next session budget
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text
          style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: '800', color: T_PRIMARY }}
        >
          ~52:00
        </Text>
        <Text style={{ fontFamily: 'monospace', fontSize: 11, color: T_SECONDARY }}>
          planned · Lower B
        </Text>
      </View>
      <Suggest tone="ahead">
        6 exercises · ~20 sets. Wall wakes to Live when the first set streams.
      </Suggest>
    </View>
  )
}

function PacePanel({ behind }: { behind: boolean }) {
  const fill = behind ? AMBER : GREEN
  return (
    <View style={shellStyle} testID="session-pace-panel">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '800',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: ORANGE,
          }}
        >
          Session Pace
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text
          style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: '800', color: T_PRIMARY }}
        >
          42:18
        </Text>
        <Text style={{ fontFamily: 'monospace', fontSize: 11, color: T_SECONDARY }}>
          of 60:00 budget
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: '#22252C', overflow: 'hidden' }}>
        <View style={{ height: '100%', width: '70%', borderRadius: 3, backgroundColor: fill }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Metric label="Volume" value="76%" />
        <Metric label="Load" value="7.3k" />
        <Metric label="Fatigue" value="MOD" color={AMBER} />
      </View>
      {behind ? (
        <Suggest tone="behind">
          Behind pace — ~9 min over budget at this rate. Drop Face Pull to 2 sets to finish on time.
        </Suggest>
      ) : (
        <Suggest tone="ahead">
          Ahead of pace — ~7 min of headroom. Room to add a Cable Fly drop-set or a back-off set on
          Row.
        </Suggest>
      )}
    </View>
  )
}

/**
 * 🚧 WIP / placeholder — the rail-footer session-pace tile. Presentational only, with
 * hardcoded sample numbers: the real time-model derivation (behind → what to trim ·
 * ahead → what to add · idle → next-session budget) is VMCP-02.76. Mounts in
 * {@link SessionRail}'s `footer` slot. Inline styles are provisional.
 */
export function SessionPacePanel({ state = 'behind' }: SessionPacePanelProps) {
  if (state === 'idle') return <IdlePanel />
  return <PacePanel behind={state === 'behind'} />
}
