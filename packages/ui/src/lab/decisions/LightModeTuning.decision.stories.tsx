import type { Meta, StoryObj } from '@storybook/react-vite'
import { vars } from 'nativewind'
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Alert } from '../../components/ui/alert'
import { Checkbox } from '../../components/ui/checkbox'
import { Chip } from '../../components/ui/chip'
import { Divider } from '../../components/ui/divider'
import { Indicator, type IndicatorColor } from '../../components/ui/indicator'
import { Input } from '../../components/ui/input'
import { Link } from '../../components/ui/link'
import {
  ListItem,
  ListItemContent,
  ListItemDivider,
  ListItemTrailing,
} from '../../components/ui/list-item'
import { Pill, type PillTone, type PillVariant } from '../../components/ui/pill'
import { Progress } from '../../components/ui/progress'
import { Radio, RadioGroup } from '../../components/ui/radio'
import { Select } from '../../components/ui/select'
import { Switch } from '../../components/ui/switch'
import {
  SELECTED_CHIP,
  SET_LABEL,
  TONE_TEXT_700,
  formatMeasurement,
  isSimulated,
  measure,
  overrideProperties,
  type TokenSet,
} from './light-tuning'
import { PAIRS, REPRESENTATIVE_PAIR_IDS, TONES, misses, type Tone } from './light-tuning-pairs'

interface Args {
  tokens: TokenSet
}

const PILL_TONE: Record<Tone, PillTone> = {
  brand: 'brand',
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error',
}
const DOT_COLOR: Record<Tone, IndicatorColor> = {
  brand: 'primary',
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error',
}
const ALERT_TONES = ['success', 'info', 'warning', 'error'] as const
const VARIANTS: PillVariant[] = ['solid', 'subtle', 'outline']

/** The set a sample is compared against: main against the proposal the variant shows. */
function compared(set: TokenSet): TokenSet {
  return set === 'main' ? 'proposed' : set
}

function Caption({ children }: { children: ReactNode }) {
  return <Text className="font-mono text-[10px] leading-4 text-text-secondary">{children}</Text>
}

/** The measured light ratio of one pair: main, then the compared proposal. */
function Measured({ id, set }: { id: string; set: TokenSet }) {
  const pair = PAIRS[id]
  const before = formatMeasurement(pair, measure(pair, 'main', 'light'))
  const after = formatMeasurement(pair, measure(pair, compared(set), 'light'))
  const sim = isSimulated(pair) ? ' · simulated' : ''
  return (
    <Caption>
      {`${pair.label}: main ${before} → ${SET_LABEL[compared(set)]} ${after} (floor ${pair.floor})${sim}`}
    </Caption>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="min-w-[300px] flex-1 basis-[340px] gap-stack-md rounded-lg border border-hairline bg-surface-base p-inset-md">
      <Text className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {title}
      </Text>
      {children}
    </View>
  )
}

function Header({ set }: { set: TokenSet }) {
  return (
    <View className="gap-stack-sm">
      <View className="flex-row flex-wrap items-center gap-inline-md">
        <Text className="text-lg font-semibold text-text-primary">Training log</Text>
        <Link href="#" onPress={() => {}}>
          Sessions
        </Link>
        <Link href="#" onPress={() => {}}>
          Programs
        </Link>
        <Link href="#" color="primary" onPress={() => {}}>
          New session
        </Link>
      </View>
      <View className="h-px w-full bg-border-prominent" />
      <Measured id="link" set={set} />
      <Measured id="link-brand" set={set} />
      <Measured id="header-rule" set={set} />
    </View>
  )
}

function FormSection({ set }: { set: TokenSet }) {
  return (
    <Section title="Form">
      <Input placeholder="Outline input" accessibilityLabel="Outline input" />
      <Measured id="input-outline" set={set} />
      <Measured id="input-hover" set={set} />
      <Input variant="filled" placeholder="Filled input" accessibilityLabel="Filled input" />
      <Measured id="input-filled" set={set} />
      <Select
        accessibilityLabel="Program"
        placeholder="Select a program"
        options={[
          { value: 'a', label: 'Strength block' },
          { value: 'b', label: 'Hypertrophy block' },
        ]}
      />
      <View className="flex-row flex-wrap gap-inline-lg">
        <Checkbox isChecked label="Checked" />
        <Checkbox isChecked={false} label="Unchecked" />
      </View>
      <RadioGroup value="a" onChange={() => {}} orientation="horizontal" accessibilityLabel="Unit">
        <Radio value="a">Kilograms</Radio>
        <Radio value="b">Pounds</Radio>
      </RadioGroup>
      <View className="flex-row flex-wrap gap-inline-lg">
        <Switch isChecked label="On" />
        <Switch isChecked={false} label="Off" />
      </View>
      <Measured id="control-on" set={set} />
      <Measured id="checkbox-off" set={set} />
      <Measured id="radio-off" set={set} />
    </Section>
  )
}

