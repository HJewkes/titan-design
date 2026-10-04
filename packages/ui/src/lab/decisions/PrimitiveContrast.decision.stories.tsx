import type { Meta, StoryObj } from '@storybook/react-vite'
import { vars } from 'nativewind'
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Button, ButtonText } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Divider } from '../../components/ui/divider'
import { Indicator, type IndicatorColor } from '../../components/ui/indicator'
import { Input } from '../../components/ui/input'
import { Pill, type PillVariant } from '../../components/ui/pill'
import { Radio, RadioGroup } from '../../components/ui/radio'
import { SurfaceContext } from '../../components/ui/surface/SurfaceContext'
import { Switch } from '../../components/ui/switch'
import { darkThemeCSSVars, lightThemeCSSVars } from '../../theme/config'
import { semanticColorsDark } from '../../theme/tokens/semantic'
import {
  SELECTED_CHIP,
  SET_LABEL,
  formatMeasurement,
  isSimulated,
  measure,
  overrideProperties,
  simulates,
  type Mode,
  type Pair,
  type TokenSet,
} from './light-tuning'
import { TONES, toneTokens, type Tone } from './light-tuning-pairs'
import { ProgressSample, SelectedChip } from './light-tuning-samples'

type Proposal = Exclude<TokenSet, 'main'>

interface Args {
  proposal: Proposal
  tone: Tone
}

const PLANES = [
  { token: 'background-base', className: 'bg-background-base' },
  { token: 'surface-base', className: 'bg-surface-base' },
  { token: 'surface-elevated', className: 'bg-surface-elevated' },
  { token: 'surface-raised', className: 'bg-surface-raised' },
  { token: 'surface-overlay', className: 'bg-surface-overlay' },
] as const

const MODE_VARS: Record<Mode, Record<string, string>> = {
  light: lightThemeCSSVars,
  dark: darkThemeCSSVars,
}

const DOT_COLOR: Record<Tone, IndicatorColor> = {
  brand: 'primary',
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error',
}

interface Sample {
  tone: Tone
  isProposed: boolean
}

interface MatrixRow {
  label: string
  pair: (plane: string, tone: Tone) => Pair
  render: (sample: Sample) => ReactNode
}

function pillRow(variant: PillVariant): MatrixRow {
  return {
    label: `Pill ${variant}`,
    pair: (plane, tone) => {
      const t = toneTokens(tone)
      if (variant === 'outline') return { label: 'label', fg: t.base, plane, floor: 4.5 }
      const [fg, bg] = variant === 'solid' ? [t.onSolid, t.solid] : [t.onSubtle, t.subtle]
      return { label: 'label', fg, bg, plane, floor: 4.5 }
    },
    render: ({ tone }) => (
      <Pill tone={tone} variant={variant} size="sm">
        {tone}
      </Pill>
    ),
  }
}

const SEPARATOR_CLASS: Record<string, string> = {
  divider: 'bg-divider',
  'hairline-subtle': 'bg-hairline-subtle',
  'hairline-default': 'bg-hairline',
  'hairline-strong': 'bg-hairline-strong',
}

function separatorRow(token: string, label: string, floor: number): MatrixRow {
  return {
    label,
    pair: (plane) => ({ label, fg: token, plane, floor, metric: 'deltaL' }),
    render: () => <Divider className={SEPARATOR_CLASS[token]} />,
  }
}

const ROWS: MatrixRow[] = [
  pillRow('solid'),
  pillRow('subtle'),
  pillRow('outline'),
  {
    label: 'Chip selected (label)',
    pair: (plane) => ({
      label: 'label',
      fg: 'on-brand-primary',
      bg: 'brand-primary-solid',
      proposedFg: { raw: SELECTED_CHIP.label },
      proposedBg: 'brand-primary-subtle',
      plane,
      floor: 4.5,
    }),
    render: ({ isProposed }) => <SelectedChip isProposed={isProposed} />,
  },
  {
    label: 'Button solid (label frozen to dark map)',
    pair: (plane) => ({
      label: 'label',
      fg: { raw: semanticColorsDark['on-brand-primary'] },
      bg: 'brand-primary-solid',
      plane,
      floor: 4.5,
    }),
    render: () => (
      <Button size="sm">
        <ButtonText>Save</ButtonText>
      </Button>
    ),
  },
  {
    label: 'Indicator',
    pair: (plane, tone) => ({ label: 'dot', fg: toneTokens(tone).base, plane, floor: 3 }),
    render: ({ tone }) => <Indicator color={DOT_COLOR[tone]} size="md" accessibilityLabel={tone} />,
  },
  {
    label: 'Progress track',
    pair: (plane, tone) => ({
      label: 'track',
      fg: toneTokens(tone).muted,
      proposedFg: 'hairline-default',
      plane,
      floor: 3,
    }),
    render: ({ tone, isProposed }) => (
      <ProgressSample tone={tone} isProposed={isProposed} label="Progress" />
    ),
  },
  {
    label: 'Input outline',
    pair: (plane) => ({ label: 'edge', fg: 'border-input', plane, floor: 3 }),
    render: () => <Input size="sm" placeholder="Input" accessibilityLabel="Input" />,
  },
  {
    label: 'Checkbox unchecked',
    pair: (plane) => ({ label: 'edge', fg: 'hairline-default', plane, floor: 3 }),
    render: () => <Checkbox isChecked={false} accessibilityLabel="Checkbox" />,
  },
  {
    label: 'Radio unchecked',
    pair: (plane) => ({ label: 'edge', fg: 'hairline-strong', plane, floor: 3 }),
    render: () => (
      <RadioGroup value={null} onChange={() => {}} accessibilityLabel="Radio">
        <Radio value="a" accessibilityLabel="Option" />
      </RadioGroup>
    ),
  },
  {
    label: 'Switch off track',
    pair: (plane) => ({ label: 'track', fg: 'hairline-strong', plane, floor: 3 }),
    render: () => <Switch isChecked={false} accessibilityLabel="Switch" />,
  },
  separatorRow('divider', 'Divider', 12),
  separatorRow('hairline-subtle', 'Hairline subtle', 7),
  separatorRow('hairline-default', 'Hairline default', 12),
  separatorRow('hairline-strong', 'Hairline strong', 18),
]

