import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { cn } from '../../utils/cn'
import { Badge } from '../../components/ui/badge'
import { Button, ButtonText } from '../../components/ui/button'
import { Chip } from '../../components/ui/chip'
import { Pill } from '../../components/ui/pill'
import { Tab, TabList, TabPanel, Tabs } from '../../components/ui/tabs'
import { Typography } from '../../components/ui/typography'
import { Gauge } from '../../components/ui/charts/gauge'
import { Scatter, type ScatterDatum } from '../../components/ui/charts/scatter'
import { useSurfaceMode } from '../../theme/surface-context'
import { getSemanticColors } from '../../theme/tokens/semantic'
import {
  OPEN_DECISIONS,
  TEXT_ROLES,
  colorLine,
  reviewPlaneHex,
  ruleClasses,
  ruleLine,
  type RoleRule,
  type TextRole,
} from './typography-roles'

/* ---------- shared frame pieces ---------- */

function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text className={cn('font-mono text-[11px] leading-4 text-text-secondary', className)}>
      {children}
    </Text>
  )
}

function Sample({ rule, children }: { rule: RoleRule; children: ReactNode }) {
  return (
    <Text
      className={ruleClasses(rule)}
      style={{ fontSize: rule.sizePx, lineHeight: Math.round(rule.sizePx * 1.4) }}
    >
      {children}
    </Text>
  )
}

function FrameHeader({ title, lede }: { title: string; lede: string }) {
  return (
    <View className="gap-1">
      <Typography variant="h6">{title}</Typography>
      <Mono>{lede}</Mono>
    </View>
  )
}

interface OptionProps {
  label: string
  note: string
  children: ReactNode
}

function Option({ label, note, children }: OptionProps) {
  return (
    <View className="w-[360px] gap-3 rounded-md border border-border-subtle p-4">
      <Typography variant="subtitle2">{label}</Typography>
      <View className="gap-2">{children}</View>
      <Mono>{note}</Mono>
    </View>
  )
}

