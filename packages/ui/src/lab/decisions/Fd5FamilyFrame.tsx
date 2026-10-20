import { View } from 'react-native'
import { Badge } from '../../components/ui/badge'
import { Pill } from '../../components/ui/pill'
import { ToolBadge } from '../../components/custom/Session'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import {
  FAMILY_MEMBERS,
  familySubtleCell,
  fmt,
  readAll,
  shippedLine,
  solidCell,
  worst,
  type Cell,
  type FamilyMember,
} from './foundations'
import { Caption, CellCarrier, FrameHeader, LiveChip, ModeFrame } from './FoundationsKit'

const LINES: Record<ThemeMode, string[]> = {
  light: [
    'Seven hues plus neutral, each a solid and a subtle cell with its on-colour, then one Pill, Badge and ToolBadge.',
    'Solid: hue 600 + white for every hue, so orange and amber carry a solid Pill at AA. FD3 records their 500 exceptions. Neutral grey 700.',
    'Subtle: FD4 package 1, hue 200 + hue 800. Ratios are the worst over the text planes -1 to +3.',
  ],
  dark: [
    'Seven hues plus neutral, each a solid and a subtle cell with its on-colour, then one Pill, Badge and ToolBadge.',
    'Solid: the shipped steps (300 to 500) + grey 950. Neutral grey 200.',
    'Subtle: FD4 package 1, hue 900 + hue 300. Ratios are the worst over the text planes -1 to +3.',
  ],
}

interface CellBlockProps {
  member: FamilyMember
  cell: Cell
  kind: 'solid' | 'subtle'
  mode: ThemeMode
}

/** Every family cell clears AA in both modes (asserted in the decision test), so each label is live. */
function CellBlock({ member, cell, kind, mode }: CellBlockProps) {
  const readings = readAll(cell, mode)
  const page = getSemanticColors(mode)['surface-base']
  return (
    <View className="w-80 gap-1" testID={`${kind}-${member}`}>
      <LiveChip cell={cell} plane={page} />
      <Caption>{`${kind} · label ${fmt(worst(readings, 'label'))} · fill vs plane ${fmt(worst(readings, 'fill'))}`}</Caption>
      <Caption>{shippedLine(member, kind, mode)}</Caption>
    </View>
  )
}

function Components({ solid, subtle }: { solid: Cell; subtle: Cell }) {
  return (
    <CellCarrier solid={solid} subtle={subtle}>
      <Pill variant="solid" tone="error">{`${solid.name} pill`}</Pill>
      <Badge variant="subtle" color="error">{`${subtle.name} badge`}</Badge>
      <ToolBadge family="web" />
    </CellCarrier>
  )
}

function MemberRow({ member, mode }: { member: FamilyMember; mode: ThemeMode }) {
  const solid = solidCell(member, mode)
  const subtle = familySubtleCell(member, mode)
  return (
    <View className="flex-row flex-wrap items-center gap-inline-md" testID={`row-${member}`}>
      <View className="w-24">
        <Caption>{member}</Caption>
      </View>
      <CellBlock member={member} cell={solid} kind="solid" mode={mode} />
      <CellBlock member={member} cell={subtle} kind="subtle" mode={mode} />
      <Components solid={solid} subtle={subtle} />
    </View>
  )
}

export function Fd5FamilyFrame({ mode }: { mode: ThemeMode }) {
  return (
    <ModeFrame mode={mode} testID={`fd5-family-${mode}`}>
      <FrameHeader title={`FD5 · the family, ${mode}`} lines={LINES[mode]} />
      <View className="gap-stack-md rounded-md bg-surface-base p-inset-md">
        {FAMILY_MEMBERS.map((member) => (
          <MemberRow key={member} member={member} mode={mode} />
        ))}
      </View>
    </ModeFrame>
  )
}
