/**
 * Hand-built light-mode specimens for the TD-4 candidates. The shipped
 * components read the shipped light ladder, so each plane here is painted
 * straight from a candidate; text keeps the shipped light text tokens, which
 * is what the AA check in lightCandidates.test.ts measures.
 */
import { View, Text, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { getSemanticColors } from '../../theme/tokens/semantic'
import type { SurfaceLevel } from '../../theme/surface-planes'
import type { LiftStep } from '../../theme/lift-shadow'
import { candidateOutline, candidateShadow, type LightCandidate } from './lightCandidates'

const TEXT = getSemanticColors('light')

interface PanelProps {
  c: LightCandidate
  level: SurfaceLevel
  lift?: LiftStep
  outline?: boolean
  style?: ViewStyle
  children?: ReactNode
}

function Panel({ c, level, lift, outline, style, children }: PanelProps) {
  const depth = lift ? ({ boxShadow: candidateShadow(lift, c) } as unknown as ViewStyle) : {}
  const edge = outline ? { borderWidth: 1, borderColor: candidateOutline(c) } : {}
  return (
    <View style={[{ backgroundColor: c.planes[level], borderRadius: 8 }, depth, edge, style]}>
      {children}
    </View>
  )
}

type Tone = 'primary' | 'secondary' | 'tertiary'

function T({
  tone = 'primary',
  size = 13,
  bold,
  children,
}: {
  tone?: Tone
  size?: number
  bold?: boolean
  children: ReactNode
}) {
  return (
    <Text style={{ color: TEXT[`text-${tone}`], fontSize: size, fontWeight: bold ? '600' : '400' }}>
      {children}
    </Text>
  )
}

function Caption({ children }: { children: string }) {
  return (
    <Text
      style={{ color: TEXT['text-tertiary'], fontSize: 10, fontWeight: '700', letterSpacing: 1 }}
    >
      {children}
    </Text>
  )
}

const LADDER_CARDS: { step: LiftStep; level: SurfaceLevel }[] = [
  { step: 1, level: 'elevated' },
  { step: 2, level: 'raised' },
  { step: 3, level: 'overlay' },
]

function LadderCard({
  c,
  level,
  lift,
  outline,
}: {
  c: LightCandidate
  level: SurfaceLevel
  lift?: LiftStep
  outline?: boolean
}) {
  const title = outline ? 'outline' : `+${lift}`
  return (
    <Panel
      c={c}
      level={level}
      lift={lift}
      outline={outline}
      style={{ flex: 1, minWidth: 140, padding: 14, gap: 2 }}
    >
      <T bold>{title}</T>
      <T tone="secondary" size={12}>{`${level} · ${c.planes[level]}`}</T>
    </Panel>
  )
}

/** One candidate's ladder: three lifted cards and an outline card on its page plane. */
export function CandidateLadder({ c }: { c: LightCandidate }) {
  return (
    <Panel c={c} level="base" style={{ padding: 20, gap: 12 }}>
      <Caption>{c.name.toUpperCase()}</Caption>
      <T tone="secondary" size={12}>
        {c.idea}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {LADDER_CARDS.map(({ step, level }) => (
          <LadderCard key={step} c={c} level={level} lift={step} />
        ))}
        <LadderCard c={c} level="base" outline />
      </View>
    </Panel>
  )
}

const STATS = [
  { label: 'Open loops', value: '14' },
  { label: 'Due this week', value: '6' },
  { label: 'Blocked', value: '2' },
]

function StatCards({ c }: { c: LightCandidate }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {STATS.map(({ label, value }) => (
        <Panel
          key={label}
          c={c}
          level="raised"
          lift={2}
          style={{ flex: 1, minWidth: 100, padding: 14, gap: 4 }}
        >
          <T tone="tertiary" size={11}>
            {label}
          </T>
          <T bold size={20}>
            {value}
          </T>
        </Panel>
      ))}
    </View>
  )
}

const ROWS = [
  ['Rename export', 'Ready', '2 d'],
  ['Audit tokens', 'Review', '4 d'],
  ['Tidy fixtures', 'Draft', '1 w'],
  ['Retire alias', 'Ready', '3 d'],
]

function TableRow({ cells, header, c }: { cells: string[]; header?: boolean; c: LightCandidate }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: header ? c.planes.elevated : undefined,
      }}
    >
      {cells.map((cell, i) => (
        <View key={cell} style={{ flex: i === 0 ? 2 : 1 }}>
          <T
            tone={header ? 'tertiary' : i === 0 ? 'primary' : 'secondary'}
            size={header ? 11 : 13}
            bold={header}
          >
            {cell}
          </T>
        </View>
      ))}
    </View>
  )
}

function TableCard({ c }: { c: LightCandidate }) {
  return (
    <Panel c={c} level="raised" lift={2} style={{ overflow: 'hidden' }}>
      <TableRow c={c} header cells={['Task', 'State', 'Age']} />
      {ROWS.map((cells) => (
        <TableRow key={cells[0]} c={c} cells={cells} />
      ))}
    </Panel>
  )
}

function Drawer({ c }: { c: LightCandidate }) {
  return (
    <Panel
      c={c}
      level="overlay"
      lift={4}
      style={{ flexGrow: 1, flexBasis: 260, padding: 18, gap: 10 }}
    >
      <Caption>DRAWER · OVERLAY · LIFT 4</Caption>
      <T bold size={15}>
        Audit tokens
      </T>
      <T tone="secondary">Review the light ladder against the wall before the owner round.</T>
      <Panel c={c} level="raised" outline style={{ padding: 12, gap: 4 }}>
        <T tone="tertiary" size={11}>
          Outline card in the drawer
        </T>
        <T>Owner: design · Due Friday</T>
      </Panel>
    </Panel>
  )
}

function Dialog({ c }: { c: LightCandidate }) {
  return (
    <Panel
      c={c}
      level="overlay"
      lift={5}
      style={{ alignSelf: 'center', width: '100%', maxWidth: 380, padding: 20, gap: 12 }}
    >
      <Caption>DIALOG · OVERLAY · LIFT 5</Caption>
      <T bold size={15}>
        Archive this loop?
      </T>
      <T tone="secondary">It leaves the board and stays in search.</T>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <Panel c={c} level="elevated" style={{ paddingVertical: 8, paddingHorizontal: 14 }}>
          <T bold>Cancel</T>
        </Panel>
        <Panel c={c} level="raised" lift={1} style={{ paddingVertical: 8, paddingHorizontal: 14 }}>
          <T bold>Archive</T>
        </Panel>
      </View>
    </Panel>
  )
}

/** A console-like page in one candidate: shell bar, cards, a table, a drawer and a dialog. */
export function CandidateComposite({ c }: { c: LightCandidate }) {
  return (
    <View style={{ backgroundColor: c.planes.background }}>
      <View style={{ paddingVertical: 12, paddingHorizontal: 20, gap: 2 }}>
        <T bold>{c.name}</T>
        <T tone="secondary" size={12}>
          {c.idea}
        </T>
      </View>
      <Panel
        c={c}
        level="base"
        style={{ borderRadius: 0, padding: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}
      >
        <View style={{ flexGrow: 3, flexBasis: 320, gap: 16 }}>
          <StatCards c={c} />
          <TableCard c={c} />
          <Dialog c={c} />
        </View>
        <Drawer c={c} />
      </Panel>
    </View>
  )
}