function Options({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap gap-4">{children}</View>
}

/**
 * The review plane: background-base in dark, surface-base in light (the planes #764's frames
 * used). text-tertiary clears 4.5:1 on both, so the "today" samples can be shown as text.
 */
function Frame({ children }: { children: ReactNode }) {
  const mode = useSurfaceMode()
  return (
    <View className="min-h-screen gap-5 p-6" style={{ backgroundColor: reviewPlaneHex(mode) }}>
      {children}
    </View>
  )
}

/* ---------- Default: the unified role page ---------- */

function RoleRow({ role }: { role: TextRole }) {
  const open = role.decision ? `OPEN ${role.decision}` : 'ESTABLISHED'
  return (
    <View className="flex-row gap-4 border-t border-border-subtle py-3">
      <View className="w-60 gap-1">
        <Mono className="text-text-primary">{role.role}</Mono>
        <Mono>{role.usedBy}</Mono>
      </View>
      <View className="w-72 justify-center">
        <Sample rule={role.rule}>{role.sample}</Sample>
      </View>
      <View className="w-72 justify-center">
        {role.proposed ? <Sample rule={role.proposed}>{role.sample}</Sample> : null}
      </View>
      <View className="flex-1 gap-0.5">
        <Mono className="text-text-primary">{open}</Mono>
        <Mono>{`today: ${ruleLine(role.rule)}`}</Mono>
        <Mono>{`colour: ${colorLine(role.rule.color)}`}</Mono>
        {role.proposed ? <Mono>{`default: ${ruleLine(role.proposed)}`}</Mono> : null}
        {role.proposed ? <Mono>{`colour: ${colorLine(role.proposed.color)}`}</Mono> : null}
        <Mono className="text-text-primary">{role.note}</Mono>
      </View>
    </View>
  )
}

function groupsOf(roles: readonly TextRole[]): string[] {
  return roles.reduce<string[]>((acc, r) => (acc.includes(r.group) ? acc : [...acc, r.group]), [])
}

function RolePage() {
  return (
    <Frame>
      <FrameHeader
        title="Typography rules: every text role"
        lede="Left sample is the rule as built today; right sample is the recommended default where a decision is OPEN. Colours are named by ramp step with the WCAG ratio on the review plane: background-base in dark, surface-base in light. Tone and result samples render in text-primary here; their colour is the component's."
      />
      <View className="flex-row gap-4">
        <Mono className="w-60">role · used by</Mono>
        <Mono className="w-72">today</Mono>
        <Mono className="w-72">default if OPEN</Mono>
        <Mono className="flex-1">variant · family · weight · case · size · colour</Mono>
      </View>
      {groupsOf(TEXT_ROLES).map((group) => (
        <View key={group} className="gap-0">
          <Typography variant="overline" color="secondary" marginBottom="sm">
            {group}
          </Typography>
          {TEXT_ROLES.filter((r) => r.group === group).map((role) => (
            <RoleRow key={role.id} role={role} />
          ))}
        </View>
      ))}
      <Mono>{`Open decisions: ${OPEN_DECISIONS.join(', ')}. D1 (lockup name) closed by #764 pick C. One story per decision follows in this group.`}</Mono>
    </Frame>
  )
}

/* ---------- D2: colour token of every uppercase label ---------- */

function LabelLockup({ labelColor }: { labelColor: 'secondary' | 'tertiary' }) {
  return (
    <View className="gap-3">
      <View className="gap-0.5">
        <Typography variant="overline" color={labelColor}>
          Weekly volume
        </Typography>
        <Typography variant="mono" className="text-2xl font-bold">
          14 sets
        </Typography>
      </View>
      <View className="flex-row gap-6">
        <Typography variant="overline" color={labelColor}>
          Focused · by rank
        </Typography>
        <Typography variant="microLabel" color={labelColor}>
          Set · Prev
        </Typography>
      </View>
      <Typography variant="overline" color={labelColor}>
        Recent sessions
      </Typography>
    </View>
  )
}

function D2Frame() {
  return (
    <Frame>
      <FrameHeader
        title="D2 · Uppercase labels: which colour token?"
        lede="Only the label colour changes. Eyebrow, stat header, column header and menu group header, all on overline / microLabel semibold."
      />
      <Options>
        <Option label="A · today: text-tertiary" note={`label ${colorLine('text-tertiary')}`}>
          <LabelLockup labelColor="tertiary" />
        </Option>
        <Option label="B · default: text-secondary" note={`label ${colorLine('text-secondary')}`}>
          <LabelLockup labelColor="secondary" />
        </Option>
      </Options>
    </Frame>
  )
}

/* ---------- D3: the role of text-tertiary ---------- */

const scatterData = (mode: 'dark' | 'light'): ScatterDatum[] => {
  const t = getSemanticColors(mode)
  return [
    { id: 'a', x: 0.15, y: 0.8, r: 8, color: t['data-1'], label: 'a' },
    { id: 'b', x: 0.45, y: 0.45, r: 10, color: t['data-7'], label: 'b' },
    { id: 'c', x: 0.85, y: 0.15, r: 7, color: t['data-6'], label: 'c' },
  ]
}

function TickChart() {
  return (
    <Scatter
      data={scatterData('dark')}
      width={320}
      height={200}
      axis={{
        xLabel: 'Instability (I)',
        yLabel: 'Abstractness (A)',
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
      }}
    />
  )
}

function CaptionCard({ captionColor }: { captionColor: 'secondary' | 'tertiary' }) {
  return (
    <View className="gap-1">
      <Typography variant="h6">Bench press</Typography>
      <Typography variant="caption" color={captionColor}>
        Updated 3 min ago · 4 sets logged
      </Typography>
      <View className="flex-row items-baseline gap-1">
        <Typography variant="mono" className="font-bold">
          185
        </Typography>
        <Typography variant="mono" color="tertiary">
          lb
        </Typography>
      </View>
      <Typography variant="caption" color={captionColor}>
        Help text: sets count toward weekly volume
      </Typography>
      <TickChart />
    </View>
  )
}

function D3Frame() {
  return (
    <Frame>
      <FrameHeader
        title="D3 · What may text-tertiary paint?"
        lede="Only the caption and help text colour changes. The unit after a figure and the chart tick numerals stay text-tertiary in both options (redundant unit; 3:1 chart-ink floor)."
      />
      <Options>
        <Option
          label="A · today: captions text-tertiary"
          note={`caption ${colorLine('text-tertiary')}; ticks the same`}
        >
          <CaptionCard captionColor="tertiary" />
        </Option>
        <Option
          label="B · default: captions text-secondary"
          note={`caption ${colorLine('text-secondary')}; ticks ${colorLine('text-tertiary')}`}
        >
          <CaptionCard captionColor="secondary" />
        </Option>
      </Options>
    </Frame>
  )
}

/* ---------- D4: one chart text spec ---------- */

const TICKS = ['100', '75', '50', '25', '0']
const CATEGORIES = ['MEV', 'MAV', 'MRV']

interface ChartSpecimenProps {
  titleClass: string
  legendClass: string
  titleText: string
}

function ChartTextSpecimen({ titleClass, legendClass, titleText }: ChartSpecimenProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <View className="h-2 w-2 rounded-full bg-data-1" />
          <Text className={legendClass}>Main sequence</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="h-2 w-2 rounded-full bg-data-7" />
          <Text className={legendClass}>Last block</Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <View className="justify-between py-0.5">
          {TICKS.map((t) => (
            <Typography key={t} variant="mono" color="tertiary" className="text-[10px] text-right">
              {t}
            </Typography>
          ))}
        </View>
        <View className="h-24 flex-1 justify-between border-l border-b border-border-subtle">
          {TICKS.map((t) => (
            <View key={t} className="h-px w-full bg-border-subtle" />
          ))}
        </View>
      </View>
      <View className="flex-row justify-between pl-8">
        {CATEGORIES.map((c) => (
          <Typography key={c} variant="microLabel" color="secondary">
            {c}
          </Typography>
        ))}
      </View>
      <Text className={cn('text-center', titleClass)}>{titleText}</Text>
    </View>
  )
}