function StatusSection({ set }: { set: TokenSet }) {
  return (
    <Section title="Status pills">
      {TONES.map((tone) => (
        <View key={tone} className="gap-stack-xs">
          <View className="flex-row flex-wrap items-center gap-inline-sm">
            <Indicator color={DOT_COLOR[tone]} size="md" accessibilityLabel={`${tone} dot`} />
            {VARIANTS.map((variant) => (
              <Pill key={variant} tone={PILL_TONE[tone]} variant={variant} size="sm">
                {`${tone} ${variant}`}
              </Pill>
            ))}
          </View>
          {VARIANTS.map((variant) => (
            <Measured key={variant} id={`pill-${variant}-${tone}`} set={set} />
          ))}
          <Measured id={`dot-${tone}`} set={set} />
        </View>
      ))}
    </Section>
  )
}

function AlertSection({ set }: { set: TokenSet }) {
  return (
    <Section title="Alerts">
      {ALERT_TONES.map((tone) => (
        <View key={tone} className="gap-stack-xs">
          <Alert status={tone} variant="subtle" size="compact" message={`${tone}: subtle alert`} />
          <Alert status={tone} variant="solid" size="compact" message={`${tone}: solid alert`} />
          <Measured id={`pill-subtle-${tone}`} set={set} />
          <Measured id={`alert-icon-${tone}`} set={set} />
          <Measured id={`alert-solid-${tone}`} set={set} />
        </View>
      ))}
    </Section>
  )
}

/** TD-490 track recipe: a neutral hairline track under the fill (not a token, so simulated). */
function SimulatedProgress({ fill, label }: { fill: string; label: string }) {
  return (
    <View
      className="h-2 w-full overflow-hidden rounded-full bg-hairline"
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <View className={`h-full w-3/5 rounded-full ${fill}`} />
    </View>
  )
}

function ProgressSamples({ set }: { set: TokenSet }) {
  if (set === 'main') {
    return (
      <>
        <Progress value={60} color="success" accessibilityLabel="Week progress" />
        <Progress value={60} color="primary" accessibilityLabel="Block progress" />
      </>
    )
  }
  return (
    <>
      <SimulatedProgress fill="bg-status-success" label="Week progress" />
      <SimulatedProgress fill="bg-brand-primary" label="Block progress" />
    </>
  )
}

/** TD-490 selected Chip: subtle fill, 600 border, 700 label. The label rides a local var. */
function SelectedChip({ set }: { set: TokenSet }) {
  if (set === 'main') {
    return (
      <Chip variant="solid" color="primary">
        Selected
      </Chip>
    )
  }
  return (
    <View style={vars({ '--color-on-brand-primary-subtle': SELECTED_CHIP.label })}>
      <Chip
        variant="subtle"
        color="primary"
        style={{ borderWidth: 1, borderColor: SELECTED_CHIP.border }}
      >
        Selected
      </Chip>
    </View>
  )
}

function MarksSection({ set }: { set: TokenSet }) {
  return (
    <Section title="Progress and chips">
      <ProgressSamples set={set} />
      <Measured id="progress-fill" set={set} />
      <Measured id="progress-brand-fill" set={set} />
      <Measured id="progress-track" set={set} />
      <View className="flex-row flex-wrap gap-inline-sm">
        <SelectedChip set={set} />
        <Chip>Unselected</Chip>
      </View>
      <Measured id="chip-selected-label" set={set} />
      <Measured id="chip-selected-edge" set={set} />
      <Measured id="chip-label" set={set} />
    </Section>
  )
}

const ROWS = [
  { title: 'Back squat', subtitle: '5 × 5 at 120 kg', tone: 'success' as const },
  { title: 'Bench press', subtitle: '4 × 6 at 85 kg', tone: 'info' as const },
  { title: 'Deadlift', subtitle: '3 × 3 at 160 kg', tone: 'warning' as const },
]