function Half({ set, mode, children }: { set: TokenSet; mode: Mode; children: ReactNode }) {
  return (
    <View style={vars(overrideProperties(set, mode))} className="flex-1">
      {children}
    </View>
  )
}

interface CellProps {
  row: MatrixRow
  plane: (typeof PLANES)[number]
  mode: Mode
  proposal: Proposal
  tone: Tone
}

function CellHalf({
  row,
  plane,
  mode,
  tone,
  set,
}: Omit<CellProps, 'proposal'> & { set: TokenSet }) {
  const pair = row.pair(plane.token, tone)
  return (
    <Half set={set} mode={mode}>
      <View className={`min-h-[64px] flex-1 justify-between gap-1 p-1.5 ${plane.className}`}>
        <View className="items-start">
          {row.render({ tone, isProposed: simulates(set, mode) })}
        </View>
        <Text className="font-mono text-[10px] text-text-secondary">
          {formatMeasurement(pair, measure(pair, set, mode))}
          {simulates(set, mode) && isSimulated(pair) ? ' · simulated' : ''}
        </Text>
      </View>
    </Half>
  )
}

function Cell(props: CellProps) {
  return (
    <View className="flex-1 flex-row">
      <CellHalf {...props} set="main" />
      <CellHalf {...props} set={props.proposal} />
    </View>
  )
}

function ModeBlock({ mode, proposal, tone }: { mode: Mode } & Args) {
  return (
    <SurfaceContext.Provider value={{ mode, level: 'base' }}>
      <View style={vars(MODE_VARS[mode])} className="gap-px bg-background-frame p-2">
        <Text className="p-1 text-sm font-semibold text-text-primary">
          {`${mode}: each cell is main | ${SET_LABEL[proposal]}; ✗ marks a miss`}
        </Text>
        <View className="flex-row gap-px">
          <View className="w-36" />
          {PLANES.map((plane) => (
            <Text
              key={plane.token}
              className="flex-1 p-1 font-mono text-[10px] text-text-secondary"
            >
              {plane.token}
            </Text>
          ))}
        </View>
        {ROWS.map((row) => (
          <View key={row.label} className="flex-row gap-px">
            <Text className="w-36 p-1 text-xs text-text-primary">{row.label}</Text>
            {PLANES.map((plane) => (
              <Cell
                key={plane.token}
                row={row}
                plane={plane}
                mode={mode}
                proposal={proposal}
                tone={tone}
              />
            ))}
          </View>
        ))}
      </View>
    </SurfaceContext.Provider>
  )
}

/**
 * TD-487 Gate 2 view: every primitive on every plane, main beside the TD-488..491 proposal,
 * in light and in dark. Proposals are `--color-*` overrides on each proposed half (`vars()`);
 * each block re-declares its whole theme the way ThemeProvider does, so both modes render
 * on one page whatever the toolbar theme is.
 */
const meta: Meta<Args> = {
  title: 'Lab/Decisions/Primitive Contrast',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { proposal: 'proposed', tone: 'brand' },
  argTypes: {
    proposal: { control: 'inline-radio', options: ['proposed', 'proposedOrange600'] },
    tone: { control: 'inline-radio', options: [...TONES] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-487). Composes Pill, Chip, Button, Indicator, Progress, Input, ' +
          'Checkbox, Radio, Switch and Divider on the five planes. Ratios are measured from the ' +
          'resolved token values (4.5 text, 3 marks and boundaries, ΔL* 7 / 12 / 18 separators). ' +
          '`tone` drives the Pill, Indicator and Progress rows.',
      },
    },
  },
  render: function Render(args) {
    return (
      <View className="gap-4">
        <ModeBlock mode="light" {...args} />
        <ModeBlock mode="dark" {...args} />
      </View>
    )
  },
}
export default meta
type Story = StoryObj<Args>

export const Matrix: Story = {}