function ChartsAsBuilt() {
  return (
    <View className="flex-row flex-wrap items-start gap-6">
      <TickChart />
      <Gauge value={88} unit="%" label="Health" size={140} />
    </View>
  )
}

function D4Frame() {
  return (
    <Frame>
      <FrameHeader
        title="D4 · One chart text spec: tick numerals, axis category, axis title, legend"
        lede="Above: the charts as built (Scatter 9px tertiary ticks and 10px semibold titles, Gauge 12px label; ZoneTrack's inline monospace ticks are in custom-workout-dataviz-zonetrack--default, whose brand tick already misses on white). Below: the spec, where only the axis title and legend face changes between options; ticks (mono regular tertiary) and categories (microLabel secondary) are the same in both. Space Grotesk is loaded at 600-700 only, so A's medium legend renders at the nearest loaded weight."
      />
      <ChartsAsBuilt />
      <Options>
        <Option
          label="A · default: heading-face title and legend"
          note={`ticks ${colorLine('text-tertiary')} · title/legend ${colorLine('text-secondary')}`}
        >
          <ChartTextSpecimen
            titleClass="font-heading text-[11px] font-semibold text-text-secondary"
            legendClass="font-heading text-xs font-medium text-text-secondary"
            titleText="Weekly sets (sets/wk)"
          />
        </Option>
        <Option
          label="B · all-caps title and legend (microLabel)"
          note={`ticks ${colorLine('text-tertiary')} · title/legend ${colorLine('text-secondary')}`}
        >
          <ChartTextSpecimen
            titleClass="font-sans text-2xs font-semibold uppercase tracking-widest text-text-secondary"
            legendClass="font-sans text-2xs font-semibold uppercase tracking-widest text-text-secondary"
            titleText="Weekly sets (sets/wk)"
          />
        </Option>
      </Options>
    </Frame>
  )
}

/* ---------- D5: the face of every control label ---------- */

function ControlRow({ face }: { face: 'today' | 'heading' | 'sans' }) {
  const small = face === 'today' ? 'font-sans' : `font-${face}`
  const pill = face === 'sans' ? 'font-sans' : 'font-heading'
  const button = face === 'heading' ? 'font-heading' : 'font-sans'
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <Button size="md">
          <ButtonText className={button}>Save</ButtonText>
        </Button>
        <Pill tone="success" textClassName={pill}>
          On track
        </Pill>
        <Chip>
          <Text className={cn('text-xs font-medium text-inherit', small)}>Filter</Text>
        </Chip>
        <Badge color="info">
          <Text className={cn('text-xs font-medium text-inherit', small)}>New</Text>
        </Badge>
      </View>
      <Tabs defaultValue={0}>
        <TabList>
          <Tab index={0}>
            <Text className={small}>Overview</Text>
          </Tab>
          <Tab index={1}>
            <Text className={small}>History</Text>
          </Tab>
        </TabList>
        {/* Hidden, so each Tab's aria-controls resolves without changing the layout. */}
        <TabPanel index={0} className="hidden" />
        <TabPanel index={1} className="hidden" />
      </Tabs>
    </View>
  )
}

function D5Frame() {
  return (
    <Frame>
      <FrameHeader
        title="D5 · Control labels: which face?"
        lede="Only the font family changes. Weights are held as built: Button semibold, Pill semibold, Chip / Badge / Tab medium. Colours are on tone, per component. Space Grotesk is loaded at 600-700 only, so a medium heading-face label renders at the nearest loaded weight; the owner's call if B lands."
      />
      <Options>
        <Option
          label="A · today: Pill heading, the rest sans"
          note="Pill Space Grotesk; the rest Inter"
        >
          <ControlRow face="today" />
        </Option>
        <Option
          label="B · default: heading face on every control"
          note="Space Grotesk on Button, Pill, Chip, Badge and Tab"
        >
          <ControlRow face="heading" />
        </Option>
        <Option
          label="C · sans face on every control"
          note="Inter everywhere; Pill drops font-heading"
        >
          <ControlRow face="sans" />
        </Option>
      </Options>
    </Frame>
  )
}

