import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View } from 'react-native'
import { formatTrimmedDecimal } from '../utils/number-format'
import { contrast } from './color-checks'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'

/**
 * Foundations/Color/Family — the colour family cells of decision 0004, both modes side by side.
 *
 * Eight members (seven hues and neutral), four cells each: `tint-{m}-solid` under `on-tint-{m}`
 * and `tint-{m}-subtle` under `on-tint-{m}-subtle`. Every label is painted live from the token
 * map of its mode, and the two ratios the decision measures are printed under each cell: the
 * label on its fill (text, floor 4.5) and the fill against the page it sits on, the number the
 * decision flags because a subtle fill separates from its plane by hue alone.
 *
 * Fills, labels and planes go on as inline style from the per-mode maps, not through the theme
 * switch, so the frame shows both modes at once whatever the toolbar says, as the lab decision
 * stories do. No `mode` control is needed for the same reason.
 */
const MEMBERS = ['red', 'orange', 'amber', 'green', 'cyan', 'blue', 'magenta', 'neutral'] as const
type Member = (typeof MEMBERS)[number]
const EMPHASES = ['solid', 'subtle'] as const
type Emphasis = (typeof EMPHASES)[number]
const MODES: readonly ThemeMode[] = ['light', 'dark']

interface FamilyArgs {
  member: 'all' | Member
  emphasis: 'both' | Emphasis
}

const meta: Meta<FamilyArgs> = {
  title: 'Foundations/Color/Family',
  tags: ['autodocs'],
  args: { member: 'all', emphasis: 'both' },
  argTypes: {
    member: { control: 'select', options: ['all', ...MEMBERS] },
    emphasis: { control: 'inline-radio', options: ['both', ...EMPHASES] },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Foundation.** The colour family cells (decision 0004): `tint-{m}-solid` under ' +
          '`on-tint-{m}` and `tint-{m}-subtle` under `on-tint-{m}-subtle`, for red, orange, amber, ' +
          'green, cyan, blue, magenta and neutral, in both modes at once. `brand-*` and `status-*` ' +
          'alias their hue’s cells; the swatch matrix is in ' +
          '[Palettes](?path=/docs/foundations-color-palettes--docs). Each cell prints its label ' +
          'ratio and its fill’s ratio against the page.',
      },
    },
  },
}

export default meta
type Story = StoryObj<FamilyArgs>

function cellTokens(member: Member, emphasis: Emphasis) {
  return emphasis === 'solid'
    ? { fill: `tint-${member}-solid`, label: `on-tint-${member}` }
    : { fill: `tint-${member}-subtle`, label: `on-tint-${member}-subtle` }
}

function Cell({ mode, member, emphasis }: { mode: ThemeMode; member: Member; emphasis: Emphasis }) {
  const colors: Record<string, string> = getSemanticColors(mode)
  const { fill, label } = cellTokens(member, emphasis)
  const onFill = formatTrimmedDecimal(contrast(colors[label], colors[fill]), 2)
  const onPage = formatTrimmedDecimal(contrast(colors[fill], colors['surface-base']), 2)
  return (
    <View style={{ flex: 1, gap: 4 }} testID={`cell-${mode}-${member}-${emphasis}`}>
      <View
        style={{
          backgroundColor: colors[fill],
          borderRadius: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <Text style={{ color: colors[label], fontSize: 13, fontWeight: '600' }}>
          {`${member} ${emphasis}`}
        </Text>
      </View>
      <Text style={{ color: colors['text-secondary'], fontSize: 10 }}>
        {`${fill} · label ${onFill} · on page ${onPage}`}
      </Text>
    </View>
  )
}

function ModeFrame({
  mode,
  members,
  emphases,
}: {
  mode: ThemeMode
  members: readonly Member[]
  emphases: readonly Emphasis[]
}) {
  const colors = getSemanticColors(mode)
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors['surface-base'],
        borderRadius: 8,
        padding: 16,
        gap: 10,
      }}
      testID={`frame-${mode}`}
    >
      <Text style={{ color: colors['text-primary'], fontSize: 14, fontWeight: '700' }}>{mode}</Text>
      {members.map((member) => (
        <View key={member} style={{ flexDirection: 'row', gap: 10 }}>
          {emphases.map((emphasis) => (
            <Cell key={emphasis} mode={mode} member={member} emphasis={emphasis} />
          ))}
        </View>
      ))}
    </View>
  )
}

export const Default: Story = {
  render: function Render(args) {
    const members = args.member === 'all' ? MEMBERS : [args.member]
    const emphases = args.emphasis === 'both' ? EMPHASES : [args.emphasis]
    return (
      <View style={{ flexDirection: 'row', gap: 16, padding: 16 }}>
        {MODES.map((mode) => (
          <ModeFrame key={mode} mode={mode} members={members} emphases={emphases} />
        ))}
      </View>
    )
  },
}