function ListSection({ set }: { set: TokenSet }) {
  return (
    <Section title="List and divider">
      <View>
        {ROWS.map((row, i) => (
          <View key={row.title}>
            {i > 0 && <ListItemDivider inset={false} />}
            <ListItem>
              <ListItemContent title={row.title} subtitle={row.subtitle} />
              <ListItemTrailing>
                <Indicator color={DOT_COLOR[row.tone]} accessibilityLabel={row.tone} />
              </ListItemTrailing>
            </ListItem>
          </View>
        ))}
      </View>
      <Divider />
      <Measured id="divider" set={set} />
    </Section>
  )
}

const TONE_TEXT_TOKEN: Record<Tone, string> = {
  brand: 'text-brand-primary',
  success: 'text-status-success',
  info: 'text-status-info',
  warning: 'text-status-warning',
  error: 'text-text-error',
}

function ToneText({ tone, set }: { tone: Tone; set: TokenSet }) {
  const simulated = set !== 'main' && tone !== 'error'
  const style = simulated ? { color: TONE_TEXT_700[tone as keyof typeof TONE_TEXT_700] } : undefined
  return (
    <Text className={`text-sm font-medium ${simulated ? '' : TONE_TEXT_TOKEN[tone]}`} style={style}>
      {`${tone} as text`}
    </Text>
  )
}

function ToneTextSection({ set }: { set: TokenSet }) {
  return (
    <Section title="Tone as text">
      <View className="flex-row flex-wrap gap-inline-lg">
        {TONES.map((tone) => (
          <ToneText key={tone} tone={tone} set={set} />
        ))}
      </View>
      {TONES.map((tone) => (
        <Measured key={tone} id={`tone-text-${tone}`} set={set} />
      ))}
    </Section>
  )
}

function MissesLine({ set }: { set: TokenSet }) {
  const list = misses(REPRESENTATIVE_PAIR_IDS, set, 'light')
  return (
    <View className="gap-stack-xs rounded-md border border-status-error p-inset-sm">
      <Text className="text-xs font-semibold text-text-primary">
        {`Misses under ${SET_LABEL[set]}: ${list.length} of ${REPRESENTATIVE_PAIR_IDS.length} pairs`}
      </Text>
      <Caption>{list.map((m) => `${m.label} ${m.text}`).join(' · ')}</Caption>
    </View>
  )
}

const NOT_FOLLOWING =
  'Not moved by the proposal: Pill and Chip solid read *-solid, Pill and Alert subtle labels read ' +
  'on-*-subtle, so those samples stay as main. Simulated: Progress track, selected Chip, tone as text.'

function RepresentativePanel({ tokens }: Args) {
  return (
    <View
      style={vars(overrideProperties(tokens, 'light'))}
      className="gap-stack-lg bg-background-base p-gutter-sm"
      testID="light-tuning-panel"
    >
      <Header set={tokens} />
      <MissesLine set={tokens} />
      <Caption>{NOT_FOLLOWING}</Caption>
      <View className="flex-row flex-wrap gap-stack-md">
        <FormSection set={tokens} />
        <StatusSection set={tokens} />
        <AlertSection set={tokens} />
        <MarksSection set={tokens} />
        <ListSection set={tokens} />
        <ToneTextSection set={tokens} />
      </View>
    </View>
  )
}

/**
 * TD-487: the light-mode tuning TD-488..491 propose, before and after, on one realistic panel.
 *
 * Proposed values are `--color-*` overrides on the panel wrapper (`vars()`), so no token file
 * changes. Every ratio printed is measured from the resolved values in `light-tuning.ts`.
 * Light only: the overrides are light values.
 */
const meta: Meta<Args> = {
  title: 'Lab/Decisions/Light Mode Tuning',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { tokens: 'main' },
  argTypes: {
    tokens: { control: 'inline-radio', options: ['main', 'proposed', 'proposedOrange600'] },
  },
  globals: { theme: 'light' },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-487). Composes Input, Select, Checkbox, Radio, Switch, Pill, ' +
          'Indicator, Alert, Progress, Chip, ListItem, Divider and Link under the light token ' +
          'overrides proposed by TD-488 to TD-491. `tokens` picks main, proposed, or proposed ' +
          'with brand-primary at orange[600].',
      },
    },
  },
  render: (args) => <RepresentativePanel {...args} />,
}
export default meta
type Story = StoryObj<Args>

export const Representative: Story = {}