/* ---------- D6: the SectionHeader title ---------- */

function SectionTitle({ treatment }: { treatment: 'today' | 'heading' | 'eyebrow' }) {
  const title =
    treatment === 'today' ? (
      <Text className="font-body text-sm font-semibold uppercase tracking-wider text-text-secondary">
        Weekly volume
      </Text>
    ) : treatment === 'heading' ? (
      <Typography variant="h6" className="text-sm">
        Weekly volume
      </Typography>
    ) : (
      <Typography variant="overline" color="secondary">
        Weekly volume
      </Typography>
    )
  return (
    <View className="gap-1">
      {title}
      <Typography variant="caption" color="tertiary">
        Sets per muscle group
      </Typography>
    </View>
  )
}

function D6Frame() {
  return (
    <Frame>
      <FrameHeader
        title="D6 · SectionHeader title: 14px caps today, heading face, or a 12px eyebrow?"
        lede="Only the title changes. The subtitle stays as built (caption, text-tertiary) in every option; D3 owns its colour."
      />
      <Options>
        <Option
          label="A · today: 14px body-face caps"
          note={`body · semibold · upper · 14px · ${colorLine('text-secondary')}`}
        >
          <SectionTitle treatment="today" />
        </Option>
        <Option
          label="B · default: heading face, sentence case"
          note={`heading · semibold · sentence · 14px · ${colorLine('text-primary')}`}
        >
          <SectionTitle treatment="heading" />
        </Option>
        <Option
          label="C · 12px overline eyebrow"
          note={`body · semibold · upper · 12px · ${colorLine('text-secondary')}`}
        >
          <SectionTitle treatment="eyebrow" />
        </Option>
      </Options>
    </Frame>
  )
}

/* ---------- D7: sentence-case labels, body face or heading face ---------- */

function SentenceLabels({ face }: { face: 'body' | 'heading' }) {
  const label = face === 'body' ? 'font-body' : 'font-heading'
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className={cn('text-sm font-medium text-text-primary', label)}>Target weight</Text>
        <View className="h-9 w-40 rounded-md border border-border-default bg-surface-input" />
      </View>
      <View className="flex-row justify-between border-b border-border-subtle pb-1">
        <Text className={cn('text-sm text-text-secondary', label)}>Rest timer</Text>
        <Typography variant="mono" className="font-medium">
          90 s
        </Typography>
      </View>
      <View className="items-start">
        <Typography variant="mono" className="text-2xl font-bold">
          88%
        </Typography>
        <Text className={cn('text-xs text-text-secondary', label)}>Health</Text>
      </View>
    </View>
  )
}

function D7Frame() {
  return (
    <Frame>
      <FrameHeader
        title="D7 · Sentence-case labels (form label, DataRow label, Metric label): body face or heading face?"
        lede="Only the font family changes; weight, case, size and colour are held as built. Space Grotesk is loaded at 600-700 only, so the regular and medium labels in B render at the nearest loaded weight; the owner's call if B lands."
      />
      <Options>
        <Option
          label="A · today: body face (Nunito Sans)"
          note={`label ${colorLine('text-primary')}`}
        >
          <SentenceLabels face="body" />
        </Option>
        <Option
          label="B · default: heading face (Space Grotesk)"
          note={`label ${colorLine('text-primary')}`}
        >
          <SentenceLabels face="heading" />
        </Option>
      </Options>
    </Frame>
  )
}

/* ---------- meta ---------- */

const meta: Meta = {
  title: 'Lab/Typography/Rules',
  tags: ['autodocs', 'status:lab', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-781). `Default` is the unified page: every text role with its rule or its ' +
          'open decision. Then one story per open decision (D2 to D7), each changing one thing between ' +
          'its options. Composes [Typography](?path=/docs/foundations-typography--docs), Button, Pill, ' +
          'Chip, Badge, Tabs, Scatter, Gauge and VolumeLandmarkBar; no token or component changes.',
      },
    },
  },
}
export default meta
type Story = StoryObj

export const Default: Story = { render: () => <RolePage /> }
export const D2LabelColour: Story = { render: () => <D2Frame /> }
export const D3TertiaryRole: Story = { render: () => <D3Frame /> }
export const D4ChartText: Story = { render: () => <D4Frame /> }
export const D5ControlFace: Story = { render: () => <D5Frame /> }
export const D6SectionTitle: Story = { render: () => <D6Frame /> }
export const D7LabelFace: Story = { render: () => <D7Frame /> }
